"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user, organization, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex justify-between items-center border-b border-zinc-800 pb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.name}</h1>
            <p className="text-zinc-400 mt-1">
              Currently managing <span className="text-primary font-medium">{organization?.name}</span>
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
          >
            Sign Out
          </Button>
        </header>

        {/* Dashboard content grid will go here */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="h-48 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-white">0</span>
              <span className="text-sm text-zinc-400 mt-2">Active Incidents</span>
           </div>
           <div className="h-48 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-white">0</span>
              <span className="text-sm text-zinc-400 mt-2">Open Tickets</span>
           </div>
           <div className="h-48 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-white">100%</span>
              <span className="text-sm text-zinc-400 mt-2">API Uptime</span>
           </div>
        </div>

      </div>
    </div>
  );
}
