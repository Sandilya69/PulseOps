"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/axios";
import {
  Loader2,
  Bell,
  Mail,
  AlertCircle,
  CheckCircle,
  X,
  ChevronDown,
  Clock,
  Filter,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

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

const typeIcons: Record<string, React.ReactNode> = {
  incident_triggered: <AlertCircle className="w-4 h-4 text-red-400" />,
  incident_acknowledged: <CheckCircle className="w-4 h-4 text-yellow-400" />,
  incident_resolved: <CheckCircle className="w-4 h-4 text-green-400" />,
  ticket_created: <Mail className="w-4 h-4 text-blue-400" />,
  ticket_updated: <Mail className="w-4 h-4 text-blue-400" />,
  mention: <AlertCircle className="w-4 h-4 text-purple-400" />,
  team_member_joined: <CheckCircle className="w-4 h-4 text-green-400" />,
  team_member_left: <X className="w-4 h-4 text-red-400" />,
  api_down: <AlertCircle className="w-4 h-4 text-red-400" />,
};

const typeColors: Record<string, string> = {
  incident_triggered: "border-red-500/30 bg-red-500/5",
  incident_acknowledged: "border-yellow-500/30 bg-yellow-500/5",
  incident_resolved: "border-green-500/30 bg-green-500/5",
  ticket_created: "border-blue-500/30 bg-blue-500/5",
  ticket_updated: "border-blue-500/30 bg-blue-500/5",
  mention: "border-purple-500/30 bg-purple-500/5",
  team_member_joined: "border-green-500/30 bg-green-500/5",
  team_member_left: "border-red-500/30 bg-red-500/5",
  api_down: "border-red-500/30 bg-red-500/5",
};

export default function NotificationsPage() {
  const { user, organization } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "30",
        ...(unreadOnly && { unread: "true" }),
      });
      const res = await api.get<PaginatedResponse<Notification>>(
        `/users/me/notifications?${params}`
      );
      setNotifications(res.data.data);
      setTotal(res.data.pagination.total);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, unreadOnly]);

  const handleMarkRead = async (notificationId: string) => {
    try {
      await api.put(`/users/me/notifications/${notificationId}/read`);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put(`/users/me/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
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

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-[#94a3b8] mt-1">Stay updated on incidents, tickets, and team activity</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-[#334155] border border-[#475569] rounded-xl text-sm font-medium text-[#94a3b8] hover:text-white hover:border-[#06b6d4]/50 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Mark All Read
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl p-4 border border-[#334155]">
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={e => { setUnreadOnly(e.target.checked); setPage(1); }}
              className="w-4 h-4 rounded border-[#334155] text-[#06b6d4] focus:ring-[#06b6d4]"
            />
            <span className="font-medium text-white">Show unread only</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">{unreadCount}</span>
            )}
          </label>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-[#334155] overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#06b6d4] animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-[#334155] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#94a3b8] mb-2">No notifications</h3>
            <p className="text-[#64748b]">You&apos;re all caught up!</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#334155]/50">
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 hover:bg-[#334155]/30 transition-colors ${!notification.read ? "bg-[#06b6d4]/5" : ""}`}
                >
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${typeColors[notification.type] || "border-[#334155] bg-[#0c0f1d]/50"}`}>
                      {typeIcons[notification.type] || <Bell className="w-4 h-4 text-[#64748b]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className={`font-medium ${!notification.read ? "text-white" : "text-[#94a3b8]"}`}>{notification.title}</h4>
                          <p className={`text-sm ${!notification.read ? "text-[#94a3b8]" : "text-[#64748b]"} mt-1`}>{notification.message}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#64748b]">{formatDate(notification.createdAt)}</span>
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkRead(notification.id)}
                              className="p-1.5 rounded-lg text-[#64748b] hover:text-white hover:bg-[#334155] transition-colors"
                              aria-label="Mark as read"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {total > 30 && (
              <div className="px-6 py-4 border-t border-[#334155] flex items-center justify-between">
                <p className="text-sm text-[#94a3b8]">
                  Showing {(page - 1) * 30 + 1} to {Math.min(page * 30, total)} of {total} notifications
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
                    disabled={page * 30 >= total}
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
    </div>
  );
}