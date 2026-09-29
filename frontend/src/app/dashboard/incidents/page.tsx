"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/axios";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Send,
  MoreVertical,
  X,
  ChevronDown,
  User,
  AlertTriangle,
  Zap,
  Search,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type IncidentStatus = "triggered" | "acknowledged" | "investigating" | "resolved" | "closed";
type IncidentSeverity = "critical" | "high" | "medium" | "low";

interface TimelineEvent {
  id: string;
  incidentId: string;
  actorId: string | null;
  eventType: string;
  content: string;
  isPublic: boolean;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    avatarUrl: string | null;
    role: string;
  };
}

interface Incident {
  id: string;
  orgId: string;
  apiId: string | null;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  triggeredAt: string;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  rootCause: string | null;
  createdAt: string;
  updatedAt: string;
  api?: {
    id: string;
    name: string;
  };
  acknowledger?: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
  resolver?: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
  timeline: TimelineEvent[];
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

const statusColors: Record<IncidentStatus, string> = {
  triggered: "bg-red-500/20 text-red-400 border-red-500/30",
  acknowledged: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  investigating: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const statusLabels: Record<IncidentStatus, string> = {
  triggered: "Triggered",
  acknowledged: "Acknowledged",
  investigating: "Investigating",
  resolved: "Resolved",
  closed: "Closed",
};

const severityColors: Record<IncidentSeverity, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const severityLabels: Record<IncidentSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const eventTypeIcons: Record<string, React.ReactNode> = {
  status_change: <AlertCircle className="w-4 h-4" />,
  note_added: <MessageSquare className="w-4 h-4" />,
  user_notified: <User className="w-4 h-4" />,
  user_acknowledged: <CheckCircle className="w-4 h-4" />,
  runbook_attached: <AlertTriangle className="w-4 h-4" />,
};

const eventTypeColors: Record<string, string> = {
  status_change: "text-red-400",
  note_added: "text-blue-400",
  user_notified: "text-yellow-400",
  user_acknowledged: "text-green-400",
  runbook_attached: "text-purple-400",
};

export default function IncidentsPage() {
  const { user, organization } = useAuthStore();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | "all">("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [newNote, setNewNote] = useState("");
  const [isPublicNote, setIsPublicNote] = useState(false);
  const [sendingNote, setSendingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const currentUserId = user?.id;
  const currentUserRole = user?.role;

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(severityFilter !== "all" && { severity: severityFilter }),
        ...(search && { search }),
      });
      const res = await api.get<PaginatedResponse<Incident>>(
        `/organizations/${organization?.id}/incidents?${params}`
      );
      setIncidents(res.data.data);
      setTotal(res.data.pagination.total);
    } catch (error) {
      console.error("Failed to fetch incidents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [page, statusFilter, severityFilter, search]);

  const handleViewIncident = async (incidentId: string) => {
    try {
      const res = await api.get<Incident>(`/organizations/${organization?.id}/incidents/${incidentId}`);
      setSelectedIncident(res.data);
    } catch (error) {
      console.error("Failed to fetch incident:", error);
      alert("Failed to load incident details.");
    }
  };

  const handleStatusChange = async (newStatus: IncidentStatus) => {
    if (!selectedIncident) return;
    setUpdatingStatus(selectedIncident.id);
    try {
      await api.patch(
        `/organizations/${organization?.id}/incidents/${selectedIncident.id}/${newStatus}`,
        {}
      );
      const res = await api.get<Incident>(`/organizations/${organization?.id}/incidents/${selectedIncident.id}`);
      setSelectedIncident(res.data);
      fetchIncidents();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedIncident) return;
    setSendingNote(true);
    try {
      await api.post(
        `/organizations/${organization?.id}/incidents/${selectedIncident.id}/notes`,
        { content: newNote, isPublic: isPublicNote }
      );
      setNewNote("");
      const res = await api.get<Incident>(`/organizations/${organization?.id}/incidents/${selectedIncident.id}`);
      setSelectedIncident(res.data);
    } catch (error) {
      console.error("Failed to add note:", error);
      alert("Failed to add note. Please try again.");
    } finally {
      setSendingNote(false);
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

  const getTimeToAcknowledge = (incident: Incident) => {
    if (!incident.acknowledgedAt) return null;
    const diff = new Date(incident.acknowledgedAt).getTime() - new Date(incident.triggeredAt).getTime();
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 1) return "< 1 min";
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}min`;
  };

  const getTimeToResolve = (incident: Incident) => {
    if (!incident.resolvedAt) return null;
    const diff = new Date(incident.resolvedAt).getTime() - new Date(incident.triggeredAt).getTime();
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 1) return "< 1 min";
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}min`;
  };

  const availableStatuses: IncidentStatus[] = ["triggered", "acknowledged", "investigating", "resolved", "closed"];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
          <p className="text-[#94a3b8] mt-1">Track, acknowledge, and collaborate on incidents</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          title="Active"
          value={incidents.filter(i => !["resolved", "closed"].includes(i.status)).length}
          icon={<AlertCircle className="w-5 h-5 text-red-400" />}
          trend="Needs attention"
        />
        <StatCard
          title="Acknowledged"
          value={incidents.filter(i => i.status === "acknowledged").length}
          icon={<CheckCircle className="w-5 h-5 text-yellow-400" />}
          trend="In progress"
        />
        <StatCard
          title="Investigating"
          value={incidents.filter(i => i.status === "investigating").length}
          icon={<Zap className="w-5 h-5 text-blue-400" />}
          trend="Being analyzed"
        />
        <StatCard
          title="Resolved"
          value={incidents.filter(i => i.status === "resolved").length}
          icon={<CheckCircle className="w-5 h-5 text-green-400" />}
          trend="This month"
        />
        <StatCard
          title="Critical"
          value={incidents.filter(i => i.severity === "critical").length}
          icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
          trend="Urgent"
        />
      </div>

      {/* Filters & Search */}
      <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl p-4 border border-[#334155]">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-10 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <SelectFilter
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value as IncidentStatus | "all"); setPage(1); }}
              options={[
                { value: "all", label: "All Status" },
                { value: "triggered", label: "Triggered" },
                { value: "acknowledged", label: "Acknowledged" },
                { value: "investigating", label: "Investigating" },
                { value: "resolved", label: "Resolved" },
                { value: "closed", label: "Closed" },
              ]}
              icon={<Filter className="w-4 h-4" />}
            />
            <SelectFilter
              value={severityFilter}
              onChange={e => { setSeverityFilter(e.target.value as IncidentSeverity | "all"); setPage(1); }}
              options={[
                { value: "all", label: "All Severity" },
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

      {/* Incidents List */}
      <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-[#334155] overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#06b6d4] animate-spin" />
          </div>
        ) : incidents.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-[#334155] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#94a3b8] mb-2">No incidents found</h3>
            <p className="text-[#64748b]">All systems operational!</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#334155] bg-[#0c0f1d]/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Incident</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden md:table-cell">API</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Severity</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">Triggered</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden xl:table-cell">MTTA</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden xl:table-cell">MTTR</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden xl:table-cell">Acknowledged By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]/50">
                  {incidents.map((incident) => (
                    <tr
                      key={incident.id}
                      className="hover:bg-[#334155]/30 transition-colors cursor-pointer"
                      onClick={() => handleViewIncident(incident.id)}
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-white truncate max-w-xs">{incident.title}</p>
                        <p className="text-sm text-[#64748b] truncate max-w-xs">{incident.description}</p>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-sm text-[#94a3b8]">
                        {incident.api?.name || "Manual"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${severityColors[incident.severity]}`}>
                          {severityLabels[incident.severity]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[incident.status]}`}>
                          {statusLabels[incident.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-sm text-[#94a3b8]">
                        {formatDate(incident.triggeredAt)}
                      </td>
                      <td className="px-6 py-4 hidden xl:table-cell text-sm font-mono text-[#06b6d4]">
                        {getTimeToAcknowledge(incident) || "—"}
                      </td>
                      <td className="px-6 py-4 hidden xl:table-cell text-sm font-mono text-green-400">
                        {getTimeToResolve(incident) || "—"}
                      </td>
                      <td className="px-6 py-4 hidden xl:table-cell text-sm text-[#94a3b8]">
                        {incident.acknowledger?.name || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > 20 && (
              <div className="px-6 py-4 border-t border-[#334155] flex items-center justify-between">
                <p className="text-sm text-[#94a3b8]">
                  Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} incidents
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg text-sm bg-[#334155] border border-[#475569] text-white hover:bg-[#475569] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * 20 >= total}
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

      {/* Incident Detail Modal */}
      <AnimatePresence>
        {selectedIncident && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedIncident(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1e293b] border border-[#334155] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-[#334155}">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedIncident(null)}
                    className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${severityColors[selectedIncident.severity]}`}>
                        {severityLabels[selectedIncident.severity]}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[selectedIncident.status]}`}>
                        {statusLabels[selectedIncident.status]}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mt-1">{selectedIncident.title}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {["owner", "admin", "member", "on_call_engineer"].includes(currentUserRole || "") && (
                    <select
                      value={selectedIncident.status}
                      onChange={e => handleStatusChange(e.target.value as IncidentStatus)}
                      disabled={updatingStatus === selectedIncident.id}
                      className="bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none text-sm"
                    >
                      {availableStatuses.map(s => (
                        <option key={s} value={s}>{statusLabels[s]}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Description */}
                <div className="bg-[#0c0f1d]/50 border border-[#334155] rounded-xl p-5">
                  <p className="text-[#94a3b8] whitespace-pre-wrap">{selectedIncident.description}</p>
                  {selectedIncident.rootCause && (
                    <div className="mt-4 pt-4 border-t border-[#334155]">
                      <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Root Cause</p>
                      <p className="text-[#94a3b8]">{selectedIncident.rootCause}</p>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#0c0f1d]/50 border border-[#334155] rounded-xl p-4">
                    <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Triggered</p>
                    <p className="font-mono text-sm text-white">{formatFullDate(selectedIncident.triggeredAt)}</p>
                  </div>
                  <div className="bg-[#0c0f1d]/50 border border-[#334155] rounded-xl p-4">
                    <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">MTTA</p>
                    <p className="font-mono text-sm text-[#06b6d4]">{getTimeToAcknowledge(selectedIncident) || "Not acknowledged"}</p>
                  </div>
                  <div className="bg-[#0c0f1d]/50 border border-[#334155] rounded-xl p-4">
                    <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">MTTR</p>
                    <p className="font-mono text-sm text-green-400">{getTimeToResolve(selectedIncident) || "Not resolved"}</p>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="font-semibold text-white mb-4">Timeline</h4>
                  <div className="space-y-4">
                    {selectedIncident.timeline.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex gap-3"
                      >
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${eventTypeColors[event.eventType] || "text-[#64748b]"} bg-white/5`}>
                            {eventTypeIcons[event.eventType] || <MessageSquare className="w-4 h-4" />}
                          </div>
                          <div className="w-px h-full bg-[#334155] mt-1" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {event.actor && (
                              <span className="font-medium text-white">
                                {event.actor.avatarUrl ? (
                                  <img src={event.actor.avatarUrl} alt="" className="w-5 h-5 rounded-full inline-block mr-1" />
                                ) : (
                                  <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#ff4b1f] to-[#06b6d4] flex items-center justify-center text-[10px] font-bold inline-block mr-1">
                                    {getInitials(event.actor.name)}
                                  </span>
                                )}
                                {event.actor.name}
                              </span>
                            )}
                            <span className="text-xs text-[#64748b]">{formatFullDate(event.createdAt)}</span>
                            {event.isPublic && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-500/20 text-green-400 rounded">Public</span>
                            )}
                          </div>
                          <p className="text-[#94a3b8] whitespace-pre-wrap">{event.content}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Add Note */}
                <div className="border-t border-[#334155] pt-6">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff4b1f] to-[#06b6d4] flex items-center justify-center font-semibold text-white flex-shrink-0">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full" />
                      ) : (
                        getInitials(user?.name || "")
                      )}
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <textarea
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        placeholder="Add a note to the incident timeline..."
                        rows={3}
                        className="bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-3 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm text-[#94a3b8] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isPublicNote}
                            onChange={e => setIsPublicNote(e.target.checked)}
                            className="w-4 h-4 rounded border-[#334155] text-[#06b6d4] focus:ring-[#06b6d4]"
                          />
                          Post as public (visible on status page)
                        </label>
                        <button
                          onClick={handleAddNote}
                          disabled={sendingNote || !newNote.trim()}
                          className="px-4 py-2 bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white rounded-xl font-medium hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all disabled:opacity-50"
                        >
                          {sendingNote ? "Posting..." : "Add Note"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string; value: number; icon: React.ReactNode; trend: string }) {
  return (
    <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl p-5 border border-[#334155] hover:border-[#06b6d4]/30 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">{title}</p>
          <p className="text-3xl font-black tracking-tight text-white">{value}</p>
          <p className="text-xs text-[#64748b] mt-1">{trend}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-[#0c0f1d]/50 border border-[#334155] flex items-center justify-center">
          {icon}
        </div>
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
        className="w-full sm:w-40 bg-[#0c0f1d] border border-[#334155] rounded-xl px-10 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none"
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