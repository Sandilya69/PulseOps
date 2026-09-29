# PulseOps Frontend - System Design for Load Handling

## Overview
This document outlines the architecture for handling high load scenarios in the PulseOps dashboard, including real-time data, large datasets, concurrent users, and offline resilience.

---

## 1. Data Fetching Layer

### 1.1 React Query / SWR Configuration
```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30s cache
      gcTime: 5 * 60_000,       // 5min garbage collection
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});
```

### 1.2 Pagination Strategy
- **Cursor-based** for infinite scroll (activity log, notifications)
- **Page-based** for tables (APIs, incidents, tickets)
- **Default page size**: 20, max 100
- **Server-side filtering/sorting** always

### 1.3 Request Deduplication
- Automatic via React Query
- 500ms dedupe window for rapid triggers

---

## 2. Real-time Updates

### 2.1 WebSocket Architecture
```typescript
// lib/realtime.ts
type EventType = 
  | 'incident.triggered' 
  | 'incident.acknowledged' 
  | 'incident.resolved'
  | 'api.status_changed'
  | 'alert.fired'
  | 'check.completed';

interface RealtimeEvent<T> {
  type: EventType;
  payload: T;
  timestamp: string;
  orgId: string;
}

class RealtimeClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private subscribers = new Map<EventType, Set<(payload: any) => void>>();
  
  connect(token: string) { /* ... */ }
  subscribe(type: EventType, cb: (payload: any) => void) { /* ... */ }
  unsubscribe(type: EventType, cb: (payload: any) => void) { /* ... */ }
}
```

### 2.2 Fallback: Server-Sent Events (SSE)
```typescript
// For environments blocking WebSockets
const eventSource = new EventSource('/api/realtime/stream');
eventSource.onmessage = (e) => {
  const event = JSON.parse(e.data);
  queryClient.invalidateQueries({ queryKey: [event.type] });
};
```

### 2.3 Optimistic Updates
```typescript
// For instant UI feedback
const mutation = useMutation({
  mutationFn: updateIncidentStatus,
  onMutate: async (newStatus) => {
    await queryClient.cancelQueries({ queryKey: ['incidents'] });
    const previous = queryClient.getQueryData(['incidents']);
    queryClient.setQueryData(['incidents'], (old) => 
      old.map(i => i.id === id ? { ...i, status: newStatus } : i)
    );
    return { previous };
  },
  onError: (err, vars, context) => {
    queryClient.setQueryData(['incidents'], context.previous);
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['incidents'] }),
});
```

---

## 3. Large Dataset Handling

### 3.1 Virtualized Tables
```tsx
// components/VirtualizedTable.tsx
import { FixedSizeList as List } from 'react-window';

function VirtualizedTable<T>({ data, columns, height = 600, rowHeight = 48 }) {
  const Row = ({ index, style }) => (
    <div style={style} className="flex items-center px-6">
      {columns.map(col => (
        <div key={col.key} className={col.width}>
          {col.render(data[index])}
        </div>
      ))}
    </div>
  );

  return (
    <List height={height} itemCount={data.length} itemSize={rowHeight} width="100%">
      {Row}
    </List>
  );
}
```

### 3.2 Infinite Scroll for Logs
```tsx
// hooks/useInfiniteQuery.ts
function useInfiniteActivities(filters) {
  return useInfiniteQuery({
    queryKey: ['activities', filters],
    queryFn: ({ pageParam }) => fetchActivities({ ...filters, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  });
}
```

### 3.3 Chart Data Downsampling
```typescript
// lib/downsample.ts - LTTB (Largest-Triangle-Three-Buckets)
function downsample(data: DataPoint[], threshold = 500): DataPoint[] {
  if (data.length <= threshold) return data;
  // Implementation preserves visual fidelity
  return lttb(data, threshold);
}
```

---

## 4. Caching Strategy

### 4.1 Cache Hierarchy
```
┌─────────────────────────────────────┐
│  Browser Cache (HTTP)               │  ← Static assets, immutable
├─────────────────────────────────────┤
│  Service Worker (Workbox)           │  ← Offline-first, precache
├─────────────────────────────────────┤
│  React Query Cache (Memory)         │  ← API responses, 30s stale
├─────────────────────────────────────┤
│  IndexedDB (Persisted)              │  ← User preferences, drafts
└─────────────────────────────────────┘
```

### 4.2 Cache Invalidation Patterns
```typescript
// Tag-based invalidation
queryClient.invalidateQueries({ queryKey: ['apis'] });
queryClient.invalidateQueries({ queryKey: ['incidents', id] });
queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'alerts' });

// Mutation-based
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['team'] });
  queryClient.invalidateQueries({ queryKey: ['invitations'] });
}
```

---

## 5. Performance Optimizations

### 5.1 Code Splitting
```tsx
// Dynamic imports for heavy pages
const SLODashboard = dynamic(() => import('@/app/dashboard/slo/page'), {
  loading: () => <SkeletonChart />,
  ssr: false,
});

const KnowledgeBase = dynamic(() => import('@/app/dashboard/kb/page'), {
  loading: () => <SkeletonList />,
});
```

### 5.2 Bundle Analysis
```bash
# Analyze bundle
ANALYZE=true npm run build

# Target budgets
# - Initial JS: < 200KB gzipped
# - Page JS: < 100KB gzipped
# - CSS: < 50KB gzipped
```

### 5.3 Image Optimization
```tsx
// Use Next.js Image component everywhere
import Image from 'next/image';

<Image
  src={user.avatarUrl}
  alt={user.name}
  width={32}
  height={32}
  className="rounded-full"
  placeholder="blur"
  blurDataUrl="data:image/png;base64,..."
/>
```

---

## 6. Error Boundaries & Resilience

### 6.1 Error Boundary Hierarchy
```tsx
// components/ErrorBoundary.tsx
<ErrorBoundary fallback={<PageError />}>
  <DashboardLayout>
    <ErrorBoundary fallback={<WidgetError name="Charts" />}>
      <ChartsWidget />
    </ErrorBoundary>
    <ErrorBoundary fallback={<WidgetError name="Table" />}>
      <DataTable />
    </ErrorBoundary>
  </DashboardLayout>
</ErrorBoundary>
```

### 6.2 Retry with Exponential Backoff
```typescript
// lib/fetchWithRetry.ts
async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetch(url, options);
    } catch (e) {
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, 1000 * 2 ** i + Math.random() * 1000));
    }
  }
}
```

### 6.3 Circuit Breaker
```typescript
// lib/circuitBreaker.ts
class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > 30_000) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit open');
      }
    }
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (e) {
      this.onFailure();
      throw e;
    }
  }
}
```

---

## 7. Background Jobs & Web Workers

### 7.1 Heavy Computation Offloading
```typescript
// workers/chartWorker.ts
self.onmessage = (e) => {
  const { type, data } = e.data;
  if (type === 'downsample') {
    const result = lttb(data.points, data.threshold);
    self.postMessage({ type: 'downsampled', result });
  }
};
```

### 7.2 Web Worker Hook
```typescript
// hooks/useWorker.ts
function useWorker<T>(workerScript: string) {
  const workerRef = useRef<Worker>();
  const [result, setResult] = useState<T>();

  useEffect(() => {
    workerRef.current = new Worker(workerScript);
    workerRef.current.onmessage = (e) => setResult(e.data.result);
    return () => workerRef.current?.terminate();
  }, [workerScript]);

  const postMessage = useCallback((data) => {
    workerRef.current?.postMessage(data);
  }, []);

  return { result, postMessage };
}
```

---

## 8. Monitoring & Observability

### 8.1 Client-Side Metrics
```typescript
// lib/metrics.ts
function reportWebVitals() {
  // LCP, FID, CLS, TTFB
  new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      analytics.track('web_vital', {
        name: entry.name,
        value: entry.value,
        rating: entry.value > threshold ? 'poor' : 'good',
      });
    });
  }).observe({ type: 'largest-contentful-paint', buffered: true });
}
```

### 8.2 Error Tracking
```typescript
// Sentry integration
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event) {
    // Filter sensitive data
    return sanitizeEvent(event);
  },
});
```

### 8.3 API Health Checks
```typescript
// /api/health
export async function GET() {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkExternalAPIs(),
  ]);
  return Response.json({
    status: checks.every(c => c.status === 'fulfilled') ? 'healthy' : 'degraded',
    checks: checks.map((c, i) => ({ name: names[i], status: c.status })),
  });
}
```

---

## 9. Scalability Patterns

### 9.1 Horizontal Scaling Ready
- Stateless frontend (no session affinity needed)
- CDN for static assets
- Edge caching for API responses (stale-while-revalidate)

### 9.2 Database Connection Pooling
- Backend handles pooling
- Frontend uses request coalescing via React Query

### 9.3 Rate Limiting (Client-side)
```typescript
// hooks/useRateLimit.ts
function useRateLimit(key: string, maxRequests = 10, windowMs = 60_000) {
  const requests = useRef<number[]>([]);
  
  return () => {
    const now = Date.now();
    requests.current = requests.current.filter(t => now - t < windowMs);
    if (requests.current.length >= maxRequests) {
      throw new Error('Rate limited');
    }
    requests.current.push(now);
  };
}
```

---

## 10. Implementation Priority

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| P0 | React Query integration | Medium | High |
| P0 | Virtualized tables | Low | High |
| P0 | Error boundaries | Low | High |
| P1 | WebSocket real-time | High | High |
| P1 | Optimistic updates | Medium | High |
| P1 | Code splitting | Low | Medium |
| P2 | Service Worker / PWA | Medium | Medium |
| P2 | Web Workers for charts | Medium | Medium |
| P3 | Circuit breaker | Low | Medium |
| P3 | Advanced metrics | Medium | Low |

---

## 11. File Structure for System Layer

```
src/
├── lib/
│   ├── queryClient.ts          # React Query setup
│   ├── realtime.ts             # WebSocket/SSE client
│   ├── cache.ts                # Cache utilities
│   ├── metrics.ts              # Web vitals, analytics
│   ├── circuitBreaker.ts       # Resilience patterns
│   ├── downsample.ts           # Chart data optimization
│   └── fetchWithRetry.ts       # Retry logic
├── hooks/
│   ├── useInfiniteQuery.ts     # Infinite scroll
│   ├── useOptimisticMutation.ts # Optimistic updates
│   ├── useRateLimit.ts         # Client-side rate limiting
│   └── useWorker.ts            # Web Worker abstraction
├── components/
│   ├── ErrorBoundary.tsx       # Error boundaries
│   ├── VirtualizedTable.tsx    # react-window wrapper
│   ├── SkeletonChart.tsx       # Loading states
│   └── RealtimeIndicator.tsx   # Connection status
├── providers/
│   ├── QueryProvider.tsx       # React Query provider
│   └── RealtimeProvider.tsx    # WebSocket context
└── workers/
    ├── chartWorker.ts          # Chart downsampling
    └── dataWorker.ts           # Data processing
```

---

## 12. Backend Contract Requirements

### Pagination Response
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1000,
    "totalPages": 50,
    "hasNext": true,
    "hasPrev": false,
    "nextCursor": "abc123"
  }
}
```

### Real-time Event Format
```json
{
  "type": "incident.triggered",
  "payload": { "id": "123", "title": "API Down" },
  "timestamp": "2026-01-20T10:00:00Z",
  "orgId": "org_456"
}
```

### Health Check
```json
{
  "status": "healthy",
  "checks": [
    { "name": "database", "status": "ok", "latencyMs": 5 },
    { "name": "redis", "status": "ok", "latencyMs": 2 }
  ]
}
```