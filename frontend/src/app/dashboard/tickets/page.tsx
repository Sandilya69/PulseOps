"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/axios";
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  MoreVertical,
  Mail,
  MessageSquare,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Flag,
  ArrowLeft,
  Send,
  Paperclip,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type TicketStatus = "open" | "in_progress" | "waiting_on_user" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "critical";
type TicketCategory = "bug" | "feature_request" | "technical_support" | "billing" | "general";

interface TicketMessage {
  id: string;
  message: string;
  isInternal: boolean;
  isSystemMessage: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    role: string;
  };
}

interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  creator: {
    id: string;
    name: string;
    avatarUrl: string | null;
    email: string;
  };
  assignee: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
  messages: TicketMessage[];
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

const statusColors: Record<TicketStatus, string> = {
  open: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  waiting_on_user: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const statusLabels: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting_on_user: "Waiting on User",
  resolved: "Resolved",
  closed: "Closed",
};

const priorityColors: Record<TicketPriority, string> = {
  low: "bg-gray-500/20 text-gray-400",
  medium: "bg-blue-500/20 text-blue-400",
  high: "bg-orange-500/20 text-orange-400",
  critical: "bg-red-500/20 text-red-400",
};

const priorityLabels: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const categoryLabels: Record<TicketCategory, string> = {
  bug: "Bug Report",
  feature_request: "Feature Request",
  technical_support: "Technical Support",
  billing: "Billing",
  general: "General",
};

export default function TicketsPage() {
  const { user, organization } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "all">("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    category: "technical_support" as TicketCategory,
    priority: "medium" as TicketPriority,
    tags: "",
  });
  const [creating, setCreating] = useState(false);

  const currentUserRole = user?.role;
  const currentUserId = user?.id;
  const canViewAll = ["owner", "admin"].includes(currentUserRole || "");

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(priorityFilter !== "all" && { priority: priorityFilter }),
        ...(search && { search }),
      });
      const res = await api.get<PaginatedResponse<Ticket>>(
        `/organizations/${organization?.id}/tickets?${params}`
      );
      setTickets(res.data.data);
      setTotal(res.data.total);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [page, statusFilter, priorityFilter, search]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.description.trim()) return;

    setCreating(true);
    try {
      await api.post(`/organizations/${organization?.id}/tickets`, {
        title: createForm.title,
        description: createForm.description,
        category: createForm.category,
        priority: createForm.priority,
        tags: createForm.tags.split(",").map(t => t.trim()).filter(Boolean),
      });
      setShowCreateModal(false);
      setCreateForm({ title: "", description: "", category: "technical_support", priority: "medium", tags: "" });
      fetchTickets();
    } catch (error) {
      console.error("Failed to create ticket:", error);
      alert("Failed to create ticket. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleViewTicket = async (ticketNumber: string) => {
    try {
      const res = await api.get<Ticket>(`/organizations/${organization?.id}/tickets/${ticketNumber}`);
      setSelectedTicket(res.data);
    } catch (error) {
      console.error("Failed to fetch ticket:", error);
      alert("Failed to load ticket details.");
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    setSendingMessage(true);
    try {
      await api.post(
        `/organizations/${organization?.id}/tickets/${selectedTicket.id}/messages`,
        { message: newMessage, isInternal: false }
      );
      setNewMessage("");
      // Refresh ticket
      const res = await api.get<Ticket>(`/organizations/${organization?.id}/tickets/${selectedTicket.ticketNumber}`);
      setSelectedTicket(res.data);
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    try {
      await api.put(
        `/organizations/${organization?.id}/tickets/${selectedTicket.id}/status`,
        { status: newStatus }
      );
      const res = await api.get<Ticket>(`/organizations/${organization?.id}/tickets/${selectedTicket.ticketNumber}`);
      setSelectedTicket(res.data);
      fetchTickets();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString();
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const availableStatuses: TicketStatus[] = ["open", "in_progress", "waiting_on_user", "resolved", "closed"];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-[#94a3b8] mt-1">Track and manage support requests</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white px-4 py-2 rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          title="Total"
          value={total}
          icon={<Mail className="w-5 h-5 text-blue-400" />}
          trend="All tickets"
        />
        <StatCard
          title="Open"
          value={tickets.filter(t => t.status === "open").length}
          icon={<AlertCircle className="w-5 h-5 text-blue-400" />}
          trend="Needs attention"
        />
        <StatCard
          title="In Progress"
          value={tickets.filter(t => t.status === "in_progress").length}
          icon={<MessageSquare className="w-5 h-5 text-yellow-400" />}
          trend="Being worked on"
        />
        <StatCard
          title="Resolved"
          value={tickets.filter(t => t.status === "resolved").length}
          icon={<CheckCircle className="w-5 h-5 text-green-400" />}
          trend="This month"
        />
        <StatCard
          title="Critical"
          value={tickets.filter(t => t.priority === "critical").length}
          icon={<Flag className="w-5 h-5 text-red-400" />}
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
              placeholder="Search tickets..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-10 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <SelectFilter
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value as TicketStatus | "all"); setPage(1); }}
              options={[
                { value: "all", label: "All Status" },
                { value: "open", label: "Open" },
                { value: "in_progress", label: "In Progress" },
                { value: "waiting_on_user", label: "Waiting on User" },
                { value: "resolved", label: "Resolved" },
                { value: "closed", label: "Closed" },
              ]}
              icon={<Filter className="w-4 h-4" />}
            />
            <SelectFilter
              value={priorityFilter}
              onChange={e => { setPriorityFilter(e.target.value as TicketPriority | "all"); setPage(1); }}
              options={[
                { value: "all", label: "All Priority" },
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

      {/* Tickets List */}
      <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-[#334155] overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#06b6d4] animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-12 h-12 text-[#334155] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#94a3b8] mb-2">No tickets found</h3>
            <p className="text-[#64748b] mb-6">Create your first support ticket</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white px-4 py-2 rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all"
            >
              <Plus className="w-4 h-4" />
              New Ticket
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#334155] bg-[#0c0f1d]/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Ticket</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden md:table-cell">Title</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden xl:table-cell">Created By</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden xl:table-cell">Created</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden xl:table-cell">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]/50">
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="hover:bg-[#334155]/30 transition-colors cursor-pointer"
                      onClick={() => handleViewTicket(ticket.ticketNumber)}
                    >
                      <td className="px-6 py-4 font-mono text-sm font-semibold text-[#06b6d4]">
                        {ticket.ticketNumber}
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="font-medium text-white truncate max-w-xs">{ticket.title}</p>
                        <p className="text-sm text-[#64748b] truncate max-w-xs">{ticket.description}</p>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-sm text-[#94a3b8]">
                        {categoryLabels[ticket.category]}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[ticket.priority]}`}>
                          {priorityLabels[ticket.priority]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[ticket.status]}`}>
                          {statusLabels[ticket.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden xl:table-cell text-sm text-[#94a3b8]">
                        {ticket.creator.name}
                      </td>
                      <td className="px-6 py-4 hidden xl:table-cell text-sm text-[#64748b]">
                        {formatDate(ticket.createdAt)}
                      </td>
                      <td className="px-6 py-4 hidden xl:table-cell text-sm text-[#64748b]">
                        {formatDate(ticket.updatedAt)}
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
                  Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} tickets
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

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Create Support Ticket</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Title</label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder="Brief description of the issue"
                    required
                    className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Description</label>
                  <textarea
                    value={createForm.description}
                    onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Provide details about the issue, steps to reproduce, expected behavior, etc."
                    rows={5}
                    required
                    className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Category</label>
                    <select
                      value={createForm.category}
                      onChange={e => setCreateForm({ ...createForm, category: e.target.value as TicketCategory })}
                      className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none"
                    >
                      <option value="bug">Bug Report</option>
                      <option value="feature_request">Feature Request</option>
                      <option value="technical_support">Technical Support</option>
                      <option value="billing">Billing</option>
                      <option value="general">General Inquiry</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Priority</label>
                    <select
                      value={createForm.priority}
                      onChange={e => setCreateForm({ ...createForm, priority: e.target.value as TicketPriority })}
                      className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={createForm.tags}
                    onChange={e => setCreateForm({ ...createForm, tags: e.target.value })}
                    placeholder="e.g., alerts, email, urgent"
                    className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-[#334155] border border-[#475569] text-white hover:bg-[#475569] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !createForm.title.trim() || !createForm.description.trim()}
                    className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all disabled:opacity-50"
                  >
                    {creating ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      "Create Ticket"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ticket Detail Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedTicket(null)}
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
                    onClick={() => setSelectedTicket(null)}
                    className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-[#06b6d4]">{selectedTicket.ticketNumber}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${priorityColors[selectedTicket.priority]}`}>
                        {priorityLabels[selectedTicket.priority]}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[selectedTicket.status]}`}>
                        {statusLabels[selectedTicket.status]}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mt-1">{selectedTicket.title}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canViewAll && (
                    <select
                      value={selectedTicket.status}
                      onChange={e => handleStatusChange(e.target.value as TicketStatus)}
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
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Description</h4>
                    <span className="text-xs text-[#64748b]">{categoryLabels[selectedTicket.category]}</span>
                  </div>
                  <p className="text-[#94a3b8] whitespace-pre-wrap">{selectedTicket.description}</p>
                  {selectedTicket.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedTicket.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 text-xs bg-[#334155] rounded text-[#94a3b8]">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div>
                  <h4 className="font-semibold mb-4">Conversation</h4>
                  <div className="space-y-4">
                    {selectedTicket.messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${msg.isInternal ? "border-l-2 border-yellow-500/50 pl-4 ml-4" : ""}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff4b1f] to-[#06b6d4] flex items-center justify-center font-semibold text-white flex-shrink-0">
                          {msg.user.avatarUrl ? (
                            <img src={msg.user.avatarUrl} alt="" className="w-full h-full rounded-full" />
                          ) : (
                            getInitials(msg.user.name)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white">{msg.user.name}</span>
                            <span className="text-xs text-[#64748b]">{formatTime(msg.createdAt)}</span>
                            {msg.isInternal && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-yellow-500/20 text-yellow-400 rounded">Internal</span>
                            )}
                            {msg.isSystemMessage && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/20 text-blue-400 rounded">System</span>
                            )}
                          </div>
                          <p className="text-[#94a3b8] whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* New Message Input */}
                <div className="border-t border-[#334155] pt-6">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff4b1f] to-[#06b6d4] flex items-center justify-center font-semibold text-white flex-shrink-0">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full" />
                      ) : (
                        getInitials(user?.name || "")
                      )}
                    </div>
                    <div className="flex-1 flex gap-2">
                      <textarea
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type your response..."
                        rows={3}
                        className="flex-1 bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-3 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors resize-none"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={sendingMessage || !newMessage.trim()}
                        className="px-4 py-3 bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white rounded-xl font-medium hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        {sendingMessage ? "Sending..." : "Send"}
                      </button>
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