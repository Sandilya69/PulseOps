# PulseOps CRM - Design Documentation

**Version:** 2.0  
**Last Updated:** September 2026

---

## 1. Design System

### 1.1 Color Palette

```css
/* Light Mode */
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;
--card: 0 0% 100%;
--card-foreground: 222.2 84% 4.9%;
--popover: 0 0% 100%;
--popover-foreground: 222.2 84% 4.9%;
--primary: 221.2 83.2% 53.3%;        /* Blue */
--primary-foreground: 210 40% 98%;
--secondary: 210 40% 96.1%;
--secondary-foreground: 222.2 47.4% 11.2%;
--muted: 210 40% 96.1%;
--muted-foreground: 215.4 16.3% 46.9%;
--accent: 210 40% 96.1%;
--accent-foreground: 222.2 47.4% 11.2%;
--destructive: 0 84.2% 60.2%;
--destructive-foreground: 210 40% 98%;
--border: 214.3 31.8% 91.4%;
--input: 214.3 31.8% 91.4%;
--ring: 221.2 83.2% 53.3%;
--radius: 0.5rem;

/* Dark Mode */
--background: 222.2 84% 4.9%;
--foreground: 210 40% 98%;
--card: 222.2 84% 4.9%;
--card-foreground: 210 40% 98%;
--popover: 222.2 84% 4.9%;
--popover-foreground: 210 40% 98%;
--primary: 217.2 91.2% 59.8%;
--primary-foreground: 222.2 47.4% 11.2%;
--secondary: 217.2 32.6% 17.5%;
--secondary-foreground: 210 40% 98%;
--muted: 217.2 32.6% 17.5%;
--muted-foreground: 215 20.2% 65.1%;
--accent: 217.2 32.6% 17.5%;
--accent-foreground: 210 40% 98%;
--destructive: 0 62.8% 30.6%;
--destructive-foreground: 210 40% 98%;
--border: 217.2 32.6% 17.5%;
--input: 217.2 32.6% 17.5%;
--ring: 224.3 76.3% 48%;
```

### 1.2 Semantic Colors (Status/Priority)

```css
/* Severity Colors */
--severity-critical: 0 84.2% 60.2%;    /* Red */
--severity-high: 25 95% 53%;            /* Orange */
--severity-medium: 45 100% 51%;         /* Amber */
--severity-low: 142 76% 36%;            /* Green */

/* Status Colors */
--status-operational: 142 76% 36%;      /* Green */
--status-degraded: 45 100% 51%;         /* Amber */
--status-down: 0 84.2% 60.2%;           /* Red */
--status-maintenance: 221.2 83.2% 53.3%; /* Blue */

/* Ticket Status */
--ticket-open: 221.2 83.2% 53.3%;
--ticket-in-progress: 25 95% 53%;
--ticket-waiting: 45 100% 51%;
--ticket-resolved: 142 76% 36%;
--ticket-closed: 215.4 16.3% 46.9%;
```

### 1.3 Typography

```css
/* Font Families */
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Scale */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
```

### 1.4 Spacing Scale

```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

### 1.5 Breakpoints

```css
--bp-sm: 640px;   /* Mobile */
--bp-md: 768px;   /* Tablet */
--bp-lg: 1024px;  /* Desktop */
--bp-xl: 1280px;  /* Large Desktop */
--bp-2xl: 1536px; /* Extra Large */
```

---

## 2. Component Library (shadcn/ui + Custom)

### 2.1 Base Components (shadcn/ui)

| Component | Usage |
|-----------|-------|
| `Button` | Primary, secondary, destructive, outline, ghost, link |
| `Input` | Text, email, password, search |
| `Textarea` | Multi-line input |
| `Select` | Single/multi select with search |
| `Checkbox` | Boolean toggles |
| `Switch` | On/off toggles |
| `RadioGroup` | Single choice |
| `Label` | Form labels |
| `Card` | Content containers |
| `Table` | Data display with sorting/filtering |
| `Dialog` | Modals, confirmations |
| `Sheet` | Mobile drawers |
| `DropdownMenu` | Action menus |
| `Tooltip` | Hover hints |
| `Toast` | Notifications (sonner) |
| `Avatar` | User/org images |
| `Badge` | Status indicators |
| `Tabs` | Tabbed interfaces |
| `Accordion` | Collapsible sections |
| `Separator` | Visual dividers |
| `ScrollArea` | Custom scrollbars |
| `Popover` | Floating content |
| `HoverCard` | Rich hover previews |

### 2.2 Custom Components

#### DataTable
```typescript
// components/tables/DataTable.tsx
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  pagination?: PaginationState;
  onPaginationChange?: (state: PaginationState) => void;
  sorting?: SortingState;
  onSortingChange?: (state: SortingState) => void;
  filtering?: FilteringState;
  onFilteringChange?: (state: FilteringState) => void;
  rowActions?: RowAction<T>[];
  selection?: RowSelectionState;
  onSelectionChange?: (state: RowSelectionState) => void;
  loading?: boolean;
  emptyMessage?: string;
}
```

#### StatCard
```typescript
// components/dashboard/StatCard.tsx
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;        // Percentage change
  changeLabel?: string;   // "vs last month"
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  href?: string;          // Link to detailed view
}
```

#### IncidentTimeline
```typescript
// components/incidents/IncidentTimeline.tsx
interface TimelineEvent {
  id: string;
  actor?: { name: string; avatar?: string };
  eventType: string;
  content: string;
  isPublic: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface IncidentTimelineProps {
  events: TimelineEvent[];
  currentUserId: string;
  onAddNote: (content: string) => Promise<void>;
  onMention: (userId: string) => void;
}
```

#### TicketThread
```typescript
// components/tickets/TicketThread.tsx
interface TicketThreadProps {
  messages: TicketMessage[];
  currentUser: User;
  onReply: (message: string, attachments: File[]) => Promise<void>;
  onInternalNote: (message: string) => Promise<void>;
  onStatusChange: (status: TicketStatus) => Promise<void>;
  onAssign: (userId: string) => Promise<void>;
}
```

#### ActivityFeed
```typescript
// components/activity/ActivityFeed.tsx
interface ActivityFeedProps {
  orgId: string;
  filters?: ActivityFilters;
  onFilterChange: (filters: ActivityFilters) => void;
  realtime?: boolean;
}
```

---

## 3. Page Layouts

### 3.1 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Header (64px)                                                  │
│  ┌──────────────┐                    ┌──────────────────────┐  │
│  │ Logo + Name  │                    │ User Menu            │  │
│  └──────────────┘                    │ - Profile            │  │
│                                      │ - Notifications      │  │
│                                      │ - Settings           │  │
│                                      │ - Sign Out           │  │
│                                      └──────────────────────┘  │
├──────────────────┬──────────────────────────────────────────────┤
│                  │                                              │
│  Sidebar (280px) │  Main Content                                │
│  ┌────────────┐  │  ┌──────────────────────────────────────┐   │
│  │ Navigation │  │  │ Page Header                          │   │
│  │            │  │  │ - Title + Description                │   │
│  │ ☐ Overview │  │  │ - Breadcrumbs                        │   │
│  │ ☐ Team     │  │  │ - Primary Actions                    │   │
│  │ ☐ Invites  │  │  └──────────────────────────────────────┘   │
│  │ ☐ Tickets  │  │  ┌──────────────────────────────────────┐   │
│  │ ☐ Activity │  │  │                                      │   │
│  │ ☐ Incidents│  │  │         Page Content                 │   │
│  │ ☐ APIs     │  │  │  (Grid, Tables, Forms, Charts)       │   │
│  │ ☐ Settings │  │  │                                      │   │
│  └────────────┘  │  └──────────────────────────────────────┘   │
│                  │                                              │
└──────────────────┴──────────────────────────────────────────────┘
```

### 3.2 Responsive Behavior

| Breakpoint | Sidebar | Header | Content |
|------------|---------|--------|---------|
| `< 768px` | Sheet (slide-over) | Condensed | Full width |
| `768-1024px` | Collapsed (icons only) | Full | Flexible |
| `> 1024px` | Full (280px) | Full | Flexible |

---

## 4. Key Page Designs

### 4.1 Dashboard Overview (`/dashboard`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Page Header: "Dashboard" • "Real-time overview of your APIs"  │
├─────────────────────────────────────────────────────────────────┤
│  [StatCard] [StatCard] [StatCard] [StatCard]                    │
│  Uptime     Active APIs   Incidents (30d)   Avg Response Time  │
│  99.9%      23/50         12                245ms              │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────┐  ┌───────────────────────────┐   │
│  │ API Health Timeline       │  │ Recent Incidents          │   │
│  │ (Area chart - 24h)        │  │ (List - last 5)           │   │
│  │                           │  │                           │   │
│  │ ████████░░░░░░░░░░░░░░░░  │  │ 🔴 INC-123  10:15 AM      │   │
│  │                           │  │    Auth API Down          │   │
│  │                           │  │ 🟡 INC-122  Yesterday     │   │
│  │                           │  │    High Latency           │   │
│  │                           │  │ 🟢 INC-121  2 days ago    │   │
│  │                           │  │    Resolved               │   │
│  └───────────────────────────┘  └───────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────┐  ┌───────────────────────────┐   │
│  │ Alert Volume (7d)         │  │ Team Activity             │   │
│  │ (Bar chart by day)        │  │ (Feed - last 10)          │   │
│  │                           │  │                           │   │
│  │ █ █ █ █ █ █ █             │  │ [Avatar] Priya created    │   │
│  │                           │  │     API "Payments" 2h ago │   │
│  │                           │  │ [Avatar] Raj acknowledged │   │
│  │                           │  │     INC-123 5h ago        │   │
│  └───────────────────────────┘  └───────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Team Management (`/dashboard/team`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Page Header: "Team" • "Manage team members and roles"         │
│  [Button: Invite Member]                                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Search: [________________]  Filter: [Role ▼] [Status ▼]    ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ ☐ Avatar  Name          Email              Role      Status  ││
│  │ ☐ [Img]   Priya Sharma  priya@...          Owner     🟢 Active││
│  │ ☐ [Img]   Raj Kumar     raj@...            Admin     🟢 Active││
│  │ ☐ [Img]   Amit Patel    amit@...           Member    🟡 Idle  ││
│  │ ☐ [Img]   Neha Singh    neha@...           Viewer    🔴 Away  ││
│  └─────────────────────────────────────────────────────────────┘│
│  Pagination: [◀] 1 [2] [3] [▶]  Showing 1-4 of 12              │
├─────────────────────────────────────────────────────────────────┤
│  Bulk Actions (when selected): [Change Role ▼] [Deactivate]    │
│  [Export CSV]                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Invite Member Modal:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Invite Team Member                                    [×]      │
├─────────────────────────────────────────────────────────────────┤
│  Email Address: [________________________] (multiple, comma)   │
│  Role: [Member ▼]  (Owner/Admin/Member/Viewer/On-Call)         │
│  Message (optional):                                            │
│  [________________________________________________]             │
│  [Cancel]  [Send Invitations]                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Support Tickets (`/dashboard/tickets`)

**List View:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Page Header: "Support Tickets"  [New Ticket]                   │
├─────────────────────────────────────────────────────────────────┤
│  Tabs: [All] [Open] [In Progress] [Resolved] [My Tickets]      │
│  Filters: [Status ▼] [Priority ▼] [Category ▼] [Assignee ▼]    │
├─────────────────────────────────────────────────────────────────┤
│  ☐ #        Title                    User         Cat    Prio  │
│  ☐ TICKET-42 Email alerts not work…  Raj Kumar    Tech   High  │
│  ☐ TICKET-41 Feature: Dark mode      Neha Singh   Feat   Low   │
│  ☐ TICKET-40 Billing question        Amit Patel   Bill   Med   │
└─────────────────────────────────────────────────────────────────┘
```

**Detail View:**
```
┌─────────────────────────────────────────────────────────────────┐
│  TICKET-42  Email alerts not working for "Payment Gateway"     │
│  [Open ▼]  [High]  [Technical Support]  [Assigned: Priya]      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [Avatar] Raj Kumar  2 days ago                              ││
│  │ I've configured email alerts but not receiving emails...    ││
│  │ [Attachment: screenshot.png]                                ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ [Avatar] Priya Sharma (Admin)  2 days ago                   ││
│  │ Hi Raj, thanks for reporting. Let me investigate...         ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ 🔒 [Internal] Priya: Checking SendGrid logs for this user  ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ [Avatar] Priya Sharma  1 day ago                            ││
│  │ Found the issue! Email had a typo. Fixed now.              ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ [Avatar] Raj Kumar  1 day ago                               ││
│  │ Working now! Thanks for the quick fix.                      ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ 🔄 [System] Status changed: Open → Resolved  1 day ago     ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  Reply: [____________________________________________] [Send]  │
│  [Internal Note]  [Change Status]  [Assign]  [Add Tags]        │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 Activity Logs (`/dashboard/activity`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Page Header: "Activity Log"  [Export CSV]                      │
├─────────────────────────────────────────────────────────────────┤
│  Filters: [User ▼] [Action ▼] [Resource ▼] [Date Range ▼]      │
│  Search: [____________________________]                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [Avatar] Priya Sharma  created API "Payment Gateway"       ││
│  │ 2 hours ago  •  API •  View Details                         ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ [Avatar] Raj Kumar  acknowledged incident #INC-123         ││
│  │ 5 hours ago  •  Incident  •  View Incident                  ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ [Avatar] Amit Patel  invited neha@startup.com              ││
│  │ Yesterday  •  Invitation  •  View                           ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ [System]  triggered incident #INC-124 (Auth API Down)      ││
│  │ Yesterday  •  Incident  •  View Incident                    ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ [Avatar] Priya Sharma  updated alert rule "High Latency"   ││
│  │ 2 days ago  •  Alert Rule  •  View Changes  ◀ Diff         ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Activity Detail Modal (Diff View):**
```
┌─────────────────────────────────────────────────────────────────┐
│  Activity Detail: Alert Rule Updated                    [×]     │
├─────────────────────────────────────────────────────────────────┤
│  User: Priya Sharma    Time: 2 days ago    IP: 192.168.1.1     │
│  Resource: Alert Rule "High Latency" (ALERT-005)               │
├─────────────────────────────────────────────────────────────────┤
│  Changes:                                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ threshold:     500ms    ──▶  300ms     (changed)           ││
│  │ duration:      5min     ──▶  3min      (changed)           ││
│  │ channels:      [email]  ──▶  [email, slack] (added slack)  ││
│  │ isActive:      true     ──▶  true      (unchanged)         ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 4.5 Incidents (`/dashboard/incidents`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Page Header: "Incidents"  [New Incident]                       │
├─────────────────────────────────────────────────────────────────┤
│  Tabs: [Active] [Resolved] [All]                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ #INC-123  Auth API Down          🔴 Critical  10:15 AM    ││
│  │ Acknowledged by Priya  •  MTTA: 3m  •  MTTR: 12m  [View]   ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ #INC-122  High Latency - Payments  🟡 High  Yesterday      ││
│  │ Resolved by Raj  •  MTTA: 5m  •  MTTR: 25m  [View]         ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Incident Detail:**
```
┌─────────────────────────────────────────────────────────────────┐
│  #INC-123  Auth API Down                    🔴 Critical         │
│  Status: [Acknowledged ▼]  [Resolve]  [Close]                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────────────────┐   │
│  │ Incident Info       │  │ Timeline                        │   │
│  │ ─────────────────   │  │ ─────────────────               │   │
│  │ API: Auth API       │  │ [System] 10:15 AM  Triggered    │   │
│  │ Severity: Critical  │  │ [System] 10:15 AM  Alerts sent  │   │
│  │ Triggered: 10:15 AM │  │ [Priya]  10:18 AM  Acknowledged │   │
│  │ Acknowledged: 10:18 │  │ [Priya]  10:20 AM  Note added   │   │
│  │ MTTA: 3 min         │  │     "DB pool exhausted..."      │   │
│  │ MTTR: 12 min        │  │ [Priya]  10:22 AM  Runbook:     │   │
│  │ Root Cause:         │  │     "DB Connection Issues"      │   │
│  │ DB pool config      │  │ [System] 10:25 AM  Health OK    │   │
│  └─────────────────────┘  │ [Priya]  10:27 AM  Resolved     │   │
│                           │     "Root cause: pool config"   │   │
│  ┌─────────────────────┐  └─────────────────────────────────┘   │
│  │ Actions             │                                         │
│  │ ─────────────────   │  Add Note: [___________________] [@]  │
│  │ [Acknowledge]       │  [Attach Runbook] [Post to Slack]     │
│  │ [Resolve]           │                                         │
│  │ [Add Note]          │                                         │
│  │ [Attach Runbook]    │                                         │
│  └─────────────────────┘                                         │
└─────────────────────────────────────────────────────────────────┘
```

### 4.6 Settings (`/dashboard/settings`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Tabs: [Organization] [Billing] [Notifications] [Danger Zone]  │
├─────────────────────────────────────────────────────────────────┤
│  Organization Tab:                                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Logo: [Upload]  Current: [img]                              ││
│  │ Name: [PulseOps Engineering          ]                      ││
│  │ Slug: pulseops-eng  (URL: app.pulseops.com/pulseops-eng)   ││
│  │ Website: [https://pulseops.com          ]                   ││
│  │ Industry: [SaaS ▼]  Size: [11-50 ▼]                        ││
│  │ Timezone: [Asia/Kolkata ▼]                                    ││
│  │ Default Alert Channels: [Email ✓] [Slack ✓] [SMS ]         ││
│  │ Data Retention: [90 days ▼]                                   ││
│  │ [Save Changes]                                                ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Notifications Tab (Org Defaults):                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Default preferences for new team members:                  ││
│  │ Email: [✓] Critical [✓] High [✓] Medium [ ] Low           ││
│  │ Quiet Hours: [ ]  22:00 - 08:00  (Asia/Kolkata)           ││
│  │ Weekly Digest: [✓]  Daily Digest: [ ]                      ││
│  │ [Save Defaults]                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Danger Zone:                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ⚠️ Delete Organization                                      ││
│  │ This will permanently delete all data including:           ││
│  │ • All team members and their data                          ││
│  │ • All APIs, incidents, tickets, activity logs              ││
│  │ • All integrations and status pages                        ││
│  │ Type organization name to confirm: [_______________]       ││
│  │ [Delete Organization]  (Red, destructive)                  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. User Experience Flows

### 5.1 Empty States

| Page | Empty State | Action |
|------|-------------|--------|
| Team | "No team members yet" | [Invite Member] |
| Tickets | "No tickets yet. Great job!" | [Create Ticket] |
| Incidents | "No incidents. All systems operational!" | — |
| Activity | "No activity yet" | — |
| APIs | "No APIs monitored" | [Add API] |
| Invitations | "No pending invitations" | [Invite Member] |

### 5.2 Loading States

- **Skeleton screens** for initial page loads
- **Spinner** for button actions (disabled during submit)
- **Progressive loading** for large lists (infinite scroll or pagination)

### 5.3 Error States

- **Inline validation** for forms (Zod + React Hook Form)
- **Toast notifications** for API errors (sonner)
- **Error boundaries** for component crashes
- **Empty state with retry** for failed data fetches

---

## 6. Accessibility (a11y)

### 6.1 Standards
- **WCAG 2.1 AA** compliance
- **Semantic HTML** (landmarks, headings, lists)
- **Keyboard navigation** for all interactive elements
- **Focus indicators** visible and consistent
- **ARIA labels** for icon-only buttons
- **Color contrast** 4.5:1 minimum

### 6.2 Implementation
```typescript
// Example: Accessible button
<Button
  aria-label="Invite team member"
  onClick={openInviteModal}
>
  <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
  Invite Member
</Button>

// Example: Accessible table
<Table>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Name</TableHead>
      <TableHead scope="col">Role</TableHead>
      <TableHead scope="col">
        <span className="sr-only">Actions</span>
      </TableHead>
    </TableRow>
  </TableHeader>
</Table>
```

---

## 7. Dark Mode

- **System preference** detection (`prefers-color-scheme`)
- **Manual toggle** in user profile/settings
- **Persisted** in localStorage + synced to server (notification_preferences)
- **CSS variables** for all colors (no hardcoded hex)

---

## 8. Mobile Considerations

### 8.1 Responsive Tables
- **Card view** on mobile (< 768px)
- **Horizontal scroll** with sticky first column (optional)
- **Priority columns** only on mobile

### 8.2 Touch Targets
- Minimum **44x44px** touch targets
- Adequate spacing between interactive elements

### 8.3 Navigation
- **Bottom sheet** for mobile sidebar
- **Collapsible header** on scroll
- **Swipe gestures** for drawer (optional)

---

## 9. Animation & Transitions

```css
/* Transition durations */
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;

/* Easing */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* Usage */
.transition-all { transition: all var(--duration-normal) var(--ease-out); }
.hover-scale { transition: transform var(--duration-fast) var(--ease-out); }
.hover-scale:hover { transform: scale(1.02); }
```

**Animations:**
- Modal/sheet: slide + fade (200ms)
- Toast: slide from bottom (300ms)
- Dropdown: fade + scale (150ms)
- Table row hover: background transition (150ms)
- Real-time updates: subtle highlight pulse (1s)

---

## 10. Icon System

- **Library:** lucide-react (consistent, tree-shakable)
- **Size scale:** 14px (xs), 16px (sm), 18px (base), 20px (lg), 24px (xl)
- **Usage:** Always with `aria-hidden="true"` + accessible label

---

## 11. Form Design

### 11.1 Validation Patterns
- **Real-time:** On blur (not on change)
- **Submit:** Validate all, focus first error
- **Server errors:** Map to field-level messages

### 11.2 Form Layout
```tsx
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email Address</FormLabel>
      <FormControl>
        <Input
          placeholder="user@company.com"
          type="email"
          {...field}
        />
      </FormControl>
      <FormDescription>
        We'll send a verification email
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## 12. Data Visualization

### 12.1 Chart Library: Recharts

**Standard Chart Props:**
```typescript
interface ChartProps {
  data: ChartDataPoint[];
  width?: number;
  height: number;
  margin?: Margin;
  showGrid?: boolean;
  showTooltip?: boolean;
  animationDuration?: number;
}
```

**Chart Types Used:**
| Chart | Use Case |
|-------|----------|
| `AreaChart` | API health timeline, uptime trends |
| `LineChart` | Response time, latency |
| `BarChart` | Alert volume, ticket counts |
| `PieChart` | Incident severity distribution |
| `RadialBarChart` | Uptime percentage |
| `ComposedChart` | Multiple metrics overlay |

---

## 13. Email Templates

### 13.1 Invitation Email
```
Subject: You're invited to join [Org Name] on PulseOps

Hi [Name],

[Inviter Name] invited you to join [Org Name] as a [Role].

[Accept Invitation Button] → magic link

This invitation expires in 7 days.

— The PulseOps Team
```

### 13.2 Ticket Notifications
```
Subject: [TICKET-42] New message: "Email alerts not working"

Hi [Name],

[Author] replied to your ticket:

[Message preview...]

[View Ticket Button]

— PulseOps Support
```

### 13.3 Incident Alerts
```
Subject: 🔴 CRITICAL: Auth API Down (INC-123)

Alert: Auth API returned 500 status code
Severity: Critical
Time: 10:15 AM IST

[Acknowledge Button] [View Incident Button]

— PulseOps Monitoring
```

### 13.4 Digest Emails
```
Subject: Your Weekly PulseOps Summary (Week of Sep 22)

┌────────────────────────────────────────────┐
│ This Week's Highlights                     │
├────────────────────────────────────────────┤
│ 📊 99.97% uptime across 23 APIs           │
│ 🚨 3 incidents (2 resolved, 1 active)     │
│ ⏱️ Avg MTTR: 18 min                       │
│ 👥 4 team members active                  │
├────────────────────────────────────────────┤
│ Top Issues:                                │
│ 1. Auth API - 2 incidents (DB pool)       │
│ 2. Payment Gateway - 1 incident (timeout) │
└────────────────────────────────────────────┘

[View Full Dashboard Button]
```

---

## 14. Design Tokens (Exportable)

```json
// design-tokens.json
{
  "colors": { ... },
  "spacing": { ... },
  "typography": { ... },
  "borderRadius": { ... },
  "shadows": { ... },
  "zIndex": { ... },
  "breakpoints": { ... },
  "transitions": { ... }
}
```

---

## 15. Component Development Guidelines

### 15.1 File Naming
```
components/
├── ui/                    # shadcn/ui (kebab-case)
│   ├── button.tsx
│   ├── input.tsx
│   └── ...
├── dashboard/             # Feature components (PascalCase)
│   ├── StatCard.tsx
│   ├── IncidentTimeline.tsx
│   └── ...
├── forms/                 # Form-specific
│   ├── TicketForm.tsx
│   └── ...
└── tables/                # Table components
    └── DataTable.tsx
```

### 15.2 Component Structure
```typescript
// ComponentName.tsx
'use client'; // Only if needed

import { cn } from '@/lib/utils';

interface ComponentNameProps {
  // Props with JSDoc comments
  /** Description of prop */
  propName: string;
}

export function ComponentName({ propName }: ComponentNameProps) {
  // Implementation
  return (
    <div className={cn('base-classes', 'variant-classes')}>
      {/* Content */}
    </div>
  );
}
```

### 15.3 Props Documentation
- Use JSDoc for all props
- Export types for consumers
- Default values in destructuring

---

## 16. Design Handoff Checklist

- [ ] All colors defined in CSS variables
- [ ] Spacing scale documented
- [ ] Typography scale documented
- [ ] Component inventory complete
- [ ] Responsive breakpoints defined
- [ ] Dark mode implemented
- [ ] Accessibility audit passed
- [ ] Loading/error/empty states designed
- [ ] Email templates designed
- [ ] Icon system established
- [ ] Animation guidelines documented
- [ ] Design tokens exported