"use client";

import { useState } from "react";
import { Plus, Search, Filter, ChevronDown, MoreVertical, FileText, Edit, Trash2, Copy, ExternalLink, Play, Clock, AlertTriangle, CheckCircle, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Runbook = {
  id: string;
  title: string;
  description: string;
  category: "incident_response" | "deployment" | "maintenance" | "troubleshooting";
  severity: "critical" | "high" | "medium" | "low";
  tags: string[];
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  lastUsed: string | null;
  usageCount: number;
};

const categoryIcons = {
  incident_response: <AlertTriangle className="w-4 h-4" />,
  deployment: <Rocket className="w-4 h-4" />,
  maintenance: <Settings className="w-4 h-4" />,
  troubleshooting: <Search className="w-4 h-4" />,
};

const categoryLabels = {
  incident_response: "Incident Response",
  deployment: "Deployment",
  maintenance: "Maintenance",
  troubleshooting: "Troubleshooting",
};

const severityColors = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const mockRunbooks: Runbook[] = [
  {
    id: "1",
    title: "Database Connection Pool Exhaustion",
    description: "Steps to diagnose and resolve database connection pool exhaustion issues",
    category: "incident_response",
    severity: "critical",
    tags: ["database", "postgresql", "connection-pool"],
    content: `## Symptoms
- Application errors: "connection pool exhausted"
- Increased response times
- 500 errors on database-dependent endpoints

## Diagnosis
1. Check current connections: \`SELECT count(*) FROM pg_stat_activity;\`
2. Check max connections: \`SHOW max_connections;\`
3. Identify long-running queries: \`SELECT * FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '5 minutes';\`

## Resolution
1. Kill idle connections: \`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND now() - state_change > interval '10 minutes';\`
2. Increase pool size temporarily
3. Investigate root cause: missing connection cleanup in code

## Prevention
- Implement connection pooling (PgBouncer)
- Add connection timeout configs
- Set up monitoring alerts for pool usage > 80%`,
    author: "Priya Sharma",
    createdAt: "2026-01-10T10:00:00Z",
    updatedAt: "2026-01-15T14:30:00Z",
    version: 3,
    lastUsed: "2026-01-20T14:22:00Z",
    usageCount: 12,
  },
  {
    id: "2",
    title: "High Latency Investigation",
    description: "Systematic approach to diagnose and resolve high latency issues",
    category: "troubleshooting",
    severity: "high",
    tags: ["latency", "performance", "apm"],
    content: `## Quick Checks (2 min)
1. Check APM dashboard for error rate spike
2. Verify deployment timing correlation
3. Check infrastructure metrics (CPU, Memory, Disk, Network)

## Deep Dive (10 min)
1. Trace ID sampling in APM
2. Database slow query analysis
3. External dependency latency (third-party APIs)
4. Queue depths and processing times

## Common Causes
- New deployment with N+1 queries
- Database missing indexes
- Third-party API degradation
- Resource saturation (CPU throttling, GC pauses)
- Lock contention

## Resolution Steps
1. Rollback if recent deployment
2. Add missing indexes
3. Scale affected service
4. Enable circuit breakers for external deps`,
    author: "Raj Kumar",
    createdAt: "2026-01-12T09:00:00Z",
    updatedAt: "2026-01-18T16:45:00Z",
    version: 2,
    lastUsed: "2026-01-18T16:45:00Z",
    usageCount: 8,
  },
  {
    id: "3",
    title: "Kubernetes Deployment Rollback",
    description: "Standard procedure for rolling back a failed Kubernetes deployment",
    category: "deployment",
    severity: "high",
    tags: ["kubernetes", "deployment", "rollback"],
    content: `## Prerequisites
- kubectl access to cluster
- ArgoCD/Flux access (if GitOps)

## Rollback Steps
1. Check deployment status: \`kubectl rollout status deployment/<name> -n <namespace>\`
2. View revision history: \`kubectl rollout history deployment/<name> -n <namespace>\`
3. Rollback to previous: \`kubectl rollout undo deployment/<name> -n <namespace>\`
4. Rollback to specific revision: \`kubectl rollout undo deployment/<name> --to-revision=<N> -n <namespace>\`
4. Verify rollback: \`kubectl rollout status deployment/<name> -n <namespace>\`

## Post-Rollback
1. Verify application health
2. Check error rates and latency
3. Notify team
4. Create incident ticket for root cause analysis

## GitOps (ArgoCD)
1. Revert git commit
2. ArgoCD will auto-sync
3. Or use CLI: \`argocd app rollback <app-name> <revision>\``,
    author: "Amit Patel",
    createdAt: "2026-01-08T11:00:00Z",
    updatedAt: "2026-01-08T11:00:00Z",
    version: 1,
    lastUsed: null,
    usageCount: 0,
  },
  {
    id: "4",
    title: "Certificate Renewal Process",
    description: "Automated and manual steps for TLS certificate renewal",
    category: "maintenance",
    severity: "medium",
    tags: ["tls", "certificates", "security"],
    content: `## Automated (Cert-Manager)
1. Check cert-manager status: \`kubectl get certificates -A\`
2. Check challenges: \`kubectl get challenges -A\`
3. Force renewal: \`kubectl delete certificate <name> -n <namespace>\`

## Manual (Let's Encrypt)
1. Generate CSR
2. Submit to CA
3. Validate domain (DNS-01 or HTTP-01)
4. Install certificate
5. Reload nginx/traefik

## Verification
1. Check expiry: \`openssl x509 -in cert.pem -text -noout | grep "Not After"\`
2. Test with: \`curl -vI https://domain.com\`
3. Check SSL Labs rating

## Monitoring
- Alert 30 days before expiry
- Alert 7 days before expiry
- Alert on renewal failure`,
    author: "Neha Singh",
    createdAt: "2026-01-05T14:00:00Z",
    updatedAt: "2026-01-20T10:00:00Z",
    version: 4,
    lastUsed: "2026-01-15T10:00:00Z",
    usageCount: 5,
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

export default function RunbooksPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRunbook, setSelectedRunbook] = useState<Runbook | null>(null);

  const filteredRunbooks = mockRunbooks.filter(rb => {
    const matchesSearch = rb.title.toLowerCase().includes(search.toLowerCase()) ||
      rb.description.toLowerCase().includes(search.toLowerCase()) ||
      rb.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || rb.category === categoryFilter;
    const matchesSeverity = severityFilter === "all" || rb.severity === severityFilter;
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Runbooks</h1>
          <p className="text-[#94a3b8] mt-1">Operational procedures for incident response and maintenance</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white px-4 py-2 rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Runbook
        </button>
      </div>

      <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl p-4 border border-[#334155]">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              type="text"
              placeholder="Search runbooks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-10 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <SelectFilter
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              options={[
                { value: "all", label: "All Categories" },
                { value: "incident_response", label: "Incident Response" },
                { value: "deployment", label: "Deployment" },
                { value: "maintenance", label: "Maintenance" },
                { value: "troubleshooting", label: "Troubleshooting" },
              ]}
              icon={<Filter className="w-4 h-4" />}
            />
            <SelectFilter
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              options={[
                { value: "all", label: "All Severities" },
                { value: "critical", label: "Critical" },
                { value: "high", label: "High" },
                { value: "medium", label: "Medium" },
                { value: "low", label: "Low" },
              ]}
              icon={<Filter className="w-4 h-4" />}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockRunbooks.map((rb) => (
          <motion.div
            key={rb.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-[#334155] p-6 hover:border-[#06b6d4]/30 transition-colors flex flex-col"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#334155] flex items-center justify-center">
                  {categoryIcons[rb.category]}
                </div>
                <div>
                  <span className="px-2 py-0.5 text-xs font-medium bg-[#334155] rounded text-[#94a3b8]">{categoryLabels[rb.category]}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium border ml-2 ${severityColors[rb.severity]}`}>
                    {rb.severity.charAt(0).toUpperCase() + rb.severity.slice(1)}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors" title="Execute">
                  <Play className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors" title="Copy link">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">{rb.title}</h3>
            <p className="text-[#94a3b8] text-sm mb-4 line-clamp-2">{rb.description}</p>

            <div className="flex flex-wrap gap-1 mb-4">
              {rb.tags.slice(0, 4).map(tag => (
                <span key={tag} className="px-2 py-0.5 text-xs bg-[#334155] rounded text-[#94a3b8]">{tag}</span>
              ))}
              {rb.tags.length > 4 && <span className="px-2 py-0.5 text-xs bg-[#334155] rounded text-[#64748b]">+{rb.tags.length - 4} more</span>}
            </div>

            <div className="border-t border-[#334155] pt-4 mt-auto">
              <div className="flex items-center justify-between text-xs text-[#64748b] mb-2">
                <span>By {rb.author}</span>
                <span>v{rb.version} • Updated {formatDate(rb.updatedAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[#64748b]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Used {rb.usageCount} times</span>
                  {rb.lastUsed && <span className="ml-2">• Last used {formatDate(rb.lastUsed)}</span>}
                </div>
                <button className="px-3 py-1.5 text-sm bg-[#06b6d4]/20 text-[#06b6d4] rounded-lg hover:bg-[#06b6d4]/30 transition-colors" onClick={() => setSelectedRunbook(rb)}>
                  View
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {mockRunbooks.length === 0 && (
        <div className="text-center p-12">
          <BookOpen className="w-12 h-12 text-[#334155] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#94a3b8] mb-2">No runbooks found</h3>
          <p className="text-[#64748b] mb-6">Create your first runbook to document procedures</p>
          <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white px-4 py-2 rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all">
            <Plus className="w-4 h-4" /> Create Runbook
          </button>
        </div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Create Runbook</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form className="space-y-4">
                <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Title</label><input type="text" placeholder="e.g., Database Connection Pool Exhaustion" className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors" /></div>
                <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Description</label><textarea placeholder="Brief description..." rows={2} className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors resize-none" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Category</label><select className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none"><option value="incident_response">Incident Response</option><option value="deployment">Deployment</option><option value="maintenance">Maintenance</option><option value="troubleshooting">Troubleshooting</option></select></div>
                  <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Severity</label><select className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none"><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
                </div>
                <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Tags (comma separated)</label><input type="text" placeholder="database, postgresql, connection-pool" className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors" /></div>
                <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Content (Markdown)</label><textarea placeholder="## Symptoms\n## Diagnosis\n## Resolution\n## Prevention" rows={10} className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors resize-none font-mono" /></div>
                <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-[#334155] border border-[#475569] text-white hover:bg-[#475569] transition-colors">Cancel</button><button type="submit" className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all">Create Runbook</button></div>
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

import { Rocket, Settings, X } from "lucide-react";