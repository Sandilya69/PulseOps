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
  UserCheck,
  UserX,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type UserRole = "owner" | "admin" | "member" | "viewer" | "on_call_engineer";

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  lastActiveAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
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

const roleColors: Record<UserRole, string> = {
  owner: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  admin: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  member: "bg-green-500/20 text-green-400 border-green-500/30",
  viewer: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  on_call_engineer: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const roleLabels: Record<UserRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
  on_call_engineer: "On-Call",
};

const roleHierarchy: Record<UserRole, number> = {
  owner: 5,
  admin: 4,
  on_call_engineer: 3,
  member: 2,
  viewer: 1,
};

export default function TeamPage() {
  const { user, organization } = useAuthStore();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("member");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const currentUserRole = user?.role as UserRole;
  const currentUserId = user?.id;

  const canManageUsers = ["owner", "admin"].includes(currentUserRole);
  const canChangeRole = (targetRole: UserRole) => {
    if (currentUserRole === "owner") return true;
    if (currentUserRole === "admin") {
      return !["owner", "admin"].includes(targetRole);
    }
    return false;
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(roleFilter !== "all" && { role: roleFilter }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(search && { search }),
      });
      const res = await api.get<PaginatedResponse<TeamMember>>(
        `/organizations/${organization?.id}/users?${params}`
      );
      setMembers(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [page, roleFilter, statusFilter, search]);

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    const member = members.find(m => m.id === memberId);
    if (!member || !canChangeRole(member.role) || !canChangeRole(newRole)) return;

    setActionLoading(memberId);
    try {
      await api.put(
        `/organizations/${organization?.id}/users/${memberId}/role`,
        { role: newRole }
      );
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    } catch (error) {
      console.error("Failed to change role:", error);
      alert("Failed to change role. Please try again.");
    } finally {
      setActionLoading(null);
      setActiveDropdown(null);
    }
  };

  const handleDeactivate = async (memberId: string, isActive: boolean) => {
    const member = members.find(m => m.id === memberId);
    if (!member || member.id === currentUserId || member.role === "owner") return;

    setActionLoading(memberId);
    try {
      await api.put(
        `/organizations/${organization?.id}/users/${memberId}/${isActive ? "reactivate" : "deactivate"}`
      );
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, isActive: !isActive } : m));
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setActionLoading(null);
      setActiveDropdown(null);
    }
  };

  const handleRemove = async (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member || member.id === currentUserId || member.role === "owner") return;

    if (!confirm(`Are you sure you want to remove ${member.name} from the organization? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(memberId);
    try {
      await api.delete(`/organizations/${organization?.id}/users/${memberId}`);
      setMembers(prev => prev.filter(m => m.id !== memberId));
      setTotal(prev => prev - 1);
    } catch (error) {
      console.error("Failed to remove user:", error);
      alert("Failed to remove user. Please try again.");
    } finally {
      setActionLoading(null);
      setActiveDropdown(null);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviteLoading(true);
    try {
      await api.post(`/organizations/${organization?.id}/invitations`, {
        email: inviteEmail,
        role: inviteRole,
        message: inviteMessage || undefined,
      });
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteMessage("");
      fetchMembers();
    } catch (error: unknown) {
      console.error("Failed to send invitation:", error);
      const message = error instanceof Error ? error.message : "Failed to send invitation. Please try again.";
      alert(message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.post(
        `/organizations/${organization?.id}/users/export`,
        {},
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "team-members.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to export:", error);
      alert("Failed to export. Please try again.");
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-[#94a3b8] mt-1">Manage team members, roles, and invitations</p>
        </div>
        {canManageUsers && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white px-4 py-2 rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all"
          >
            <Plus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Members"
          value={total}
          icon={<Users className="w-5 h-5 text-blue-400" />}
          trend="+2 this month"
        />
        <StatCard
          title="Active (7d)"
          value={members.filter(m => m.isActive && m.lastActiveAt && new Date(m.lastActiveAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
          icon={<CheckCircle className="w-5 h-5 text-green-400" />}
          trend="75% engagement"
        />
        <StatCard
          title="Admins"
          value={members.filter(m => ["owner", "admin"].includes(m.role)).length}
          icon={<ShieldCheck className="w-5 h-5 text-purple-400" />}
          trend="2 owners/admins"
        />
        <StatCard
          title="Pending Invites"
          value={0} // Would need separate API call
          icon={<Mail className="w-5 h-5 text-orange-400" />}
          trend="Check invitations page"
        />
      </div>

      {/* Filters & Search */}
      <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl p-4 border border-[#334155]">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-10 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <SelectFilter
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
              options={[
                { value: "all", label: "All Roles" },
                { value: "owner", label: "Owner" },
                { value: "admin", label: "Admin" },
                { value: "member", label: "Member" },
                { value: "viewer", label: "Viewer" },
                { value: "on_call_engineer", label: "On-Call Engineer" },
              ]}
              icon={<Filter className="w-4 h-4" />}
            />
            <SelectFilter
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              options={[
                { value: "all", label: "All Status" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              icon={<Filter className="w-4 h-4" />}
            />
          </div>
          {canManageUsers && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#334155]/50 border border-[#475569] rounded-xl text-sm font-medium text-[#94a3b8] hover:text-white hover:border-[#06b6d4]/50 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-[#334155] overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#06b6d4] animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-[#334155] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#94a3b8] mb-2">No team members found</h3>
            <p className="text-[#64748b]">Invite your first team member to get started</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#334155] bg-[#0c0f1d]/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Member</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden md:table-cell">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden xl:table-cell">Last Active</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden xl:table-cell">Joined</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-[#64748b] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]/50">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-[#334155]/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff4b1f] to-[#06b6d4] flex items-center justify-center font-semibold text-white">
                            {member.avatarUrl ? (
                              <img src={member.avatarUrl} alt="" className="w-full h-full rounded-full" />
                            ) : (
                              getInitials(member.name)
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white">{member.name}</p>
                            {member.id === currentUserId && (
                              <span className="text-xs text-[#06b6d4] font-medium">You</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-[#94a3b8]">{member.email}</td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleColors[member.role]}`}>
                          {roleLabels[member.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.isActive
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        }`}>
                          {member.isActive ? (
                            <>
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                              Active
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden xl:table-cell text-[#94a3b8]">
                        {formatDate(member.lastActiveAt)}
                      </td>
                      <td className="px-6 py-4 hidden xl:table-cell text-[#94a3b8]">
                        {formatDate(member.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative">
                          <button
                            onClick={() => setActiveDropdown(activeDropdown === member.id ? null : member.id)}
                            className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors"
                            aria-label="More actions"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          <AnimatePresence>
                            {activeDropdown === member.id && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute right-0 top-full mt-1 w-48 bg-[#1e293b] border border-[#334155] rounded-xl shadow-lg py-1 z-50"
                              >
                                <button
                                  onClick={() => handleRoleChange(member.id, "admin")}
                                  disabled={!canChangeRole("admin") || member.role === "admin" || actionLoading === member.id}
                                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[#334155] flex items-center gap-2"
                                >
                                  <UserCheck className="w-4 h-4" /> Make Admin
                                </button>
                                <button
                                  onClick={() => handleRoleChange(member.id, "member")}
                                  disabled={!canChangeRole("member") || member.role === "member" || actionLoading === member.id}
                                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[#334155] flex items-center gap-2"
                                >
                                  <UserCheck className="w-4 h-4" /> Make Member
                                </button>
                                <button
                                  onClick={() => handleRoleChange(member.id, "viewer")}
                                  disabled={!canChangeRole("viewer") || member.role === "viewer" || actionLoading === member.id}
                                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[#334155] flex items-center gap-2"
                                >
                                  <UserCheck className="w-4 h-4" /> Make Viewer
                                </button>
                                <hr className="my-1 border-[#334155]" />
<button
                                    onClick={() => handleDeactivate(member.id, member.isActive)}
                                    disabled={member.id === currentUserId || member.role === "owner" || actionLoading === member.id}
                                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-[#334155] ${member.isActive ? "text-yellow-400" : "text-green-400"}`}
                                  >
                                  {member.isActive ? (
                                    <>
                                      <AlertCircle className="w-4 h-4" /> Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4" /> Reactivate
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleRemove(member.id)}
                                  disabled={member.id === currentUserId || member.role === "owner" || actionLoading === member.id}
                                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[#334155] flex items-center gap-2"
                                >
                                  <XCircle className="w-4 h-4" /> Remove from org
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-[#334155] flex items-center justify-between">
                <p className="text-sm text-[#94a3b8]">
                  Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} members
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

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Invite Team Member</h2>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    required
                    className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Role</label>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as UserRole)}
                    className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none"
                  >
                    <option value="member">Member - Can create/edit APIs, acknowledge incidents</option>
                    <option value="admin">Admin - Can manage users, APIs, settings</option>
                    <option value="viewer">Viewer - Read-only access to dashboards</option>
                    <option value="on_call_engineer">On-Call Engineer - Member + priority alerts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Personal Message (Optional)</label>
                  <textarea
                    value={inviteMessage}
                    onChange={e => setInviteMessage(e.target.value)}
                    placeholder="Add a personal note..."
                    rows={3}
                    className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-[#334155] border border-[#475569] text-white hover:bg-[#475569] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading || !inviteEmail.trim()}
                    className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all disabled:opacity-50"
                  >
                    {inviteLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      "Send Invitation"
                    )}
                  </button>
                </div>
              </form>
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