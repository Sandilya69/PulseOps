"use client";

import { useState } from "react";
import { Plus, Search, Filter, ChevronDown, MoreVertical, FileText, Edit, Trash2, Copy, ExternalLink, FolderOpen, Tag, Eye, Clock, ArrowUpDown, Settings, Grid, List, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type KBArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  status: "draft" | "published" | "archived";
  visibility: "public" | "internal" | "private";
  views: number;
  helpful: number;
  notHelpful: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

type KBSettings = {
  siteName: string;
  description: string;
  logo: string;
  favicon: string;
  customDomain: string;
  primaryColor: string;
  allowPublicAccess: boolean;
  requireAuth: boolean;
  enableSearch: boolean;
  enableFeedback: boolean;
  enableAnalytics: boolean;
};

const categories = [
  "Getting Started",
  "API Reference",
  "Integrations",
  "Troubleshooting",
  "Best Practices",
  "Security",
  "Billing",
  "Account Management",
];

const mockArticles: KBArticle[] = [
  {
    id: "1",
    title: "Getting Started with PulseOps API",
    slug: "getting-started-with-api",
    excerpt: "Learn how to authenticate and make your first API call to PulseOps",
    content: `# Getting Started with PulseOps API

Welcome to PulseOps! This guide will help you make your first API call.

## Authentication

All API requests require authentication using a Bearer token.

\`\`\`bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.pulseops.com/v1/apis
\`\`\`

## Your First Request

\`\`\`bash
curl -X GET "https://api.pulseops.com/v1/apis" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
\`\`\`

## Response

\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "api_123",
      "name": "Payment Gateway",
      "endpoint": "https://api.example.com/health",
      "status": "operational"
    }
  ]
}
\`\`\`

## Next Steps

- [Create your first monitored API](/kb/create-api)
- [Set up alert rules](/kb/alert-rules)
- [Configure notification channels](/kb/notifications)`,
    category: "Getting Started",
    tags: ["api", "authentication", "quickstart"],
    author: "Priya Sharma",
    status: "published",
    visibility: "public",
    views: 1247,
    helpful: 89,
    notHelpful: 3,
    createdAt: "2026-01-05T10:00:00Z",
    updatedAt: "2026-01-15T14:30:00Z",
    publishedAt: "2026-01-05T10:00:00Z",
  },
  {
    id: "2",
    title: "Creating Alert Rules",
    slug: "creating-alert-rules",
    excerpt: "Learn how to configure alert rules for downtime, latency, and error rates",
    content: `# Creating Alert Rules

Alert rules define when you should be notified about issues with your monitored APIs.

## Types of Alert Rules

### Downtime Alerts
Trigger when an API endpoint returns a non-2xx status code or times out.

### Latency Alerts
Trigger when response time exceeds a threshold for a sustained period.

### Error Rate Alerts
Trigger when the percentage of failed requests exceeds a threshold.

## Creating a Rule

1. Navigate to **Alerting > Alert Rules**
2. Click **Create Rule**
3. Configure:
   - **Name**: Descriptive name
   - **Type**: Downtime, Latency, Error Rate, or Status Code
   - **Condition**: Threshold and duration
   - **Severity**: Critical, High, Medium, Low
   - **APIs**: Select which APIs to monitor
   - **Notifications**: Choose channels

## Best Practices

- Start with conservative thresholds
- Use different severities for different impacts
- Test rules before enabling
- Regularly review and tune thresholds`,
    category: "Alerting",
    tags: ["alerts", "rules", "configuration"],
    author: "Raj Kumar",
    status: "published",
    visibility: "public",
    views: 892,
    helpful: 67,
    notHelpful: 2,
    createdAt: "2026-01-10T09:00:00Z",
    updatedAt: "2026-01-18T16:45:00Z",
    publishedAt: "2026-01-10T09:00:00Z",
  },
  {
    id: "3",
    title: "Configuring Notification Channels",
    slug: "configuring-notification-channels",
    excerpt: "Set up Email, Slack, PagerDuty, SMS, and Webhook notifications",
    content: `# Configuring Notification Channels

Learn how to set up various notification channels for your alerts.

## Email Notifications

1. Go to **Settings > Notifications**
2. Enable **Email** channel
3. Add recipient emails
4. Configure templates (optional)

## Slack Integration

1. Go to **Settings > Integrations > Slack**
2. Click **Add to Slack**
3. Authorize workspace
4. Select channels for alerts

## PagerDuty

1. Get Integration Key from PagerDuty
2. Go to **Settings > Integrations > PagerDuty**
3. Paste Integration Key
4. Map severities to urgency levels

## SMS (Twilio)

1. Configure Twilio credentials in Settings
2. Add verified phone numbers
3. Enable SMS for critical alerts only

## Webhooks

1. Provide endpoint URL
2. Select events to trigger
3. Configure headers/authentication
4. Test with sample payload`,
    category: "Integrations",
    tags: ["notifications", "slack", "pagerduty", "webhooks"],
    author: "Amit Patel",
    status: "published",
    visibility: "public",
    views: 654,
    helpful: 45,
    notHelpful: 1,
    createdAt: "2026-01-12T11:00:00Z",
    updatedAt: "2026-01-18T16:45:00Z",
    publishedAt: "2026-01-12T11:00:00Z",
  },
  {
    id: "4",
    title: "Troubleshooting High Latency",
    slug: "troubleshooting-high-latency",
    excerpt: "Systematic approach to diagnose and resolve high latency issues",
    content: `# Troubleshooting High Latency

A systematic approach to diagnose and resolve high latency issues in your services.

## Quick Checks (2 minutes)

1. Check APM dashboard for error rate spikes
2. Verify recent deployment timing correlation
3. Check infrastructure metrics (CPU, Memory, Disk, Network)

## Deep Dive (10 minutes)

1. **Trace Analysis**: Sample trace IDs in APM
2. **Database Analysis**: Slow query log review
3. **External Dependencies**: Third-party API latency
3. **Queue Analysis**: Message queue depths and processing times

## Common Root Causes

- **N+1 Queries**: New deployment with unoptimized database access
- **Missing Indexes**: Database query plan analysis
- **Third-party Degradation**: External API latency spikes
- **Resource Saturation**: CPU throttling, GC pauses, memory pressure
- **Lock Contention**: Database row locks, distributed locks

## Resolution Playbook

1. **Immediate**: Rollback recent deployment if correlated
2. **Short-term**: Add missing indexes, scale affected service
3. **Mitigation**: Enable circuit breakers for external dependencies
4. **Long-term**: Implement caching, optimize queries, add read replicas

## Prevention

- Add latency budgets to CI/CD
- Set up latency alerts with appropriate thresholds
- Implement distributed tracing
- Regular performance reviews`,
    category: "Troubleshooting",
    tags: ["latency", "performance", "troubleshooting", "apm"],
    author: "Raj Kumar",
    status: "published",
    visibility: "public",
    views: 1123,
    helpful: 78,
    notHelpful: 4,
    createdAt: "2026-01-15T14:00:00Z",
    updatedAt: "2026-01-19T10:30:00Z",
    publishedAt: "2026-01-15T14:00:00Z",
  },
  {
    id: "5",
    title: "Setting Up On-Call Schedules",
    slug: "setting-up-oncall-schedules",
    excerpt: "Configure on-call rotations, escalation policies, and handoff procedures",
    content: `# Setting Up On-Call Schedules

Configure on-call rotations, escalation policies, and handoff procedures for your team.

## Creating a Schedule

1. Go to **Alerting > On-Call Schedules**
2. Click **Create Schedule**
3. Configure:
   - **Name**: e.g., "Primary On-Call"
   - **Rotation**: Daily, Weekly, or Custom
   - **Handoff**: Day and time (e.g., Monday 9:00 AM UTC)
   - **Timezone**: Team's primary timezone
   - **Members**: Add team members in rotation order

## Escalation Policies

Define what happens when alerts aren't acknowledged:

| Level | Delay | Channels | Recipients |
|-------|-------|----------|------------|
| 1 | 0 min | Push, SMS | Current on-call |
| 2 | 5 min | Phone, Slack | Current + secondary |
| 3 | 15 min | Phone, Email, PagerDuty | Team lead + manager |

## Handoff Procedures

1. **Automatic**: System notifies next on-call at handoff time
2. **Manual**: Outgoing engineer confirms handoff in Slack
3. **Verification**: Incoming engineer acknowledges in dashboard

## Best Practices

- Minimum 2 people per rotation
- Maximum 1 week per shift
- Overlap handoff by 30 minutes
- Document runbook links in schedule description
- Quarterly schedule reviews`,
    category: "Alerting",
    tags: ["oncall", "schedules", "escalation", "team"],
    author: "Neha Singh",
    status: "published",
    visibility: "internal",
    views: 445,
    helpful: 34,
    notHelpful: 1,
    createdAt: "2026-01-18T10:00:00Z",
    updatedAt: "2026-01-20T10:00:00Z",
    publishedAt: "2026-01-18T10:00:00Z",
  },
];

function formatDate(dateStr: string | null) {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const statusColors = {
  draft: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  published: "bg-green-500/20 text-green-400 border-green-500/30",
  archived: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const statusLabels = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

const visibilityColors = {
  public: "bg-green-500/20 text-green-400 border-green-500/30",
  internal: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  private: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<KBArticle[]>(mockArticles);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KBArticle | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(search.toLowerCase()) ||
      article.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || article.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || article.status === statusFilter;
    const matchesVisibility = visibilityFilter === "all" || article.visibility === visibilityFilter;
    return matchesSearch && matchesCategory && matchesStatus && matchesVisibility;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-[#94a3b8] mt-1">Create and manage documentation for your team and customers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSettings(true)} className="px-4 py-2 rounded-xl font-medium bg-[#334155] border border-[#475569] text-white hover:bg-[#475569] transition-colors">
            <Settings className="w-4 h-4 mr-2" /> Settings
          </button>
          <button onClick={() => { setEditingArticle(null); setShowCreateModal(true); }} className="flex items-center gap-2 bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white px-4 py-2 rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all">
            <Plus className="w-4 h-4" /> New Article
          </button>
        </div>
      </div>

      <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl p-4 border border-[#334155]">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input type="text" placeholder="Search articles..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-10 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors" />
          </div>
          <div className="flex gap-2">
            <SelectFilter value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} options={[{value:"all",label:"All Categories"},...categories.map(c=>({value:c,label:c}))]} icon={<Filter className="w-4 h-4" />} />
            <SelectFilter value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={[{value:"all",label:"All Status"},{value:"published",label:"Published"},{value:"draft",label:"Draft"},{value:"archived",label:"Archived"}]} icon={<Filter className="w-4 h-4" />} />
            <SelectFilter value={visibilityFilter} onChange={e => setVisibilityFilter(e.target.value)} options={[{value:"all",label:"All Visibility"},{value:"public",label:"Public"},{value:"internal",label:"Internal"},{value:"private",label:"Private"}]} icon={<Filter className="w-4 h-4" />} />
            <div className="flex gap-1 border border-[#334155] rounded-lg p-1">
              <button onClick={() => setViewMode("grid")} className={`p-2 rounded transition-colors ${viewMode === "grid" ? "bg-[#06b6d4]/20 text-[#06b6d4]" : "text-[#64748b] hover:text-white"}`}><Grid className="w-5 h-5" /></button>
              <button onClick={() => setViewMode("list")} className={`p-2 rounded transition-colors ${viewMode === "list" ? "bg-[#06b6d4]/20 text-[#06b6d4]" : "text-[#64748b] hover:text-white"}`}><List className="w-5 h-5" /></button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategoryFilter(categoryFilter === cat ? "all" : cat)} className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${categoryFilter === cat ? "bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white" : "bg-[#334155] text-[#94a3b8] hover:text-white"}`}>{cat}</button>
          ))}
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map(article => (
            <motion.article key={article.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-[#334155] p-6 hover:border-[#06b6d4]/30 transition-colors flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-medium bg-[#334155] rounded text-[#94a3b8]">{article.category}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium border ${statusColors[article.status]}`}>{statusLabels[article.status]}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium border ${visibilityColors[article.visibility]}`}>{article.visibility}</span>
                </div>
                <div className="flex gap-1">
                  <button className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                  <button className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors" title="Edit" onClick={() => setEditingArticle(article)}><Edit className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">{article.title}</h3>
              <p className="text-[#94a3b8] text-sm mb-4 line-clamp-2">{article.excerpt}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {article.tags.slice(0, 3).map(tag => <span key={tag} className="px-2 py-0.5 text-xs bg-[#334155] rounded text-[#94a3b8]">#{tag}</span>)}
                {article.tags.length > 3 && <span className="px-2 py-0.5 text-xs bg-[#334155] rounded text-[#64748b]">+{article.tags.length - 3}</span>}
              </div>
              <div className="border-t border-[#334155] pt-4 mt-auto">
                <div className="flex items-center justify-between text-xs text-[#64748b] mb-2">
                  <span>By {article.author}</span>
                  <span>{article.status === "published" && article.publishedAt ? `Published ${formatDate(article.publishedAt)}` : `Updated ${formatDate(article.updatedAt)}`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-[#64748b]">
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {article.views}</span>
                    <span className="flex items-center gap-1"><ArrowUpDown className="w-3.5 h-3.5" /> {article.helpful - article.notHelpful}</span>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      ) : (
        <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-[#334155] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#334155] bg-[#0c0f1d]/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Article</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden md:table-cell">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">Visibility</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">Views</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">Helpful</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden xl:table-cell">Updated</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[#64748b] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]/50">
                {filteredArticles.map(article => (
                  <tr key={article.id} className="hover:bg-[#334155]/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-white truncate max-w-xs">{article.title}</p>
                      <p className="text-sm text-[#64748b] truncate max-w-xs">{article.excerpt}</p>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="px-2 py-0.5 text-xs bg-[#334155] rounded text-[#94a3b8]">{article.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[article.status]}`}>{statusLabels[article.status]}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${visibilityColors[article.visibility]}`}>{article.visibility}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-[#94a3b8]">{article.views.toLocaleString()}</td>
                    <td className="px-6 py-4 hidden lg:table-cell text-[#94a3b8]">{article.helpful - article.notHelpful}</td>
                    <td className="px-6 py-4 hidden xl:table-cell text-[#64748b]">{formatDate(article.updatedAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setEditingArticle(article)} className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors"><Edit className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredArticles.length === 0 && (
        <div className="text-center p-12">
          <FileText className="w-12 h-12 text-[#334155] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#94a3b8] mb-2">No articles found</h3>
          <p className="text-[#64748b] mb-6">Create your first article to start building your knowledge base</p>
          <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white px-4 py-2 rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all"><Plus className="w-4 h-4" /> Create Article</button>
        </div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold">Create Article</h2><button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors"><X className="w-5 h-5" /></button></div>
              <form className="space-y-4">
                <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Title</label><input type="text" placeholder="e.g., Getting Started with API" className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors" /></div>
                <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Excerpt</label><textarea placeholder="Brief summary..." rows={2} className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors resize-none" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Category</label><select className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Status</label><select className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Visibility</label><select className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none"><option value="public">Public</option><option value="internal">Internal</option><option value="private">Private</option></select></div>
                  <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Tags (comma separated)</label><input type="text" placeholder="api, authentication, quickstart" className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors" /></div>
                </div>
                <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Content (Markdown)</label><textarea placeholder="Write your article content here..." rows={12} className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors resize-none font-mono" /></div>
                <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-[#334155] border border-[#475569] text-white hover:bg-[#475569] transition-colors">Cancel</button><button type="submit" className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all">Create Article</button></div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold">Knowledge Base Settings</h2><button onClick={() => setShowSettings(false)} className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors"><X className="w-5 h-5" /></button></div>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Site Name</label><input type="text" placeholder="PulseOps Docs" className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors" /></div>
                  <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Custom Domain</label><input type="text" placeholder="docs.example.com" className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors" /></div>
                </div>
                <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Description</label><textarea placeholder="Your knowledge base description..." rows={2} className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors resize-none" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-3 bg-[#0c0f1d] border border-[#334155] rounded-xl cursor-pointer"><input type="checkbox" className="w-4 h-4 rounded border-[#334155] text-[#06b6d4] focus:ring-[#06b6d4]" /><div><p className="font-medium text-white">Public Access</p><p className="text-xs text-[#64748b]">Allow public access without authentication</p></div></label>
                  <label className="flex items-center gap-3 p-3 bg-[#0c0f1d] border border-[#334155] rounded-xl cursor-pointer"><input type="checkbox" className="w-4 h-4 rounded border-[#334155] text-[#06b6d4] focus:ring-[#06b6d4]" /><div><p className="font-medium text-white">Require Authentication</p><p className="text-xs text-[#64748b]">Require login for internal articles</p></div></label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-3 bg-[#0c0f1d] border border-[#334155] rounded-xl cursor-pointer"><input type="checkbox" className="w-4 h-4 rounded border-[#334155] text-[#06b6d4] focus:ring-[#06b6d4]" /><div><p className="font-medium text-white">Enable Search</p><p className="text-xs text-[#64748b]">Allow full-text search</p></div></label>
                  <label className="flex items-center gap-3 p-3 bg-[#0c0f1d] border border-[#334155] rounded-xl cursor-pointer"><input type="checkbox" className="w-4 h-4 rounded border-[#334155] text-[#06b6d4] focus:ring-[#06b6d4]" /><div><p className="font-medium text-white">Enable Feedback</p><p className="text-xs text-[#64748b">Allow helpful/not helpful votes</p></div></label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-3 bg-[#0c0f1d] border border-[#334155] rounded-xl cursor-pointer"><input type="checkbox" className="w-4 h-4 rounded border-[#334155] text-[#06b6d4] focus:ring-[#06b6d4]" /><div><p className="font-medium text-white">Enable Analytics</p><p className="text-xs text-[#64748b">Track views and engagement</p></div></label>
                </div>
                <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowSettings(false)} className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-[#334155] border border-[#475569] text-white hover:bg-[#475569] transition-colors">Cancel</button><button type="submit" className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all">Save Settings</button></div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingArticle && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditingArticle(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold">Edit Article</h2><button onClick={() => setEditingArticle(null)} className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors"><X className="w-5 h-5" /></button></div>
              <form className="space-y-4">
                <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Title</label><input type="text" defaultValue={editingArticle.title} className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors" /></div>
                <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Excerpt</label><textarea defaultValue={editingArticle.excerpt} rows={2} className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors resize-none" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Category</label><select defaultValue={editingArticle.category} className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Status</label><select defaultValue={editingArticle.status} className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Visibility</label><select defaultValue={editingArticle.visibility} className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none"><option value="public">Public</option><option value="internal">Internal</option><option value="private">Private</option></select></div>
                  <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Tags (comma separated)</label><input type="text" defaultValue={editingArticle.tags.join(", ")} className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors" /></div>
                </div>
                <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Content (Markdown)</label><textarea defaultValue={editingArticle.content} rows={15} className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors resize-none font-mono" /></div>
                <div className="flex gap-3 pt-4"><button type="button" onClick={() => setEditingArticle(null)} className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-[#334155] border border-[#475569] text-white hover:bg-[#475569] transition-colors">Cancel</button><button type="submit" className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all">Save Changes</button></div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SelectFilter({ value, onChange, options, icon }: { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: { value: string; label: string }[]; icon: React.ReactNode }) {
  return (<div className="relative"><select value={value} onChange={onChange} className="w-full sm:w-40 bg-[#0c0f1d] border border-[#334155] rounded-xl px-10 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none">{options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select><div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">{icon}</div><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" /></div>);
}