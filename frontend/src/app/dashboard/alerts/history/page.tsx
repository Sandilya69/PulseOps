"use client";

import { useState } from "react";
import { Search, Filter, ChevronDown, MoreVertical, Bell, Clock, AlertTriangle, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type AlertHistory = {
  id: string;
  ruleId: string;
  ruleName: string;
  apiName: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "firing" | "acknowledged" | "resolved";
  message: string;
  triggeredAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  acknowledgedBy: string | null;
};

const severityColors = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const statusColors = {
  firing: "bg-red-500/20 text-red-400 border-red-500/30",
  acknowledged: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
};

const statusIcons = {
  firing: <Bell className="w-4 h-4" />,
  acknowledged: <Clock className="w-4 h-4" />,
  resolved: <CheckCircle className="w-4 h-4" />,
};

const mockAlerts: AlertHistory[] = [
  {
    id: "1",
    ruleId: "1",
    ruleName: "Payment API Downtime",
    apiName: "Payment Gateway",
    severity: "critical",
    status: "resolved",
    message: "Payment Gateway returned 503 for 3 consecutive checks",
    triggeredAt: "2026-01-20T14:22:00Z",
    acknowledgedAt: "2026-01-20T14:25:00Z",
    resolvedAt: "2026-01-20T14:45:00Z",
    acknowledgedBy: "Priya Sharma",
  },
  {
    id: "2",
    ruleId: "2",
    ruleName: "High Latency Alert",
    apiName: "User Service",
    severity: "high",
    status: "acknowledged",
    message: "P95 latency exceeded 800ms for 5 minutes",
    triggeredAt: "2026-01-20T16:45:00Z",
    acknowledgedAt: "2026-01-20T16:48:00Z",
    resolvedAt: null,
    acknowledgedBy: "Raj Kumar",
  },
  {
    id: "3",
    ruleId: "4",
    ruleName: "Non-2xx Status Codes",
    apiName: "Auth API",
    severity: "medium",
    status: "firing",
    message: "Auth API returned 502 Bad Gateway",
    triggeredAt: "2026-01-20T17:30:00Z",
    acknowledgedAt: null,
    resolvedAt: null,
    acknowledgedBy: null,
  },
  {
    id: "4",
    ruleId: "1",
    ruleName: "Payment API Downtime",
    apiName: "Billing API",
    severity: "critical",
    status: "resolved",
    message: "Billing API timeout after 30 seconds",
    triggeredAt: "2026-01-19T08:30:00Z",
    acknowledgedAt: "2026-01-19T08:32:00Z",
    resolvedAt: "2026-01-19T08:55:00Z",
    acknowledgedBy: "Amit Patel",
  },
  {
    id: "5",
    ruleId: "2",
    ruleName: "High Latency Alert",
    apiName: "Notification Service",
    severity: "high",
    status: "resolved",
    message: "P95 latency exceeded 600ms",
    triggeredAt: "2026-01-18T16:45:00Z",
    acknowledgedAt: "2026-01-18T16:47:00Z",
    resolvedAt: "2026-01-18T17:10:00Z",
    acknowledgedBy: "Priya Sharma",
  },
];

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatRelative(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function AlertHistoryPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredAlerts = mockAlerts.filter(alert => {
    const matchesSearch = alert.ruleName.toLowerCase().includes(search.toLowerCase()) ||
      alert.apiName.toLowerCase().includes(search.toLowerCase()) ||
      alert.message.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || alert.status === statusFilter;
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const getDuration = (alert: AlertHistory) => {
    if (!alert.acknowledgedAt) return null;
    const start = new Date(alert.triggeredAt).getTime();
    const end = alert.resolvedAt ? new Date(alert.resolvedAt).getTime() : new Date(alert.acknowledgedAt).getTime();
    const diffMs = end - start;
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alert History</h1>
        <p className="text-[#94a3b8] mt-1">View all alert events, acknowledgments, and resolutions</p>
      </div>

      <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl p-4 border border-[#334155]">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-10 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <SelectFilter
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              options={[
                { value: "all", label: "All Status" },
                { value: "firing", label: "Firing" },
                { value: "acknowledged", label: "Acknowledged" },
                { value: "resolved", label: "Resolved" },
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

      <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-[#334155] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#334155] bg-[#0c0f1d]/50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Alert</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden md:table-cell">API</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Severity</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">Triggered</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden xl:table-cell">Acknowledged</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden xl:table-cell">Resolved</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden xl:table-cell">MTTA / MTTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]/50">
              {filteredAlerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-[#334155]/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">{alert.ruleName}</p>
                    <p className="text-sm text-[#64748b] truncate max-w-xs">{alert.message}</p>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="px-2 py-0.5 text-xs bg-[#334155] rounded text-[#94a3b8]">{alert.apiName}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${severityColors[alert.severity]}`}>
                      {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[alert.status]}`}>
                      {statusIcons[alert.status]} {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-[#94a3b8]">
                    {formatRelative(alert.triggeredAt)}
                  </td>
                  <td className="px-6 py-4 hidden xl:table-cell">
                    {alert.acknowledgedAt ? (
                      <>
                        <span className="text-[#06b6d4]">{formatRelative(alert.acknowledgedAt)}</span>
                        <span className="text-[#64748b] ml-1">by {alert.acknowledgedBy}</span>
                      </>
                    ) : (
                      <span className="text-[#64748b">Not acknowledged</span>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden xl:table-cell">
                    {alert.resolvedAt ? (
                      <span className="text-green-400">{formatRelative(alert.resolvedAt)}</span>
                    ) : (
                      <span className="text-[#64748b">Not resolved</span>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden xl:table-cell text-[#06b6d4] font-mono">
                    {getDuration(alert) || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAlerts.length === 0 && (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-[#334155] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#94a3b8] mb-2">No alerts found</h3>
            <p className="text-[#64748b]">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SelectFilter({ value, onChange, options, icon }: { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: { value: string; label: string }[]; icon: React.ReactNode }) {
  return (
    <div className="relative">
      <select value={value} onChange={onChange} className="w-full sm:w-40 bg-[#0c0f1d] border border-[#334155] rounded-xl px-10 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none">
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">{icon}</div>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
    </div>
  );
}