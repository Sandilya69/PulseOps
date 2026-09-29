"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Mail,
  Activity,
  Settings,
  Bell,
  ShieldCheck,
  Server,
  Ticket,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
  User,
  Key,
  ChevronDown,
  AlertCircle,
  AlertTriangle,
  CalendarClock,
  BookOpen,
  Globe,
  BarChart2,
  BookMarked,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Navigation items organized by groups
const navigationGroups = [
  {
    label: "Monitoring",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "APIs", href: "/dashboard/apis", icon: Server },
      { name: "Incidents", href: "/dashboard/incidents", icon: AlertCircle },
      { name: "SLO Dashboard", href: "/dashboard/slo", icon: BarChart2 },
    ],
  },
  {
    label: "Alerting",
    items: [
      { name: "Alert Rules", href: "/dashboard/alerts/rules", icon: AlertTriangle },
      { name: "Alert History", href: "/dashboard/alerts/history", icon: Activity },
      { name: "On-call Schedules", href: "/dashboard/alerts/oncall", icon: CalendarClock },
    ],
  },
  {
    label: "Incidents",
    items: [
      { name: "Incidents", href: "/dashboard/incidents", icon: AlertCircle },
      { name: "Runbooks", href: "/dashboard/incidents/runbooks", icon: BookOpen },
      { name: "Status Pages", href: "/dashboard/statuspages", icon: Globe },
    ],
  },
  {
    label: "People",
    items: [
      { name: "Team", href: "/dashboard/team", icon: Users },
      { name: "Invitations", href: "/dashboard/invitations", icon: Mail },
      { name: "On-call Schedules", href: "/dashboard/alerts/oncall", icon: CalendarClock },
    ],
  },
  {
    label: "Support",
    items: [
      { name: "Tickets", href: "/dashboard/tickets", icon: Ticket },
      { name: "Knowledge Base", href: "/dashboard/kb", icon: BookMarked },
      { name: "Status Pages", href: "/dashboard/statuspages", icon: Globe },
    ],
  },
  {
    label: "Account",
    items: [
      { name: "Profile", href: "/dashboard/profile", icon: User },
      { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Activity Log", href: "/dashboard/activity", icon: Activity },
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

// Flatten for backward compatibility
const navigation = navigationGroups.flatMap((group) => group.items);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, organization, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) return null;

  return (
    <div className="flex h-screen w-full bg-[#0c0f1d] overflow-hidden text-white font-sans selection:bg-[#ff4b1f]/20">
      {/* Background Dots Pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30 z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 2c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z' fill='%2322d3ee' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full bg-[#0c0f1d]/95 backdrop-blur-xl border-r border-[#1e293b] flex flex-col transition-all duration-300 ease-in-out shadow-[4px_0_24px_rgba(0,0,0,0.3)]",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Logo & Org Selector */}
        <div className={cn("p-4 border-b border-[#1e293b] flex flex-col gap-4", sidebarOpen ? "" : "items-center")}>
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#ff4b1f] to-[#06b6d4] rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <span className="text-xl font-bold bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] bg-clip-text text-transparent">
                PulseOps
              </span>
            )}
          </Link>

          {sidebarOpen && (
            <div className="relative">
              <button className="w-full flex items-center justify-between px-3 py-2 text-sm bg-[#1e293b]/50 rounded-lg border border-[#334155] hover:border-[#06b6d4]/50 transition-colors">
                <span className="truncate font-medium">{organization?.name || "My Organization"}</span>
                <ChevronDown className="w-4 h-4 text-[#64748b] shrink-0" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto" aria-label="Main navigation">
          {navigationGroups.map((group) => (
            <div key={group.label} className="mb-6">
              {sidebarOpen && (
                <h3 className="px-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">
                  {group.label}
                </h3>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden",
                          isActive
                            ? "bg-gradient-to-r from-[#ff4b1f]/20 to-[#06b6d4]/20 text-white border border-[#ff4b1f]/30 shadow-[0_0_20px_rgba(255,75,31,0.1)]"
                            : "text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/50",
                          !sidebarOpen && "justify-center px-0"
                        )}
                        title={sidebarOpen ? undefined : item.name}
                      >
                        <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                        {sidebarOpen && <span>{item.name}</span>}
                        {isActive && sidebarOpen && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#ff4b1f] to-[#06b6d4]" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Menu & Toggle */}
        <div className="p-3 border-t border-[#1e293b]">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full",
              sidebarOpen
                ? "text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/50 justify-start"
                : "text-[#64748b] hover:text-white hover:bg-[#1e293b]/50 justify-center mx-auto"
            )}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? (
              <>
                <div className="w-8 h-8 bg-gradient-to-br from-[#ff4b1f] to-[#06b6d4] rounded-full flex items-center justify-center shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full" />
                  ) : (
                    <span className="text-white text-sm font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{user.name}</p>
                  <p className="truncate text-xs text-[#64748b] capitalize">{user.role}</p>
                </div>
                <ChevronLeft className="w-4 h-4 text-[#64748b]" />
              </>
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>

          {sidebarOpen && (
            <div className="mt-3 space-y-1">
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/50 transition-colors"
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </Link>
              <Link
                href="/dashboard/notifications"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/50 transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </Link>
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#f87171] hover:text-red-400 hover:bg-[#f87171]/10 transition-colors w-full"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 flex flex-col overflow-hidden transition-all duration-300",
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
        )}
      >
        {/* Top Bar */}
        <header className={cn(
          "sticky top-0 z-20 bg-[#0c0f1d]/80 backdrop-blur-xl border-b border-[#1e293b] transition-all duration-300",
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
        )}>
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/50 transition-colors"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:flex p-2 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/50 transition-colors"
                aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {sidebarOpen ? (
                  <ChevronLeft className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>

              {sidebarOpen && (
                <div className="hidden sm:flex items-center gap-2 bg-[#1e293b]/50 px-3 py-1.5 rounded-full border border-[#334155]">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-semibold text-green-400">ALL SYSTEMS OPERATIONAL</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <Link
                href="/dashboard/notifications"
                className="relative p-2 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/50 transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff4b1f] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#0c0f1d]">3</span>
              </Link>

              {/* User Avatar Dropdown */}
              <div className="relative">
                <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#1e293b]/50 transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#ff4b1f] to-[#06b6d4] rounded-full flex items-center justify-center">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full" />
                    ) : (
                      <span className="text-white text-sm font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-[1600px] w-full mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}