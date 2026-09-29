"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/axios";
import {
  Loader2,
  Plus,
  Search,
  Filter,
  ChevronDown,
  MoreVertical,
  Server,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Edit,
  Play,
  Pause,
  ExternalLink,
  Save,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ApiMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type ApiStatus = "operational" | "degraded" | "down" | "maintenance";

interface MonitoredApi {
  id: string;
  orgId: string;
  name: string;
  endpointUrl: string;
  method: ApiMethod;
  headers: Record<string, unknown>;
  body: Record<string, unknown>;
  expectedStatusCodes: number[];
  timeoutSeconds: number;
  checkIntervalSeconds: number;
  status: ApiStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    checks: number;
    alerts: number;
  };
}

interface ApiCheck {
  id: string;
  statusCode: number | null;
  responseTimeMs: number | null;
  errorMessage: string | null;
  isSuccess: boolean;
  checkedAt: string;
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

const statusColors: Record<ApiStatus, string> = {
  operational: "bg-green-500/20 text-green-400 border-green-500/30",
  degraded: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  down: "bg-red-500/20 text-red-400 border-red-500/30",
  maintenance: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const statusLabels: Record<ApiStatus, string> = {
  operational: "Operational",
  degraded: "Degraded",
  down: "Down",
  maintenance: "Maintenance",
};

const methodColors: Record<ApiMethod, string> = {
  GET: "bg-blue-500/20 text-blue-400",
  POST: "bg-green-500/20 text-green-400",
  PUT: "bg-yellow-500/20 text-yellow-400",
  DELETE: "bg-red-500/20 text-red-400",
  PATCH: "bg-purple-500/20 text-purple-400",
};

export default function ApisPage() {
  const { user, organization } = useAuthStore();
  const [apis, setApis] = useState<MonitoredApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApiStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingApi, setEditingApi] = useState<MonitoredApi | null>(null);
  const [showChecksModal, setShowChecksModal] = useState(false);
  const [checksApi, setChecksApi] = useState<MonitoredApi | null>(null);
  const [checks, setChecks] = useState<ApiCheck[]>([]);
  const [checksLoading, setChecksLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    endpointUrl: "",
    method: "GET" as ApiMethod,
    expectedStatusCodes: "200",
    timeoutSeconds: 10,
    checkIntervalSeconds: 60,
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchApis = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(search && { search }),
      });
      const res = await api.get<PaginatedResponse<MonitoredApi>>(
        `/organizations/${organization?.id}/apis?${params}`
      );
      setApis(res.data.data);
      setTotal(res.data.pagination.total);
    } catch (error) {
      console.error("Failed to fetch APIs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApis();
  }, [page, statusFilter, search]);

  const handleCreateApi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.endpointUrl.trim()) return;

    setCreating(true);
    try {
      await api.post(`/organizations/${organization?.id}/apis`, {
        name: createForm.name,
        endpointUrl: createForm.endpointUrl,
        method: createForm.method,
        expectedStatusCodes: createForm.expectedStatusCodes.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n)),
        timeoutSeconds: createForm.timeoutSeconds,
        checkIntervalSeconds: createForm.checkIntervalSeconds,
      });
      setShowCreateModal(false);
      setCreateForm({ name: "", endpointUrl: "", method: "GET", expectedStatusCodes: "200", timeoutSeconds: 10, checkIntervalSeconds: 60 });
      fetchApis();
    } catch (error) {
      console.error("Failed to create API:", error);
      alert("Failed to create API. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateApi = async () => {
    if (!editingApi) return;
    setUpdating(true);
    try {
      await api.patch(`/organizations/${organization?.id}/apis/${editingApi.id}`, {
        name: editingApi.name,
        endpointUrl: editingApi.endpointUrl,
        method: editingApi.method,
        expectedStatusCodes: editingApi.expectedStatusCodes,
        timeoutSeconds: editingApi.timeoutSeconds,
        checkIntervalSeconds: editingApi.checkIntervalSeconds,
        isActive: editingApi.isActive,
      });
      setShowEditModal(false);
      fetchApis();
    } catch (error) {
      console.error("Failed to update API:", error);
      alert("Failed to update API. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteApi = async (apiId: string) => {
    if (!confirm("Are you sure you want to delete this API? This action cannot be undone.")) return;
    setDeletingId(apiId);
    try {
      await api.delete(`/organizations/${organization?.id}/apis/${apiId}`);
      fetchApis();
    } catch (error) {
      console.error("Failed to delete API:", error);
      alert("Failed to delete API. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (apiId: string, currentStatus: boolean) => {
    setTogglingId(apiId);
    try {
      await api.patch(`/organizations/${organization?.id}/apis/${apiId}`, { isActive: !currentStatus });
      fetchApis();
    } catch (error) {
      console.error("Failed to toggle API:", error);
      alert("Failed to update API status. Please try again.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleViewChecks = async (apiData: MonitoredApi) => {
    setChecksApi(apiData);
    setShowChecksModal(true);
    setChecksLoading(true);
    try {
      const res = await api.get<PaginatedResponse<ApiCheck>>(
        `/organizations/${organization?.id}/apis/${apiData.id}/checks?limit=50`
      );
      setChecks(res.data.data);
    } catch (error) {
      console.error("Failed to fetch checks:", error);
    } finally {
      setChecksLoading(false);
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

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const operationalCount = apis.filter(a => a.status === "operational" && a.isActive).length;
  const degradedCount = apis.filter(a => a.status === "degraded" && a.isActive).length;
  const downCount = apis.filter(a => a.status === "down" && a.isActive).length;
  const inactiveCount = apis.filter(a => !a.isActive).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitored APIs</h1>
          <p className="text-[#94a3b8] mt-1">Track uptime, latency, and health of your endpoints</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white px-4 py-2 rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all"
        >
          <Plus className="w-4 h-4" />
          Add API
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Operational"
          value={operationalCount}
          icon={<CheckCircle className="w-5 h-5 text-green-400" />}
          trend="Healthy"
          color="green"
        />
        <StatCard
          title="Degraded"
          value={degradedCount}
          icon={<Activity className="w-5 h-5 text-yellow-400" />}
          trend="Performance issues"
          color="yellow"
        />
        <StatCard
          title="Down"
          value={downCount}
          icon={<AlertCircle className="w-5 h-5 text-red-400" />}
          trend="Critical"
          color="red"
        />
        <StatCard
          title="Paused"
          value={inactiveCount}
          icon={<Pause className="w-5 h-5 text-gray-400" />}
          trend="Not monitoring"
          color="gray"
        />
      </div>

      {/* Filters & Search */}
      <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl p-4 border border-[#334155]">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              type="text"
              placeholder="Search APIs..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-10 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors"
            />
          </div>
          <SelectFilter
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as ApiStatus | "all"); setPage(1); }}
            options={[
              { value: "all", label: "All Status" },
              { value: "operational", label: "Operational" },
              { value: "degraded", label: "Degraded" },
              { value: "down", label: "Down" },
              { value: "maintenance", label: "Maintenance" },
            ]}
            icon={<Filter className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* APIs List */}
      <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-[#334155] overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#06b6d4] animate-spin" />
          </div>
        ) : apis.length === 0 ? (
          <div className="p-12 text-center">
            <Server className="w-12 h-12 text-[#334155] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#94a3b8] mb-2">No APIs monitored</h3>
            <p className="text-[#64748b] mb-6">Add your first API endpoint to start monitoring</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white px-4 py-2 rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all"
            >
              <Plus className="w-4 h-4" />
              Add API
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#334155] bg-[#0c0f1d]/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">API</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden md:table-cell">Endpoint</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Method</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">Interval</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">Timeout</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden xl:table-cell">Last Check</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]/50">
                  {apis.map((api) => (
                    <tr key={api.id} className="hover:bg-[#334155]/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff4b1f] to-[#06b6d4] flex items-center justify-center">
                            <Server className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{api.name}</p>
                            <p className="text-xs text-[#64748b]">{api.isActive ? "Active" : "Paused"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-sm text-[#94a3b8] font-mono truncate max-w-xs">
                        {api.endpointUrl}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${methodColors[api.method]}`}>
                          {api.method}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[api.status]}`}>
                          {api.isActive ? (
                            <>
                              <span className={`w-1.5 h-1.5 rounded-full ${api.status === "operational" ? "bg-green-500" : api.status === "degraded" ? "bg-yellow-500" : api.status === "down" ? "bg-red-500" : "bg-blue-500"}`} />
                              {statusLabels[api.status]}
                            </>
                          ) : (
                            <span className="text-gray-400">Paused</span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-sm text-[#64748b]">
                        {api.checkIntervalSeconds}s
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-sm text-[#64748b]">
                        {api.timeoutSeconds}s
                      </td>
                      <td className="px-6 py-4 hidden xl:table-cell text-sm text-[#64748b]">
                        {formatDate(api.updatedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewChecks(api)}
                            className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors"
                            title="View checks"
                          >
                            <Activity className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingApi(api); setShowEditModal(true); }}
                            className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(api.id, api.isActive)}
                            disabled={togglingId === api.id}
                            className={`p-2 rounded-lg transition-colors ${api.isActive ? "text-yellow-400 hover:bg-yellow-500/10" : "text-green-400 hover:bg-green-500/10"}`}
                            title={api.isActive ? "Pause monitoring" : "Resume monitoring"}
                          >
                            {api.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteApi(api.id)}
                            disabled={deletingId === api.id}
                            className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
                  Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} APIs
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

      {/* Create API Modal */}
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
                <h2 className="text-xl font-bold">Add Monitored API</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateApi} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">API Name</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g., Payment Gateway"
                    required
                    className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Endpoint URL</label>
                  <input
                    type="url"
                    value={createForm.endpointUrl}
                    onChange={e => setCreateForm({ ...createForm, endpointUrl: e.target.value })}
                    placeholder="https://api.example.com/health"
                    required
                    className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">HTTP Method</label>
                    <select
                      value={createForm.method}
                      onChange={e => setCreateForm({ ...createForm, method: e.target.value as ApiMethod })}
                      className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Expected Status Codes</label>
                    <input
                      type="text"
                      value={createForm.expectedStatusCodes}
                      onChange={e => setCreateForm({ ...createForm, expectedStatusCodes: e.target.value })}
                      placeholder="200, 201, 204"
                      className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors"
                    />
                    <p className="text-xs text-[#64748b] mt-1">Comma-separated</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Timeout (seconds)</label>
                    <input
                      type="number"
                      value={createForm.timeoutSeconds}
                      onChange={e => setCreateForm({ ...createForm, timeoutSeconds: parseInt(e.target.value) })}
                      min="1"
                      max="60"
                      className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Check Interval (seconds)</label>
                    <input
                      type="number"
                      value={createForm.checkIntervalSeconds}
                      onChange={e => setCreateForm({ ...createForm, checkIntervalSeconds: parseInt(e.target.value) })}
                      min="10"
                      max="3600"
                      className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors"
                    />
                  </div>
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
                    disabled={creating || !createForm.name.trim() || !createForm.endpointUrl.trim()}
                    className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Create API"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit API Modal */}
      <AnimatePresence>
        {showEditModal && editingApi && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowEditModal(false); setEditingApi(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Edit API</h2>
                <button
                  onClick={() => { setShowEditModal(false); setEditingApi(null); }}
                  className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={e => { e.preventDefault(); handleUpdateApi(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">API Name</label>
                  <input
                    type="text"
                    value={editingApi.name}
                    onChange={e => setEditingApi({ ...editingApi, name: e.target.value })}
                    className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Endpoint URL</label>
                  <input
                    type="url"
                    value={editingApi.endpointUrl}
                    onChange={e => setEditingApi({ ...editingApi, endpointUrl: e.target.value })}
                    className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">HTTP Method</label>
                    <select
                      value={editingApi.method}
                      onChange={e => setEditingApi({ ...editingApi, method: e.target.value as ApiMethod })}
                      className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Expected Status Codes</label>
                    <input
                      type="text"
                      value={editingApi.expectedStatusCodes.join(", ")}
                      onChange={e => setEditingApi({ ...editingApi, expectedStatusCodes: e.target.value.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n)) })}
                      className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Timeout (seconds)</label>
                    <input
                      type="number"
                      value={editingApi.timeoutSeconds}
                      onChange={e => setEditingApi({ ...editingApi, timeoutSeconds: parseInt(e.target.value) })}
                      min="1"
                      max="60"
                      className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Check Interval (seconds)</label>
                    <input
                      type="number"
                      value={editingApi.checkIntervalSeconds}
                      onChange={e => setEditingApi({ ...editingApi, checkIntervalSeconds: parseInt(e.target.value) })}
                      min="10"
                      max="3600"
                      className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editingApi.isActive}
                    onChange={e => setEditingApi({ ...editingApi, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-[#334155] text-[#06b6d4] focus:ring-[#06b6d4]"
                  />
                  <label htmlFor="isActive" className="font-medium text-white">Active (monitoring enabled)</label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowEditModal(false); setEditingApi(null); }}
                    className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-[#334155] border border-[#475569] text-white hover:bg-[#475569] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all disabled:opacity-50"
                  >
                    {updating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checks Modal */}
      <AnimatePresence>
        {showChecksModal && checksApi && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowChecksModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1e293b] border border-[#334155] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-[#334155}">
                <div>
                  <h3 className="text-xl font-bold">{checksApi.name}</h3>
                  <p className="text-sm text-[#94a3b8] font-mono">{checksApi.endpointUrl}</p>
                </div>
                <button
                  onClick={() => setShowChecksModal(false)}
                  className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {checksLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-[#06b6d4] animate-spin" />
                  </div>
                ) : checks.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 text-[#334155] mx-auto mb-4" />
                    <p className="text-[#64748b]">No checks yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {checks.map((check) => (
                      <div
                        key={check.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-4 ${
                          check.isSuccess
                            ? "border-green-500/30 bg-green-500/5"
                            : "border-red-500/30 bg-red-500/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${check.isSuccess ? "bg-green-500" : "bg-red-500"}`} />
                          <span className="text-sm font-mono text-white">{formatTime(check.checkedAt)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${check.isSuccess ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                            {check.isSuccess ? "Success" : "Failed"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-[#64748b]">
                          {check.statusCode && <span>HTTP {check.statusCode}</span>}
                          {check.responseTimeMs && <span>{check.responseTimeMs}ms</span>}
                          {check.errorMessage && <span className="text-red-400">{check.errorMessage}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, icon, trend, color }: { title: string; value: number; icon: React.ReactNode; trend: string; color: string }) {
  const colorMap: Record<string, string> = {
    green: "text-green-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
    gray: "text-gray-400",
    blue: "text-blue-400",
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