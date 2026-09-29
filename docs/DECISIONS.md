# PulseOps CRM - Architecture Decision Records (ADRs)

**Version:** 2.0  
**Last Updated:** September 2026

---

## ADR Format

Each decision follows this format:

```
# ADR-XXX: Title

**Status:** Accepted | Proposed | Deprecated | Superseded
**Date:** YYYY-MM-DD
**Deciders:** [Names]
**Technical Story:** [Link to issue/PR]

## Context
What is the issue that we're seeing that is motivating this decision or change?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
What becomes easier or more difficult to do because of this change?

### Positive
- 

### Negative
- 

### Neutral
- 
```

---

## ADR-001: Monorepo vs Multi-Repo

**Status:** Accepted  
**Date:** 2026-01-15  
**Deciders:** Architecture Team

### Context
Need to decide on repository structure for frontend and backend codebases.

### Decision
Use a **monorepo** with separate `backend/` and `frontend/` directories.

### Consequences

#### Positive
- Single source of truth for shared types, schemas, constants
- Atomic commits across frontend/backend
- Easier refactoring of shared code
- Simplified CI/CD (single pipeline)
- Shared tooling (ESLint, Prettier, TypeScript config)

#### Negative
- Larger clone size
- Potential for tighter coupling
- Build times increase with size

#### Neutral
- Requires path aliases for imports

---

## ADR-002: Backend Framework - Express vs Fastify vs NestJS

**Status:** Accepted  
**Date:** 2026-01-15  
**Deciders:** Backend Lead

### Context
Choosing a Node.js framework for the REST API.

### Decision
Use **Express + TypeScript** with manual structure (not NestJS).

### Consequences

#### Positive
- Minimal abstraction, full control
- Team familiarity
- Lightweight, fast startup
- Easy to customize middleware pipeline
- No decorator magic, explicit code

#### Negative
- More boilerplate than NestJS
- No built-in DI container
- Manual module organization

#### Neutral
- Could migrate to Fastify later for performance

---

## ADR-003: Database ORM - Prisma vs TypeORM vs Drizzle vs Raw SQL

**Status:** Accepted  
**Date:** 2026-01-15  
**Deciders:** Backend Lead

### Context
Need type-safe database access with migrations.

### Decision
Use **Prisma ORM** with PostgreSQL.

### Consequences

#### Positive
- Excellent TypeScript integration (generated types)
- Declarative schema as single source of truth
- Built-in migrations
- Prisma Studio for data exploration
- Connection pooling built-in
- Good performance with query optimization

#### Negative
- Learning curve for complex queries
- Bundle size (mitigated with `prisma generate`)
- Less flexible than raw SQL for complex analytics

#### Neutral
- Consider Drizzle for future edge deployment

---

## ADR-004: Database - PostgreSQL vs MySQL vs MongoDB

**Status:** Accepted  
**Date:** 2026-01-15  
**Deciders:** Architecture Team

### Context
Primary data store for relational CRM data.

### Decision
Use **PostgreSQL** (via Supabase/Neon/RDS).

### Consequences

#### Positive
- ACID compliance for financial/billing data
- JSONB for flexible metadata (settings, notifications)
- Excellent performance with proper indexing
- Rich ecosystem (extensions, tools)
- Row-level security (Supabase)
- Point-in-time recovery
- Strong consistency for multi-tenant data

#### Negative
- More complex than MongoDB for simple docs
- Horizontal scaling more challenging

---

## ADR-005: Authentication - JWT vs Session/Cookie vs Supabase Auth

**Status:** Accepted  
**Date:** 2026-01-20  
**Deciders:** Backend Lead, Security Lead

### Context
Authentication strategy for SPA + mobile future.

### Decision
**JWT Access Tokens (15min) + Refresh Tokens (7d) in HttpOnly Cookies** with custom implementation (not Supabase Auth).

### Consequences

#### Positive
- Stateless authentication (scales horizontally)
- Short-lived access tokens limit exposure
- HttpOnly cookies prevent XSS token theft
- Refresh token rotation detects reuse
- Works with mobile/native apps
- No vendor lock-in
- Full control over token payload

#### Negative
- More implementation complexity than Supabase Auth
- Need to handle token refresh logic
- CSRF protection needed (SameSite=Lax)

#### Neutral
- Could integrate Supabase Auth for OAuth only

---

## ADR-006: Frontend Framework - Next.js App Router vs Pages Router vs Vite/React

**Status:** Accepted  
**Date:** 2026-01-15  
**Deciders:** Frontend Lead

### Context
React framework choice for dashboard application.

### Decision
**Next.js 14+ with App Router** (React Server Components).

### Consequences

#### Positive
- Server Components reduce client bundle
- Built-in routing, layouts, loading states
- Image optimization, font optimization
- Middleware for auth redirects
- ISR for static content
- Excellent DX with Turbopack
- Vercel deployment optimized

#### Negative
- Learning curve for RSC patterns
- Server/client boundary complexity
- Bundle size larger than Vite
- Breaking changes in Next.js 15+

---

## ADR-007: State Management - Zustand + TanStack Query vs Redux vs Context

**Status:** Accepted  
**Date:** 2026-01-20  
**Deciders:** Frontend Lead

### Context
Client state management for auth, UI, and server state.

### Decision
**Zustand** for global client state + **TanStack Query** for server state.

### Consequences

#### Positive
- Zustand: Simple, no providers, TypeScript-first, small bundle
- TanStack Query: Caching, deduping, background refetch, mutations
- Clear separation: client vs server state
- No boilerplate (unlike Redux)
- DevTools support for both

#### Negative
- Two libraries to learn
- Potential overlap confusion

---

## ADR-008: UI Library - shadcn/ui vs Material UI vs Chakra vs Custom

**Status:** Accepted  
**Date:** 2026-01-20  
**Deciders:** Frontend Lead, Design Lead

### Context
Component library for consistent, accessible UI.

### Decision
**shadcn/ui** (Radix UI primitives + Tailwind CSS).

### Consequences

#### Positive
- Copy-paste ownership (no version lock-in)
- Accessible by default (Radix)
- Tailwind for styling consistency
- Customizable to design system
- Tree-shakable, small bundle
- No runtime theme provider needed

#### Negative
- More initial setup than MUI
- Need to maintain components
- No built-in theming system

---

## ADR-009: Real-time - Supabase Realtime vs Socket.io vs Pusher vs Custom WebSocket

**Status:** Accepted  
**Date:** 2026-02-01  
**Deciders:** Backend Lead, Frontend Lead

### Context
Real-time updates for activity feed, incidents, notifications.

### Decision
**Supabase Realtime** (PostgreSQL Change Data Capture).

### Consequences

#### Positive
- Native PostgreSQL integration
- No separate WebSocket server
- Row-level security applies to realtime
- Automatic reconnection
- Scales with Supabase
- Type-safe subscriptions with Prisma types

#### Negative
- Vendor lock-in to Supabase/PostgreSQL
- Limited to Postgres changes (not arbitrary events)
- Connection limits on free tier

---

## ADR-010: Email Service - Resend vs SendGrid vs Nodemailer vs AWS SES

**Status:** Accepted  
**Date:** 2026-02-01  
**Deciders:** Backend Lead

### Context
Transactional email for invitations, alerts, digests.

### Decision
**Resend** (React Email + API).

### Consequences

#### Positive
- Modern API, excellent DX
- React Email for templates
- Good deliverability
- Generous free tier
- Webhooks for delivery tracking
- No SMTP configuration

#### Negative
- Newer service (less track record)
- Pricing at scale

---

## ADR-011: SMS/Voice - Twilio vs Vonage vs Plivo vs Telnyx

**Status:** Accepted  
**Date:** 2026-02-01  
**Deciders:** Backend Lead

### Context
Critical alert delivery via SMS, WhatsApp, Voice calls.

### Decision
**Twilio** (industry leader).

### Consequences

#### Positive
- Global coverage
- WhatsApp Business API
- Programmable Voice (TwiML)
- Excellent documentation
- Reliable delivery
- Status callbacks

#### Negative
- Expensive at scale
- Complex pricing

---

## ADR-012: File Storage - Supabase Storage vs AWS S3 vs Cloudinary

**Status:** Accepted  
**Date:** 2026-02-01  
**Deciders:** Backend Lead

### Context
Avatar uploads, ticket attachments, org logos.

### Decision
**Supabase Storage** (S3-compatible).

### Consequences

#### Positive
- Integrated with Supabase Auth/Database
- Row-level security policies
- CDN included
- Simple API
- Cost-effective

#### Negative
- Tied to Supabase
- Less features than Cloudinary (transformations)

---

## ADR-013: Background Jobs - In-process vs BullMQ vs pg-boss vs Temporal

**Status:** Accepted  
**Date:** 2026-02-15  
**Deciders:** Backend Lead

### Context
Scheduled jobs for monitoring, alerts, digests, cleanup.

### Decision
**In-process Node.js workers** (setInterval/cron) for MVP, migrate to **BullMQ** later.

### Consequences

#### Positive
- Zero infrastructure for MVP
- Simple to implement and debug
- No Redis dependency for jobs
- Easy local development

#### Negative
- Not horizontally scalable
- Jobs lost on restart
- No retry/backoff built-in
- Single point of failure

#### Neutral
- Plan migration to BullMQ when scale demands

---

## ADR-014: API Style - REST vs GraphQL vs tRPC

**Status:** Accepted  
**Date:** 2026-01-15  
**Deciders:** Architecture Team

### Context
API paradigm for frontend-backend communication.

### Decision
**REST** with OpenAPI/Swagger documentation.

### Consequences

#### Positive
- Universal understanding
- HTTP caching works naturally
- Easy to debug (curl, Postman)
- TanStack Query works great
- No schema stitching complexity
- Gradual adoption possible

#### Negative
- Over/under-fetching possible
- Multiple round trips for related data
- No built-in type sharing (use shared Zod schemas)

---

## ADR-015: Multi-tenancy - Shared DB vs Schema-per-tenant vs Database-per-tenant

**Status:** Accepted  
**Date:** 2026-01-15  
**Deciders:** Architecture Team

### Context
How to isolate customer data in SaaS.

### Decision
**Shared database with `org_id` column** (discriminator column) + Row-Level Security.

### Consequences

#### Positive
- Simple to implement and maintain
- Cost-effective (single DB)
- Easy cross-tenant queries (analytics)
- Prisma handles scoping naturally
- RLS provides defense in depth

#### Negative
- Noisy neighbor problem (mitigated by indexing)
- Schema changes affect all tenants
- Backup/restore per tenant complex

---

## ADR-016: Invitation Tokens - JWT vs UUID vs Crypto-random

**Status:** Accepted  
**Date:** 2026-02-15  
**Deciders:** Backend Lead

### Context
Secure invitation links for team members.

### Decision
**Cryptographically random UUID v4** stored in database with expiry.

### Consequences

#### Positive
- No secrets in token (just reference)
- Revocable anytime
- Expiry enforced in DB
- Audit trail of invitation
- No JWT parsing needed

#### Negative
- Database lookup required
- Slightly larger URL

---

## ADR-017: Ticket Numbers - Sequential vs UUID vs Composite

**Status:** Accepted  
**Date:** 2026-02-15  
**Deciders:** Backend Lead

### Context
Human-readable ticket identifiers.

### Decision
**Sequential per organization: `TICKET-0042`**

### Consequences

#### Positive
- Human readable and memorable
- Sequential implies order
- Easy to reference in conversation
- Short for SMS/voice

#### Negative
- Requires transaction/lock for generation
- Not globally unique (scoped to org)
- Reveals ticket volume

---

## ADR-018: Activity Logging - Synchronous vs Async vs CDC

**Status:** Accepted  
**Date:** 2026-02-20  
**Deciders:** Backend Lead

### Context
Audit trail for all mutating actions.

### Decision
**Synchronous within same transaction** (Prisma transaction).

### Consequences

#### Positive
- Guaranteed consistency
- No event loss
- Simple implementation
- Immediate visibility

#### Negative
- Slightly slower mutations
- Transaction size increases

#### Neutral
- Could move to async (Kafka) for high volume

---

## ADR-019: Monitoring Checks - Push vs Pull vs Hybrid

**Status:** Accepted  
**Date:** 2026-02-20  
**Deciders:** Backend Lead

### Context
How to execute API health checks.

### Decision
**Pull-based** (backend workers poll APIs on schedule).

### Consequences

#### Positive
- Control over check timing
- No endpoint changes needed
- Works with any HTTP API
- Easy to implement retries
- Centralized check logic

#### Negative
- Resource intensive at scale
- Not real-time (interval-based)

#### Neutral
- Future: Webhook-based for supported providers

---

## ADR-020: Alert Evaluation - In-check vs Separate vs Stream Processing

**Status:** Accepted  
**Date:** 2026-02-20  
**Deciders:** Backend Lead

### Context
When to evaluate alert rules after check completes.

### Decision
**In same job, after check stored** (synchronous evaluation).

### Consequences

#### Positive
- Immediate alerting
- Access to fresh check data
- Simple transaction boundary

#### Negative
- Check latency includes evaluation
- Complex rules slow down checks

---

## ADR-021: Status Pages - Subdomain vs Path vs Custom Domain

**Status:** Accepted  
**Date:** 2026-03-01  
**Deciders:** Product, Engineering

### Context
Public status page URL structure.

### Decision
**Subdomain per org: `{org-slug}.status.pulseops.com`** + optional custom domain.

### Consequences

#### Positive
- Clean, professional URLs
- Easy DNS (CNAME to status.pulseops.com)
- Cookie isolation per org
- SEO friendly

#### Negative
- Requires wildcard DNS/SSL
- Subdomain takeover risk (mitigated)

---

## ADR-022: Analytics Aggregation - Real-time vs Batch vs Hybrid

**Status:** Accepted  
**Date:** 2026-03-01  
**Deciders:** Backend Lead

### Context
Computing metrics for dashboards (uptime, MTTR, etc.).

### Decision
**Hybrid: Real-time for counters, Batch for complex aggregations.**

### Consequences

#### Positive
- Real-time counters (incident count, active users)
- Batch jobs for MTTR, percentiles, trends
- Balanced performance and freshness

#### Negative
- Two systems to maintain
- Eventual consistency for complex metrics

---

## ADR-023: Error Handling - Exceptions vs Result Types vs Union Types

**Status:** Accepted  
**Date:** 2026-01-20  
**Deciders:** Backend Lead

### Context
How to handle and propagate errors in TypeScript.

### Decision
**Custom Error Classes + Global Error Middleware** (throw/catch).

### Consequences

#### Positive
- Familiar try/catch flow
- Structured error types (ValidationError, NotFoundError, ForbiddenError)
- Centralized HTTP response mapping
- Easy to add logging/monitoring

#### Negative
- Stack traces in production (sanitized)
- Runtime overhead minimal

---

## ADR-024: Validation - Zod vs Joi vs Class-validator vs JSON Schema

**Status:** Accepted  
**Date:** 2026-01-20  
**Deciders:** Backend Lead, Frontend Lead

### Context
Runtime validation shared between frontend/backend.

### Decision
**Zod** (TypeScript-first, inference).

### Consequences

#### Positive
- Types inferred from schemas
- Works on frontend and backend
- Composable, reusable
- Good error messages
- Small bundle

#### Negative
- Slightly slower than Joi (negligible)

---

## ADR-025: Date/Time - UTC Storage vs Local + Timezone

**Status:** Accepted  
**Date:** 2026-01-15  
**Deciders:** Architecture Team

### Context
Handling user timezones in global SaaS.

### Decision
**Store all timestamps in UTC**, convert to user timezone in frontend.

### Consequences

#### Positive
- Unambiguous storage
- Easy sorting, comparison
- Daylight saving handled by frontend
- Database timezone independent

#### Negative
- Frontend must handle conversion
- Need user timezone preference

---

## ADR-026: Soft Deletes - Boolean Flag vs DeletedAt vs Archive Table

**Status:** Accepted  
**Date:** 2026-02-01  
**Deciders:** Backend Lead

### Context
Handling deletion of entities (users, tickets, APIs).

### Decision
**`isActive` boolean + `deletedAt` timestamp** on relevant tables.

### Consequences

#### Positive
- Simple queries with `where: { isActive: true }`
- Recovery possible
- Audit trail preserved
- Works with Prisma middleware

#### Negative
- Must remember to filter everywhere
- Index bloat (mitigated with partial indexes)

---

## ADR-027: Feature Flags - LaunchDarkly vs Unleash vs Custom vs None

**Status:** Accepted  
**Date:** 2026-03-15  
**Deciders:** Product, Engineering

### Context
Gradual rollout, kill switches, experimentation.

### Decision
**None for MVP**, build custom simple flags if needed later.

### Consequences

#### Positive
- No external dependency
- No cost
- Simple boolean in DB/config sufficient for now

#### Negative
- No gradual rollout
- No targeting rules
- Manual deployment for features

---

## ADR-028: Logging - Winston vs Pino vs Console vs Bunyan

**Status:** Accepted  
**Date:** 2026-02-01  
**Deciders:** Backend Lead

### Context
Structured logging for observability.

### Decision
**Pino** (fast, JSON, child loggers).

### Consequences

#### Positive
- Very fast (low overhead)
- JSON output for log aggregation
- Child loggers for context
- Pretty printing in development
- Standard log levels

#### Negative
- Less features than Winston

---

## ADR-029: API Documentation - OpenAPI/Swagger vs Postman vs Redoc vs None

**Status:** Accepted  
**Date:** 2026-03-01  
**Deciders:** Backend Lead

### Context
Documenting REST API for consumers.

### Decision
**OpenAPI 3.0** generated from code (tsoa or manual) + Swagger UI.

### Consequences

#### Positive
- Industry standard
- Generates types for clients
- Interactive testing
- Versioned with code

#### Negative
- Maintenance overhead
- Can drift from implementation

---

## ADR-030: Deployment - Vercel + Railway vs AWS vs Kubernetes vs Fly.io

**Status:** Accepted  
**Date:** 2026-02-15  
**Deciders:** DevOps, Architecture

### Context
Production hosting strategy.

### Decision
**Frontend: Vercel** (Next.js native)  
**Backend: Railway/Render** (Node.js, managed PG, Redis)  
**Database: Supabase/Neon** (managed PostgreSQL)

### Consequences

#### Positive
- Zero ops for frontend
- Managed PostgreSQL with PITR
- Automatic scaling
- Preview deployments
- Cost-effective for startup scale

#### Negative
- Vendor lock-in
- Less control than K8s
- Cold starts on serverless (mitigated)

---

## ADR Index

| ID | Title | Status | Date |
|----|-------|--------|------|
| ADR-001 | Monorepo vs Multi-Repo | Accepted | 2026-01-15 |
| ADR-002 | Backend Framework | Accepted | 2026-01-15 |
| ADR-003 | Database ORM | Accepted | 2026-01-15 |
| ADR-004 | Database | Accepted | 2026-01-15 |
| ADR-005 | Authentication | Accepted | 2026-01-20 |
| ADR-006 | Frontend Framework | Accepted | 2026-01-15 |
| ADR-007 | State Management | Accepted | 2026-01-20 |
| ADR-008 | UI Library | Accepted | 2026-01-20 |
| ADR-009 | Real-time | Accepted | 2026-02-01 |
| ADR-010 | Email Service | Accepted | 2026-02-01 |
| ADR-011 | SMS/Voice | Accepted | 2026-02-01 |
| ADR-012 | File Storage | Accepted | 2026-02-01 |
| ADR-013 | Background Jobs | Accepted | 2026-02-15 |
| ADR-014 | API Style | Accepted | 2026-01-15 |
| ADR-015 | Multi-tenancy | Accepted | 2026-01-15 |
| ADR-016 | Invitation Tokens | Accepted | 2026-02-15 |
| ADR-017 | Ticket Numbers | Accepted | 2026-02-15 |
| ADR-018 | Activity Logging | Accepted | 2026-02-20 |
| ADR-019 | Monitoring Checks | Accepted | 2026-02-20 |
| ADR-020 | Alert Evaluation | Accepted | 2026-02-20 |
| ADR-021 | Status Pages | Accepted | 2026-03-01 |
| ADR-022 | Analytics Aggregation | Accepted | 2026-03-01 |
| ADR-023 | Error Handling | Accepted | 2026-01-20 |
| ADR-024 | Validation | Accepted | 2026-01-20 |
| ADR-025 | Date/Time | Accepted | 2026-01-15 |
| ADR-026 | Soft Deletes | Accepted | 2026-02-01 |
| ADR-027 | Feature Flags | Accepted | 2026-03-15 |
| ADR-028 | Logging | Accepted | 2026-02-01 |
| ADR-029 | API Documentation | Accepted | 2026-03-01 |
| ADR-030 | Deployment | Accepted | 2026-02-15 |

---

## How to Add New ADRs

1. Create new file: `docs/decisions/ADR-XXX-title.md`
2. Use the format above
3. Update this index table
4. Link from relevant docs (ARCHITECTURE.md, SECURITY.md)
5. Review in architecture meeting