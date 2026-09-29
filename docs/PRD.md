# PulseOps CRM - Product Requirements Document

**Version:** 2.0  
**Status:** Active  
**Last Updated:** September 2026

---

## 1. Product Overview

### 1.1 Vision
PulseOps CRM transforms infrastructure monitoring into a **team collaboration platform**. Traditional monitoring tools only track systems—PulseOps tracks the *people* managing those systems.

### 1.2 Problem Statement
- **Single-user monitoring** → No team accountability or collaboration
- **No audit trail** → No visibility into who did what during incidents
- **Scattered communication** → Incident discussions happen across Slack, email, calls
- **No support system** → Users can't report issues or request features
- **No team insights** → No visibility into team performance or workload

### 1.3 Solution
A comprehensive CRM module integrated with API monitoring that provides:
- **Team Management** — Organizations, users, roles, permissions (RBAC)
- **Activity Tracking** — Complete audit trail of all actions
- **Support Tickets** — Built-in ticketing for user issues
- **Incident Collaboration** — Timeline, notes, @mentions, MTTA/MTTR tracking
- **Analytics** — Team performance, usage, subscription metrics

---

## 2. Target Users

| User Persona | Needs | Pain Points |
|--------------|-------|-------------|
| **DevOps Engineer** | Monitor APIs, respond to incidents, collaborate with team | Alert fatigue, no context, manual escalation |
| **Engineering Manager** | Team visibility, performance metrics, on-call scheduling | No insight into team workload or response times |
| **Platform Owner** | Organization settings, billing, security, compliance | Multiple tools for monitoring + team management |
| **Support Engineer** | Ticket management, user communication, resolution tracking | Disconnected from monitoring data |

---

## 3. Core Features

### 3.1 Organization & Team Management
- **Multi-tenant organizations** (workspaces) with slugs, settings, billing
- **User roles:** Owner, Admin, Member, Viewer, On-Call Engineer
- **Invitation system** with magic links, expiry, bulk invite
- **Organization settings:** Timezone, alert defaults, data retention

### 3.2 Role-Based Access Control (RBAC)
| Permission | Owner | Admin | Member | Viewer | On-Call |
|------------|-------|-------|--------|--------|---------|
| API CRUD | ✅ | ✅ | ✅ | Read | ✅ |
| Incident ack/resolve | ✅ | ✅ | ✅ | Read | ✅ |
| User invite/remove | ✅ | ✅ | ❌ | ❌ | ❌ |
| Role changes | ✅ | ✅ | ❌ | ❌ | ❌ |
| Billing access | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete organization | ✅ | ❌ | ❌ | ❌ | ❌ |
| View all tickets | ✅ | ✅ | Own | Own | Own |
| Resolve tickets | ✅ | ✅ | ❌ | ❌ | ❌ |

### 3.3 Activity Logs & Audit Trail
- **Tracked entities:** Users, APIs, Incidents, Integrations, Organization, Tickets
- **Tracked actions:** 35+ action types (create, update, delete, login, invite, acknowledge, resolve)
- **Data captured:** User, timestamp, IP, user-agent, before/after changes (JSON), metadata
- **UI:** Filterable, searchable, real-time feed, CSV export

### 3.4 Support Ticket System
- **Ticket lifecycle:** Open → In Progress → Waiting on User → Resolved → Closed
- **Categories:** Bug, Feature Request, Technical Support, Billing, General
- **Priorities:** Critical (2h SLA), High (8h), Medium (24h), Low (5d)
- **Threaded conversations** with attachments, internal notes, @mentions
- **Admin dashboard:** Filters, bulk actions, analytics

### 3.5 Incident Communication & Collaboration
- **Timeline events:** System + user actions with actor attribution
- **Real-time updates** via Supabase Realtime
- **@Mentions** in notes with notifications
- **Runbook attachment** for incident response
- **MTTA/MTTR tracking** per user and team

### 3.6 Notification Preferences
- **Channels:** Email, SMS (Twilio), Push, Slack DM
- **Severity filters** per channel
- **Quiet hours** with Critical exception
- **Digest emails:** Daily (9 AM), Weekly (Monday 9 AM)
- **Organization defaults** inherited by new members

### 3.7 API Monitoring (Core PulseOps)
- **Monitored APIs:** REST endpoints with configurable checks
- **Check intervals:** 30s to 5min based on plan
- **Alert rules:** Downtime, latency, error rate thresholds
- **Integrations:** Discord, Webhook, Email
- **Status pages:** Public status pages with subscribers

### 3.8 Analytics & Insights
- **User engagement:** Active users, login frequency, action counts
- **API health:** Uptime, response time, incident counts
- **Team performance:** MTTA/MTTR by user, incident distribution
- **Support metrics:** Resolution time, satisfaction, common issues
- **Subscription tracking:** Usage vs limits, upgrade prompts

---

## 4. User Workflows

### 4.1 New User Onboarding
1. Sign up → Create user + default organization
2. Onboarding wizard: Add first API → Configure alerts → (Optional) Invite team
3. Redirect to dashboard with real-time metrics

### 4.2 Team Invitation
1. Admin invites email with role
2. System sends magic link email (7-day expiry)
3. Recipient clicks → Signup/Login → Added to org
4. Activity logged, team notified

### 4.3 Support Ticket Flow
1. User creates ticket with category, priority, description
2. Email confirmation to user, notification to admins
3. Admin assigns, investigates, responds (internal notes + public replies)
4. User notified on each update
5. Admin resolves → Resolution email → Analytics updated

### 4.4 Incident Response with Collaboration
1. API fails → Alert triggered → Incident created
2. Alerts sent via configured channels
3. On-call engineer acknowledges (MTTA tracked)
4. Team collaborates via timeline notes, @mentions
5. Root cause found → Runbook attached
6. Incident resolved (MTTR tracked) → Status page updated

---

## 5. Non-Functional Requirements

### 5.1 Security
- JWT access tokens (15 min) + refresh tokens (7 days)
- bcrypt password hashing (cost 12)
- Helmet.js headers, CORS, rate limiting
- RBAC enforced at API + middleware level
- Audit logs for compliance
- Secure invitation tokens (UUID + expiry)

### 5.2 Performance
- API response < 200ms (p95)
- Database indexes on all query paths
- Real-time updates via WebSocket (Supabase)
- Frontend: Next.js SSR/ISR, code splitting
- Pagination on all list endpoints (default 20, max 100)

### 5.3 Reliability
- Database: PostgreSQL with connection pooling
- Health checks: `/api/health` endpoint
- Graceful degradation: Monitoring continues if CRM features fail
- Transactional integrity: Prisma transactions for multi-table ops

### 5.4 Scalability
- Multi-tenant architecture (org_id on all tables)
- Horizontal scaling: Stateless backend, Redis for sessions/rate-limiting
- Background jobs for: Email, alerts, digests, analytics aggregation

---

## 6. Technical Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Express + TypeScript + Prisma ORM |
| **Frontend** | Next.js 14 (App Router) + React 19 + TailwindCSS |
| **Database** | PostgreSQL (Supabase/Neon/RDS) |
| **Auth** | JWT + Supabase Auth (OAuth: Google, GitHub) |
| **Real-time** | Supabase Realtime (Postgres Changes) |
| **Email** | Resend (transactional) |
| **SMS/Voice** | Twilio |
| **File Storage** | Supabase Storage |
| **Monitoring** | Built-in (self-monitoring) |

---

## 7. Subscription Tiers (Future Billing)

| Feature | Free | Pro ($10/mo) | Team ($50/mo) | Enterprise |
|---------|------|--------------|---------------|------------|
| APIs | 5 | 50 | Unlimited | Unlimited |
| Team Members | 1 | 5 | Unlimited | Unlimited |
| Projects | 1 | 5 | Unlimited | Unlimited |
| Check Interval | 5 min | 1 min | 30 sec | Custom |
| Alert Channels | Email | Email, Slack | All | All + SMS |
| Data Retention | 30 days | 90 days | 1 year | Custom |
| Status Pages | ❌ | 1 | 5 | Unlimited |
| API Access | ❌ | ✅ | ✅ | ✅ |
| Support | Community | Email | Priority | Dedicated |

---

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| Invitation acceptance rate | > 80% |
| Daily active users (team) | > 60% |
| Ticket resolution time | < 8 hours |
| Incident collaboration rate | > 40% |
| User retention (30-day) | > 70% |
| Team retention (org active) | > 85% |

---

## 9. Future Roadmap

### Phase 2: Advanced Team Features
- Custom roles, team workspaces, approval workflows, delegation

### Phase 3: Customer Success
- Health scores, proactive outreach, in-app chat, onboarding checklist

### Phase 4: Enterprise
- SSO (SAML, Okta, Azure AD), advanced audit logs, data residency, custom SLAs

---

## 10. Acceptance Criteria

- [ ] All RBAC permissions enforced at API level
- [ ] Activity logs capture 100% of mutating actions
- [ ] Ticket SLA timers visible in admin dashboard
- [ ] MTTA/MTTR calculated and displayed per incident
- [ ] Real-time activity feed updates < 500ms
- [ ] Invitation flow works end-to-end (email → signup → org join)
- [ ] All dashboard pages load < 2s
- [ ] Mobile responsive (dashboard, tickets, incidents)