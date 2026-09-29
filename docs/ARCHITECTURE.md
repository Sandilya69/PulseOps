# PulseOps CRM - System Architecture

**Version:** 2.0  
**Last Updated:** September 2026

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │   Web Browser   │  │  Mobile Browser │  │  API Consumers (cURL, etc)  │  │
│  └────────┬────────┘  └────────┬────────┘  └──────────────┬──────────────┘  │
└───────────┼────────────────────┼──────────────────────────┼─────────────────┘
            │                    │                          │
            ▼                    ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CDN / EDGE                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Vercel Edge Network / Cloudflare (Static Assets, ISR, Edge Funcs)  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                                  │
│  ┌──────────────────────────┐    ┌──────────────────────────────────────┐  │
│  │     FRONTEND (Next.js)   │    │         BACKEND (Express)            │  │
│  │  ┌────────────────────┐  │    │  ┌────────────────────────────────┐  │  │
│  │  │ App Router Pages   │  │    │  │ Express App (app.ts)           │  │  │
│  │  │ - Dashboard        │  │    │  │ - Helmet, CORS, Morgan         │  │  │
│  │  │ - Auth (login,     │  │    │  │ - Rate Limiting                │  │  │
│  │  │   signup, OAuth)   │  │    │  │ - Error Handling               │  │  │
│  │  │ - Settings         │  │    │  └──────────────┬─────────────────┘  │  │
│  │  └────────────────────┘  │    │                 │                   │  │
│  │  ┌────────────────────┐  │    │  ┌──────────────▼────────────────┐  │  │
│  │  │ Components         │  │    │  │ Routes (REST API)             │  │  │
│  │  │ - shadcn/ui        │  │    │  │ - /api/auth/*                 │  │  │
│  │  │ - Custom (forms,   │  │    │  │ - /api/organizations/*        │  │  │
│  │  │   tables, charts)  │  │    │  │ - /api/users/*                │  │  │
│  │  └────────────────────┘  │    │  │ - /api/tickets/*              │  │  │
│  │  ┌────────────────────┐  │    │  │ - /api/incidents/*            │  │  │
│  │  │ State Management   │  │    │  │ - /api/apis/*                 │  │  │
│  │  │ - Zustand (auth)   │  │    │  │ - /api/integrations/*         │  │  │
│  │  │ - TanStack Query   │  │    │  │ - /api/activity/*             │  │  │
│  │  │   (server state)   │  │    │  └──────────────┬────────────────┘  │  │
│  │  └────────────────────┘  │    │                 │                   │  │
│  │  ┌────────────────────┐  │    │  ┌──────────────▼────────────────┐  │  │
│  │  │ Real-time          │  │    │  │ Controllers                   │  │  │
│  │  │ - Supabase Client  │  │    │  │ - Request validation (Zod)    │  │  │
│  │  │ - WebSocket        │  │    │  │ - Call services               │  │  │
│  │  └────────────────────┘  │    │  └──────────────┬────────────────┘  │  │
│  └──────────────────────────┘    │                 │                   │  │
└──────────────────────────────────┼─────────────────┼───────────────────┘
                                   │                 │
                    ┌──────────────┴───────┐  ┌──────┴──────────────┐
                    ▼                      ▼  ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SERVICE LAYER                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │   Auth      │ │  User/Org   │ │  Activity   │ │    Ticket           │  │
│  │  Service    │ │  Service    │ │  Service    │ │    Service          │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │  Incident   │ │  Monitor    │ │  Alert      │ │  Integration        │  │
│  │  Service    │ │  Service    │ │  Service    │ │  Service            │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │ Notification│ │  Email      │ │  Analytics  │ │  Billing            │  │
│  │  Service    │ │  Service    │ │  Service    │ │  Service (future)   │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘  │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │  PostgreSQL      │  │  Redis           │  │  Supabase Realtime       │  │
│  │  (Primary DB)    │  │  (Cache, Sessions│  │  (WebSocket /            │  │
│  │  - Prisma ORM    │  │   Rate Limit)    │  │   Postgres Changes)      │  │
│  │  - Connection    │  │  - Upstash/      │  │  - Activity feed         │  │
│  │    Pooling       │  │   Redis Cloud    │  │  - Incident updates      │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────────────┘  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │  Supabase        │  │  Resend          │  │  Twilio                  │  │
│  │  Storage         │  │  (Email API)     │  │  (SMS/WhatsApp/Voice)    │  │
│  │  - Avatars       │  │  - Invitations   │  │  - Critical alerts       │  │
│  │  - Attachments   │  │  - Notifications │  │  - Voice calls           │  │
│  │  - Logos         │  │  - Digests       │  └──────────────────────────┘  │
│  └──────────────────┘  └──────────────────┘
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Backend Architecture (Express + TypeScript)

### 2.1 Project Structure
```
backend/
├── prisma/
│   └── schema.prisma          # Database schema (single source of truth)
├── src/
│   ├── index.ts               # Entry point - starts server
│   ├── app.ts                 # Express setup, middleware, routes
│   ├── config/
│   │   └── index.ts           # Environment validation (Zod)
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── permissions.ts     # RBAC permission matrix
│   │   ├── jwt.ts             # JWT sign/verify utilities
│   │   ├── password.ts        # bcrypt hash/verify
│   │   └── slug.ts            # URL-friendly slug generation
│   ├── middleware/
│   │   ├── auth.middleware.ts     # JWT verification, user attachment
│   │   ├── rbac.middleware.ts     # Permission checking
│   │   ├── validation.middleware.ts # Zod schema validation
│   │   ├── rateLimit.middleware.ts # Express-rate-limit
│   │   └── error.middleware.ts    # Global error handler
│   ├── routes/
│   │   ├── index.ts           # Route aggregator
│   │   ├── auth.routes.ts     # /api/auth/*
│   │   ├── org.routes.ts      # /api/organizations/*
│   │   ├── user.routes.ts     # /api/users/*
│   │   ├── ticket.routes.ts   # /api/tickets/*
│   │   ├── incident.routes.ts # /api/incidents/*
│   │   ├── api.routes.ts      # /api/apis/*
│   │   ├── integration.routes.ts
│   │   ├── activity.routes.ts
│   │   └── notification.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── org.controller.ts
│   │   ├── user.controller.ts
│   │   ├── ticket.controller.ts
│   │   ├── incident.controller.ts
│   │   ├── api.controller.ts
│   │   ├── integration.controller.ts
│   │   ├── activity.controller.ts
│   │   └── notification.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── org.service.ts
│   │   ├── ticket.service.ts
│   │   ├── incident.service.ts
│   │   ├── api.service.ts
│   │   ├── monitor.service.ts      # Background health checks
│   │   ├── alert.service.ts        # Alert evaluation + dispatch
│   │   ├── integration.service.ts
│   │   ├── activity.service.ts
│   │   ├── notification.service.ts
│   │   ├── email.service.ts        # Resend wrapper
│   │   ├── sms.service.ts          # Twilio wrapper
│   │   └── analytics.service.ts
│   ├── utils/
│   │   ├── apiResponse.ts     # Standardized API responses
│   │   ├── errors.ts          # Custom error classes
│   │   └── date.ts            # Date formatting helpers
│   └── jobs/
│       ├── monitor.job.ts     # Scheduled API health checks
│       ├── alert.job.ts       # Alert evaluation
│       ├── digest.job.ts      # Daily/weekly email digests
│       └── cleanup.job.ts     # Data retention, expired tokens
```

### 2.2 Request Flow

```
HTTP Request
    │
    ▼
┌─────────────────┐
│  Helmet/CORS    │  Security headers
└────────┬────────┘
    │
    ▼
┌─────────────────┐
│  Rate Limiter   │  Per-IP / per-user limits
└────────┬────────┘
    │
    ▼
┌─────────────────┐
│  Morgan Logger  │  Request logging
└────────┬────────┘
    │
    ▼
┌─────────────────┐
│  Body Parser    │  JSON/URL-encoded
└────────┬────────┘
    │
    ▼
┌─────────────────┐
│  Auth Middleware│  Verify JWT → attach req.user
└────────┬────────┘
    │
    ▼
┌─────────────────┐
│  RBAC Middleware│  Check permission for route
└────────┬────────┘
    │
    ▼
┌─────────────────┐
│  Validation     │  Zod schema validation
│  Middleware     │
└────────┬────────┘
    │
    ▼
┌─────────────────┐
│  Controller     │  Handle request, call service
└────────┬────────┘
    │
    ▼
┌─────────────────┐
│  Service        │  Business logic, DB operations
└────────┬────────┘
    │
    ▼
┌─────────────────┐
│  Prisma         │  Database queries
└────────┬────────┘
    │
    ▼
┌─────────────────┐
│  Response       │  Standardized JSON response
└─────────────────┘
```

### 2.3 Key Design Patterns

**Dependency Injection via Singletons**
```typescript
// lib/prisma.ts
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
```

**Service Layer for Business Logic**
```typescript
// services/ticket.service.ts
export class TicketService {
  async create(userId: string, orgId: string, data: CreateTicketInput) {
    // 1. Validate permissions
    // 2. Generate ticket number
    // 3. Create ticket + activity log (transaction)
    // 4. Send notifications
    // 5. Return ticket
  }
}
```

**Middleware Composition**
```typescript
// routes/ticket.routes.ts
router.post(
  '/',
  authenticate,
  requirePermission('ticket.create'),
  validate(createTicketSchema),
  ticketController.create
);
```

---

## 3. Frontend Architecture (Next.js 14 + App Router)

### 3.1 Project Structure
```
frontend/
├── src/
│   ├── app/                    # App Router pages
│   │   ├── layout.tsx          # Root layout + providers
│   │   ├── page.tsx            # Landing page
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── auth/
│   │   │   └── callback/route.ts  # OAuth callbacks
│   │   ├── dashboard/
│   │   │   ├── layout.tsx          # Dashboard shell (sidebar, header)
│   │   │   ├── page.tsx            # Overview metrics
│   │   │   ├── team/page.tsx       # Team management
│   │   │   ├── invitations/page.tsx
│   │   │   ├── tickets/page.tsx    # Support tickets
│   │   │   ├── activity/page.tsx   # Activity logs
│   │   │   ├── incidents/page.tsx
│   │   │   ├── apis/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   └── notifications/page.tsx
│   │   └── api/               # Next.js API routes (proxy to backend)
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── dashboard/         # Dashboard-specific components
│   │   ├── forms/             # Form components (Zod + RHF)
│   │   ├── tables/            # Data table components
│   │   ├── charts/            # Recharts wrappers
│   │   └── providers/         # Context providers
│   ├── store/
│   │   ├── authStore.ts       # Zustand: user, tokens, org
│   │   ├── uiStore.ts         # UI state (sidebar, modals)
│   │   └── notificationStore.ts
│   ├── lib/
│   │   ├── axios.ts           # Axios instance + interceptors
│   │   ├── queryClient.ts     # TanStack Query config
│   │   ├── supabase.ts        # Supabase client (realtime)
│   │   ├── utils.ts           # cn(), formatters
│   │   └── validations.ts     # Zod schemas (shared with backend)
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useRealtime.ts
│   │   └── usePermissions.ts
│   └── types/
│       └── index.ts           # TypeScript types (shared with backend)
```

### 3.2 State Management Strategy

| State Type | Solution | Scope |
|------------|----------|-------|
| **Auth** | Zustand (persisted) | Global |
| **Server Data** | TanStack Query | Per-component + cache |
| **Real-time** | Supabase Realtime + React Context | Components subscribed |
| **UI** | Zustand | Global (sidebar, modals, toasts) |
| **Forms** | React Hook Form + Zod | Per-form |

### 3.3 Data Fetching Pattern

```typescript
// hooks/useTickets.ts
export function useTickets(filters: TicketFilters) {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: () => api.tickets.list(filters),
    staleTime: 30_000,
  });
}

// Component
const { data, isLoading } = useTickets({ status: 'open', page: 1 });
```

### 3.4 Real-time Updates

```typescript
// hooks/useRealtimeActivity.ts
export function useRealtimeActivity(orgId: string) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel('activity_logs')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_logs',
        filter: `org_id=eq.${orgId}`,
      }, (payload) => {
        queryClient.setQueryData(['activity', orgId], (old) => 
          [payload.new, ...(old || [])]
        );
      })
      .subscribe();
    
    return () => supabase.removeChannel(channel);
  }, [orgId]);
}
```

---

## 4. Database Architecture (PostgreSQL + Prisma)

### 4.1 Schema Design Principles

1. **Multi-tenancy:** Every table has `org_id` (except users which has org_id + unique email)
2. **Soft deletes:** `is_active` boolean, `deleted_at` timestamp where needed
3. **Audit fields:** `created_at`, `updated_at` on all tables
4. **Indexes:** Composite indexes for common query patterns
5. **Enums:** PostgreSQL enums for type safety (UserRole, TicketStatus, etc.)
6. **JSONB:** Flexible metadata, settings, notification preferences
7. **Cascading deletes:** Organization deletion cascades to all related data

### 4.2 Core Entity Relationships

```
Organization (1) ─────< (N) User
Organization (1) ─────< (N) Invitation
Organization (1) ─────< (N) ActivityLog
Organization (1) ─────< (N) SupportTicket
Organization (1) ─────< (N) Contact
Organization (1) ─────< (N) MonitoredApi
Organization (1) ─────< (N) Integration
Organization (1) ─────< (N) StatusPage
Organization (1) ─────< (N) Incident

User (1) ─────< (N) ActivityLog (user_id)
User (1) ─────< (N) SupportTicket (creator)
User (1) ─────< (N) SupportTicket (assignee)
User (1) ─────< (N) TicketMessage
User (1) ─────< (N) NotificationPreference
User (1) ─────< (N) Notification
User (1) ─────< (N) Contact (creator)
User (1) ─────< (N) Incident (acknowledgedBy)
User (1) ─────< (N) Incident (resolvedBy)
User (1) ─────< (N) IncidentTimelineEvent

SupportTicket (1) ─────< (N) TicketMessage

MonitoredApi (1) ─────< (N) ApiCheck
MonitoredApi (1) ─────< (N) AlertRule
MonitoredApi (1) ─────< (N) Incident

AlertRule (1) ─────< (N) Alert

Incident (1) ─────< (N) IncidentTimelineEvent
Incident (1) ─────< (N) IntegrationLog

Integration (1) ─────< (N) IntegrationLog

StatusPage (1) ─────< (N) StatusPageItem
StatusPage (1) ─────< (N) StatusSubscriber
```

### 4.3 Critical Indexes

```sql
-- Activity logs: Org + time (most common query)
CREATE INDEX idx_activity_logs_org_created ON activity_logs(org_id, created_at DESC);

-- Tickets: Org + status (dashboard filters)
CREATE INDEX idx_tickets_org_status ON support_tickets(org_id, status);

-- Users: Org + role (team management)
CREATE INDEX idx_users_org_role ON users(org_id, role);

-- API Checks: API + time (metrics)
CREATE INDEX idx_api_checks_api_checked ON api_checks(api_id, checked_at DESC);

-- Incidents: Org + status (dashboard)
CREATE INDEX idx_incidents_org_status ON incidents(org_id, status);
```

---

## 5. Background Job Architecture

### 5.1 Job Types

| Job | Schedule | Purpose |
|-----|----------|---------|
| **Monitor Job** | Every 30s-5min (per API) | Execute health checks, store results |
| **Alert Job** | Every 60s | Evaluate alert rules, trigger alerts |
| **Digest Job** | Daily 9AM, Weekly Mon 9AM | Send email digests |
| **Cleanup Job** | Daily 2AM | Expire invitations, clean old logs, data retention |

### 5.2 Implementation (Node.js Workers)

```typescript
// jobs/monitor.job.ts
export async function runMonitorChecks() {
  const apis = await prisma.monitoredApi.findMany({
    where: { isActive: true },
    include: { alertRules: true }
  });

  for (const api of apis) {
    // Execute check
    const result = await checkApi(api);
    
    // Store check result
    await prisma.apiCheck.create({ data: result });
    
    // Evaluate alerts
    await evaluateAlerts(api, result);
    
    // Update API status
    await updateApiStatus(api, result);
  }
}
```

---

## 6. API Design

### 6.1 REST Conventions

| Resource | Endpoints |
|----------|-----------|
| **Auth** | POST `/api/auth/signup`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/me`, `/api/auth/logout` |
| **OAuth** | GET `/api/auth/google`, `/api/auth/google/callback`, `/api/auth/github`, `/api/auth/github/callback` |
| **Organizations** | GET `/api/organizations/me`, PATCH `/api/organizations/me`, DELETE `/api/organizations/me` |
| **Users** | GET `/api/users`, GET `/api/users/:id`, PATCH `/api/users/:id`, DELETE `/api/users/:id` |
| **Invitations** | POST `/api/organizations/:orgId/invitations`, GET `/api/organizations/:orgId/invitations`, DELETE `/api/invitations/:id` |
| **Tickets** | GET `/api/tickets`, POST `/api/tickets`, GET `/api/tickets/:id`, PATCH `/api/tickets/:id`, POST `/api/tickets/:id/messages` |
| **Incidents** | GET `/api/incidents`, POST `/api/incidents`, GET `/api/incidents/:id`, PATCH `/api/incidents/:id`, POST `/api/incidents/:id/timeline` |
| **APIs** | GET `/api/apis`, POST `/api/apis`, GET `/api/apis/:id`, PATCH `/api/apis/:id`, DELETE `/api/apis/:id`, POST `/api/apis/:id/check` |
| **Integrations** | GET `/api/integrations`, POST `/api/integrations`, GET `/api/integrations/:id`, PATCH `/api/integrations/:id`, DELETE `/api/integrations/:id`, POST `/api/integrations/:id/test` |
| **Activity** | GET `/api/activity`, GET `/api/activity/stats` |
| **Notifications** | GET `/api/notifications`, PATCH `/api/notifications/:id/read`, PATCH `/api/notifications/read-all` |

### 6.2 Response Format

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 100 }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [{ "field": "email", "message": "Invalid email" }]
  }
}
```

### 6.3 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid/expired token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `CONFLICT` | 409 | Resource conflict (duplicate) |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 7. Security Architecture

### 7.1 Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Client  │────▶│ Backend │────▶│  JWT    │────▶│ Client  │
│ Signup  │     │ Creates │     │ Access  │     │ Stores  │
│ /Login  │     │ User    │     │ (15m)   │     │ (HttpOnly│
└─────────┘     └─────────┘     └────┬────┘     │ Cookie) │
                                     │          └─────────┘
                                     ▼
                              ┌─────────┐
                              │  JWT    │
                              │ Refresh │
                              │ (7d)    │
                              └────┬────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
             ┌─────────┐                   ┌─────────┐
             │ HttpOnly│                   │  Access │
             │ Cookie  │                   │  Token  │
             │ (Secure)│                   │ (Memory)│
             └─────────┘                   └─────────┘
```

### 7.2 Authorization Layers

1. **Route-level:** Middleware checks permission before controller
2. **Service-level:** Business logic validates ownership (e.g., user can only see own tickets unless admin)
3. **Database-level:** RLS policies (if using Supabase) or Prisma middleware

---

## 8. Deployment Architecture

### 8.1 Development
```
Local Machine
├── PostgreSQL (Docker)
├── Redis (Docker)
├── Backend: tsx watch (port 5000)
└── Frontend: next dev (port 3000)
```

### 8.2 Production (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│                      VERCEL (Frontend)                       │
│  - Next.js build output                                     │
│  - Edge functions for auth callbacks                        │
│  - ISR for landing/dashboard                                │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     RAILWAY / RENDER / AWS                   │
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │ Backend Service │  │ PostgreSQL (Managed)            │   │
│  │ - Node.js       │  │ - Supabase / Neon / RDS         │   │
│  │ - PM2/Docker    │  │ - Connection pooling (PgBouncer)│   │
│  │ - Health checks │  │ - Automated backups             │   │
│  └────────┬────────┘  └─────────────────────────────────┘   │
│           │                                                │
│           ▼                                                │
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │ Redis           │  │ Background Workers              │   │
│  │ - Upstash/Redis │  │ - Monitor job (cron)            │   │
│  │   Cloud         │  │ - Alert job                     │   │
│  └─────────────────┘  │ - Digest job                    │   │
│                       │ - Cleanup job                   │   │
│                       └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 Environment Variables (Production)

```env
# Backend
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
REDIS_URL="redis://user:pass@host:6379"
JWT_ACCESS_SECRET="32+ char random string"
JWT_REFRESH_SECRET="32+ char random string"
NODE_ENV=production
FRONTEND_URL="https://app.pulseops.com"
RESEND_API_KEY="re_..."
TWILIO_*="..."

# Frontend
NEXT_PUBLIC_API_URL="https://api.pulseops.com"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="..."
NEXT_PUBLIC_GITHUB_CLIENT_ID="..."
```

---

## 9. Monitoring & Observability

### 9.1 Health Checks
- `GET /api/health` → `{ status: "ok", timestamp, uptime, db: "connected" }`
- `GET /api/health/ready` → Checks DB, Redis connectivity
- `GET /api/health/live` → Process alive

### 9.2 Logging
- **Request logs:** Morgan (combined format)
- **Error logs:** Winston (structured JSON)
- **Audit logs:** Database (activity_logs table)
- **Application logs:** Console (dev) → Log aggregation (prod)

### 9.3 Metrics (Future)
- Prometheus metrics endpoint
- Custom metrics: API latency, check success rate, alert volume
- Grafana dashboards

---

## 10. Disaster Recovery

| Scenario | RTO | RPO | Strategy |
|----------|-----|-----|----------|
| Database failure | < 15 min | < 1 min | Managed PG with PITR (Point-in-Time Recovery) |
| Backend down | < 5 min | 0 | Health checks + auto-restart (PM2/Docker) |
| Region outage | < 30 min | < 5 min | Multi-region DB (Supabase/Neon), DNS failover |
| Data corruption | < 1 hour | < 1 hour | Daily backups + PITR |

---

## 11. Capacity Planning

| Resource | Current | Projected (1yr) | Scaling Trigger |
|----------|---------|-----------------|-----------------|
| PostgreSQL | 1 GB | 50 GB | > 70% storage |
| Redis | 100 MB | 2 GB | > 80% memory |
| Backend CPU | 10% | 60% | > 70% for 5min |
| Backend Memory | 200 MB | 2 GB | > 80% |
| API Checks/day | 100K | 10M | Horizontal workers |
| WebSocket connections | 100 | 10K | Connection pooling |

---

## 12. Technology Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Backend Framework** | Express + TypeScript | Mature, flexible, team familiarity |
| **ORM** | Prisma | Type-safe, migrations, great DX |
| **Database** | PostgreSQL | ACID, JSONB, relational + document |
| **Auth** | JWT + HttpOnly Cookies | Stateless, secure, mobile-friendly |
| **Frontend** | Next.js 14 App Router | SSR, ISR, React Server Components |
| **UI Library** | shadcn/ui + Tailwind | Accessible, customizable, no runtime |
| **State** | Zustand + TanStack Query | Simple global + powerful server state |
| **Real-time** | Supabase Realtime | Native Postgres changes, no extra infra |
| **Email** | Resend | Developer-friendly, deliverability |
| **SMS/Voice** | Twilio | Global coverage, reliable |
| **File Storage** | Supabase Storage | Integrated with DB, S3-compatible |

---

## 13. API Versioning Strategy

- **Current:** v1 (implicit via `/api/`)
- **Future:** URL versioning `/api/v2/` when breaking changes needed
- **Deprecation:** 6-month notice, both versions run in parallel

---

## 14. Data Flow Examples

### 14.1 API Health Check Flow
```
Cron (every 60s)
    │
    ▼
Monitor Job fetches active APIs
    │
    ▼
For each API: HTTP request → measure latency, status
    │
    ▼
Store ApiCheck result
    │
    ▼
Evaluate AlertRules for this API
    │
    ├── No alert → Update API status
    └── Alert triggered →
         Create Alert record
         Call IntegrationService.dispatch()
              │
              ├── Discord webhook
              ├── Generic webhook
              └── Email (Resend)
         Create Incident if not exists
         Send real-time update via Supabase
```

### 14.2 Ticket Creation Flow
```
POST /api/tickets
    │
    ▼
Auth middleware → validate user + org
    │
    ▼
RBAC middleware → check 'ticket.create'
    │
    ▼
Validation → Zod schema
    │
    ▼
TicketService.create()
    │
    ├── Generate ticket number (TICKET-0042)
    ├── Create ticket (transaction)
    ├── Log activity: 'ticket.created'
    ├── Send confirmation email to user
    ├── Notify admins (in-app + email)
    └── Return ticket
```

---

## 15. Testing Architecture

See `TEST_PLAN.md` for detailed test strategy.

**Test Pyramid:**
- Unit: Services, utilities, validators (Vitest)
- Integration: API routes, database operations (Vitest + Testcontainers)
- E2E: Critical user flows (Playwright)
- Contract: API schema validation (Zod)

---

## 16. Future Architecture Considerations

1. **Event Sourcing** for activity logs (CQRS)
2. **Message Queue** (BullMQ/Redis) for background jobs
3. **GraphQL** for flexible frontend queries
4. **Webhooks** for third-party integrations
5. **Plugin System** for custom integrations
6. **Multi-region** for global latency reduction