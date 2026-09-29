"use client";

import { useState } from "react";
import { Plus, Search, Filter, ChevronDown, MoreVertical, User, Calendar, Clock, Bell, Mail, Phone, Trash2, Edit, Copy, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type OnCallSchedule = {
  id: string;
  name: string;
  description: string;
  timezone: string;
  rotationType: "daily" | "weekly" | "custom";
  handoffTime: string;
  handoffDay: number;
  members: { id: string; name: string; email: string; phone?: string; avatarUrl?: string | null }[];
  escalationPolicy: { level: number; delayMinutes: number; channels: string[] }[];
  active: boolean;
  createdAt: string;
};

type OnCallShift = {
  id: string;
  scheduleId: string;
  userId: string;
  userName: string;
  startAt: string;
  endAt: string;
  isCurrent: boolean;
};

const mockSchedules: OnCallSchedule[] = [
  {
    id: "1",
    name: "Primary On-Call",
    description: "Primary rotation for critical production alerts",
    timezone: "UTC",
    rotationType: "weekly",
    handoffTime: "09:00",
    handoffDay: 1,
    members: [
      { id: "1", name: "Priya Sharma", email: "priya@company.com", phone: "+1-555-0101", avatarUrl: null },
      { id: "2", name: "Raj Kumar", email: "raj@company.com", phone: "+1-555-0102", avatarUrl: null },
      { id: "3", name: "Amit Patel", email: "amit@company.com", phone: "+1-555-0103", avatarUrl: null },
    ],
    escalationPolicy: [
      { level: 1, delayMinutes: 0, channels: ["Push", "SMS"] },
      { level: 2, delayMinutes: 5, channels: ["Phone Call", "Slack"] },
      { level: 3, delayMinutes: 15, channels: ["Phone Call", "Email", "PagerDuty"] },
    ],
    active: true,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Secondary On-Call",
    description: "Backup rotation for non-critical alerts",
    timezone: "UTC",
    rotationType: "weekly",
    handoffTime: "09:00",
    handoffDay: 1,
    members: [
      { id: "4", name: "Neha Singh", email: "neha@company.com", phone: "+1-555-0104", avatarUrl: null },
      { id: "5", name: "Vikram Singh", email: "vikram@company.com", phone: "+1-555-0105", avatarUrl: null },
    ],
    escalationPolicy: [
      { level: 1, delayMinutes: 0, channels: ["Push", "Email"] },
      { level: 2, delayMinutes: 10, channels: ["SMS", "Slack"] },
      { level: 3, delayMinutes: 30, channels: ["Phone Call"] },
    ],
    active: true,
    createdAt: "2026-01-10T00:00:00Z",
  },
];

const mockShifts: OnCallShift[] = [
  { id: "1", scheduleId: "1", userId: "1", userName: "Priya Sharma", startAt: "2026-01-20T09:00:00Z", endAt: "2026-01-27T09:00:00Z", isCurrent: true },
  { id: "2", scheduleId: "1", userId: "2", userName: "Raj Kumar", startAt: "2026-01-27T09:00:00Z", endAt: "2026-02-03T09:00:00Z", isCurrent: false },
  { id: "3", scheduleId: "1", userId: "3", userName: "Amit Patel", startAt: "2026-02-03T09:00:00Z", endAt: "2026-02-10T09:00:00Z", isCurrent: false },
  { id: "4", scheduleId: "2", userId: "4", userName: "Neha Singh", startAt: "2026-01-20T09:00:00Z", endAt: "2026-01-27T09:00:00Z", isCurrent: true },
  { id: "5", scheduleId: "2", userId: "5", userName: "Vikram Singh", startAt: "2026-01-27T09:00:00Z", endAt: "2026-02-03T09:00:00Z", isCurrent: false },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function OnCallSchedulesPage() {
  const [activeTab, setActiveTab] = useState<"schedules" | "shifts">("schedules");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<OnCallSchedule | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">On-Call Schedules</h1>
          <p className="text-[#94a3b8] mt-1">Manage on-call rotations and escalation policies</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white px-4 py-2 rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Schedule
        </button>
      </div>

      <div className="flex gap-2 bg-[#1e293b]/50 backdrop-blur-sm rounded-xl p-1 border border-[#334155] mb-6">
        <button
          onClick={() => setActiveTab("schedules")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "schedules"
              ? "bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white shadow-[0_0_20px_rgba(255,75,31,0.3)]"
              : "text-[#94a3b8] hover:text-white"
          }`}
        >
          Schedules
        </button>
        <button
          onClick={() => setActiveTab("shifts")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "shifts"
              ? "bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white shadow-[0_0_20px_rgba(255,75,31,0.3)]"
              : "text-[#94a3b8] hover:text-white"
          }`}
        >
          Upcoming Shifts
        </button>
      </div>

      {activeTab === "schedules" && (
        <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-[#334155] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#334155] bg-[#0c0f1d]/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Schedule</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden md:table-cell">Rotation</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">Members</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">Escalation</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden xl:table-cell">Handoff</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[#64748b] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]/50">
                {mockSchedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-[#334155]/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{schedule.name}</p>
                      <p className="text-sm text-[#64748b] truncate max-w-xs">{schedule.description}</p>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="px-2 py-0.5 text-xs bg-[#334155] rounded text-[#94a3b8] capitalize">{schedule.rotationType}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="flex -space-x-2">
                        {schedule.members.slice(0, 3).map(member => (
                          <div key={member.id} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff4b1f] to-[#06b6d4] flex items-center justify-center text-white text-xs font-bold border-2 border-[#0c0f1d]">
                            {getInitials(member.name)}
                          </div>
                        ))}
                        {schedule.members.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-[#334155] flex items-center justify-center text-white text-xs font-bold border-2 border-[#0c0f1d]">
                            +{schedule.members.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="px-2 py-0.5 text-xs bg-[#06b6d4]/20 rounded text-[#06b6d4]">{schedule.escalationPolicy.length} levels</span>
                    </td>
                    <td className="px-6 py-4 hidden xl:table-cell text-[#64748b]">
                      {schedule.handoffDay === 1 ? "Mon" : schedule.handoffDay === 5 ? "Fri" : "Day " + schedule.handoffDay} at {schedule.handoffTime} {schedule.timezone}
                    </td>
                    <td className="px-6 py-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={schedule.active} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:ring-2 peer-focus:ring-[#06b6d4] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#06b6d4]"></div>
                      </label>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "shifts" && (
        <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-[#334155] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#334155] bg-[#0c0f1d]/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">On-Call Engineer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden md:table-cell">Schedule</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Period</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]/50">
                {mockShifts.map((shift) => (
                  <tr key={shift.id} className={`hover:bg-[#334155]/30 transition-colors ${shift.isCurrent ? "bg-[#06b6d4]/10" : ""}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff4b1f] to-[#06b6d4] flex items-center justify-center text-white font-bold">
                          {getInitials(shift.userName)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{shift.userName}</p>
                          {shift.isCurrent && <span className="text-xs text-[#06b6d4] font-medium">Currently on-call</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-[#94a3b8]">
                      {mockSchedules.find(s => s.id === shift.scheduleId)?.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-white">{formatDate(shift.startAt)} - {formatDate(shift.endAt)}</span>
                        <span className="text-xs text-[#64748b">{formatTime(shift.startAt)} - {formatTime(shift.endAt)} UTC</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {shift.isCurrent ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border-green-500/30">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> On-Call Now
                        </span>
                      ) : (
                        <span className="text-[#64748b">Upcoming</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                <h2 className="text-xl font-bold">Create On-Call Schedule</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Schedule Name</label>
                  <input type="text" placeholder="e.g., Primary On-Call" className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Description</label>
                  <textarea placeholder="Describe this rotation..." rows={2} className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Rotation Type</label>
                    <select className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none">
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Timezone</label>
                    <select className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none">
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="America/Los_Angeles">America/Los_Angeles</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="Asia/Kolkata">Asia/Kolkata</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Handoff Day</label>
                    <select className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none">
                      <option value="1">Monday</option>
                      <option value="2">Tuesday</option>
                      <option value="3">Wednesday</option>
                      <option value="4">Thursday</option>
                      <option value="5">Friday</option>
                      <option value="6">Saturday</option>
                      <option value="0">Sunday</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Handoff Time</label>
                    <input type="time" value="09:00" className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Team Members</label>
                  <div className="flex flex-wrap gap-2">
                    {["Priya Sharma", "Raj Kumar", "Amit Patel", "Neha Singh", "Vikram Singh"].map(name => (
                      <label key={name} className="flex items-center gap-2 px-3 py-1.5 bg-[#0c0f1d] border border-[#334155] rounded-lg text-sm text-white hover:border-[#06b6d4] cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-[#334155] text-[#06b6d4] focus:ring-[#06b6d4]" />
                        {name}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Escalation Policy</label>
                  <div className="space-y-2">
                    {[1, 2, 3].map(level => (
                      <div key={level} className="flex items-center gap-3 p-3 bg-[#0c0f1d] border border-[#334155] rounded-xl">
                        <span className="px-2 py-1 text-xs font-bold bg-[#06b6d4] text-white rounded">Level {level}</span>
                        <input type="number" placeholder="Delay (min)" value={level === 1 ? 0 : level === 2 ? 5 : 15} className="w-24 bg-[#0c0f1d] border border-[#334155] rounded-lg px-3 py-2 text-white focus:border-[#06b6d4] focus:outline-none" />
                        <span className="text-xs text-[#64748b">min delay</span>
                        <div className="flex flex-wrap gap-1 ml-auto">
                          {["Push", "SMS", "Email", "Slack", "Phone", "PagerDuty"].map(ch => (
                            <label key={`${level}-${ch}`} className="flex items-center gap-1 px-2 py-0.5 bg-[#0c0f1d] border border-[#334155] rounded text-xs text-white hover:border-[#06b6d4] cursor-pointer">
                              <input type="checkbox" className="w-3 h-3 rounded border-[#334155] text-[#06b6d4] focus:ring-[#06b6d4]" />
                              {ch}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-[#334155] border border-[#475569] text-white hover:bg-[#475569] transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all">Create Schedule</button>
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