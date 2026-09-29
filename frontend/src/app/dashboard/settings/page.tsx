"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/axios";
import {
  Loader2,
  Save,
  Building2,
  Globe,
  Building,
  Users,
  CreditCard,
  Shield,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Image,
  Camera,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  logoUrl: string | null;
  website: string | null;
  industry: string | null;
  companySize: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
  stripeCustomerId: string | null;
  billingEmail: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    supportTickets: number;
    contacts: number;
  };
}

const tierColors: Record<string, string> = {
  free: "bg-gray-500/20 text-gray-400",
  pro: "bg-blue-500/20 text-blue-400",
  team: "bg-purple-500/20 text-purple-400",
  enterprise: "bg-yellow-500/20 text-yellow-400",
};

const tierLabels: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  team: "Team",
  enterprise: "Enterprise",
};

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  canceled: "bg-red-500/20 text-red-400",
  past_due: "bg-orange-500/20 text-orange-400",
  trialing: "bg-blue-500/20 text-blue-400",
};

const industryOptions = [
  "technology", "fintech", "healthcare", "ecommerce", "education",
  "manufacturing", "real_estate", "media", "consulting", "other"
];

const sizeOptions = [
  "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"
];

export default function SettingsPage() {
  const { user, organization } = useAuthStore();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "billing" | "danger">("general");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const currentUserRole = user?.role;
  const isOwner = currentUserRole === "owner";
  const canManageBilling = isOwner;
  const canDeleteOrg = isOwner;

  const fetchOrg = async () => {
    setLoading(true);
    try {
      const res = await api.get<Organization>(`/organizations/${organization?.id}`);
      setOrg(res.data);
      if (res.data.logoUrl) setLogoPreview(res.data.logoUrl);
    } catch (error) {
      console.error("Failed to fetch organization:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrg();
  }, [organization?.id]);

  const handleSave = async () => {
    if (!org) return;
    setSaving(true);
    try {
      await api.put(`/organizations/${organization?.id}`, {
        name: org.name,
        logoUrl: org.logoUrl,
        website: org.website,
        industry: org.industry,
        companySize: org.companySize,
        billingEmail: org.billingEmail,
      });
      alert("Organization settings saved successfully!");
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real app, you'd upload to your storage service
    // For now, we'll use a data URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
      setOrg(prev => prev ? { ...prev, logoUrl: reader.result as string } : null);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteOrg = async () => {
    if (deleteConfirm !== org?.name) return;
    setDeleting(true);
    try {
      await api.delete(`/organizations/${organization?.id}`);
      alert("Organization deleted successfully.");
      // Redirect to login or signup
      window.location.href = "/login";
    } catch (error) {
      console.error("Failed to delete organization:", error);
      alert("Failed to delete organization. Please try again.");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString([], {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#06b6d4] animate-spin" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="text-center p-12">
        <Building2 className="w-12 h-12 text-[#334155] mx-auto mb-4" />
        <h3 className="text-lg font-medium text-[#94a3b8] mb-2">Organization not found</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
        <p className="text-[#94a3b8] mt-1">Manage your organization details, billing, and security</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1e293b]/50 backdrop-blur-sm rounded-xl p-1 border border-[#334155]">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "general"
              ? "bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white shadow-[0_0_20px_rgba(255,75,31,0.3)]"
              : "text-[#94a3b8] hover:text-white"
          }`}
        >
          <Building2 className="w-4 h-4 inline mr-2" />
          General
        </button>
        <button
          onClick={() => setActiveTab("billing")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "billing"
              ? "bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white shadow-[0_0_20px_rgba(255,75,31,0.3)]"
              : "text-[#94a3b8] hover:text-white"
          }`}
          disabled={!canManageBilling}
        >
          <CreditCard className="w-4 h-4 inline mr-2" />
          Billing
        </button>
        {canDeleteOrg && (
          <button
            onClick={() => setActiveTab("danger")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "danger"
                ? "bg-red-500/20 text-red-400"
                : "text-[#94a3b8] hover:text-red-400"
            }`}
          >
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            Danger Zone
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-[#334155] overflow-hidden">
        {/* General Tab */}
        <AnimatePresence mode="wait">
          {activeTab === "general" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 space-y-6"
            >
              {/* Logo */}
              <div className="flex items-center gap-6 p-4 bg-[#0c0f1d]/50 rounded-xl border border-[#334155]">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#334155] flex items-center justify-center">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-10 h-10 text-[#64748b]" />
                  )}
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                    <Camera className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Organization Logo</h3>
                  <p className="text-sm text-[#64748b]">Recommended: 200x200px, PNG or JPG, max 2MB</p>
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Organization Name</label>
                    <input
                      type="text"
                      value={org.name}
                      onChange={e => setOrg({ ...org, name: e.target.value })}
                      className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Website</label>
                    <input
                      type="url"
                      value={org.website || ""}
                      onChange={e => setOrg({ ...org, website: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Industry</label>
                    <select
                      value={org.industry || ""}
                      onChange={e => setOrg({ ...org, industry: e.target.value })}
                      className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none"
                    >
                      <option value="">Select industry</option>
                      {industryOptions.map(opt => (
                        <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1).replace("_", " ")}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Company Size</label>
                    <select
                      value={org.companySize || ""}
                      onChange={e => setOrg({ ...org, companySize: e.target.value })}
                      className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none"
                    >
                      <option value="">Select size</option>
                      {sizeOptions.map(opt => (
                        <option key={opt} value={opt}>{opt} employees</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Billing Email</label>
                    <input
                      type="email"
                      value={org.billingEmail || ""}
                      onChange={e => setOrg({ ...org, billingEmail: e.target.value })}
                      placeholder="billing@example.com"
                      className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Organization Details */}
              <div className="space-y-4 pt-4 border-t border-[#334155]">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Organization Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailRow label="Organization ID" value={org.id} />
                  <DetailRow label="Slug" value={org.slug} />
                  <DetailRow label="Owner" value={user?.id === org.ownerId ? `${user.name} (You)` : "Another user"} />
                  <DetailRow label="Created" value={formatDate(org.createdAt)} />
                  <DetailRow label="Team Members" value={org._count.users.toString()} />
                  <DetailRow label="Support Tickets" value={org._count.supportTickets.toString()} />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-[#334155] flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Billing Tab */}
          {activeTab === "billing" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Subscription
                  </h3>
                  <p className="text-sm text-[#64748b] mt-1">Manage your organization&apos;s subscription plan</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${tierColors[org.subscriptionTier]}`}>
                  {tierLabels[org.subscriptionTier] || org.subscriptionTier}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#0c0f1d]/50 rounded-xl border border-[#334155]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#64748b">Status</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[org.subscriptionStatus]}`}>
                      {org.subscriptionStatus.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-white">${org.subscriptionTier === "free" ? "0" : org.subscriptionTier === "pro" ? "10" : org.subscriptionTier === "team" ? "50" : "Custom"}</p>
                  <p className="text-sm text-[#64748b">/month</p>
                </div>
                <div className="p-4 bg-[#0c0f1d]/50 rounded-xl border border-[#334155]">
                  <span className="text-sm text-[#64748b">Next Billing Date</span>
                  <p className="text-lg font-bold text-white mt-1">—</p>
                  <p className="text-sm text-[#64748b">Estimated: $0.00</p>
                </div>
              </div>

              <div className="p-4 bg-[#0c0f1d]/50 rounded-xl border border-[#334155]">
                <h4 className="font-medium text-white mb-2">Usage vs Limits</h4>
                <div className="space-y-3">
                  <UsageBar label="Team Members" used={org._count.users} limit={org.subscriptionTier === "free" ? 1 : org.subscriptionTier === "pro" ? 5 : 999} />
                  <UsageBar label="APIs Monitored" used={0} limit={org.subscriptionTier === "free" ? 5 : org.subscriptionTier === "pro" ? 50 : 999} />
                  <UsageBar label="Projects" used={0} limit={org.subscriptionTier === "free" ? 1 : org.subscriptionTier === "pro" ? 5 : 999} />
                </div>
              </div>

              <button className="w-full px-4 py-2.5 bg-[#334155] border border-[#475569] rounded-xl font-medium text-white hover:bg-[#475569] transition-colors">
                Manage Subscription →
              </button>
            </motion.div>
          )}

          {/* Danger Zone Tab */}
          {activeTab === "danger" && canDeleteOrg && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 space-y-6 border-t border-red-500/30"
            >
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-300">Danger Zone</h3>
                  <p className="text-sm text-red-400/80 mt-1">Irreversible actions that permanently delete data</p>
                </div>
              </div>

              <div className="p-4 bg-[#0c0f1d]/50 rounded-xl border border-[#334155]">
                <h4 className="font-medium text-white mb-2">Delete Organization</h4>
                <p className="text-sm text-[#94a3b8] mb-4">
                  Permanently delete this organization and all associated data including:
                </p>
                <ul className="text-sm text-[#64748b] space-y-1 mb-4 pl-4 list-disc">
                  <li>All team members and their data</li>
                  <li>All monitored APIs and check history</li>
                  <li>All incidents and timeline events</li>
                  <li>All support tickets and messages</li>
                  <li>All activity logs</li>
                  <li>All integrations and contacts</li>
                </ul>
                <p className="text-sm text-red-400 font-medium mb-4">
                  This action cannot be undone. All data will be permanently lost.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                      Type the organization name to confirm: <strong>{org.name}</strong>
                    </label>
                    <input
                      type="text"
                      value={deleteConfirm}
                      onChange={e => setDeleteConfirm(e.target.value)}
                      placeholder={org.name}
                      className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-red-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={deleting || deleteConfirm !== org.name}
                    className="w-full px-4 py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Delete Organization Permanently"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1e293b] border border-red-500/30 rounded-2xl p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-red-300">Delete Organization?</h2>
              </div>

              <p className="text-[#94a3b8] mb-6">
                This will permanently delete <strong className="text-white">{org?.name}</strong> and all its data.
                This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-[#334155] border border-[#475569] text-white hover:bg-[#475569] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteOrg}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete Forever"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-[#0c0f1d]/50 rounded-xl border border-[#334155]">
      <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">{label}</p>
      <p className="font-mono text-sm text-white">{value}</p>
    </div>
  );
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isUnlimited = limit >= 999;
  
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-[#94a3b8]">{label}</span>
        <span className="text-sm font-medium text-white">
          {isUnlimited ? "Unlimited" : `${used} / ${limit}`}
        </span>
      </div>
      <div className="h-2 bg-[#0c0f1d] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}