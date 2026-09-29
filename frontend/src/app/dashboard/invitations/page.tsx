"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/axios";
import {
  Plus,
  Mail,
  X,
  Clock,
  UserCheck,
  Loader2,
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Invitation {
  id: string;
  email: string;
  role: string;
  invitedBy: string;
  message: string | null;
  expiresAt: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  createdAt: string;
  inviter: {
    name: string;
    email: string;
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

const roleColors: Record<string, string> = {
  owner: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  admin: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  member: "bg-green-500/20 text-green-400 border-green-500/30",
  viewer: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  on_call_engineer: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
  on_call_engineer: "On-Call",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  accepted: "bg-green-500/20 text-green-400 border-green-500/30",
  expired: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  revoked: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  expired: "Expired",
  revoked: "Revoked",
};

export default function InvitationsPage() {
  const { user, organization } = useAuthStore();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const currentUserRole = user?.role;

  const canInvite = ["owner", "admin"].includes(currentUserRole || "");

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Invitation>>(
        `/organizations/${organization?.id}/invitations`
      );
      setInvitations(res.data.data);
    } catch (error) {
      console.error("Failed to fetch invitations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [organization?.id]);

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
      fetchInvitations();
    } catch (error: unknown) {
      console.error("Failed to send invitation:", error);
      const message = error instanceof Error ? error.message : "Failed to send invitation. Please try again.";
      alert(message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRevoke = async (invitationId: string) => {
    if (!confirm("Are you sure you want to revoke this invitation? The link will no longer work.")) {
      return;
    }

    setRevokingId(invitationId);
    try {
      await api.delete(`/organizations/${organization?.id}/invitations/${invitationId}`);
      fetchInvitations();
    } catch (error) {
      console.error("Failed to revoke invitation:", error);
      alert("Failed to revoke invitation. Please try again.");
    } finally {
      setRevokingId(null);
    }
  };

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(token);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Expires today";
    if (diffDays === 1) return "Expires tomorrow";
    return `Expires in ${diffDays} days`;
  };

  const formatCreatedDate = (dateStr: string) => {
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

  const pendingInvites = invitations.filter(i => i.status === "pending");
  const acceptedInvites = invitations.filter(i => i.status === "accepted");
  const expiredInvites = invitations.filter(i => i.status === "expired");
  const revokedInvites = invitations.filter(i => i.status === "revoked");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invitations</h1>
          <p className="text-[#94a3b8] mt-1">Manage team member invitations</p>
        </div>
        {canInvite && (
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
          title="Pending"
          value={pendingInvites.length}
          icon={<Mail className="w-5 h-5 text-yellow-400" />}
          trend="Awaiting response"
          color="yellow"
        />
        <StatCard
          title="Accepted"
          value={acceptedInvites.length}
          icon={<UserCheck className="w-5 h-5 text-green-400" />}
          trend="Joined team"
          color="green"
        />
        <StatCard
          title="Expired"
          value={expiredInvites.length}
          icon={<Clock className="w-5 h-5 text-gray-400" />}
          trend="Past 30 days"
          color="gray"
        />
        <StatCard
          title="Revoked"
          value={revokedInvites.length}
          icon={<X className="w-5 h-5 text-red-400" />}
          trend="Cancelled"
          color="red"
        />
      </div>

      {/* Tabs */}
      <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-[#334155] overflow-hidden">
        <div className="flex border-b border-[#334155] overflow-x-auto">
          {[
            { key: "all", label: "All", count: invitations.length },
            { key: "pending", label: "Pending", count: pendingInvites.length },
            { key: "accepted", label: "Accepted", count: acceptedInvites.length },
            { key: "expired", label: "Expired", count: expiredInvites.length },
            { key: "revoked", label: "Revoked", count: revokedInvites.length },
          ].map((tab) => (
            <button
              key={tab.key}
              className="px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
            >
              <span className="flex items-center gap-2">
                {tab.label}
                <span className="px-2 py-0.5 text-xs bg-[#334155] rounded-full">{tab.count}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="p-4">
          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#06b6d4] animate-spin" />
            </div>
          ) : invitations.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="w-12 h-12 text-[#334155] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#94a3b8] mb-2">No invitations yet</h3>
              <p className="text-[#64748b] mb-6">Invite your first team member to get started</p>
              {canInvite && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white px-4 py-2 rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Invite Member
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <motion.div
                  key={invitation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0c0f1d]/50 border border-[#334155] rounded-xl p-4 hover:border-[#06b6d4]/30 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff4b1f] to-[#06b6d4] flex items-center justify-center font-semibold text-white">
                        <Mail className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{invitation.email}</p>
                        <p className="text-sm text-[#94a3b8]">Invited by {invitation.inviter.name} · {formatCreatedDate(invitation.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleColors[invitation.role]}`}>
                        {roleLabels[invitation.role]}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[invitation.status]}`}>
                        {statusLabels[invitation.status]}
                      </span>

                      {invitation.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleCopyLink(invitation.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#94a3b8] hover:text-white hover:bg-[#334155] rounded-lg transition-colors"
                            title="Copy invitation link"
                          >
                            <Copy className="w-4 h-4" />
                            <span>Copy Link</span>
                          </button>
                          <button
                            onClick={() => handleRevoke(invitation.id)}
                            disabled={revokingId === invitation.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                            <span>Revoke</span>
                          </button>
                        </>
                      )}

                      {invitation.status === "accepted" && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-green-400 bg-green-500/10 rounded-lg">
                          <CheckCircle className="w-4 h-4" />
                          <span>Joined</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {invitation.message && (
                    <div className="mt-4 pt-4 border-t border-[#334155]">
                      <p className="text-sm text-[#94a3b8] italic">{"{invitation.message}"}</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-[#334155] flex flex-wrap items-center gap-4 text-sm text-[#64748b]">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(invitation.expiresAt)}
                    </span>
                    {invitation.status === "pending" && (
                      <button
                        onClick={() => handleCopyLink(invitation.id)}
                        className="flex items-center gap-1.5 text-[#06b6d4] hover:text-[#06b6d4]/80"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open invitation link
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
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
                  <X className="w-5 h-5" />
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
                    onChange={e => setInviteRole(e.target.value)}
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

function StatCard({ title, value, icon, trend, color }: { title: string; value: number; icon: React.ReactNode; trend: string; color: string }) {
  const colorMap: Record<string, string> = {
    yellow: "text-yellow-400",
    green: "text-green-400",
    gray: "text-gray-400",
    red: "text-red-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
  };

  return (
    <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl p-5 border border-[#334155] hover:border-[#06b6d4]/30 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">{title}</p>
          <p className="text-3xl font-black tracking-tight text-white">{value}</p>
          <p className="text-xs text-[#64748b] mt-1">{trend}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-[#0c0f1d]/50 border border-[#334155] flex items-center justify-center">
          <span className={colorMap[color]}>{icon}</span>
        </div>
      </div>
    </div>
  );
}