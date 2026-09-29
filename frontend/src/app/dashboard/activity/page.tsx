"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/axios";
import {
  Search,
  Filter,
  ChevronDown,
  Download,
  Loader2,
  Clock,
  User,
  Server,
  AlertCircle,
  Ticket,
  Building2,
  Key,
  ShieldCheck,
  Mail,
  ExternalLink,
  Eye,
  UserCheck,
  UserX,
  XCircle,
  CheckCircle,
  Activity,
  MessageSquare,
} from "lucide-react";
import { motion } from "framer-motion";

interface ActivityLog {
  id: string;
  orgId: string;
  userId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  resourceName: string | null;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const actionIcons: Record<string, React.ReactNode> = {
  "user.login": <Key className="w-4 h-4" />,
  "user.logout": <Key className="w-4 h-4" />,
  "user.signup": <User className="w-4 h-4" />,
  "user.invited": <Mail className="w-4 h-4" />,
  "user.joined": <UserCheck className="w-4 h-4" />,
  "user.role_changed": <ShieldCheck className="w-4 h-4" />,
  "user.deactivated": <XCircle className="w-4 h-4" />,
  "user.removed": <UserX className="w-4 h-4" />,
  "api.created": <Server className="w-4 h-4" />,
  "api.updated": <Server className="w-4 h-4" />,
  "api.deleted": <Server className="w-4 h-4" />,
  "api.activated": <Server className="w-4 h-4" />,
  "api.deactivated": <Server className="w-4 h-4" />,
  "incident.triggered": <AlertCircle className="w-4 h-4" />,
  "incident.acknowledged": <CheckCircle className="w-4 h-4" />,
  "incident.resolved": <CheckCircle className="w-4 h-4" />,
  "incident.closed": <XCircle className="w-4 h-4" />,
  "incident.note_added": <MessageSquare className="w-4 h-4" />,
  "ticket.created": <Ticket className="w-4 h-4" />,
  "ticket.resolved": <CheckCircle className="w-4 h-4" />,
  "org.updated": <Building2 className="w-4 h-4" />,
  "org.ownership_transferred": <Building2 className="w-4 h-4" />,
  "invitation.revoked": <Mail className="w-4 h-4" />,
};

const actionColors: Record<string, string> = {
  "user.login": "text-blue-400",
  "user.logout": "text-blue-400",
  "user.signup": "text-green-400",
  "user.invited": "text-orange-400",
  "user.joined": "text-green-400",
  "user.role_changed": "text-purple-400",
  "user.deactivated": "text-red-400",
  "user.removed": "text-red-400",
  "api.created": "text-blue-400",
  "api.updated": "text-yellow-400",
  "api.deleted": "text-red-400",
  "api.activated": "text-green-400",
  "api.deactivated": "text-red-400",
  "incident.triggered": "text-red-400",
  "incident.acknowledged": "text-yellow-400",
  "incident.resolved": "text-green-400",
  "incident.closed": "text-gray-400",
  "incident.note_added": "text-blue-400",
  "ticket.created": "text-blue-400",
  "ticket.resolved": "text-green-400",
  "org.updated": "text-purple-400",
  "org.ownership_transferred": "text-purple-400",
  "invitation.revoked": "text-red-400",
};

const resourceTypeLabels: Record<string, string> = {
  user: "User",
  api: "API",
  incident: "Incident",
  ticket: "Ticket",
  organization: "Organization",
  invitation: "Invitation",
  integration: "Integration",
  contact: "Contact",
};

function formatAction(action: string): string {
  return action
    .split(".")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function ActivityPage() {
  const { user, organization } = useAuthStore();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });

  const currentUserRole = user?.role;
  const canViewActivity = ["owner", "admin", "member", "viewer", "on_call_engineer"].includes(currentUserRole || "");
  const canExport = ["owner", "admin"].includes(currentUserRole || "");

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
        ...(actionFilter !== "all" && { action: actionFilter }),
        ...(resourceFilter !== "all" && { resourceType: resourceFilter }),
        ...(userFilter !== "all" && { userId: userFilter }),
        ...(search && { search }),
        ...(dateRange.from && { from: dateRange.from.toISOString() }),
        ...(dateRange.to && { to: dateRange.to.toISOString() }),
      });
      const res = await api.get<PaginatedResponse<ActivityLog>>(
        `/organizations/${organization?.id}/activity?${params}`
      );
      setActivities(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [page, actionFilter, resourceFilter, userFilter, search, dateRange]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...(actionFilter !== "all" && { action: actionFilter }),
        ...(resourceFilter !== "all" && { resourceType: resourceFilter }),
        ...(userFilter !== "all" && { userId: userFilter }),
        ...(search && { search }),
        ...(dateRange.from && { from: dateRange.from.toISOString() }),
        ...(dateRange.to && { to: dateRange.to.toISOString() }),
        export: "true",
      });
      const res = await api.get(
        `/organizations/${organization?.id}/activity?${params}`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `activity-log-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to export:", error);
      alert("Failed to export. Please try again.");
    }
  };

  const formatDate = (dateStr: string) => {
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
  };

  const formatFullDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUniqueActions = () => {
    const actions = new Set(activities.map(a => a.action));
    return Array.from(actions).sort();
  };

  const getUniqueResources = () => {
    const resources = new Set(activities.map(a => a.resourceType).filter(Boolean));
    return Array.from(resources).sort().filter((r): r is string => r !== null);
  };

  const getUniqueUsers = () => {
    const users = new Set(activities.map(a => a.user?.name).filter(Boolean));
    return Array.from(users).sort().filter((u): u is string => u !== undefined);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-[#94a3b8] mt-1">Complete audit trail of all organization actions</p>
        </div>
        {canExport && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-[#334155]/50 border border-[#475569] rounded-xl text-sm font-medium text-[#94a3b8] hover:text-white hover:border-[#06b6d4]/50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl p-4 border border-[#334155]">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              type="text"
              placeholder="Search activities..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-10 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors"
            />
          </div>
          <SelectFilter
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1); }}
            options={[
              { value: "all", label: "All Actions" },
              ...getUniqueActions().map(a => ({ value: a, label: formatAction(a) })),
            ]}
            icon={<Filter className="w-4 h-4" />}
          />
          <SelectFilter
            value={resourceFilter}
            onChange={e => { setResourceFilter(e.target.value); setPage(1); }}
            options={[
              { value: "all", label: "All Resources" },
              ...getUniqueResources().map(r => ({ value: r, label: resourceTypeLabels[r as string] || r })),
            ]}
            icon={<Filter className="w-4 h-4" />}
          />
          <SelectFilter
            value={userFilter}
            onChange={e => { setUserFilter(e.target.value); setPage(1); }}
            options={[
              { value: "all", label: "All Users" },
              ...getUniqueUsers().map(u => ({ value: u, label: u })),
            ]}
            icon={<Filter className="w-4 h-4" />}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748b]">Date range:</span>
            <input
              type="date"
              value={dateRange.from ? dateRange.from.toISOString().split("T")[0] : ""}
              onChange={e => setDateRange({ ...dateRange, from: e.target.value ? new Date(e.target.value) : undefined })}
              className="bg-[#0c0f1d] border border-[#334155] rounded-xl px-3 py-2 text-white text-sm focus:border-[#06b6d4] focus:outline-none transition-colors"
            />
            <span className="text-[#64748b]">to</span>
            <input
              type="date"
              value={dateRange.to ? dateRange.to.toISOString().split("T")[0] : ""}
              onChange={e => setDateRange({ ...dateRange, to: e.target.value ? new Date(e.target.value) : undefined })}
              className="bg-[#0c0f1d] border border-[#334155] rounded-xl px-3 py-2 text-white text-sm focus:border-[#06b6d4] focus:outline-none transition-colors"
            />
            {(dateRange.from || dateRange.to) && (
              <button
                onClick={() => setDateRange({ from: undefined, to: undefined })}
                className="text-xs text-[#06b6d4] hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-[#334155] overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#06b6d4] animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-[#334155] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#94a3b8] mb-2">No activity found</h3>
            <p className="text-[#64748b]">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#334155]/50">
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="p-4 hover:bg-[#334155]/30 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Icon & Time */}
                    <div className="flex items-start gap-3 sm:flex-shrink-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${actionColors[activity.action] || "text-[#64748b]"} bg-white/5`}>
                        {actionIcons[activity.action] || <Activity className="w-5 h-5" />}
                      </div>
                      <div className="text-right sm:text-left min-w-[100px]">
                        <p className="text-xs font-medium text-white">{formatDate(activity.createdAt)}</p>
                        <p className="text-[10px] text-[#64748b]">{formatFullDate(activity.createdAt)}</p>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {activity.user && (
                          <span className="flex items-center gap-1.5 text-sm font-medium text-white">
                            {activity.user.avatarUrl ? (
                              <img src={activity.user.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#ff4b1f] to-[#06b6d4] flex items-center justify-center text-[10px] font-bold">
                                {getInitials(activity.user.name)}
                              </div>
                            )}
                            {activity.user.name}
                          </span>
                        )}
                        {activity.resourceType && (
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-[#334155] rounded text-[#94a3b8]">
                            {resourceTypeLabels[activity.resourceType] || activity.resourceType}
                          </span>
                        )}
                        {activity.resourceName && (
                          <span className="px-2 py-0.5 text-[10px] font-mono font-medium bg-[#0c0f1d] border border-[#334155] rounded text-[#06b6d4]">
                            {activity.resourceName}
                          </span>
                        )}
                      </div>
                      <p className="text-[#94a3b8] text-sm">
                        <span className="font-medium text-white capitalize">{formatAction(activity.action)}</span>
                        {activity.resourceType && <span> {activity.resourceType}</span>}
                        {activity.resourceName && <span className="font-mono"> {`"${activity.resourceName}"`}</span>}
                      </p>

                      {/* Changes */}
                      {activity.changes && Object.keys(activity.changes).length > 0 && (
                        <details className="mt-2 group">
                          <summary className="flex items-center gap-2 text-xs text-[#64748b] hover:text-[#94a3b8] cursor-pointer">
                            <Eye className="w-3.5 h-3.5" />
                            View changes ({Object.keys(activity.changes).length})
                          </summary>
                          <div className="mt-2 ml-8 space-y-1 border-l border-[#334155] pl-3">
                            {Object.entries(activity.changes).map(([key, change]) => (
                              <div key={key} className="text-[11px] font-mono">
                                <span className="text-[#64748b]">{key}:</span>
                                <span className="text-red-400 ml-1">- {JSON.stringify(change.old)}</span>
                                <span className="text-green-400 ml-2">+ {JSON.stringify(change.new)}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}

                      {/* Metadata */}
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <details className="mt-2 group">
                          <summary className="flex items-center gap-2 text-xs text-[#64748b] hover:text-[#94a3b8] cursor-pointer">
                            <ExternalLink className="w-3.5 h-3.5" />
                            View metadata
                          </summary>
                          <div className="mt-2 ml-8 text-[11px] text-[#64748b] font-mono bg-[#0c0f1d] p-2 rounded border border-[#334155]">
                            {JSON.stringify(activity.metadata, null, 2)}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-[#334155] flex items-center justify-between">
                <p className="text-sm text-[#94a3b8]">
                  Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, total)} of {total} activities
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg text-sm bg-[#334155] border border-[#475569] text-white hover:bg-[#475569] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-3 text-sm text-[#94a3b8]">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-lg text-sm bg-[#334155] border border-[#475569] text-white hover:bg-[#475569] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SelectFilter({ value, onChange, options, icon }: { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: { value: string; label: string }[]; icon: React.ReactNode }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="w-full sm:w-48 bg-[#0c0f1d] border border-[#334155] rounded-xl px-10 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">{icon}</div>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
    </div>
  );
}

