"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Search, Filter, ChevronDown, MoreVertical, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Target, BarChart2, LineChart, Rocket, Settings } from "lucide-react";
import { motion } from "framer-motion";

type SLO = {
  id: string;
  name: string;
  description: string;
  service: string;
  sliType: "availability" | "latency" | "throughput" | "error_rate";
  target: number;
  current: number;
  errorBudget: number;
  errorBudgetBurnRate: number;
  window: "7d" | "30d" | "90d";
  status: "met" | "at_risk" | "breached";
  lastUpdated: string;
};

type SLIDataPoint = {
  timestamp: string;
  value: number;
  target: number;
};

const mockSLOs: SLO[] = [
  {
    id: "1",
    name: "API Availability",
    description: "Percentage of successful API requests across all endpoints",
    service: "API Gateway",
    sliType: "availability",
    target: 99.9,
    current: 99.95,
    errorBudget: 43.2,
    errorBudgetBurnRate: 0.3,
    window: "30d",
    status: "met",
    lastUpdated: "2026-01-20T10:00:00Z",
  },
  {
    id: "2",
    name: "Payment API Latency P95",
    description: "95th percentile latency for payment processing endpoints",
    service: "Payment Service",
    sliType: "latency",
    target: 500,
    current: 420,
    errorBudget: 65.4,
    errorBudgetBurnRate: 0.8,
    window: "30d",
    status: "met",
    lastUpdated: "2026-01-20T10:00:00Z",
  },
  {
    id: "3",
    name: "Error Rate",
    description: "Percentage of 5xx errors across all services",
    service: "All Services",
    sliType: "error_rate",
    target: 0.1,
    current: 0.15,
    errorBudget: -12.5,
    errorBudgetBurnRate: 2.3,
    window: "7d",
    status: "breached",
    lastUpdated: "2026-01-20T10:00:00Z",
  },
  {
    id: "4",
    name: "Database Query Latency P99",
    description: "99th percentile latency for database queries",
    service: "PostgreSQL",
    sliType: "latency",
    target: 1000,
    current: 850,
    errorBudget: 28.7,
    errorBudgetBurnRate: 1.2,
    window: "30d",
    status: "at_risk",
    lastUpdated: "2026-01-20T10:00:00Z",
  },
  {
    id: "5",
    name: "Authentication Success Rate",
    description: "Percentage of successful authentication attempts",
    service: "Auth Service",
    sliType: "availability",
    target: 99.99,
    current: 99.995,
    errorBudget: 89.1,
    errorBudgetBurnRate: 0.1,
    window: "90d",
    status: "met",
    lastUpdated: "2026-01-20T10:00:00Z",
  },
];

const statusColors = {
  met: "bg-green-500/20 text-green-400 border-green-500/30",
  at_risk: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  breached: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusLabels = {
  met: "Met",
  at_risk: "At Risk",
  breached: "Breached",
};

const sliTypeLabels = {
  availability: "Availability",
  latency: "Latency",
  throughput: "Throughput",
  error_rate: "Error Rate",
};

function formatSLOValue(slo: SLO) {
  if (slo.sliType === "latency") return `${slo.current}ms / ${slo.target}ms`;
  if (slo.sliType === "error_rate") return `${slo.current}% / ${slo.target}%`;
  return `${slo.current}% / ${slo.target}%`;
}

export default function SLODashboardPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [selectedSLO, setSelectedSLO] = useState<SLO | null>(null);
  const [chartData, setChartData] = useState<SLIDataPoint[]>([]);
  const chartDataRef = useRef(chartData);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (!selectedSLO) {
      setChartData([]);
      return;
    }
    const data: SLIDataPoint[] = [];
    const days = selectedSLO.window === "7d" ? 7 : selectedSLO.window === "30d" ? 30 : 90;
    const now = new Date();
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const variance = (Math.random() - 0.5) * (selectedSLO.sliType === "latency" ? 100 : selectedSLO.sliType === "error_rate" ? 0.05 : 0.5);
      const value = Math.max(0, selectedSLO.current + variance);
      data.push({
        timestamp: date.toISOString(),
        value,
        target: selectedSLO.target,
      });
    }
    chartDataRef.current = data;
    setChartData(data);
  }, [selectedSLO]);

  const filteredSLOs = mockSLOs.filter(slo => {
    const matchesSearch = slo.name.toLowerCase().includes(search.toLowerCase()) || slo.service.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || slo.status === statusFilter;
    const matchesService = serviceFilter === "all" || slo.service === serviceFilter;
    return matchesSearch && matchesStatus && matchesService;
  });

  const getUniqueServices = () => [...new Set(mockSLOs.map(s => s.service))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SLO Dashboard</h1>
          <p className="text-[#94a3b8] mt-1">Service Level Objectives and error budget tracking</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-xl font-medium bg-[#334155] border border-[#475569] text-white hover:bg-[#475569] transition-colors">
            <BarChart2 className="w-4 h-4 mr-2" /> Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total SLOs" value={mockSLOs.length} icon={<Target className="w-5 h-5 text-blue-400" />} />
        <StatCard title="Met" value={mockSLOs.filter(s => s.status === "met").length} icon={<CheckCircle className="w-5 h-5 text-green-400" />} color="green" />
        <StatCard title="At Risk" value={mockSLOs.filter(s => s.status === "at_risk").length} icon={<AlertTriangle className="w-5 h-5 text-yellow-400" />} color="yellow" />
        <StatCard title="Breached" value={mockSLOs.filter(s => s.status === "breached").length} icon={<AlertTriangle className="w-5 h-5 text-red-400" />} color="red" />
      </div>

      <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl p-4 border border-[#334155]">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input type="text" placeholder="Search SLOs..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-10 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors" />
          </div>
          <div className="flex gap-2">
            <SelectFilter value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={[{value:"all",label:"All Status"},{value:"met",label:"Met"},{value:"at_risk",label:"At Risk"},{value:"breached",label:"Breached"}]} icon={<Filter className="w-4 h-4" />} />
            <SelectFilter value={serviceFilter} onChange={e => setServiceFilter(e.target.value)} options={[{value:"all",label:"All Services"},...getUniqueServices().map(s=>({value:s,label:s}))]} icon={<Filter className="w-4 h-4" />} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-[#334155] overflow-hidden">
            <div className="p-6 border-b border-[#334155]">
              <h3 className="text-lg font-semibold">SLO Overview</h3>
              <p className="text-sm text-[#64748b] mt-1">Select an SLO to view details</p>
            </div>
            <div className="p-6 space-y-4">
              {filteredSLOs.map(slo => (
                <motion.button
                  key={slo.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedSLO(slo)}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    selectedSLO?.id === slo.id
                      ? "bg-gradient-to-r from-[#ff4b1f]/20 to-[#06b6d4]/20 border border-[#ff4b1f]/30"
                      : "bg-[#0c0f1d]/50 border border-[#334155] hover:border-[#06b6d4]/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[slo.status]}`}>
                      {statusLabels[slo.status]}
                    </span>
                    <span className="text-xs text-[#64748b]">{slo.window}</span>
                  </div>
                  <h4 className="font-semibold text-white mb-1">{slo.name}</h4>
                  <p className="text-sm text-[#64748b] mb-2">{slo.service}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[#64748b]">Target</span>
                      <div className="font-mono font-semibold text-white">{slo.target}{slo.sliType === "latency" ? "ms" : "%"}</div>
                    </div>
                    <div>
                      <span className="text-[#64748b]">Current</span>
                      <div className="font-mono font-semibold text-white">{slo.current}{slo.sliType === "latency" ? "ms" : "%"}</div>
                    </div>
                    <div>
                      <span className="text-[#64748b]">Error Budget</span>
                      <div className="font-mono font-semibold" style={{ color: slo.errorBudget >= 0 ? "#22c55e" : "#ef4444" }}>
                        {slo.errorBudget >= 0 ? "+" : ""}{slo.errorBudget.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-[#64748b]">Burn Rate</span>
                      <div className="font-mono font-semibold" style={{ color: slo.errorBudgetBurnRate > 1 ? "#ef4444" : slo.errorBudgetBurnRate > 0.5 ? "#f59e0b" : "#22c55e" }}>
                        {slo.errorBudgetBurnRate}x
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          {selectedSLO ? (
            <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-[#334155] overflow-hidden">
              <div className="p-6 border-b border-[#334155] flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{selectedSLO.name}</h3>
                  <p className="text-[#94a3b8] mt-1">{selectedSLO.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[selectedSLO.status]}`}>
                  {statusLabels[selectedSLO.status]}
                </span>
              </div>

              <div className="p-6 border-b border-[#334155]">
                <h4 className="font-semibold mb-4">Error Budget Burn</h4>
                <div className="h-48 relative">
                  <svg className="w-full h-full" viewBox="0 0 400 150">
                    <defs>
                      <linearGradient id="budgetGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <rect x="20" y="20" width="360" height="100" rx="5" fill="#0c0f1d" stroke="#334155" />
                    <line x1="20" y1="120" x2="380" y2="120" stroke="#334155" strokeDasharray="5,5" />
                    <text x="20" y="15" fill="#64748b" fontSize="12" fontFamily="monospace">100%</text>
                    <text x="20" y="135" fill="#64748b" fontSize="12" fontFamily="monospace">0%</text>
                    <polyline
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2"
                      points={chartData.map((d, i) => {
                        const x = 20 + (i / Math.max(1, chartData.length - 1)) * 360;
                        const y = 120 - ((d.value / selectedSLO.target) * 100);
                        return `${x},${y}`;
                      }).join(" ")}
                    />
                    <line x1="20" y1={120 - (selectedSLO.target / selectedSLO.target * 100)} x2="380" y2={120 - (selectedSLO.target / selectedSLO.target * 100)} stroke="#ef4444" strokeDasharray="5,5" strokeWidth="1" />
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-6 border-b border-[#334155]">
                <MetricCard label="Target" value={`${selectedSLO.target}${selectedSLO.sliType === "latency" ? "ms" : "%"}`} />
                <MetricCard label="Current" value={`${selectedSLO.current}${selectedSLO.sliType === "latency" ? "ms" : "%"}`} />
                <MetricCard label="Error Budget" value={`${selectedSLO.errorBudget >= 0 ? "+" : ""}${selectedSLO.errorBudget.toFixed(1)}%`} color={selectedSLO.errorBudget >= 0 ? "green" : "red"} />
                <MetricCard label="Burn Rate" value={`${selectedSLO.errorBudgetBurnRate}x`} color={selectedSLO.errorBudgetBurnRate > 1 ? "red" : selectedSLO.errorBudgetBurnRate > 0.5 ? "yellow" : "green"} />
              </div>

              <div className="p-6">
                <h4 className="font-semibold mb-4">Configuration</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-[#0c0f1d]/50 rounded-xl p-4 border border-[#334155]">
                    <span className="text-[#64748b]">SLI Type</span>
                    <div className="font-medium text-white mt-1 capitalize">{selectedSLO.sliType.replace("_", " ")}</div>
                  </div>
                  <div className="bg-[#0c0f1d]/50 rounded-xl p-4 border border-[#334155]">
                    <span className="text-[#64748b]">Service</span>
                    <div className="font-medium text-white mt-1">{selectedSLO.service}</div>
                  </div>
                  <div className="bg-[#0c0f1d]/50 rounded-xl p-4 border border-[#334155]">
                    <span className="text-[#64748b]">Window</span>
                    <div className="font-medium text-white mt-1">{selectedSLO.window}</div>
                  </div>
                  <div className="bg-[#0c0f1d]/50 rounded-xl p-4 border border-[#334155]">
                    <span className="text-[#64748b]">Last Updated</span>
                    <div className="font-medium text-white mt-1">{formatDate(selectedSLO.lastUpdated)}</div>
                  </div>
                </div>
              </div>
            </div>
        ) : (
          <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-[#334155] p-12 text-center">
            <Target className="w-16 h-16 text-[#334155] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#94a3b8] mb-2">Select an SLO</h3>
            <p className="text-[#64748b]">Choose an SLO from the left to view detailed metrics and error budget burn</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color?: "green" | "yellow" | "red" | "blue" }) {
  const colorMap = { green: "text-green-400", yellow: "text-yellow-400", red: "text-red-400", blue: "text-blue-400" };
  return (
    <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl p-5 border border-[#334155] hover:border-[#06b6d4]/30 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">{title}</p>
          <p className="text-3xl font-black tracking-tight text-white">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-[#0c0f1d]/50 border border-[#334155] flex items-center justify-center">
          <span className={colorMap[color || "blue"]}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color?: "green" | "yellow" | "red" }) {
  const colorMap = { green: "text-green-400", yellow: "text-yellow-400", red: "text-red-400" };
  return (
    <div className="bg-[#0c0f1d]/50 rounded-xl p-4 border border-[#334155]">
      <span className="text-xs text-[#64748b] uppercase tracking-wider mb-1 block">{label}</span>
      <div className={`font-mono text-xl font-bold ${colorMap[color || "green"]}`}>{value}</div>
    </div>
  );
}

function SelectFilter({ value, onChange, options, icon }: { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: { value: string; label: string }[]; icon: React.ReactNode }) {
  return (<div className="relative"><select value={value} onChange={onChange} className="w-full sm:w-40 bg-[#0c0f1d] border border-[#334155] rounded-xl px-10 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none">{options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select><div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">{icon}</div><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" /></div>);
}