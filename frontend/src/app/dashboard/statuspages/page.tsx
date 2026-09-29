"use client";

import { useState } from "react";
import { Plus, Search, Filter, ChevronDown, MoreVertical, Globe, GlobeLock, Edit, Trash2, Copy, ExternalLink, ToggleLeft, ToggleRight, Shield, Lock, Link as LinkIcon, Mail, Bell, Users, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type StatusPage = {
  id: string;
  name: string;
  subdomain: string;
  customDomain: string | null;
  headerText: string;
  supportEmail: string;
  isPublic: boolean;
  passwordProtected: boolean;
  password: string | null;
  components: { id: string; name: string; apiId: string | null; status: "operational" | "degraded" | "down" | "maintenance" }[];
  subscribers: number;
  createdAt: string;
  updatedAt: string;
};

const mockStatusPages: StatusPage[] = [
  {
    id: "1",
    name: "PulseOps Public Status",
    subdomain: "pulseops",
    customDomain: "status.pulseops.com",
    headerText: "Real-time status of all PulseOps services",
    supportEmail: "support@pulseops.com",
    isPublic: true,
    passwordProtected: false,
    password: null,
    components: [
      { id: "1", name: "API Gateway", apiId: "1", status: "operational" },
      { id: "2", name: "Payment Processing", apiId: "2", status: "operational" },
      { id: "3", name: "User Authentication", apiId: "3", status: "operational" },
      { id: "4", name: "Notification Service", apiId: "4", status: "degraded" },
      { id: "5", name: "Database", apiId: null, status: "operational" },
    ],
    subscribers: 247,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-20T10:00:00Z",
  },
  {
    id: "2",
    name: "Internal Team Status",
    subdomain: "pulseops-internal",
    customDomain: null,
    headerText: "Internal infrastructure status for engineering team",
    supportEmail: "engineering@pulseops.com",
    isPublic: false,
    passwordProtected: true,
    password: "internal2026",
    components: [
      { id: "6", name: "Kubernetes Cluster", apiId: null, status: "operational" },
      { id: "7", name: "CI/CD Pipeline", apiId: null, status: "operational" },
      { id: "8", name: "Internal Tools", apiId: null, status: "maintenance" },
    ],
    subscribers: 12,
    createdAt: "2026-01-10T00:00:00Z",
    updatedAt: "2026-01-15T14:00:00Z",
  },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

const statusColors = {
  operational: "bg-green-500/20 text-green-400 border-green-500/30",
  degraded: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  down: "bg-red-500/20 text-red-400 border-red-500/30",
  maintenance: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export default function StatusPagesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPage, setEditingPage] = useState<StatusPage | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "preview">("list");
  const [previewPage, setPreviewPage] = useState<StatusPage | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Status Pages</h1>
          <p className="text-[#94a3b8] mt-1">Public and private status pages for your services</p>
        </div>
        <button
          onClick={() => { setEditingPage(null); setShowCreateModal(true); }}
          className="flex items-center gap-2 bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white px-4 py-2 rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Status Page
        </button>
      </div>

      <div className="flex gap-2 bg-[#1e293b]/50 backdrop-blur-sm rounded-xl p-1 border border-[#334155] mb-6">
        <button onClick={() => setActiveTab("list")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "list" ? "bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white shadow-[0_0_20px_rgba(255,75,31,0.3)]" : "text-[#94a3b8] hover:text-white"}`}>All Pages</button>
        <button onClick={() => setActiveTab("preview")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "preview" ? "bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white shadow-[0_0_20px_rgba(255,75,31,0.3)]" : "text-[#94a3b8] hover:text-white"}`}>Preview</button>
      </div>

      {activeTab === "list" && (
        <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-[#334155] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#334155] bg-[#0c0f1d]/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Page</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden md:table-cell">URL</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">Components</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">Subscribers</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Visibility</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden xl:table-cell">Updated</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[#64748b] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]/50">
                {mockStatusPages.map((page) => (
                  <tr key={page.id} className="hover:bg-[#334155]/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{page.name}</p>
                      <p className="text-sm text-[#64748b] truncate max-w-xs">{page.headerText}</p>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-2 text-sm text-[#94a3b8] font-mono">
                        {page.customDomain ? (
                          <>
                            <Globe className="w-4 h-4" />
                            {page.customDomain}
                          </>
                        ) : (
                          <>
                            <LinkIcon className="w-4 h-4" />
                            {page.subdomain}.pulseops.io
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {page.components.map(c => (
                          <span key={c.id} className={`px-2 py-0.5 text-xs rounded ${statusColors[c.status]}`}>{c.name}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="px-2 py-0.5 text-xs bg-[#06b6d4]/20 rounded text-[#06b6d4]">{page.subscribers}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {page.isPublic ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border-green-500/30">
                            <Globe className="w-3 h-3" /> Public
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            <Lock className="w-3 h-3" /> Private
                          </span>
                        )}
                        {page.passwordProtected && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border-purple-500/30">
                            <Shield className="w-3 h-3" /> Password
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden xl:table-cell text-[#64748b]">
                      {formatDate(page.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setPreviewPage(page); setActiveTab("preview"); }} className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors" title="Preview">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingPage(page)} className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "preview" && previewPage && (
        <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-[#334155] overflow-hidden">
          <div className="p-6 border-b border-[#334155] flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{previewPage.name}</h2>
              <p className="text-[#94a3b8] mt-1">{previewPage.headerText}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setActiveTab("list")} className="px-4 py-2 rounded-lg text-sm font-medium bg-[#334155] border border-[#475569] text-white hover:bg-[#475569] transition-colors">Back to List</button>
              <button className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all">
                <ExternalLink className="w-4 h-4 mr-2" /> View Live
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-[#0c0f1d]/50 rounded-xl p-4 border border-[#334155]">
                <h4 className="font-medium text-white mb-2">URLs</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-[#94a3b8]">
                    <LinkIcon className="w-4 h-4" />
                    <span className="font-mono text-white">{previewPage.customDomain || `${previewPage.subdomain}.pulseops.io`}</span>
                  </div>
                  {previewPage.customDomain && (
                    <div className="flex items-center gap-2 text-[#94a3b8]">
                      <LinkIcon className="w-4 h-4" />
                      <span className="font-mono text-white">{previewPage.subdomain}.pulseops.io</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-[#0c0f1d]/50 rounded-xl p-4 border border-[#334155]">
                <h4 className="font-medium text-white mb-2">Settings</h4>
                <div className="space-y-2 text-sm text-[#94a3b8]">
                  <div className="flex items-center justify-between">
                    <span>Public Access</span>
                    <span className={previewPage.isPublic ? "text-green-400" : "text-red-400"}>
                      {previewPage.isPublic ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Password Protected</span>
                    <span className={previewPage.passwordProtected ? "text-green-400" : "text-red-400"}>
                      {previewPage.passwordProtected ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Support Email</span>
                    <span className="font-mono text-white">{previewPage.supportEmail}</span>
                  </div>
                </div>
              </div>
              <div className="bg-[#0c0f1d]/50 rounded-xl p-4 border border-[#334155]">
                <h4 className="font-medium text-white mb-2">Stats</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-[#64748b">Subscribers</span><div className="text-2xl font-bold text-white">{previewPage.subscribers}</div></div>
                  <div><span className="text-[#64748b">Components</span><div className="text-2xl font-bold text-white">{previewPage.components.length}</div></div>
                  <div><span className="text-[#64748b">Operational</span><div className="text-2xl font-bold text-green-400">{previewPage.components.filter(c => c.status === "operational").length}</div></div>
                  <div><span className="text-[#64748b">Issues</span><div className="text-2xl font-bold text-red-400">{previewPage.components.filter(c => c.status !== "operational").length}</div></div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#334155] pt-6">
              <h4 className="font-semibold text-white mb-4">Components</h4>
              <div className="space-y-3">
                {previewPage.components.map((comp) => (
                  <div key={comp.id} className="flex items-center justify-between p-4 bg-[#0c0f1d]/50 rounded-xl border border-[#334155]">
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[comp.status]}`}>
                        {comp.status.charAt(0).toUpperCase() + comp.status.slice(1)}
                      </span>
                      <div>
                        <p className="font-medium text-white">{comp.name}</p>
                        <p className="text-xs text-[#64748b] font-mono">{comp.apiId ? `Linked to API` : `Manual component`}</p>
                      </div>
                    </div>
                    <button className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#334155] pt-6">
              <h4 className="font-semibold text-white mb-4">Subscriber Management</h4>
              <div className="flex items-center gap-4">
                <span className="text-[#94a3b8">{previewPage.subscribers} subscribers</span>
                <button className="px-4 py-2 rounded-lg text-sm font-medium bg-[#334155] border border-[#475569] text-white hover:bg-[#475569] transition-colors">
                  <Mail className="w-4 h-4 mr-2" /> Notify Subscribers
                </button>
                <button className="px-4 py-2 rounded-lg text-sm font-medium bg-[#334155] border border-[#475569] text-white hover:bg-[#475569] transition-colors">
                  <Users className="w-4 h-4 mr-2" /> Manage Subscribers
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Create Status Page</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form className="space-y-4">
                <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Page Name</label><input type="text" placeholder="e.g., PulseOps Status" className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors" /></div>
                <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Subdomain</label><div className="flex items-center gap-2"><input type="text" placeholder="pulseops" className="flex-1 bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors" /><span className="text-[#64748b] px-3">.pulseops.io</span></div></div>
                <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Custom Domain (Optional)</label><input type="text" placeholder="status.example.com" className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors" /></div>
                <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Header Text</label><textarea placeholder="Real-time status of all services" rows={2} className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors resize-none" /></div>
                <div><label className="block text-sm font-medium text-[#94a3b8] mb-2">Support Email</label><input type="email" placeholder="support@example.com" className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-3 bg-[#0c0f1d] border border-[#334155] rounded-xl cursor-pointer"><input type="checkbox" className="w-4 h-4 rounded border-[#334155] text-[#06b6d4] focus:ring-[#06b6d4]" /><div><p className="font-medium text-white">Public Access</p><p className="text-xs text-[#64748b">Anyone can view this page</p></div></label>
                  <label className="flex items-center gap-3 p-3 bg-[#0c0f1d] border border-[#334155] rounded-xl cursor-pointer"><input type="checkbox" className="w-4 h-4 rounded border-[#334155] text-[#06b6d4] focus:ring-[#06b6d4]" /><div><p className="font-medium text-white">Password Protection</p><p className="text-xs text-[#64748b">Require password to view</p></div></label>
                </div>
                <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-[#334155] border border-[#475569] text-white hover:bg-[#475569] transition-colors">Cancel</button><button type="submit" className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all">Create Status Page</button></div>
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