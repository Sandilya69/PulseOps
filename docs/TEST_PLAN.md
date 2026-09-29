# PulseOps CRM - Test Plan

**Version:** 2.0  
**Last Updated:** September 2026

---

## 1. Testing Strategy

### 1.1 Test Pyramid

```
                    ┌─────────────┐
                    │   E2E       │  ◄── 10%  (Critical user flows)
                    │  (Playwright)│
                  ┌───────────────┐
                  │ Integration   │  ◄── 20%  (API + DB)
                  │  (Vitest)     │
                ┌───────────────────┐
                │     Unit          │  ◄── 70%  (Services, utils, validators)
                │    (Vitest)       │
                └───────────────────┘
```

### 1.2 Test Categories

| Category | Tool | Scope | Target Coverage |
|----------|------|-------|-----------------|
| **Unit** | Vitest | Services, utils, validators, hooks | 80%+ |
| **Integration** | Vitest + Testcontainers | API routes, DB operations, auth | 60%+ |
| **E2E** | Playwright | Critical user journeys | 100% of happy paths |
| **Contract** | Zod | API request/response schemas | 100% |
| **Visual** | Playwright + Percy | UI regression | Key pages |
| **Performance** | k6 | Load testing | API < 200ms p95 |
| **Security** | OWASP ZAP / Manual | Auth, RBAC, injection | Critical paths |

---

## 2. Unit Tests (Backend)

### 2.1 Test Structure
```
backend/
├── src/
│   ├── services/
│   │   ├── __tests__/
│   │   │   ├── auth.service.test.ts
│   │   │   ├── ticket.service.test.ts
│   │   │   ├── incident.service.test.ts
│   │   │   ├── user.service.test.ts
│   │   │   ├── org.service.test.ts
│   │   │   ├── api.service.test.ts
│   │   │   ├── monitor.service.test.ts
│   │   │   ├── alert.service.test.ts
│   │   │   ├── activity.service.test.ts
│   │   │   ├── notification.service.test.ts
│   │   │   └── analytics.service.test.ts
│   ├── lib/
│   │   ├── __tests__/
│   │   │   ├── permissions.test.ts
│   │   │   ├── jwt.test.ts
│   │   │   ├── password.test.ts
│   │   │   └── slug.test.ts
│   └── utils/
│       ├── __tests__/
│       │   ├── apiResponse.test.ts
│       │   ├── errors.test.ts
│       │   └── date.test.ts
```

### 2.2 Key Unit Test Scenarios

#### Auth Service
- [ ] `signup` creates user + org + activity log
- [ ] `signup` fails on duplicate email
- [ ] `login` returns access + refresh tokens
- [ ] `login` fails on wrong password
- [ ] `refreshToken` rotates tokens correctly
- [ ] `refreshToken` fails on expired/revoked token
- [ ] `logout` revokes refresh token
- [ ] `oauthCallback` handles new/existing users

#### Permission System (RBAC)
- [ ] `checkPermission` returns true for allowed roles
- [ ] `checkPermission` returns false for denied roles
- [ ] All 35+ permissions mapped correctly
- [ ] Owner has all permissions
- [ ] Viewer has only read permissions

#### Ticket Service
- [ ] `create` generates sequential ticket number
- [ ] `create` sends notification to admins
- [ ] `create` logs activity
- [ ] `addMessage` creates message + notification
- [ ] `addInternalNote` hides from user
- [ ] `changeStatus` updates timestamps
- [ ] `assign` notifies assignee
- [ ] `list` filters by status/priority/assignee
- [ ] User sees only own tickets (unless admin)

#### Incident Service
- [ ] `create` sets triggeredAt, status=triggered
- [ ] `acknowledge` sets acknowledgedAt/By, status=acknowledged
- [ ] `resolve` sets resolvedAt/By, status=resolved
- [ ] `addTimelineEvent` creates event with actor
- [ ] MTTA/MTTR calculated correctly
- [ ] Alert dispatch creates integration logs

#### Activity Service
- [ ] `logActivity` captures all fields
- [ ] `logActivity` includes IP + user-agent
- [ ] `getActivityFeed` paginates correctly
- [ ] `getActivityFeed` filters by user/action/resource
- [ ] `exportActivity` returns CSV

#### Monitor Service
- [ ] `checkApi` performs HTTP request
- [ ] `checkApi` measures response time
- [ ] `checkApi` stores ApiCheck result
- [ ] `evaluateAlerts` triggers on threshold breach
- [ ] `evaluateAlerts` respects duration windows

### 2.3 Test Utilities

```typescript
// backend/src/test/utils.ts
import { PrismaClient } from '@prisma/client';

export const testPrisma = new PrismaClient();

// Test data factories
export const createTestOrg = async (overrides = {}) => {
  return testPrisma.organization.create({
    data: {
      name: 'Test Org',
      slug: `test-org-${Date.now()}`,
      ownerId: 'test-user-id',
      ...overrides,
    },
  });
};

export const createTestUser = async (orgId: string, overrides = {}) => {
  return testPrisma.user.create({
    data: {
      orgId,
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      passwordHash: await hashPassword('password123'),
      ...overrides,
    },
  });
};

export const createTestApi = async (orgId: string, overrides = {}) => {
  return testPrisma.monitoredApi.create({
    data: {
      orgId,
      name: 'Test API',
      endpointUrl: 'https://api.example.com/health',
      ...overrides,
    },
  });
};

// Cleanup
export const cleanupTestData = async () => {
  await testPrisma.$transaction([
    testPrisma.apiCheck.deleteMany(),
    testPrisma.alert.deleteMany(),
    testPrisma.incidentTimelineEvent.deleteMany(),
    testPrisma.incident.deleteMany(),
    testPrisma.monitoredApi.deleteMany(),
    testPrisma.ticketMessage.deleteMany(),
    testPrisma.supportTicket.deleteMany(),
    testPrisma.activityLog.deleteMany(),
    testPrisma.invitation.deleteMany(),
    testPrisma.user.deleteMany(),
    testPrisma.organization.deleteMany(),
  ]);
};
```

---

## 3. Integration Tests (Backend)

### 3.1 Test Structure
```
backend/
├── src/
│   ├── routes/
│   │   ├── __tests__/
│   │   │   ├── auth.routes.test.ts
│   │   │   ├── org.routes.test.ts
│   │   │   ├── user.routes.test.ts
│   │   │   ├── ticket.routes.test.ts
│   │   │   ├── incident.routes.test.ts
│   │   │   ├── api.routes.test.ts
│   │   │   ├── integration.routes.test.ts
│   │   │   ├── activity.routes.test.ts
│   │   │   └── notification.routes.test.ts
```

### 3.2 Test Setup (Testcontainers)

```typescript
// backend/src/test/setup.ts
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';

let pgContainer: StartedPostgreSqlContainer;
let redisContainer: StartedRedisContainer;

export async function setupTestContainers() {
  pgContainer = await new PostgreSqlContainer('postgres:16')
    .withDatabase('pulseops_test')
    .withUsername('test')
    .withPassword('test')
    .start();

  redisContainer = await new RedisContainer('redis:7-alpine').start();

  process.env.DATABASE_URL = pgContainer.getConnectionUri();
  process.env.REDIS_URL = redisContainer.getConnectionUri();
  process.env.JWT_ACCESS_SECRET = 'test-secret-min-32-characters-long';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-32-characters-long';
}

export async function teardownTestContainers() {
  await pgContainer?.stop();
  await redisContainer?.stop();
}

// vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: ['./src/test/setup.ts'],
    teardown: ['./src/test/teardown.ts'],
    testTimeout: 30000,
  },
});
```

### 3.3 Key Integration Test Scenarios

#### Auth Routes
- [ ] `POST /api/auth/signup` → 201, returns user + tokens
- [ ] `POST /api/auth/login` → 200, returns tokens
- [ ] `POST /api/auth/refresh` → 200, new access token
- [ ] `GET /api/auth/me` → 200 with valid token
- [ ] `GET /api/auth/me` → 401 without token
- [ ] `POST /api/auth/logout` → 200, token revoked
- [ ] OAuth flows: Google, GitHub

#### Organization Routes
- [ ] `GET /api/organizations/me` → 200, org details
- [ ] `PATCH /api/organizations/me` → 200, updated org
- [ ] `DELETE /api/organizations/me` → 200, cascades delete
- [ ] Owner only can delete org

#### User Routes (RBAC)
- [ ] `GET /api/users` → 200, list (admin+)
- [ ] `GET /api/users` → 403 (member)
- [ ] `PATCH /api/users/:id` role change → 200 (admin+)
- [ ] `DELETE /api/users/:id` → 200 (admin+)
- [ ] Cannot delete self
- [ ] Cannot change own role

#### Ticket Routes
- [ ] `POST /api/tickets` → 201, creates ticket + notifications
- [ ] `GET /api/tickets` → 200, paginated list
- [ ] `GET /api/tickets?status=open` → filtered
- [ ] `GET /api/tickets/:id` → 200, with messages
- [ ] `PATCH /api/tickets/:id` → 200, status change
- [ ] `POST /api/tickets/:id/messages` → 201, adds message
- [ ] User cannot view other users' tickets (unless admin)

#### Incident Routes
- [ ] `POST /api/incidents` → 201, creates incident
- [ ] `PATCH /api/incidents/:id/acknowledge` → 200
- [ ] `PATCH /api/incidents/:id/resolve` → 200
- [ ] `POST /api/incidents/:id/timeline` → 201
- [ ] Timeline returns chronological events

#### API Routes
- [ ] `POST /api/apis` → 201, creates monitored API
- [ ] `GET /api/apis` → 200, list with status
- [ ] `POST /api/apis/:id/check` → 200, manual check
- [ ] `PATCH /api/apis/:id` → 200, update config
- [ ] `DELETE /api/apis/:id` → 200

#### Activity Routes
- [ ] `GET /api/activity` → 200, paginated
- [ ] `GET /api/activity?action=api.created` → filtered
- [ ] `GET /api/activity/stats` → 200, analytics

---

## 4. E2E Tests (Frontend - Playwright)

### 4.1 Test Structure
```
frontend/
├── e2e/
│   ├── fixtures/
│   │   └── test-data.ts
│   ├── pages/
│   │   ├── LoginPage.ts
│   │   ├── SignupPage.ts
│   │   ├── DashboardPage.ts
│   │   ├── TeamPage.ts
│   │   ├── TicketsPage.ts
│   │   ├── IncidentsPage.ts
│   │   ├── APIsPage.ts
│   │   └── SettingsPage.ts
│   ├── specs/
│   │   ├── auth.spec.ts
│   │   ├── onboarding.spec.ts
│   │   ├── team-management.spec.ts
│   │   ├── ticket-workflow.spec.ts
│   │   ├── incident-workflow.spec.ts
│   │   ├── api-monitoring.spec.ts
│   │   └── settings.spec.ts
│   └── utils/
│       └── helpers.ts
```

### 4.2 Page Object Model Example

```typescript
// e2e/pages/DashboardPage.ts
export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async getStatCards() {
    return this.page.locator('[data-testid="stat-card"]').all();
  }

  async getUptimeCard() {
    return this.page.locator('[data-testid="stat-uptime"]');
  }

  async clickIncidentsTab() {
    await this.page.click('[data-testid="tab-incidents"]');
  }
}
```

### 4.3 Critical E2E Scenarios

#### Authentication Flow
- [ ] **Signup** → Creates org → Redirects to dashboard
- [ ] **Login** → Redirects to dashboard
- [ ] **Logout** → Redirects to login
- [ ] **OAuth Google** → Redirects → Returns to dashboard
- [ ] **OAuth GitHub** → Redirects → Returns to dashboard
- [ ] **Protected route** → Redirects to login
- [ ] **Token refresh** → Seamless on expiry

#### Onboarding Flow
- [ ] New user → Signup → Onboarding wizard → Add API → Configure alerts → Dashboard

#### Team Management
- [ ] Admin invites member → Email sent → Member accepts → Added to team
- [ ] Admin changes member role → Updated in UI + activity log
- [ ] Admin deactivates member → Member cannot login
- [ ] Admin reactivates member → Member can login
- [ ] Bulk role change → Multiple members updated
- [ ] Export team CSV → Downloads file

#### Ticket Workflow
- [ ] User creates ticket → Appears in list → Admin notified
- [ ] Admin views ticket → Replies → User notified
- [ ] Admin adds internal note → User cannot see
- [ ] Admin changes status → User notified
- [ ] Admin assigns ticket → Assignee notified
- [ ] User replies → Admin notified
- [ ] Admin resolves → Resolution email sent
- [ ] Filters work: status, priority, category, assignee
- [ ] Search works: title, description

#### Incident Workflow
- [ ] API fails → Incident created automatically
- [ ] Alert sent via configured channels
- [ ] On-call acknowledges → MTTA recorded
- [ ] Team adds notes → Real-time updates
- [ ] @mention → Notification sent
- [ ] Runbook attached → Visible in timeline
- [ ] Incident resolved → MTTR recorded → Status page updated

#### API Monitoring
- [ ] Add API → Configure check interval → Save
- [ ] Manual check → Shows result
- [ ] Pause/Resume monitoring
- [ ] Create alert rule → Trigger alert
- [ ] View API health timeline
- [ ] Delete API → Removes checks

#### Settings
- [ ] Update org name/logo → Saved
- [ ] Change timezone → Affects timestamps
- [ ] Configure notification defaults → New users inherit
- [ ] Danger zone: Delete org → Confirms → Deletes all data

---

## 5. Contract Tests

### 5.1 API Schema Validation

```typescript
// shared/schemas/api.schemas.ts
import { z } from 'zod';

export const createTicketSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  category: z.enum(['bug', 'feature_request', 'technical_support', 'billing', 'general']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  tags: z.array(z.string()).default([]),
});

export const ticketResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string().uuid(),
    ticketNumber: z.string(),
    title: z.string(),
    status: z.enum(['open', 'in_progress', 'waiting_on_user', 'resolved', 'closed']),
    // ... rest of fields
  }),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
  }).optional(),
});

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.object({
      field: z.string(),
      message: z.string(),
    })).optional(),
  }),
});
```

### 5.2 Contract Test Execution
```typescript
// e2e/contract/api-contract.test.ts
import { test, expect } from '@playwright/test';
import { ticketResponseSchema } from '@shared/schemas';

test('GET /api/tickets returns valid schema', async ({ request }) => {
  const response = await request.get('/api/tickets', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  const result = ticketResponseSchema.safeParse(body);
  expect(result.success).toBe(true);
});
```

---

## 6. Visual Regression Tests

### 6.1 Key Pages for Visual Testing
- Landing page
- Login/Signup
- Dashboard overview
- Team management
- Ticket list + detail
- Incident list + detail
- API monitoring
- Settings (all tabs)
- Profile page

### 6.2 Percy Configuration
```javascript
// .percy.js
module.exports = {
  snapshot: {
    widths: [375, 768, 1024, 1440],
    minHeight: 800,
    percyCSS: `
      .recharts-wrapper { animation: none !important; }
      .loading-skeleton { display: none !important; }
    `,
  },
};
```

---

## 7. Performance Tests

### 7.1 Load Test Scenarios (k6)

```javascript
// k6/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Stress
    { duration: '5m', target: 200 },  // Stay
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],     // 95th percentile < 200ms
    http_req_failed: ['rate<0.01'],       // Error rate < 1%
    http_reqs: ['rate>100'],              // > 100 req/s
  },
};

export default function () {
  const token = getAuthToken();
  const headers = { Authorization: `Bearer ${token}` };
  
  // Dashboard load
  let res = http.get('https://api.pulseops.com/api/auth/me', { headers });
  check(res, { 'me status 200': (r) => r.status === 200 });
  
  // List APIs
  res = http.get('https://api.pulseops.com/api/apis', { headers });
  check(res, { 'apis status 200': (r) => r.status === 200 });
  
  // List tickets
  res = http.get('https://api.pulseops.com/api/tickets', { headers });
  check(res, { 'tickets status 200': (r) => r.status === 200 });
  
  sleep(1);
}
```

### 7.2 Performance Benchmarks

| Endpoint | Target (p95) | Target (p99) |
|----------|-------------|-------------|
| `GET /api/auth/me` | 50ms | 100ms |
| `GET /api/apis` | 100ms | 200ms |
| `GET /api/tickets` | 150ms | 300ms |
| `GET /api/incidents` | 150ms | 300ms |
| `GET /api/activity` | 200ms | 400ms |
| `POST /api/tickets` | 200ms | 400ms |
| `POST /api/apis/:id/check` | 500ms | 1000ms |

---

## 8. Security Tests

### 8.1 Authentication Tests
- [ ] Expired access token → 401
- [ ] Invalid token signature → 401
- [ ] Token without org_id → 401
- [ ] Refresh token rotation works
- [ ] Refresh token reuse → revoked
- [ ] Logout revokes refresh token
- [ ] Concurrent sessions handled

### 8.2 Authorization Tests
- [ ] Member cannot access admin routes
- [ ] Viewer cannot mutate resources
- [ ] User cannot access other orgs' data
- [ ] User sees only own tickets (non-admin)
- [ ] RBAC enforced at service layer too

### 8.3 Input Validation Tests
- [ ] SQL injection in search → sanitized
- [ ] XSS in ticket description → escaped
- [ ] Path traversal in file upload → blocked
- [ ] Oversized payloads → rejected
- [ ] Invalid UUIDs → 400

### 8.4 Rate Limiting Tests
- [ ] Auth endpoints: 10 req/min per IP
- [ ] API endpoints: 100 req/min per user
- [ ] Exceeding limit → 429 with retry-after

### 8.5 Dependency Scanning
- [ ] `npm audit` in CI
- [ ] Snyk/Dependabot alerts
- [ ] License compliance check

---

## 9. Test Data Management

### 9.1 Test Database Strategy
- **Unit tests:** Mock Prisma client
- **Integration tests:** Testcontainers (fresh DB per test file)
- **E2E tests:** Dedicated test database (seeded)
- **CI:** Ephemeral containers

### 9.2 Seed Data
```typescript
// prisma/seed.test.ts
export async function seedTestData(prisma: PrismaClient) {
  const org = await prisma.organization.create({
    data: {
      name: 'Test Org',
      slug: 'test-org',
      ownerId: 'owner-id',
    },
  });

  const owner = await prisma.user.create({
    data: {
      orgId: org.id,
      email: 'owner@test.com',
      name: 'Owner',
      role: 'owner',
      passwordHash: await hash('password123'),
    },
  });

  const admin = await prisma.user.create({
    data: {
      orgId: org.id,
      email: 'admin@test.com',
      name: 'Admin',
      role: 'admin',
      passwordHash: await hash('password123'),
    },
  });

  const member = await prisma.user.create({
    data: {
      orgId: org.id,
      email: 'member@test.com',
      name: 'Member',
      role: 'member',
      passwordHash: await hash('password123'),
    },
  });

  // Create test APIs, tickets, incidents, etc.
  return { org, owner, admin, member };
}
```

---

## 10. CI/CD Pipeline

### 10.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run typecheck

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run test:unit
      - uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: test }
        ports: [5432:5432]
      redis:
        image: redis:7-alpine
        ports: [6379:6379]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run start:prod &
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=high
      - uses: snyk/actions/node@master
        with: { command: test }
```

---

## 11. Test Execution Commands

```bash
# Backend
cd backend
npm run test              # All tests (unit + integration)
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report

# Frontend
cd frontend
npm run test              # Unit tests (Vitest)
npm run test:e2e          # E2E tests (Playwright)
npm run test:e2e:ui       # Playwright UI mode
npm run test:visual       # Visual regression (Percy)

# Full stack
npm run test:all          # Runs all test suites
```

---

## 12. Test Coverage Targets

| Layer | Target | Enforced in CI |
|-------|--------|----------------|
| **Backend Unit** | 80% | ✅ |
| **Backend Integration** | 60% | ✅ |
| **Frontend Unit** | 70% | ✅ |
| **E2E Critical Paths** | 100% | ✅ |
| **Overall** | 70% | ✅ |

---

## 13. Defect Management

### 13.1 Severity Levels
| Level | Description | SLA |
|-------|-------------|-----|
| **Critical** | Data loss, security breach, complete outage | 2 hours |
| **High** | Major feature broken, affects many users | 8 hours |
| **Medium** | Minor feature broken, workaround exists | 24 hours |
| **Low** | Cosmetic, minor UX issue | 5 days |

### 13.2 Bug Report Template
```markdown
## Bug Report

**Title:** [Clear, concise summary]

**Severity:** Critical / High / Medium / Low

**Environment:** [Local / Staging / Production]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**
 
**Actual Behavior:**

**Screenshots/Logs:**

**Affected Components:**
- [ ] Backend API
- [ ] Frontend UI
- [ ] Database
- [ ] Background Jobs

**Related Tests:**
- [ ] Unit test added
- [ ] Integration test added
- [ ] E2E test added
```

---

## 14. Release Testing Checklist

### Pre-Release
- [ ] All CI checks pass
- [ ] Coverage targets met
- [ ] No critical/high security vulnerabilities
- [ ] E2E tests pass on staging
- [ ] Visual regression approved
- [ ] Performance benchmarks met
- [ ] Database migrations tested
- [ ] Rollback plan documented

### Post-Release
- [ ] Smoke tests on production
- [ ] Monitor error rates (Sentry)
- [ ] Monitor performance (APM)
- [ ] Verify critical user flows
- [ ] Check background jobs running

---

## 15. Test Maintenance

### 15.1 Flaky Test Policy
- Quarantine flaky tests immediately
- Fix within 48 hours or remove
- Track flakiness in dashboard

### 15.2 Test Review
- New features require tests in PR
- Test code reviewed same as production code
- Refactor tests with production code

### 15.3 Documentation
- Update TEST_PLAN.md with new scenarios
- Document test data setup
- Maintain test runbook