"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/axios";
import {
  Loader2,
  Save,
  User,
  Mail,
  Bell,
  Shield,
  Key,
  Moon,
  Sun,
  Globe,
  Camera,
  Image,
  Loader,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  orgId: string;
  avatarUrl: string | null;
  phoneNumber: string | null;
  timezone: string;
  isActive: boolean;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  onboardingCompleted: boolean;
  notificationSettings: Record<string, unknown>;
  createdAt: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    subscriptionTier: string;
    subscriptionStatus: string;
    logoUrl: string | null;
  };
}

interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  severityFilter: string[];
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  quietHoursTimezone: string;
  dailyDigestEnabled: boolean;
  weeklyDigestEnabled: boolean;
  incidentUpdates: boolean;
  mentionNotify: boolean;
  teamChangesNotify: boolean;
}

const timezones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const severityOptions = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "security">("profile");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const [profileRes, notifRes] = await Promise.all([
        api.get<UserProfile>(`/auth/me`),
        api.get<NotificationPreferences>(`/users/me/notifications`),
      ]);
      setProfile(profileRes.data);
      if (profileRes.data.avatarUrl) setAvatarPreview(profileRes.data.avatarUrl);
      setNotifications(notifRes.data);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await api.put("/users/profile", {
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        phoneNumber: profile.phoneNumber,
        timezone: profile.timezone,
      });
      // Update auth store
      useAuthStore.getState().login(
        { ...user!, name: profile.name, avatarUrl: profile.avatarUrl },
        useAuthStore.getState().tokens!,
        useAuthStore.getState().organization!
      );
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationsSave = async () => {
    if (!notifications) return;
    setSaving(true);
    try {
      await api.put("/users/me/notifications", notifications);
      alert("Notification preferences saved!");
    } catch (error) {
      console.error("Failed to save notifications:", error);
      alert("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setSaving(true);
    try {
      await api.put("/users/me/password", {
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      alert("Password changed successfully!");
    } catch (error: unknown) {
      console.error("Failed to change password:", error);
      const message = error instanceof Error ? error.message : "Failed to change password. Please try again.";
      setPasswordError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be less than 2MB");
      return;
    }

    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      setAvatarPreview(dataUrl);
      setProfile(prev => prev ? { ...prev, avatarUrl: dataUrl } : null);
      
      // In a real app, you'd upload to your storage service
      // For now, we'll save the data URL directly
      try {
        await api.put("/users/profile", { avatarUrl: dataUrl });
      } catch (error) {
        console.error("Failed to upload avatar:", error);
      }
      setAvatarUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString([], {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#06b6d4] animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center p-12">
        <User className="w-12 h-12 text-[#334155] mx-auto mb-4" />
        <h3 className="text-lg font-medium text-[#94a3b8] mb-2">Profile not found</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile & Preferences</h1>
          <p className="text-[#94a3b8] mt-1">Manage your account, notifications, and security</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1e293b]/50 backdrop-blur-sm rounded-xl p-1 border border-[#334155]">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "profile"
              ? "bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white shadow-[0_0_20px_rgba(255,75,31,0.3)]"
              : "text-[#94a3b8] hover:text-white"
          }`}
        >
          <User className="w-4 h-4 inline mr-2" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "notifications"
              ? "bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white shadow-[0_0_20px_rgba(255,75,31,0.3)]"
              : "text-[#94a3b8] hover:text-white"
          }`}
        >
          <Bell className="w-4 h-4 inline mr-2" />
          Notifications
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "security"
              ? "bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white shadow-[0_0_20px_rgba(255,75,31,0.3)]"
              : "text-[#94a3b8] hover:text-white"
          }`}
        >
          <Shield className="w-4 h-4 inline mr-2" />
          Security
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-[#334155] overflow-hidden">
        {/* Profile Tab */}
        <AnimatePresence mode="wait">
          {activeTab === "profile" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 space-y-6"
            >
              {/* Avatar & Basic Info */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-4 bg-[#0c0f1d]/50 rounded-xl border border-[#334155]">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ff4b1f] to-[#06b6d4] flex items-center justify-center overflow-hidden">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-white">{getInitials(profile.name)}</span>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                    <Camera className="w-5 h-5 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={avatarUploading}
                    />
                    {avatarUploading && <Loader className="w-5 h-5 text-white animate-spin absolute" />}
                  </label>
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#94a3b8] mb-2">Full Name</label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={e => setProfile({ ...profile, name: e.target.value })}
                        className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#94a3b8] mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={profile.phoneNumber || ""}
                        onChange={e => setProfile({ ...profile, phoneNumber: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                        className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#94a3b8] mb-2">Timezone</label>
                      <select
                        value={profile.timezone}
                        onChange={e => setProfile({ ...profile, timezone: e.target.value })}
                        className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none"
                      >
                        {timezones.map(tz => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Account Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow label="Email" value={profile.email} />
                  <InfoRow label="Role" value={
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                    </span>
                  } />
                  <InfoRow label="Organization" value={profile.organization.name} />
                  <InfoRow label="Plan" value={
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {profile.organization.subscriptionTier.charAt(0).toUpperCase() + profile.organization.subscriptionTier.slice(1)}
                    </span>
                  } />
                  <InfoRow label="Member Since" value={formatDate(profile.createdAt)} />
                  <InfoRow label="Last Login" value={formatDate(profile.lastLoginAt)} />
                  <InfoRow label="Last Active" value={formatDate(profile.lastActiveAt)} />
                  <InfoRow label="Status" value={
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${profile.isActive ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                      {profile.isActive ? "Active" : "Inactive"}
                    </span>
                  } />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-[#334155] flex justify-end">
                <button
                  onClick={handleProfileSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && notifications && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 space-y-6"
            >
              {/* Alert Channels */}
              <div className="space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Alert Channels
                </h3>
                <p className="text-sm text-[#64748b]">Choose how you want to receive alerts</p>

                <div className="space-y-3">
                  {[
                    { key: "emailEnabled", label: "Email", icon: Mail, description: "Receive alerts via email", enabled: notifications.emailEnabled },
                    { key: "smsEnabled", label: "SMS", icon: null, description: "Receive critical alerts via SMS (requires phone number)", enabled: notifications.smsEnabled },
                    { key: "pushEnabled", label: "Push Notifications", icon: null, description: "Receive alerts via mobile push notifications", enabled: notifications.pushEnabled },
                  ].map(({ key, label, icon: Icon, description, enabled }) => (
                    <NotificationChannel
                      key={key}
                      label={label}
                      description={description}
                      enabled={enabled}
                      onChange={e => setNotifications({ ...notifications, [key]: e.target.checked })}
                      disabled={key === "smsEnabled" && !profile.phoneNumber}
                      disabledReason={key === "smsEnabled" && !profile.phoneNumber ? "Add a phone number in Profile to enable SMS" : undefined}
                    />
                  ))}
                </div>
              </div>

              {/* Severity Filter */}
              <div className="space-y-4 pt-4 border-t border-[#334155]">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Alert Severity Filter
                </h3>
                <p className="text-sm text-[#64748b]">Only receive alerts for these severity levels</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {severityOptions.map(({ value, label }) => (
                    <label key={value} className={`flex items-center gap-2 p-3 rounded-xl border transition-colors cursor-pointer ${
                      notifications.severityFilter.includes(value)
                        ? "border-[#06b6d4] bg-[#06b6d4]/10"
                        : "border-[#334155] hover:border-[#475569]"
                    }`}>
                      <input
                        type="checkbox"
                        checked={notifications.severityFilter.includes(value)}
                        onChange={e => {
                          const newFilter = e.target.checked
                            ? [...notifications.severityFilter, value]
                            : notifications.severityFilter.filter(s => s !== value);
                          setNotifications({ ...notifications, severityFilter: newFilter });
                        }}
                        className="w-4 h-4 rounded border-[#334155] text-[#06b6d4] focus:ring-[#06b6d4]"
                      />
                      <span className="font-medium text-white">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Quiet Hours */}
              <div className="space-y-4 pt-4 border-t border-[#334155]">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Moon className="w-5 h-5" />
                  Quiet Hours (Do Not Disturb)
                </h3>
                <p className="text-sm text-[#64748b]">Suppress non-critical alerts during specified hours</p>
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={notifications.quietHoursEnabled}
                      onChange={e => setNotifications({ ...notifications, quietHoursEnabled: e.target.checked })}
                      className="w-4 h-4 rounded border-[#334155] text-[#06b6d4] focus:ring-[#06b6d4]"
                    />
                    <span className="font-medium text-white">Enable Quiet Hours</span>
                  </label>
                  {notifications.quietHoursEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-7">
                      <div>
                        <label className="block text-sm font-medium text-[#94a3b8] mb-2">Start Time</label>
                        <input
                          type="time"
                          value={notifications.quietHoursStart}
                          onChange={e => setNotifications({ ...notifications, quietHoursStart: e.target.value })}
                          className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#94a3b8] mb-2">End Time</label>
                        <input
                          type="time"
                          value={notifications.quietHoursEnd}
                          onChange={e => setNotifications({ ...notifications, quietHoursEnd: e.target.value })}
                          className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#94a3b8] mb-2">Timezone</label>
                        <select
                          value={notifications.quietHoursTimezone || profile.timezone}
                          onChange={e => setNotifications({ ...notifications, quietHoursTimezone: e.target.value })}
                          className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:border-[#06b6d4] focus:outline-none transition-colors appearance-none"
                        >
                          {timezones.map(tz => (
                            <option key={tz} value={tz}>{tz}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-[#64748b] pl-7">
                    <strong>Critical alerts</strong> will still be delivered during quiet hours.
                  </p>
                </div>
              </div>

              {/* Digests */}
              <div className="space-y-4 pt-4 border-t border-[#334155]">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Sun className="w-5 h-5" />
                  Digest Emails
                </h3>
                <div className="space-y-3">
                  <NotificationToggle
                    label="Daily Digest"
                    description="Receive a daily summary of incidents and metrics at 9:00 AM"
                    enabled={notifications.dailyDigestEnabled}
                    onChange={e => setNotifications({ ...notifications, dailyDigestEnabled: e.target.checked })}
                  />
                  <NotificationToggle
                    label="Weekly Digest"
                    description="Receive a weekly report every Monday at 9:00 AM"
                    enabled={notifications.weeklyDigestEnabled}
                    onChange={e => setNotifications({ ...notifications, weeklyDigestEnabled: e.target.checked })}
                  />
                </div>
              </div>

              {/* Other Preferences */}
              <div className="space-y-4 pt-4 border-t border-[#334155]">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Other Preferences
                </h3>
                <div className="space-y-3">
                  <NotificationToggle
                    label="Incident Status Updates"
                    description="Get notified when incidents are acknowledged, resolved, or updated"
                    enabled={notifications.incidentUpdates}
                    onChange={e => setNotifications({ ...notifications, incidentUpdates: e.target.checked })}
                  />
                  <NotificationToggle
                    label="@Mentions in Incidents"
                    description="Get notified when you're mentioned in incident notes"
                    enabled={notifications.mentionNotify}
                    onChange={e => setNotifications({ ...notifications, mentionNotify: e.target.checked })}
                  />
                  <NotificationToggle
                    label="Team Changes"
                    description="Get notified when team members join, leave, or change roles"
                    enabled={notifications.teamChangesNotify}
                    onChange={e => setNotifications({ ...notifications, teamChangesNotify: e.target.checked })}
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-[#334155] flex justify-end">
                <button
                  onClick={handleNotificationsSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 space-y-6"
            >
              {/* Change Password */}
              <div className="space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Change Password
                </h3>
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors"
                    />
                    <p className="text-xs text-[#64748b] mt-1">Must be at least 8 characters</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#0c0f1d] border border-[#334155] rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:border-[#06b6d4] focus:outline-none transition-colors"
                    />
                  </div>
                  {passwordError && (
                    <p className="text-sm text-red-400">{passwordError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all disabled:opacity-50"
                  >
                    {saving ? "Changing..." : "Change Password"}
                  </button>
                </form>
              </div>

              {/* Sessions */}
              <div className="space-y-4 pt-4 border-t border-[#334155]">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Active Sessions
                </h3>
                <p className="text-sm text-[#64748b]">Manage your active login sessions</p>
                <div className="p-4 bg-[#0c0f1d]/50 rounded-xl border border-[#334155]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff4b1f] to-[#06b6d4] flex items-center justify-center">
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Current Session</p>
                        <p className="text-sm text-[#64748b]">This device · Active now</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">Active</span>
                  </div>
                </div>
                <button className="w-full px-4 py-2.5 bg-[#334155] border border-[#475569] rounded-xl font-medium text-white hover:bg-[#475569] transition-colors">
                  Log Out of All Other Sessions
                </button>
              </div>

              {/* Danger Zone */}
              <div className="space-y-4 pt-4 border-t border-red-500/30">
                <h3 className="font-semibold text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </h3>
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-sm text-red-400/80 mb-4">
                    Deleting your account will permanently remove all your data. This action cannot be undone.
                  </p>
                  <button className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-medium hover:bg-red-500/30 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>

              {/* Logout */}
              <div className="pt-4 border-t border-[#334155] flex justify-end">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#334155] border border-[#475569] text-white rounded-xl font-medium hover:bg-[#475569] transition-colors"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-3 bg-[#0c0f1d]/50 rounded-xl border border-[#334155]">
      <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">{label}</p>
      <div>{value}</div>
    </div>
  );
}

function NotificationChannel({ label, description, enabled, onChange, disabled, disabledReason, icon }: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  disabledReason?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className={`p-4 rounded-xl border transition-colors flex items-center gap-4 ${
      enabled
        ? "border-[#06b6d4] bg-[#06b6d4]/5"
        : "border-[#334155] hover:border-[#475569]"
    } ${disabled ? "opacity-50" : ""}`}>
      {icon && <span className="w-5 h-5 text-[#64748b] flex-shrink-0">{icon}</span>}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{label}</span>
          {disabled && <span className="px-1.5 py-0.5 text-[10px] font-medium bg-yellow-500/20 text-yellow-400 rounded">Requires Setup</span>}
        </div>
        <p className="text-sm text-[#64748b] mt-0.5">{description}</p>
        {disabledReason && <p className="text-xs text-yellow-400/80 mt-1">{disabledReason}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-600 peer-focus:ring-2 peer-focus:ring-[#06b6d4] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#06b6d4]"></div>
      </label>
    </div>
  );
}

function NotificationToggle({ label, description, enabled, onChange }: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className={`p-4 rounded-xl border transition-colors flex items-center justify-between ${
      enabled
        ? "border-[#06b6d4] bg-[#06b6d4]/5"
        : "border-[#334155] hover:border-[#475569]"
    }`}>
      <div>
        <p className="font-medium text-white">{label}</p>
        <p className="text-sm text-[#64748b] mt-0.5">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={onChange}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-600 peer-focus:ring-2 peer-focus:ring-[#06b6d4] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#06b6d4]"></div>
      </label>
    </div>
  );
}