"use client";

import { useState } from "react";
import { Plus, Search, Filter, ChevronDown, MoreVertical, Edit, Trash2, Bell, BellOff, Copy, Clock, AlertTriangle, Hash, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type AlertRule = {
  id: string;
  name: string;
  type: "downtime" | "latency" | "error_rate" | "status_code";
  condition: string;
  severity: "critical" | "high" | "medium" | "low";
  enabled: boolean;
  apis: string[];
  notificationChannels: string[];
  createdAt: string;
  lastTriggered: string | null;
};

const severityColors = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const typeIcons = {
  downtime: <Bell className="w-4 h-4" />,
  latency: <Clock className="w-4 h-4" />,
  error_rate: <AlertTriangle className="w-4 h-4" />,
  status_code: <Hash className="w-4 h-4" />,
};

const mockRules: AlertRule[] = [
  {
    id: "1",
    name: "Payment API Downtime",
    type: "downtime",
    condition: "Any check fails for 2 consecutive minutes",
    severity: "critical",
    enabled: true,
    apis: ["Payment Gateway", "Billing API"],
    notificationChannels: ["Email", "Slack", "PagerDuty"],
    createdAt: "2026-01-15T10:30:00Z",
    lastTriggered: "2026-01-20T14:22:00Z",
  },
  {
    id: "2",
    name: "High Latency Alert",
    type: "latency",
    condition: "P95 latency > 500ms for 5 minutes",
    severity: "high",
    enabled: true,
    apis: ["User Service", "Auth API", "Notification Service"],
    notificationChannels: ["Email", "Slack"],
    createdAt: "2026-01-10T09:15:00Z",
    lastTriggered: "2026-01-18T16:45:00Z",
  },
  {
    id: "3",
    name: "Error Rate Spike",
    type: "error_rate",
    condition: "Error rate > 5% over 10 minutes",
    severity: "high",
    enabled: false,
    apis: ["All APIs"],
    notificationChannels: ["Email"],
    createdAt: "2026-01-05T14:00:00Z",
    lastTriggered: null,
  },
  {
    id: "4",
    name: "Non-2xx Status Codes",
    type: "status_code",
    condition: "Any 5xx status code returned",
    severity: "medium",
    enabled: true,
    apis: ["Payment Gateway", "User Service"],
    notificationChannels: ["Slack"],
    createdAt: "2026-01-01T11:00:00Z",
    lastTriggered: "2026-01-19T08:30:00Z",
  },
];

const typeLabels = {
  downtime: "Downtime",
  latency: "Latency",
  error_rate: "Error Rate",
  status_code: "Status Code",
};

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

export default function AlertRulesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const filteredRules = mockRules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(search.toLowerCase()) ||
      rule.apis.some(api => api.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === "all" || rule.type === typeFilter;
    const matchesSeverity = severityFilter === "all" || rule.severity === severityFilter;
    return matchesSearch && matchesType && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alert Rules</h1>
          <p className="text-[#94a3b8] mt-1">Configure alert conditions and notification routing</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white px-4 py-2 rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Rule
        </button>
      </div>

      <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl p-4 border border-[#334155]">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              type="text"
              placeholder="Search rules..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-10 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <SelectFilter
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              options={[
                { value: "all", label: "All Types" },
                { value: "downtime", label: "Downtime" },
                { value: "latency", label: "Latency" },
                { value: "error_rate", label: "Error Rate" },
                { value: "status_code", label: "Status Code" },
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Rule</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden md:table-cell">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Severity</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">APIs</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">Channels</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden xl:table-cell">Last Triggered</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#64748b] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]/50">
              {filteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-[#334155]/30 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-white">{rule.name}</p>
                      <p className="text-sm text-[#64748b] truncate max-w-xs">{rule.condition}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#334155] text-[#94a3b8]">
                      {typeIcons[rule.type]} {typeLabels[rule.type]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${severityColors[rule.severity]}`}>
                      {rule.severity.charAt(0).toUpperCase() + rule.severity.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {rule.apis.map(api => (
                        <span key={api} className="px-2 py-0.5 text-xs bg-[#334155] rounded text-[#94a3b8]">{api}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {rule.notificationChannels.map(ch => (
                        <span key={ch} className="px-2 py-0.5 text-xs bg-[#06b6d4]/20 rounded text-[#06b6d4]">{ch}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden xl:table-cell text-[#64748b]">
                    {formatDate(rule.lastTriggered)}
                  </td>
                  <td className="px-6 py-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => {}}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:ring-2 peer-focus:ring-[#06b6d4] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#06b6d4]"></div>
                    </label>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === rule.id ? null : rule.id)}
                        className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      <AnimatePresence>
                        {activeDropdown === rule.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 top-full mt-1 w-48 bg-[#1e293b] border border-[#334155] rounded-xl shadow-lg py-1 z-50"
                          >
                            <button className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[#334155] flex items-center gap-2">
                              <Edit className="w-4 h-4" /> Edit Rule
                            </button>
                            <button className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[#334155] flex items-center gap-2">
                              <Copy className="w-4 h-4" /> Duplicate
                            </button>
                            <button className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[#334155] flex items-center gap-2">
                              {rule.enabled ? (
                                <>
                                  <BellOff className="w-4 h-4" /> Disable
                                </>
                              ) : (
                                <>
                                  <Bell className="w-4 h-4" /> Enable
                                </>
                              )}
                            </button>
                            <hr className="my-1 border-[#334155]" />
                            <button className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[#334155] flex items-center gap-2">
                              <Trash2 className="w-4 h-4" /> Delete
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

        {filteredRules.length === 0 && (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-[#334155] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#94a3b8] mb-2">No alert rules found</h3>
            <p className="text-[#64748b] mb-6">Create your first alert rule to start monitoring</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white px-4 py-2 rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Rule
            </button>
          </div>
        )}
      </div>

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
                <h2 className="text-xl font-bold">Create Alert Rule</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Rule Name</label>
                  <input type="text" placeholder="e.g., Payment API Downtime" className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Alert Type</label>
                    <select className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none">
                      <option value="downtime">Downtime</option>
                      <option value="latency">Latency</option>
                      <option value="error_rate">Error Rate</option>
                      <option value="status_code">Status Code</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Severity</label>
                    <select className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none">
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Condition</label>
                  <textarea placeholder="e.g., Any check fails for 2 consecutive minutes" rows={2} className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">APIs to Monitor</label>
                  <div className="flex flex-wrap gap-2">
                    {["Payment Gateway", "User Service", "Auth API", "Notification Service", "Billing API"].map(api => (
                      <label key={api} className="flex items-center gap-2 px-3 py-1.5 bg-[#0c0f1d] border border-[#334155] rounded-lg text-sm text-white hover:border-[#06b6d4] cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-[#334155] text-[#06b6d4] focus:ring-[#06b6d4]" />
                        {api}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Notification Channels</label>
                  <div className="flex flex-wrap gap-2">
                    {["Email", "Slack", "PagerDuty", "Webhook", "SMS"].map(ch => (
                      <label key={ch} className="flex items-center gap-2 px-3 py-1.5 bg-[#0c0f1d] border border-[#334155] rounded-lg text-sm text-white hover:border-[#06b6d4] cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-[#334155] text-[#06b6d4] focus:ring-[#06b6d4]" />
                        {ch}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-[#334155] border border-[#475569] text-white hover:bg-[#475569] transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all">Create Rule</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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

