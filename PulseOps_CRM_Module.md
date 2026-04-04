# 📊 PulseOps CRM System - Complete Module Documentation

**Module Name:** Customer Relationship Management (CRM) & Team Collaboration  
**Version:** 2.0  
**Status:** 🟢 Core Module  
**Integration:** Part of PulseOps Platform  
**Last Updated:** April 2026

---

## 📋 Executive Summary

### 🎯 What is the CRM Module?

The **PulseOps CRM System** transforms PulseOps from a simple monitoring tool into a complete **team collaboration and customer management platform**. It manages users, organizations, permissions, activity tracking, support tickets, and team communication around incident response.

### 💡 Why CRM in a Monitoring Platform?

**Traditional monitoring tools only track systems. PulseOps also tracks the PEOPLE managing those systems.**

| Without CRM | With CRM |
|-------------|----------|
| Single-user monitoring | Team collaboration & role-based access |
| No accountability | Full audit logs of who did what |
| Scattered communication | Centralized incident communication |
| No support system | Built-in ticket system for issues |
| No team insights | Team performance analytics |

---

## 🎯 CRM Module Objectives

### Primary Goals:
1. **Manage Teams** - Organizations, users, roles, permissions
2. **Track Activity** - Complete audit trail of all actions
3. **Enable Support** - Built-in ticket system for user issues
4. **Facilitate Communication** - Incident collaboration & notes
5. **Provide Insights** - User engagement & team performance analytics

### Value Proposition:

> "Not just monitoring APIs — managing the teams that build them."

---

## 👥 Core CRM Entities

### 1. 🏢 Organizations (Workspaces)

**Purpose:** Multi-tenant workspaces for companies/teams

**Fields:**
```sql
organizations
- id (uuid, primary key)
- name (varchar) -- e.g., "Acme Corp Engineering"
- slug (varchar, unique) -- URL-friendly: "acme-corp"
- owner_id (uuid, foreign key to users)
- logo_url (text)
- website (varchar)
- industry (varchar) -- e.g., "fintech", "saas", "ecommerce"
- company_size (varchar) -- e.g., "1-10", "11-50", "51-200"
- subscription_tier (varchar) -- free, pro, team, enterprise
- subscription_status (varchar) -- active, canceled, past_due, trialing
- stripe_customer_id (varchar) -- for billing
- billing_email (varchar)
- created_at (timestamp)
- updated_at (timestamp)
```

**Features:**
- Create organization (auto-created on signup)
- Update organization details (name, logo, settings)
- Transfer ownership to another user
- Delete organization (with confirmation + data export)
- Organization-level settings:
  - Default alert channels
  - Timezone
  - Notification preferences
  - Data retention policies

**Use Cases:**
- **Individual Developers:** "My Projects" (single-person org)
- **Startups:** "StartupX Engineering Team" (5-20 people)
- **Enterprises:** Multiple organizations per company (dev, staging, prod teams)

---

### 2. 🧑 Users (Team Members)

**Purpose:** Individual team members with specific roles and permissions

**Fields:**
```sql
users
- id (uuid, primary key)
- org_id (uuid, foreign key to organizations)
- email (varchar, unique)
- name (varchar)
- avatar_url (text)
- role (varchar) -- owner, admin, member, viewer, on_call_engineer
- phone_number (varchar) -- for SMS alerts
- timezone (varchar) -- e.g., "Asia/Kolkata"
- is_active (boolean) -- can be deactivated without deleting
- last_login_at (timestamp)
- last_active_at (timestamp)
- notification_settings (jsonb) -- email/SMS/push preferences
- onboarding_completed (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

**Role-Based Access Control (RBAC):**

| Role | Permissions |
|------|-------------|
| **Owner** | Full control: manage billing, delete org, all admin powers |
| **Admin** | Manage users, APIs, settings; cannot access billing or delete org |
| **Member** | Create/edit APIs, acknowledge incidents, view analytics |
| **Viewer** | Read-only access to dashboards and reports |
| **On-Call Engineer** | Member + priority alerts, incident assignment |

**User Lifecycle:**
1. **Invitation** → Email sent with magic link
2. **Signup** → User creates account
3. **Onboarding** → Quick tutorial (optional)
4. **Active** → Normal usage
5. **Deactivated** → Suspended (retain data)
6. **Deleted** → Permanently removed (GDPR compliance)

---

### 3. 📧 Invitations System

**Purpose:** Invite team members to join organization

**Fields:**
```sql
invitations
- id (uuid, primary key)
- org_id (uuid, foreign key to organizations)
- email (varchar)
- role (varchar) -- role to assign after acceptance
- invited_by (uuid, foreign key to users)
- token (varchar, unique) -- secure invitation token
- message (text) -- optional personal message
- expires_at (timestamp) -- 7 days validity
- accepted_at (timestamp)
- status (varchar) -- pending, accepted, expired, revoked
- created_at (timestamp)
```

**Flow:**
1. Admin invites user via email
2. System sends email with invitation link: `app.pulseops.com/invite/{token}`
3. User clicks link, signs up (if new) or logs in (if existing)
4. User added to organization with specified role
5. Invitation marked as accepted

**Features:**
- Bulk invite (CSV upload)
- Resend invitation
- Revoke invitation (before acceptance)
- Track pending invitations
- Invitation expiry (7 days default)

---

### 4. 📦 Projects (API Grouping)

**Purpose:** Organize APIs into logical groups (already covered in main PRD, but CRM manages project access)

**CRM Aspect:**
- Project ownership (who created)
- Project team assignments
- Project-level permissions (future enhancement)

---

### 5. 📞 Contacts (External Stakeholders) - Optional Advanced

**Purpose:** Store external stakeholders who receive alerts but aren't team members

**Fields:**
```sql
contacts
- id (uuid, primary key)
- org_id (uuid, foreign key)
- name (varchar)
- email (varchar)
- phone_number (varchar)
- role (varchar) -- e.g., "Client", "Vendor", "Consultant"
- company (varchar)
- notes (text)
- is_active (boolean)
- created_by (uuid, foreign key to users)
- created_at (timestamp)
```

**Use Cases:**
- Send status updates to clients
- Alert third-party vendors
- Notify consultants during incidents

---

## ⚙️ CRM Features in Detail

### Feature 1: User & Team Management

#### 1.1 Organization Dashboard
**Location:** Settings → Organization

**Displays:**
- Organization info (name, logo, website)
- Subscription details (tier, status, billing date)
- Usage statistics:
  - Total team members
  - Active APIs being monitored
  - Incidents this month
  - Alert volume
- Quick actions:
  - Invite member
  - Upgrade plan
  - Manage billing

#### 1.2 Team Management
**Location:** Settings → Team

**Features:**

**View Team Members:**
- List view with columns:
  - Avatar + Name
  - Email
  - Role badge
  - Last active
  - Status (active/inactive)
- Search and filter:
  - By role
  - By status
  - By last active date

**Invite Members:**
- Click "Invite Member" button
- Enter email(s) - supports multiple emails
- Select role from dropdown
- Optional: Add personal message
- Send invitation
- Track status in "Pending Invitations" tab

**Manage Members:**
- Change role (with confirmation)
- Deactivate user (suspend access)
- Reactivate user
- Remove from organization (with confirmation)
- View member activity log

**Bulk Actions:**
- Select multiple members
- Bulk role change
- Bulk deactivation
- Export member list (CSV)

#### 1.3 Role Management (RBAC)

**Permission Matrix:**

```typescript
const permissions = {
  // API Management
  'api.create': ['owner', 'admin', 'member'],
  'api.update': ['owner', 'admin', 'member'],
  'api.delete': ['owner', 'admin'],
  'api.view': ['owner', 'admin', 'member', 'viewer'],
  
  // Incident Management
  'incident.acknowledge': ['owner', 'admin', 'member', 'on_call_engineer'],
  'incident.resolve': ['owner', 'admin', 'member', 'on_call_engineer'],
  'incident.view': ['owner', 'admin', 'member', 'viewer'],
  'incident.delete': ['owner', 'admin'],
  
  // User Management
  'user.invite': ['owner', 'admin'],
  'user.remove': ['owner', 'admin'],
  'user.change_role': ['owner', 'admin'],
  'user.view': ['owner', 'admin', 'member', 'viewer'],
  
  // Organization Settings
  'org.update': ['owner', 'admin'],
  'org.delete': ['owner'],
  'org.billing': ['owner'],
  
  // Integrations
  'integration.create': ['owner', 'admin'],
  'integration.update': ['owner', 'admin'],
  'integration.delete': ['owner', 'admin'],
  'integration.view': ['owner', 'admin', 'member'],
  
  // Analytics
  'analytics.view': ['owner', 'admin', 'member', 'viewer'],
  'analytics.export': ['owner', 'admin'],
  
  // Support Tickets
  'ticket.create': ['owner', 'admin', 'member', 'viewer'],
  'ticket.view': ['owner', 'admin', 'member', 'viewer'], // own tickets
  'ticket.view_all': ['owner', 'admin'], // all org tickets
  'ticket.resolve': ['owner', 'admin'],
};
```

**Implementation:**
```typescript
// Middleware to check permissions
async function checkPermission(userId: string, permission: string) {
  const user = await getUser(userId);
  const allowedRoles = permissions[permission];
  return allowedRoles.includes(user.role);
}

// Usage in API route
if (!await checkPermission(userId, 'api.delete')) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

---

### Feature 2: Activity Tracking & Audit Logs

#### 2.1 Activity Log System

**Purpose:** Complete audit trail of all actions in the organization

**Fields:**
```sql
activity_logs
- id (uuid, primary key)
- org_id (uuid, foreign key)
- user_id (uuid, foreign key) -- who performed the action
- action (varchar) -- type of action (see below)
- resource_type (varchar) -- api, user, incident, integration, etc.
- resource_id (uuid) -- ID of affected resource
- resource_name (varchar) -- name for display
- changes (jsonb) -- before/after values for updates
- metadata (jsonb) -- additional context
- ip_address (inet)
- user_agent (text)
- created_at (timestamp)
```

**Tracked Actions:**

**User Actions:**
- `user.login` - User logged in
- `user.logout` - User logged out
- `user.signup` - New user registered
- `user.invited` - User invited to org
- `user.joined` - User accepted invitation
- `user.role_changed` - User role updated
- `user.deactivated` - User deactivated
- `user.removed` - User removed from org

**API Actions:**
- `api.created` - New API endpoint added
- `api.updated` - API settings changed
- `api.deleted` - API endpoint removed
- `api.activated` - API monitoring enabled
- `api.deactivated` - API monitoring paused

**Incident Actions:**
- `incident.triggered` - New incident created
- `incident.acknowledged` - Incident acknowledged by engineer
- `incident.resolved` - Incident marked as resolved
- `incident.closed` - Incident closed with post-mortem
- `incident.note_added` - Note added to incident timeline

**Integration Actions:**
- `integration.created` - New integration added
- `integration.updated` - Integration settings changed
- `integration.deleted` - Integration removed
- `integration.tested` - Integration test performed

**Organization Actions:**
- `org.updated` - Organization settings changed
- `org.upgraded` - Subscription tier upgraded
- `org.downgraded` - Subscription tier downgraded

**Settings Actions:**
- `settings.updated` - Organization settings changed
- `alert_rule.created` - New alert rule created
- `alert_rule.updated` - Alert rule modified
- `alert_rule.deleted` - Alert rule removed

#### 2.2 Activity Feed UI

**Location:** Dashboard sidebar + Settings → Activity Log

**Display:**
- Chronological feed (newest first)
- Each entry shows:
  - User avatar + name
  - Action description (human-readable)
  - Timestamp (relative: "2 hours ago")
  - Resource link (clickable to view)
- Filters:
  - By user
  - By action type
  - By resource type
  - By date range
- Search: Full-text search in activity descriptions
- Export: Download as CSV

**Example Feed Items:**
```
[Avatar] Priya Sharma created API "Payment Gateway"
         2 hours ago

[Avatar] Raj Kumar acknowledged incident #INC-123
         5 hours ago

[Avatar] Amit Patel invited neha@startup.com to join
         Yesterday at 3:45 PM

[Avatar] System triggered incident #INC-124 (Auth API Down)
         Yesterday at 11:22 AM
```

#### 2.3 Audit Log Analytics

**Insights:**
- Most active users (by action count)
- Most common actions
- Activity heatmap (by hour/day)
- Login patterns
- Failed login attempts (security monitoring)

---

### Feature 3: Support Ticket System 🛠️

#### 3.1 Ticket Creation

**Purpose:** Users can report issues, request features, or ask questions

**Fields:**
```sql
support_tickets
- id (uuid, primary key)
- org_id (uuid, foreign key)
- user_id (uuid, foreign key) -- ticket creator
- ticket_number (varchar) -- e.g., "TICKET-1234"
- title (varchar)
- description (text)
- category (varchar) -- bug, feature_request, technical_support, billing
- priority (varchar) -- low, medium, high, critical
- status (varchar) -- open, in_progress, waiting_on_user, resolved, closed
- assigned_to (uuid, foreign key to users) -- admin/support user
- tags (varchar[]) -- e.g., ["alerts", "email", "urgent"]
- created_at (timestamp)
- updated_at (timestamp)
- resolved_at (timestamp)
- closed_at (timestamp)
```

**Ticket Categories:**
1. **Bug Report** - Something is broken
2. **Feature Request** - Want new functionality
3. **Technical Support** - Help with setup/configuration
4. **Billing Question** - Subscription/payment issues
5. **General Inquiry** - Other questions

**Priority Levels:**
- **Critical** - System down, blocking work (SLA: 2 hours)
- **High** - Major issue affecting multiple users (SLA: 8 hours)
- **Medium** - Minor issue, workaround exists (SLA: 24 hours)
- **Low** - Enhancement, non-urgent (SLA: 5 days)

#### 3.2 Ticket Messaging

**Fields:**
```sql
ticket_messages
- id (uuid, primary key)
- ticket_id (uuid, foreign key)
- user_id (uuid, foreign key) -- message author
- message (text)
- attachments (jsonb) -- array of file URLs
- is_internal (boolean) -- internal notes (admin-only)
- is_system_message (boolean) -- automated messages
- created_at (timestamp)
```

**Features:**
- Threaded conversation
- File attachments (screenshots, logs)
- Rich text formatting (markdown)
- Internal notes (admin-only, not visible to user)
- @mentions for team members
- Email notifications on new messages

**Example Ticket Thread:**
```
[User Avatar] Raj Kumar (YOU)
Bug Report | Medium Priority | Open
Created 2 days ago

Title: Email alerts not being sent for API "Payment Gateway"

Description:
I've configured email alerts for my Payment Gateway API, but I'm not 
receiving any emails when it goes down. I've checked my spam folder. 
Other APIs are working fine.

[Attachment: screenshot.png]

───────────────────────────────────

[Admin Avatar] Support Team
2 days ago

Hi Raj, thanks for reporting this. I've checked your account and I can 
see the alert rule is configured correctly. Let me investigate on our end.

[Internal Note] 🔒 Admin only: Checking SendGrid logs for this user

───────────────────────────────────

[Admin Avatar] Support Team
2 days ago

I found the issue! Your email address had a typo in our system. I've 
corrected it to raj.kumar@startup.com. Can you test by triggering an 
alert and let me know if you receive it?

───────────────────────────────────

[User Avatar] Raj Kumar (YOU)
1 day ago

It's working now! Thank you so much for the quick fix.

[Status changed: Open → Resolved]
```

#### 3.3 Ticket Management (Admin View)

**Admin Dashboard:** Settings → Support Tickets

**Features:**

**Ticket List View:**
- All organization tickets in one place
- Columns:
  - Ticket #
  - Title
  - User (who created)
  - Category
  - Priority
  - Status
  - Assigned to
  - Created date
  - Last updated
- Filters:
  - By status
  - By category
  - By priority
  - By assigned admin
  - By user
- Sort: Priority, Date, Status
- Search: Full-text search in title/description

**Ticket Detail View:**
- Full conversation thread
- Quick actions:
  - Assign to admin
  - Change priority
  - Change status
  - Add tags
  - Close ticket
- Related information:
  - User details (email, role)
  - User's API count
  - Recent incidents
  - Activity log
- Internal notes section (private)

**Bulk Actions:**
- Select multiple tickets
- Bulk status change
- Bulk assignment
- Bulk close

#### 3.4 Ticket Notifications

**Email Notifications:**
- User receives email when:
  - Ticket status changes
  - Admin responds
  - Ticket is assigned
  - Ticket is resolved/closed
- Admin receives email when:
  - New ticket created
  - User responds
  - High/Critical priority tickets

**In-App Notifications:**
- Badge count on "Support" nav item
- Notification bell with unread messages
- Real-time updates (Supabase Realtime)

#### 3.5 Ticket Analytics

**Metrics:**
- Total tickets (by status)
- Average resolution time
- Tickets by category
- Tickets by priority
- User satisfaction ratings (optional: ticket feedback)
- Most common issues
- Admin performance (tickets resolved per admin)

**Reports:**
- Weekly support summary email
- Monthly ticket trends
- Common issues dashboard

---

### Feature 4: Incident Communication Log

#### 4.1 Incident Timeline Enhancement (CRM Integration)

**Purpose:** Track WHO interacted with each incident

**Fields (added to incident_timeline):**
```sql
incident_timeline
- id (uuid, primary key)
- incident_id (uuid, foreign key)
- event_type (varchar) -- state_change, user_notified, user_acknowledged, note_added, runbook_attached
- actor_id (uuid, foreign key to users) -- who performed this action
- actor_name (varchar) -- cached name for display
- content (text) -- description of event
- is_public (boolean) -- visible on public status page
- metadata (jsonb) -- additional data (e.g., notification channels used)
- created_at (timestamp)
```

**Timeline Events:**

**System Events:**
- `incident.triggered` - System detected failure
- `incident.alert_sent` - Alerts sent to team
- `incident.escalated` - Escalated to next on-call engineer

**User Events:**
- `incident.user_notified` - Specific user notified
- `incident.acknowledged` - User acknowledged
- `incident.note_added` - User added note
- `incident.runbook_attached` - Runbook linked
- `incident.status_changed` - User changed status
- `incident.resolved` - User marked as resolved

**Example Timeline:**
```
[System] Incident triggered: Auth API returned 500 status code
         Apr 2, 2026 at 10:15 AM

[System] Alerts sent via: Email (3 users), Slack (#alerts channel)
         Apr 2, 2026 at 10:15 AM

[Priya] Acknowledged incident
         Apr 2, 2026 at 10:18 AM (MTTA: 3 minutes)

[Priya] Added note: "Database connection pool exhausted. Restarting service."
         Apr 2, 2026 at 10:20 AM

[Priya] Attached runbook: "Database Connection Issues"
         Apr 2, 2026 at 10:22 AM

[System] API health check passed
         Apr 2, 2026 at 10:25 AM

[Priya] Marked incident as resolved. Root cause: Connection pool misconfiguration
         Apr 2, 2026 at 10:27 AM (MTTR: 12 minutes)
```

#### 4.2 Incident Collaboration

**Features:**
- **@Mentions:** Tag team members in incident notes
- **Real-time Updates:** All users see timeline updates live
- **Notification Tracking:** See who was notified and when
- **Response Tracking:** See who acknowledged and when
- **Team Chat:** Comment thread on incident (like Slack thread)

---

### Feature 5: Notification Preferences (User-Level)

#### 5.1 Personal Notification Settings

**Location:** User Settings → Notifications

**Fields:**
```sql
notification_preferences
- id (uuid, primary key)
- user_id (uuid, foreign key)
- channel (varchar) -- email, sms, push, slack_dm
- enabled (boolean)
- severity_filter (varchar[]) -- [critical, high, medium, low]
- quiet_hours_enabled (boolean)
- quiet_hours_start (time) -- e.g., 22:00
- quiet_hours_end (time) -- e.g., 08:00
- quiet_hours_timezone (varchar)
- daily_digest_enabled (boolean) -- receive daily summary
- weekly_digest_enabled (boolean) -- receive weekly report
- incident_updates (boolean) -- notify on incident status changes
- created_at (timestamp)
- updated_at (timestamp)
```

**Settings Options:**

**Alert Channels:**
- ✅ **Email** (enabled by default)
  - Critical alerts: ✅
  - High alerts: ✅
  - Medium alerts: ✅
  - Low alerts: ☐
- ☐ **SMS** (requires phone number)
  - Critical alerts only
- ☐ **Push Notifications** (requires mobile app)
  - All severities

**Quiet Hours (Do Not Disturb):**
- Enable quiet hours: ☐
- Time range: 10:00 PM - 8:00 AM
- Timezone: Asia/Kolkata (GMT+5:30)
- **Exception:** Still receive Critical alerts

**Digest Emails:**
- ☐ Daily digest (send at 9:00 AM)
- ✅ Weekly digest (send Monday 9:00 AM)
  - Summary of incidents
  - Uptime statistics
  - Team performance

**Other Preferences:**
- ✅ Notify on incident status changes
- ✅ Notify when @mentioned in incidents
- ✅ Notify on team member joins/leaves
- ☐ Notify on API status changes (not failures)

#### 5.2 Organization-Level Defaults

**Location:** Settings → Organization → Notification Defaults

**Purpose:** Set default notification preferences for new team members

**Features:**
- Configure default channels
- Set default severity filters
- Set organization-wide quiet hours
- New members inherit these settings (can override)

---

### Feature 6: Usage Analytics (CRM + Product Mix)

#### 6.1 Organization Analytics

**Location:** Settings → Usage & Analytics

**Metrics:**

**User Engagement:**
- Total team members: 8
- Active users (last 7 days): 6 (75%)
- Active users (last 30 days): 7 (87%)
- Most active users (by actions taken)
- Login frequency graph

**API Monitoring Usage:**
- Total APIs monitored: 23
- APIs by project:
  - Production: 15
  - Staging: 8
- APIs by status:
  - Operational: 22 (95.7%)
  - Down: 1 (4.3%)
- Average response time: 245ms

**Incident Statistics:**
- Incidents this month: 12
- Incidents by severity:
  - Critical: 2
  - High: 4
  - Medium: 6
- Average MTTR: 15 minutes
- Average MTTA: 3 minutes
- Top failing APIs

**Alert Volume:**
- Alerts sent this month: 47
- Alerts by channel:
  - Email: 35
  - Slack: 47
  - SMS: 2
- Alert delivery success rate: 99.8%

**Support Activity:**
- Open tickets: 3
- Resolved tickets (this month): 7
- Average resolution time: 4.2 hours

#### 6.2 Subscription & Billing Analytics

**For Admin Dashboard:**
- Current plan: Pro ($10/month)
- Usage vs. Limits:
  - APIs: 23 / 50 (46%)
  - Team members: 8 / Unlimited
  - Projects: 3 / 5 (60%)
- Next billing date: May 1, 2026
- Estimated next bill: $10.00

**Upgrade Prompts:**
- "You're using 46% of your API limit. Upgrade to Team for unlimited APIs."
- "Add more team members risk-free - Team plan has unlimited users."

#### 6.3 Team Performance Dashboard

**Location:** Analytics → Team Performance

**Metrics:**

**Incident Response:**
- Fastest responders (by MTTA):
  1. Priya Sharma - Avg 2.5 min
  2. Raj Kumar - Avg 4.1 min
  3. Amit Patel - Avg 6.3 min
- Most incidents resolved:
  1. Priya Sharma - 8 incidents
  2. Raj Kumar - 5 incidents
- Resolution efficiency (MTTR):
  1. Priya Sharma - Avg 12 min
  2. Amit Patel - Avg 18 min

**Activity Levels:**
- Actions per user (last 30 days):
  - Priya: 145 actions
  - Raj: 89 actions
  - Amit: 67 actions
- Login frequency:
  - Daily active: Priya, Raj
  - Weekly active: Amit, Neha

**Collaboration:**
- Most incident notes added: Priya (32 notes)
- Most runbooks created: Raj (5 runbooks)
- Most helpful (@mentions received): Priya (12 mentions)

**Workload Distribution:**
- Incidents by assignee:
  - Priya: 40%
  - Raj: 35%
  - Amit: 25%
- Alert volume by user:
  - Shows if alerts are fairly distributed

#### 6.4 Future SaaS Billing Integration

**Subscription Tiers:**

| Feature | Free | Pro | Team | Enterprise |
|---------|------|-----|------|------------|
| **APIs** | 5 | 50 | Unlimited | Unlimited |
| **Team Members** | 1 | 5 | Unlimited | Unlimited |
| **Projects** | 1 | 5 | Unlimited | Unlimited |
| **Check Interval** | 5 min | 1 min | 30 sec | Custom |
| **Alert Channels** | Email | Email, Slack | All | All + SMS |
| **Data Retention** | 30 days | 90 days | 1 year | Custom |
| **Status Pages** | ☐ | 1 | 5 | Unlimited |
| **API Access** | ☐ | ✅ | ✅ | ✅ |
| **Support** | Community | Email | Priority | Dedicated |
| **Price/month** | $0 | $10 | $50 | Custom |

**Usage Tracking for Billing:**
```sql
usage_tracking
- id (uuid, primary key)
- org_id (uuid, foreign key)
- billing_period_start (date)
- billing_period_end (date)
- metrics (jsonb) -- api_count, checks_performed, alerts_sent, etc.
- overage_fees (decimal) -- if exceeds limits
- created_at (timestamp)
```

---

## 🔄 CRM Workflows

### Workflow 1: New User Onboarding

**Flow:**
```
1. User signs up
   ↓
2. Create user record
   ↓
3. Create default organization (auto: "{User's Name}'s Organization")
   ↓
4. Set user as owner
   ↓
5. Show onboarding wizard:
   a. "Welcome! Let's set up your first API"
   b. Add API endpoint form
   c. Configure alert preferences
   d. (Optional) Invite team members
   ↓
6. Redirect to dashboard
   ↓
7. Activity log: "user.signup" and "user.login"
```

### Workflow 2: Inviting Team Member

**Flow:**
```
1. Admin navigates to Settings → Team
   ↓
2. Clicks "Invite Member"
   ↓
3. Enters email: neha@startup.com
   ↓
4. Selects role: Member
   ↓
5. (Optional) Adds message
   ↓
6. Clicks "Send Invitation"
   ↓
7. System creates invitation record
   ↓
8. System sends email to neha@startup.com
   Email contains:
   - Invitation from [Admin Name] at [Org Name]
   - Your role: Member
   - Accept button (magic link)
   ↓
9. Neha clicks "Accept Invitation"
   ↓
10. If new user:
    - Redirected to signup page (email pre-filled)
    - Creates account
    If existing user:
    - Redirected to dashboard
   ↓
11. User added to organization
   ↓
12. Activity log: "user.invited" (by admin) and "user.joined" (by neha)
   ↓
13. Team notified: "[Neha Sharma] joined the team"
```

### Workflow 3: Handling Support Ticket

**Flow:**
```
1. User encounters issue
   ↓
2. Navigates to Support → New Ticket
   ↓
3. Fills form:
   - Title: "Email alerts not working"
   - Category: Technical Support
   - Priority: High
   - Description: [details]
   - Attachments: screenshot.png
   ↓
4. Clicks "Submit Ticket"
   ↓
5. System creates ticket (TICKET-1234)
   ↓
6. System sends confirmation email to user
   ↓
7. System notifies admin team
   ↓
8. Admin (Priya) views ticket in admin panel
   ↓
9. Priya assigns ticket to herself
   ↓
10. Priya investigates issue
   ↓
11. Priya adds internal note: "Checking SendGrid logs"
   ↓
12. Priya finds issue, responds to user:
    "Found the problem! Your email had a typo. Fixed now."
   ↓
13. User receives email notification
   ↓
14. User tests, confirms fixed
   ↓
15. User responds: "Working now, thanks!"
   ↓
16. Priya marks ticket as Resolved
   ↓
17. System sends resolution email to user
   ↓
18. Activity log: "ticket.resolved" (by Priya)
   ↓
19. Analytics updated: +1 resolved ticket, resolution time: 2.3 hours
```

### Workflow 4: Incident with Team Collaboration

**Flow:**
```
1. API fails → Incident triggered
   ↓
2. System creates incident (INC-123)
   ↓
3. System sends alerts:
   - Email to all members
   - Slack message to #alerts
   ↓
4. Activity log: "incident.triggered" and "incident.alert_sent"
   ↓
5. Priya receives alert (on-call engineer)
   ↓
6. Priya clicks "Acknowledge" in email
   ↓
7. System updates incident status: Acknowledged
   ↓
8. Activity log: "incident.acknowledged" (by Priya)
   ↓
9. Timeline updated: "Priya Sharma acknowledged incident"
   ↓
10. Priya investigates, adds note:
    "@raj can you check database connections?"
   ↓
11. Activity log: "incident.note_added" (by Priya)
   ↓
12. Raj receives @mention notification
   ↓
13. Raj checks, replies:
    "Database looks fine. Checking API logs."
   ↓
14. Priya finds root cause, adds note:
    "Found it: Rate limit exceeded on third-party API."
   ↓
15. Priya attaches runbook: "Third-Party API Issues"
   ↓
16. Activity log: "incident.runbook_attached" (by Priya)
   ↓
17. Priya implements fix
   ↓
18. API health check passes
   ↓
19. Priya marks incident as Resolved
   ↓
20. Activity log: "incident.resolved" (by Priya)
   ↓
21. System calculates MTTR: 12 minutes, MTTA: 3 minutes
   ↓
22. Team performance analytics updated
   ↓
23. Status page updated: "Incident resolved"
   ↓
24. Email sent to status page subscribers
```

---

## 🧱 CRM Database Schema (Complete)

### Core CRM Tables

```sql
-- Organizations (Multi-tenant workspaces)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  owner_id UUID NOT NULL, -- References users.id
  logo_url TEXT,
  website VARCHAR(255),
  industry VARCHAR(50),
  company_size VARCHAR(20),
  subscription_tier VARCHAR(20) DEFAULT 'free',
  subscription_status VARCHAR(20) DEFAULT 'active',
  stripe_customer_id VARCHAR(255),
  billing_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users (Team members)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  phone_number VARCHAR(20),
  timezone VARCHAR(50) DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP,
  last_active_at TIMESTAMP,
  notification_settings JSONB,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'member', 'viewer', 'on_call_engineer'))
);

-- Invitations
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  message TEXT,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'expired', 'revoked'))
);

-- Activity Logs (Audit trail)
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  resource_name VARCHAR(255),
  changes JSONB,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_org_created ON activity_logs(org_id, created_at DESC);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_resource ON activity_logs(resource_type, resource_id);

-- Support Tickets
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP,
  
  CONSTRAINT valid_category CHECK (category IN ('bug', 'feature_request', 'technical_support', 'billing', 'general')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_status CHECK (status IN ('open', 'in_progress', 'waiting_on_user', 'resolved', 'closed'))
);

CREATE INDEX idx_tickets_org_status ON support_tickets(org_id, status);
CREATE INDEX idx_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_tickets_assigned ON support_tickets(assigned_to);

-- Ticket Messages
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  attachments JSONB,
  is_internal BOOLEAN DEFAULT FALSE,
  is_system_message BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id, created_at);

-- Notification Preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  channel VARCHAR(50) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  severity_filter TEXT[] DEFAULT ARRAY['critical', 'high', 'medium', 'low'],
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone VARCHAR(50),
  daily_digest_enabled BOOLEAN DEFAULT FALSE,
  weekly_digest_enabled BOOLEAN DEFAULT TRUE,
  incident_updates BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Contacts (External stakeholders) - Optional
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone_number VARCHAR(20),
  role VARCHAR(100),
  company VARCHAR(255),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🛠️ Technical Implementation

### Tech Stack (CRM Components)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | Next.js 14 (App Router) | Server components, forms |
| **UI Components** | shadcn/ui | Pre-built components (tables, forms, dialogs) |
| **Forms** | React Hook Form + Zod | Form handling, validation |
| **Data Fetching** | TanStack Query | Server state management |
| **Real-time** | Supabase Realtime | Live activity feed, incident updates |
| **Auth** | Supabase Auth | User authentication |
| **Database** | Supabase (PostgreSQL) | All CRM data |
| **Email** | Resend / SendGrid | Invitations, notifications, ticket updates |
| **File Storage** | Supabase Storage | Ticket attachments, avatars, logos |

### Key Implementation Details

#### 1. RBAC Middleware (Permission Checking)

```typescript
// lib/rbac.ts
export const checkPermission = (user: User, permission: string): boolean => {
  const permissions = {
    'api.delete': ['owner', 'admin'],
    'user.invite': ['owner', 'admin'],
    // ... all permissions
  };
  
  const allowedRoles = permissions[permission] || [];
  return allowedRoles.includes(user.role);
};

// Usage in Server Action
export async function deleteAPI(apiId: string) {
  const user = await getCurrentUser();
  
  if (!checkPermission(user, 'api.delete')) {
    throw new Error('Forbidden');
  }
  
  // Proceed with deletion
}
```

#### 2. Activity Logging (Automatic)

```typescript
// lib/activity-log.ts
export async function logActivity(params: {
  org_id: string;
  user_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  resource_name?: string;
  changes?: any;
  metadata?: any;
}) {
  await supabase.from('activity_logs').insert({
    ...params,
    ip_address: request.ip,
    user_agent: request.headers['user-agent'],
    created_at: new Date().toISOString()
  });
}

// Usage
await logActivity({
  org_id: user.org_id,
  user_id: user.id,
  action: 'api.created',
  resource_type: 'api',
  resource_id: newAPI.id,
  resource_name: newAPI.name
});
```

#### 3. Ticket Number Generation

```typescript
// lib/ticket-number.ts
export async function generateTicketNumber(orgId: string): Promise<string> {
  const count = await supabase
    .from('support_tickets')
    .select('id', { count: 'exact' })
    .eq('org_id', orgId);
  
  const ticketNum = (count.count || 0) + 1;
  return `TICKET-${ticketNum.toString().padStart(4, '0')}`; // e.g., TICKET-0042
}
```

#### 4. Real-time Activity Feed

```typescript
// components/activity-feed.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function ActivityFeed({ orgId }: { orgId: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  
  useEffect(() => {
    // Subscribe to real-time updates
    const channel = supabase
      .channel('activity_logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `org_id=eq.${orgId}`
        },
        (payload) => {
          setActivities(prev => [payload.new as Activity, ...prev]);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId]);
  
  return (
    <div className="space-y-4">
      {activities.map(activity => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
```

---

## 📊 Success Metrics for CRM Module

### Engagement Metrics
- Team member invitation acceptance rate: > 80%
- Average team size: 3-5 members (startups), 10-20 (enterprises)
- Daily active users: > 60% of team
- Activity log views per user per week: > 5

### Support Metrics
- Support ticket creation rate: < 5% of users per month (indicates good UX)
- Average ticket resolution time: < 8 hours
- Ticket reopen rate: < 10%
- User satisfaction (ticket feedback): > 4.5/5

### Collaboration Metrics
- Incidents with team collaboration (multiple users involved): > 40%
- Average incident notes per incident: > 2
- @mentions usage: > 30% of incidents

### Retention Metrics
- User retention (30-day): > 70%
- Team retention (org stays active): > 85%
- Churned users (inactive for 60 days): < 15%

---

## 🚀 Future CRM Enhancements

### Phase 2: Advanced Team Features
- **Custom Roles** - Beyond predefined roles
- **Team Workspaces** - Sub-teams within organization
- **Approval Workflows** - Require approval for critical actions
- **Delegation** - Temporarily delegate permissions

### Phase 3: Customer Success
- **Customer Health Scores** - Automated scoring based on engagement
- **Proactive Outreach** - Automated emails to inactive users
- **In-App Chat** - Live chat support
- **Onboarding Checklist** - Guided setup with progress tracking

### Phase 4: Enterprise
- **SSO Integration** - SAML, Okta, Azure AD
- **Advanced Audit Logs** - Compliance reports, log exports
- **Data Residency** - Choose data storage region
- **Custom SLAs** - Per-customer support SLAs

---

## 💡 Why This CRM Makes PulseOps Stand Out

### Standard Monitoring Tool:
- ❌ Single-user focused
- ❌ No team management
- ❌ No activity tracking
- ❌ No support system
- ❌ No collaboration features

### PulseOps with CRM:
- ✅ Multi-user, team-based
- ✅ Full RBAC and permissions
- ✅ Complete audit trail
- ✅ Built-in support ticketing
- ✅ Team collaboration on incidents
- ✅ User analytics and insights

**Interview Talking Point:**
> "I didn't just build monitoring — I built a complete collaboration platform. The CRM module manages teams, permissions, activity logs, support tickets, and provides insights into team performance. This shows I understand that software isn't just about features, it's about the people using it."

---

## 📝 Conclusion

The **PulseOps CRM System** elevates the platform from a technical monitoring tool to a complete **team collaboration and customer management solution**. It demonstrates:

- **Product Thinking** - Understanding user needs beyond technical requirements
- **System Design** - Multi-tenancy, RBAC, audit logging
- **Business Acumen** - Usage tracking for billing, customer success metrics
- **Real-World Experience** - Support systems, team management, compliance

**This CRM module is what makes PulseOps a SaaS platform, not just a monitoring script.**

---

**Document Version:** 2.0  
**Module Status:** Core Feature  
**Implementation Priority:** Phase 2 (Week 4)  
**Estimated Development Time:** 5-7 days

---
