# PulseOps CRM - Project Memory & Context

**Version:** 2.0  
**Last Updated:** September 2026  
**Purpose:** Living document for project context, decisions, and institutional knowledge

---

## 1. Project Overview

### 1.1 What is PulseOps CRM?
PulseOps CRM is a **team collaboration and customer management platform** built on top of API monitoring infrastructure. It transforms PulseOps from a single-user monitoring tool into a multi-tenant SaaS platform with:

- **Organizations & Teams** - Multi-tenant workspaces with RBAC
- **Activity Logs** - Complete audit trail of all actions
- **Support Tickets** - Built-in ticketing system
- **Incident Collaboration** - Timeline, notes, @mentions, MTTA/MTTR
- **API Monitoring** - Health checks, alerts, integrations, status pages

### 1.2 Vision Statement
> "Not just monitoring APIs — managing the teams that build them."

### 1.3 Current Status
- **Phase:** MVP Complete → Iterating on Polish & Scale
- **Backend:** Express + TypeScript + Prisma + PostgreSQL
- **Frontend:** Next.js 14 App Router + React 19 + Tailwind + shadcn/ui
- **Deploy:** Vercel (Frontend) + Railway (Backend) + Supabase (DB)
- **Team:** Solo developer / Small team

---

## 2. Key Technical Context

### 2.1 Repository Structure
```
pulseOps/
├── backend/                 # Express API
│   ├── prisma/schema.prisma # Single source of truth for DB
│   ├── src/
│   │   ├── lib/            # Prisma, permissions, JWT, utilities
│   │   ├── middleware/     # Auth, RBAC, validation, rate-limit
│   │   ├── routes/         # REST endpoints
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   └── jobs/           # Background workers
├── frontend/                # Next.js Dashboard
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # UI components
│   │   ├── store/          # Zustand state
│   │   ├── lib/            # Axios, Supabase, utilities
│   │   └── hooks/          # Custom React hooks
├── docs/                    # Documentation (this folder)
└── SETUP.md                 # Local development guide
```

### 2.2 Critical Files to Know

| File | Purpose |
|------|---------|
| `backend/prisma/schema.prisma` | Complete database schema |
| `backend/src/lib/permissions.ts` | RBAC permission matrix |
| `backend/src/middleware/rbac.middleware.ts` | Authorization enforcement |
| `frontend/src/store/authStore.ts` | Authentication state |
| `frontend/src/lib/axios.ts` | API client with token interceptor |
| `frontend/src/components/Providers.tsx` | OAuth providers wrapper |
| `backend/src/jobs/monitor.job.ts` | API health check scheduler |
| `backend/src/jobs/alert.job.ts` | Alert evaluation |

### 2.3 Database Schema Highlights

**Core Tables (20+):**
- `organizations` - Multi-tenant workspaces
- `users` - Team members with roles
- `invitations` - Magic link invites
- `activity_logs` - Audit trail (35+ action types)
- `support_tickets` + `ticket_messages` - Ticketing
- `notification_preferences` + `notifications` - User prefs
- `monitored_apis` + `api_checks` - Monitoring
- `alert_rules` + `alerts` - Alerting
- `incidents` + `incident_timeline` - Incident management
- `integrations` + `integration_logs` - Discord/Webhook/Email
- `status_pages` + `status_subscribers` - Public status pages

**Key Design Decisions:**
- `org_id` on ALL tables for multi-tenancy
- PostgreSQL enums for type safety
- JSONB for flexible metadata
- Composite indexes for common queries
- Cascading deletes from organization

---

## 3. Business Logic & Workflows

### 3.1 User Onboarding Flow
```
Signup → Create User + Default Org → Onboarding Wizard:
  1. Add first API endpoint
  2. Configure alert preferences  
  3. (Optional) Invite team members
→ Dashboard with real-time metrics
```

### 3.2 Team Invitation Flow
```
Admin invites email + role
    → System creates invitation record + sends email (Resend)
    → Recipient clicks magic link (7-day expiry)
    → Signup/Login → Added to org with role
    → Activity logged + team notified
```

### 3.3 Incident Response Flow
```
API Check Fails
    → Alert Rule Evaluates
    → Incident Created (status: triggered)
    → Alerts Dispatched (Email/Slack/Webhook)
    → On-call Acknowledges (MTTA starts)
    → Team Collaborates (Timeline + @mentions)
    → Root Cause Found → Runbook Attached
    → Incident Resolved (MTTR calculated)
    → Status Page Updated
```

### 3.4 Ticket Lifecycle
```
User Creates Ticket (category, priority)
    → Admins Notified
    → Admin Assigns/Investigates
    → Threaded Conversation (public + internal notes)
    → Status: Open → In Progress → Waiting → Resolved → Closed
    → SLA Timers Tracked
    → Analytics Updated
```

---

## 4. Current Implementation Status

### 4.1 Completed Features ✅

**Authentication & Authorization**
- [x] JWT access/refresh tokens with HttpOnly cookies
- [x] Email/password + Google OAuth + GitHub OAuth
- [x] RBAC with 5 roles (Owner, Admin, Member, Viewer, On-Call)
- [x] 35+ granular permissions
- [x] Token refresh rotation

**Organizations & Teams**
- [x] Multi-tenant organizations with slugs
- [x] Team management (invite, role change, deactivate, bulk actions)
- [x] Invitation system with magic links
- [x] Organization settings (timezone, alerts, retention)

**Activity Logs**
- [x] 35+ tracked action types
- [x] Real-time feed via Supabase Realtime
- [x] Filtering, search, CSV export
- [x] Diff view for changes

**Support Tickets**
- [x] Full CRUD + threaded messages
- [x] Categories, priorities, statuses
- [x] Internal notes (admin-only)
- [x] File attachments
- [x] Email notifications
- [x] Admin dashboard with filters/bulk actions

**Incident Management**
- [x] Automatic + manual incident creation
- [x] Timeline with actor attribution
- [x] MTTA/MTTR tracking
- [x] Real-time collaboration
- [x] @mentions with notifications
- [x] Runbook attachment

**API Monitoring**
- [x] Monitored APIs with configurable checks
- [x] Alert rules (downtime, latency, error rate)
- [x] Integrations: Discord, Webhook, Email
- [x] Manual + scheduled checks
- [x] Status pages with subscribers

**Notifications**
- [x] Per-user preferences (channels, severity, quiet hours)
- [x] In-app notification center
- [x] Email digests (daily/weekly)

**Frontend**
- [x] Dashboard with real-time metrics
- [x] All CRUD pages with shadcn/ui
- [x] Dark mode
- [x] Responsive design
- [x] TanStack Query for server state

### 4.2 In Progress 🔄

- [ ] Test coverage improvement (target 70%+)
- [ ] Performance optimization (query optimization, caching)
- [ ] Mobile responsiveness polish
- [ ] Accessibility audit (WCAG 2.1 AA)

### 4.3 Planned / Backlog 📋

**Phase 2: Advanced Team Features**
- [ ] Custom roles
- [ ] Team workspaces (sub-teams)
- [ ] Approval workflows
- [ ] Delegation

**Phase 3: Customer Success**
- [ ] Customer health scores
- [ ] Proactive outreach emails
- [ ] In-app chat (Intercom-style)
- [ ] Onboarding checklist

**Phase 4: Enterprise**
- [ ] SSO (SAML, Okta, Azure AD)
- [ ] Advanced audit logs (compliance reports)
- [ ] Data residency options
- [ ] Custom SLAs

**Technical Debt**
- [ ] Migrate background jobs to BullMQ
- [ ] Add Redis caching layer
- [ ] Implement API versioning
- [ ] Add OpenAPI/Swagger docs
- [ ] Database read replicas for analytics

---

## 5. Known Issues & Gotchas

### 5.1 Frontend
- **Next.js 15 breaking changes** - Using 14.2.x, plan migration carefully
- **Turbopack issues** - Disabled in dev (`NEXT_TURBOPACK=0`)
- **Hydration mismatches** - Check date formatting, user-agent dependent code
- **Server Components** - Can't use browser APIs (localStorage, window) directly

### 5.2 Backend
- **Prisma connection pool** - Monitor for connection exhaustion under load
- **Background jobs** - In-process, lost on restart (migrate to BullMQ)
- **Rate limiting** - Per-user in memory, not distributed (use Redis later)
- **WebSocket connections** - Supabase Realtime has limits on free tier

### 5.3 Database
- **Soft deletes** - Must remember `isActive: true` in all queries
- **Activity log growth** - Implement retention policy (1 year default)
- **UUID vs Sequential IDs** - Mix of both, be consistent in new tables

### 5.4 Security
- **JWT secrets** - Must rotate quarterly, use 32+ char random strings
- **CORS** - Configured for specific origins only
- **File uploads** - Validate MIME type AND scan (ClamAV planned)

---

## 6. Development Workflow

### 6.1 Local Development
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend  
cd frontend && npm run dev

# Terminal 3: Database (Docker)
docker start postgres-pulseops redis-pulseops
```

### 6.2 Common Commands
```bash
# Backend
cd backend
npm run dev              # Tsx watch mode
npm run build            # TypeScript compile
npm run prisma:studio    # Database GUI
npm run prisma:push      # Push schema changes
npm run test             # Vitest

# Frontend
cd frontend
npm run dev              # Next.js dev server
npm run build            # Production build + typecheck
npm run lint             # ESLint
npm run test:e2e         # Playwright tests
```

### 6.3 Database Changes
```bash
cd backend
# 1. Edit prisma/schema.prisma
# 2. Push to database
npx prisma db push
# 3. Regenerate client
npx prisma generate
# 4. Restart backend if needed
```

### 6.4 Environment Variables
**Backend (.env):**
- `DATABASE_URL`, `REDIS_URL`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `RESEND_API_KEY`, `FROM_EMAIL`
- OAuth credentials (Google, GitHub)
- Twilio credentials

**Frontend (.env.local):**
- `NEXT_PUBLIC_API_URL`
- OAuth Client IDs

---

## 7. Testing Strategy

### 7.1 Test Commands
```bash
# Backend
cd backend && npm run test           # All tests
cd backend && npm run test:unit      # Unit only
cd backend && npm run test:integration

# Frontend
cd frontend && npm run test          # Unit (Vitest)
cd frontend && npm run test:e2e      # E2E (Playwright)
cd frontend && npm run test:visual   # Visual (Percy)
```

### 7.2 Test Coverage Targets
- Backend Unit: 80%+
- Backend Integration: 60%+
- Frontend Unit: 70%+
- E2E Critical Paths: 100%

### 7.3 Key Test Files
- `backend/src/services/__tests__/` - Service unit tests
- `backend/src/routes/__tests__/` - API integration tests
- `frontend/e2e/specs/` - Playwright E2E tests

---

## 8. Deployment & Operations

### 8.1 Production Environment
- **Frontend:** Vercel (auto-deploy on main)
- **Backend:** Railway/Render (auto-deploy on main)
- **Database:** Supabase/Neon (managed PostgreSQL)
- **Redis:** Upstash/Redis Cloud
- **Email:** Resend
- **SMS/Voice:** Twilio

### 8.2 Health Checks
- `GET /api/health` - Basic health
- `GET /api/health/ready` - Dependencies (DB, Redis)
- `GET /api/health/live` - Process alive

### 8.3 Monitoring
- **Errors:** Sentry (configured)
- **Performance:** Built-in metrics + Vercel Analytics
- **Uptime:** Self-monitoring via own API checks
- **Logs:** Structured JSON (Pino)

### 8.4 Backup & Recovery
- **Database:** Automated daily + PITR (Supabase/Neon)
- **Redis:** Not critical (cache/sessions only)
- **File Storage:** Supabase Storage (replicated)
- **RTO:** < 15 min, **RPO:** < 1 min

---

## 9. Important Contacts & Resources

### 9.1 External Services
| Service | Dashboard | Purpose |
|---------|-----------|---------|
| **Supabase** | supabase.com/dashboard | Database, Auth, Storage, Realtime |
| **Vercel** | vercel.com/dashboard | Frontend hosting |
| **Railway** | railway.app/dashboard | Backend hosting |
| **Resend** | resend.com/emails | Transactional email |
| **Twilio** | console.twilio.com | SMS/WhatsApp/Voice |
| **Sentry** | sentry.io | Error tracking |

### 9.2 Documentation Links
- [PRD.md](./PRD.md) - Product requirements
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [DESIGN.md](./DESIGN.md) - Design system & components
- [TEST_PLAN.md](./TEST_PLAN.md) - Testing strategy
- [SECURITY.md](./SECURITY.md) - Security implementation
- [DECISIONS.md](./DECISIONS.md) - Architecture decisions
- [SETUP.md](../SETUP.md) - Local setup guide

---

## 10. Lessons Learned

### 10.1 What Worked Well
1. **Prisma + TypeScript** - Type-safe DB access caught many bugs early
2. **shadcn/ui + Tailwind** - Fast UI development, consistent design
3. **TanStack Query** - Eliminated manual caching logic
4. **Supabase Realtime** - Real-time features with minimal code
5. **Zod schemas shared** - Single source of truth for validation
4. **Monorepo** - Easy sharing of types/constants

### 10.2 What Would Do Differently
1. **Start with tests** - Retrofitting tests is painful
2. **Use BullMQ from start** - In-process jobs don't scale
3. **Better error boundaries** - Early on for debugging
4. **API versioning from day 1** - Even if just `/api/v1/`
5. **More granular commits** - Easier bisecting

### 10.3 Technical Debt to Address
1. **No integration test coverage** for background jobs
2. **Frontend bundle size** - Audit and optimize
3. **Database query optimization** - N+1 in some list views
4. **Error handling consistency** - Some controllers throw, others return
5. **Type safety gaps** - `any` in some service methods

---

## 11. Onboarding Checklist for New Developers

### Day 1
- [ ] Clone repo, run `npm install` in backend + frontend
- [ ] Start PostgreSQL + Redis (Docker)
- [ ] Copy `.env.example` → `.env` in backend + frontend
- [ ] Run `npx prisma db push` + `npx prisma generate`
- [ ] Start backend (`npm run dev`) + frontend (`npm run dev`)
- [ ] Visit `http://localhost:3000`, sign up, explore dashboard

### Week 1
- [ ] Read PRD.md, ARCHITECTURE.md, DESIGN.md
- [ ] Review `backend/prisma/schema.prisma`
- [ ] Understand RBAC in `backend/src/lib/permissions.ts`
- [ ] Trace a request: Route → Controller → Service → Prisma
- [ ] Write a unit test for a service method
- [ ] Write an E2E test for a user flow

### Ongoing
- [ ] Review ADRs before architectural changes
- [ ] Run tests before PR
- [ ] Update documentation with changes
- [ ] Participate in code reviews

---

## 12. Quick Reference

### 12.1 Common API Endpoints
```
Auth:
  POST /api/auth/signup
  POST /api/auth/login
  POST /api/auth/refresh
  GET  /api/auth/me
  POST /api/auth/logout

Organizations:
  GET    /api/organizations/me
  PATCH  /api/organizations/me
  DELETE /api/organizations/me

Users:
  GET    /api/users
  GET    /api/users/:id
  PATCH  /api/users/:id
  DELETE /api/users/:id

Invitations:
  POST   /api/organizations/:orgId/invitations
  GET    /api/organizations/:orgId/invitations
  DELETE /api/invitations/:id

Tickets:
  GET    /api/tickets
  POST   /api/tickets
  GET    /api/tickets/:id
  PATCH  /api/tickets/:id
  POST   /api/tickets/:id/messages

Incidents:
  GET    /api/incidents
  POST   /api/incidents
  GET    /api/incidents/:id
  PATCH  /api/incidents/:id
  POST   /api/incidents/:id/timeline
  POST   /api/incidents/:id/acknowledge
  POST   /api/incidents/:id/resolve

APIs:
  GET    /api/apis
  POST   /api/apis
  GET    /api/apis/:id
  PATCH  /api/apis/:id
  DELETE /api/apis/:id
  POST   /api/apis/:id/check

Activity:
  GET /api/activity
  GET /api/activity/stats

Notifications:
  GET /api/notifications
  PATCH /api/notifications/:id/read
  PATCH /api/notifications/read-all
```

### 12.2 Key Environment Variables
```env
# Backend
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_ACCESS_SECRET=... (32+ chars)
JWT_REFRESH_SECRET=... (32+ chars)
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@domain.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
FRONTEND_URL=https://app.pulseops.com

# Frontend
NEXT_PUBLIC_API_URL=https://api.pulseops.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
NEXT_PUBLIC_GITHUB_CLIENT_ID=...
```

### 12.3 Useful Scripts
```bash
# Kill all node processes
taskkill /F /IM node.exe

# Reset database (DANGEROUS)
cd backend && npx prisma migrate reset --force

# View database
cd backend && npx prisma studio

# Check ports
netstat -ano | findstr 5000
netstat -ano | findstr 3000
```

---

## 13. Future Vision (2026-2027)

### Q4 2026
- [ ] Complete test coverage
- [ ] Performance benchmarks
- [ ] Security audit
- [ ] Beta launch with 10 pilot customers

### Q1 2027
- [ ] Public launch
- [ ] Billing integration (Stripe)
- [ ] Custom roles
- [ ] Team workspaces

### Q2 2027
- [ ] SSO (SAML/OIDC)
- [ ] Advanced analytics
- [ ] Mobile app (React Native)
- [ ] Marketplace integrations

### Q3 2027
- [ ] Enterprise features
- [ ] Multi-region deployment
- [ ] AI-assisted incident response
- [ ] Compliance certifications (SOC 2)

---

## 14. Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-09-28 | 2.0 | Created comprehensive documentation suite |
| 2026-08-16 | 1.0 | Initial SETUP.md created |
| 2026-04-15 | 0.5 | CRM module specification completed |
| 2026-01-15 | 0.1 | Project initiated |

---

**Remember:** This document is living. Update it when you learn something new, make a significant decision, or onboard someone new. The goal is to reduce bus factor and accelerate future development.

*Last updated by: AI Assistant on behalf of the development team*