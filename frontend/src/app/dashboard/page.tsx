"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Bell, Mail, Activity, AlertCircle, ChevronDown, AlignLeft, Hexagon, Server, Ticket, ShieldCheck, Zap } from "lucide-react";

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
    <div className="flex h-screen w-full bg-[#f6f7f9] overflow-hidden text-[#1a1a1a] font-sans selection:bg-[#ff4b1f]/20">
      {/* Background Dots Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-40 z-0" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 2c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z' fill='%23d1d5db' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '24px 24px'
        }}
      />

      <Sidebar organizationName={organization?.name || "My Organization"} />

      <main className="flex-1 flex flex-col pt-4 px-6 overflow-y-auto z-10 relative">
        <TopBar userName={user.name} onLogout={() => { logout(); router.push("/login"); }} />

        <div className="flex-1 py-6 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Top Row: 4 Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <UptimeCard />
            <ActiveApisCard />
            <OpenTicketsCard />
            <ActiveIncidentsCard />
          </div>

          {/* Middle Row: Wide Data Topography */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <GlobalLatencyCard />
            </div>
            <div className="lg:col-span-1">
              <AlertDistributionCard />
            </div>
          </div>

          {/* Bottom Row: Validation Curve & Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
            <div className="lg:col-span-1">
              <ResponseTimeCurveCard />
            </div>
            <div className="lg:col-span-2">
              <LivePingTimelineCard />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// -------------------------------------------------------------------------------- //
// SIDEBAR & TOPNAV
// -------------------------------------------------------------------------------- //

function Sidebar({ organizationName }: { organizationName: string }) {
  const apis = ["Payment Gateway", "User Service", "Auth API", "Notification Service", "Billing API"];
  
  return (
    <aside className="w-64 bg-white/80 backdrop-blur-xl border-r border-[#e5e7eb] flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="p-6 border-b border-[#e5e7eb]">
        <div className="text-xs text-gray-500 font-semibold tracking-wider mb-1">PulseOps /</div>
        <div className="text-lg font-bold flex items-center justify-between cursor-pointer truncate max-w-full">
          {organizationName} <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        </div>
      </div>
      
      <div className="py-6 px-4 flex-1 overflow-y-auto">
        <div className="flex items-center gap-3 px-3 py-2 text-[#ff4b1f] bg-[#ff4b1f]/10 rounded-md font-semibold mb-8 cursor-pointer">
          <Activity className="w-4 h-4" /> DASHBOARD
        </div>

        <div className="text-[10px] uppercase font-bold text-gray-400 tracking-widest pl-3 mb-4 flex justify-between">
          MONITORED APIs <AlignLeft className="w-3 h-3" />
        </div>

        <div className="space-y-1">
          {apis.map((api, i) => (
            <div key={i} className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md cursor-pointer ${i === 0 ? 'text-[#1a1a1a] font-medium bg-gray-100' : 'text-gray-500 hover:bg-gray-50/50'}`}>
              <div className={`w-2 h-2 rounded-full ${i === 2 ? 'bg-[#ff4b1f] animate-pulse' : 'bg-green-500'}`} />
              <span className="truncate">{api}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-[#e5e7eb] text-sm font-medium text-gray-500 hover:text-gray-900 cursor-pointer">
        TEAM & SETTINGS
      </div>
    </aside>
  );
}

function TopBar({ userName, onLogout }: { userName: string, onLogout: () => void }) {
  return (
    <header className="flex justify-between items-center w-full bg-white/60 backdrop-blur-md rounded-2xl px-6 py-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-white/40">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm text-sm border border-gray-100">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="font-semibold text-gray-600">ALL SYSTEMS OPERATIONAL</span>
        </div>
        <div className="text-sm font-medium text-gray-500 hidden md:block">
          Welcome back, {userName}
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">REQUESTS/MIN</div>
          <div className="text-2xl font-bold text-gray-900 leading-none mt-1 group">
             14,230
          </div>
        </div>
        
        <div className="h-10 w-px bg-gray-200" />
        
        <div className="flex items-center gap-4">
          <div className="relative text-gray-400 hover:text-[#ff4b1f] cursor-pointer transition">
            <AlertCircle className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#ff4b1f] text-white text-[9px] font-bold rounded-full flex gap-0 items-center justify-center border-2 border-white">2</div>
          </div>
          <div className="relative text-gray-400 hover:text-blue-500 cursor-pointer transition">
            <Ticket className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 text-white text-[9px] font-bold rounded-full flex gap-0 items-center justify-center border-2 border-white">4</div>
          </div>
          
          <button onClick={onLogout} className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-1.5 rounded-full text-sm font-semibold transition">
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
}

// -------------------------------------------------------------------------------- //
// WIDGET COMPONENTS
// -------------------------------------------------------------------------------- //

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/50 relative overflow-hidden group hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] transition-shadow duration-500 ${className}`}>
    {children}
  </div>
);

function UptimeCard() {
  const [bars, setBars] = useState(() => Array.from({length: 30}, () => Math.random() * 20 + 80));
  
  useEffect(() => {
    const timer = setInterval(() => {
      setBars(prev => {
        const next = [...prev.slice(1), 100]; // simulate perfect 100 at the head currently
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="flex flex-col">
      <div className="flex justify-between items-start mb-6 w-full">
        <h3 className="text-xs uppercase font-bold tracking-widest text-green-600 flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full w-min whitespace-nowrap border border-green-100">
          <ShieldCheck className="w-3 h-3" /> UPTIME
        </h3>
        <div className="text-[10px] font-bold text-green-600 border border-green-200 px-2 py-0.5 rounded-full bg-green-50">Global</div>
      </div>
      
      <div className="flex-1 flex items-end justify-between gap-[2px] h-32 relative z-0 mt-4 opacity-80">
        {bars.map((h, i) => (
          <motion.div 
            key={i}
            initial={{ height: h }}
            animate={{ height: `${h}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className={`w-full rounded-t-sm ${i === 29 ? 'bg-green-500' : 'bg-gray-200'}`}
          />
        ))}
        {/* Glow effect on the active bar */}
        <div className="absolute bottom-0 left-[90%] w-[10%] h-full bg-gradient-to-t from-green-500/20 to-transparent blur-xl pointer-events-none" />
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div className="text-5xl font-black tracking-tighter">99.9<span className="text-2xl text-gray-400 font-medium ml-1">%</span></div>
        <div className="text-xs font-semibold text-gray-400 pb-1">API UPTIME</div>
      </div>
    </Card>
  );
}

function ActiveApisCard() {
  const [pulse, setPulse] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setPulse(p => p + 1);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="flex flex-col relative bg-gradient-to-b from-blue-50/50 to-white">
      <h3 className="text-xs uppercase font-bold tracking-widest text-blue-600 flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full w-min whitespace-nowrap border border-blue-100 absolute top-6 z-10 left-6">
        <Server className="w-3 h-3" /> APIS
      </h3>

      <div className="flex-1 flex items-center justify-center relative min-h-[140px] mt-6">
        {/* Concentric circles */}
        {[3, 2, 1].map((layer) => (
          <motion.div 
            key={`${pulse}-${layer}`}
            initial={{ scale: 0.8, opacity: 0.5, borderWidth: '1px' }}
            animate={{ scale: layer * 1.5, opacity: 0, borderWidth: '0px' }}
            transition={{ duration: 2.5, ease: "easeOut", delay: layer * 0.2 }}
            className="absolute rounded-full border-blue-500 pointer-events-none"
            style={{ width: 40, height: 40 }}
          />
        ))}
        {[30, 60, 90, 120].map((size, i) => (
          <div 
            key={`static-${i}`} 
            className="absolute rounded-full border border-gray-200/60"
            style={{ width: size, height: size }}
          />
        ))}
        <div className="absolute w-8 h-8 bg-blue-500/20 rounded-full animate-pulse flex items-center justify-center">
          <div className="w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_blue]" />
        </div>
      </div>

      <div className="mt-auto flex items-end justify-between relative z-10">
        <div className="text-5xl font-black tracking-tighter">15<span className="text-3xl text-gray-400 font-bold mx-2">/</span>15</div>
        <div className="text-xs font-semibold text-gray-400 pb-1">APIS OPERATIONAL</div>
      </div>
    </Card>
  );
}

function OpenTicketsCard() {
  return (
    <Card className="flex flex-col bg-gradient-to-br from-indigo-50/50 to-white">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xs uppercase font-bold tracking-widest text-indigo-500 flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full w-min whitespace-nowrap border border-indigo-100">
          <Ticket className="w-3 h-3" /> TICKETS
        </h3>
      </div>
      
      <div className="flex-1 relative flex items-center h-32 ml-4">
         <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
           {/* Ticket routing map representation */}
           <path d="M 0,50 C 30,50 30,20 60,20" fill="none" stroke="#e5e7eb" strokeWidth="1.5" strokeDasharray="3 3"/>
           <path d="M 0,50 C 30,50 30,80 60,80" fill="none" stroke="#e5e7eb" strokeWidth="1.5" strokeDasharray="3 3"/>
           
           <path d="M 60,20 C 80,20 80,10 100,10" fill="none" stroke="#e5e7eb" strokeWidth="1.5" strokeDasharray="3 3"/>
           <path d="M 60,20 C 80,20 80,30 100,30" fill="none" stroke="#e5e7eb" strokeWidth="1.5" strokeDasharray="3 3"/>
           
           <path d="M 60,80 C 80,80 80,70 100,70" fill="none" stroke="#e5e7eb" strokeWidth="1.5" strokeDasharray="3 3"/>
           <path d="M 60,80 C 80,80 80,90 100,90" fill="none" stroke="#e5e7eb" strokeWidth="1.5" strokeDasharray="3 3"/>
           
           {[
             {x: 0, y: 50, color: "#6366f1", size: 4}, // Entry
             {x: 60, y: 20, color: "#a1a1aa", size: 2}, // Resolved
             {x: 60, y: 80, color: "#6366f1", size: 3}, // Open routing
             {x: 100, y: 70, color: "#6366f1", size: 2.5}, // Active Ticket 1
             {x: 100, y: 90, color: "#6366f1", size: 2.5}, // Active Ticket 2
           ].map((node, i) => (
             <motion.circle 
                key={i}
                cx={node.x} cy={node.y} r={node.size} fill={node.color}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1, type: 'spring' }}
             />
           ))}
         </svg>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div className="text-5xl font-black tracking-tighter">4</div>
        <div className="text-xs font-semibold text-gray-400 pb-1">OPEN TICKETS</div>
      </div>
    </Card>
  );
}

function ActiveIncidentsCard() {
  const [points, setPoints] = useState(() => Array.from({length: 60}, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    active: Math.random() > 0.95 // Very few active incidents
  })));

  useEffect(() => {
    const timer = setInterval(() => {
      setPoints(prev => prev.map(p => ({
        ...p,
        active: Math.random() > 0.98
      })));
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="flex flex-col bg-gradient-to-b from-[#fff5f2]/50 to-white">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xs uppercase font-bold tracking-widest text-[#ff4b1f] flex items-center gap-2 bg-[#ff4b1f]/5 px-3 py-1 rounded-full w-min whitespace-nowrap border border-[#ff4b1f]/10">
          <AlertCircle className="w-3 h-3" /> INCIDENTS
        </h3>
      </div>
      
      <div className="flex-1 relative flex items-center justify-center mt-2 h-32">
        <div className="w-32 h-32 rounded-full border border-gray-100 relative overflow-hidden bg-white/50 shadow-inner">
          <div className="absolute inset-x-0 h-px bg-gray-100 top-1/2" />
          <div className="absolute inset-y-0 w-px bg-gray-100 left-1/2" />
          {points.map((p, i) => (
             <motion.div 
               key={i}
               initial={false}
               animate={{ 
                 backgroundColor: p.active ? '#ff4b1f' : '#d1d5db',
                 scale: p.active ? 1.5 : 1
               }}
               className="absolute rounded-full w-1.5 h-1.5 -ml-[3px] -mt-[3px]"
               style={{ left: `${p.x}%`, top: `${p.y}%` }}
               transition={{ duration: 0.5 }}
             />
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div className="text-5xl font-black tracking-tighter">0</div>
        <div className="text-xs font-semibold text-gray-400 pb-1 flex flex-col items-end">
          <span>ACTIVE</span>
          <span>INCIDENTS</span>
        </div>
      </div>
    </Card>
  );
}

function GlobalLatencyCard() {
  const [dataList, setDataList] = useState<number[]>([]);
  
  useEffect(() => {
    // Generate an organic looking latency chart
    let t = 0;
    const initialData = Array.from({length: 120}, (_, i) => {
      let val = Math.sin(i * 0.1) * 30 + Math.sin(i * 0.05) * 20 + 50;
      return Math.max(5, val + (Math.random() * 15 - 7.5));
    });
    setDataList(initialData);

    const timer = setInterval(() => {
      t += 0.2;
      setDataList(prev => {
        const next = [...prev.slice(1)];
        // Add random high latency spikes simulating server load
        let spike = Math.random() > 0.95 ? Math.random() * 80 : 0;
        let val = Math.sin(t) * 30 + Math.sin(t * 0.5) * 20 + 50 + spike;
        next.push(Math.max(5, Math.min(100, val)));
        return next;
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="h-full flex flex-col border-gray-200">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Global Performance</h2>
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight flex items-baseline gap-2">
            Regional <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-300">latency.</span>
          </h1>
        </div>
        <div className="flex gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <div>Y: Latency (ms)</div>
          <div>X: Real-time</div>
        </div>
      </div>

      <div className="flex-1 relative flex items-end gap-[3px] mt-4 z-10 w-full min-h-[160px]">
        {/* Helper dashed lines with labels */}
        <div className="absolute top-[20%] w-full flex items-center z-0">
          <div className="w-full h-px border-t border-dashed border-[#ff4b1f]/30" />
          <span className="text-[9px] text-[#ff4b1f] ml-2">500ms</span>
        </div>
        <div className="absolute top-[50%] w-full h-px border-t border-dashed border-gray-200 z-0" />
        <div className="absolute top-[80%] w-full h-px border-t border-dashed border-gray-200 z-0" />

        {dataList.map((val, i) => {
          // Color coding based on latency height
          let color = val > 80 ? 'bg-[#ff4b1f]' : val > 50 ? 'bg-gray-800' : 'bg-gray-400';
          if (i > 115) color = 'bg-blue-500'; // Current leading edge
          return (
            <motion.div 
              key={i}
              initial={{ height: val }}
              animate={{ height: `${val}%` }}
              transition={{ type: 'tween', duration: 0.1 }}
              className={`w-full rounded-t-sm z-10 opacity-90 ${color}`}
            />
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        <div>US-East-1</div>
        <div>EU-Central-1</div>
        <div>AP-South-1</div>
        <div>Global Avg</div>
      </div>
    </Card>
  );
}

function AlertDistributionCard() {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPulse(p => (p + 1) % 360);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const generateDots = (radius: number, count: number, offset: number) => {
    return Array.from({length: count}).map((_, i) => {
      const angle = (i / count) * Math.PI + offset;
      const x = 50 + radius * Math.cos(angle);
      const y = 100 - radius * Math.sin(angle); 
      return {x, y, active: Math.random() > 0.85};
    });
  };

  const layers = useMemo(() => [
    generateDots(20, 8, pulse * 0.01),
    generateDots(35, 12, -pulse * 0.015),
    generateDots(50, 20, pulse * 0.005),
  ], [pulse]);

  return (
    <Card className="h-full flex flex-col border-gray-200">
       <div className="mb-8">
          <h2 className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Alert Matrix</h2>
          <h1 className="text-xl font-bold text-gray-900">Incident Distribution</h1>
       </div>

       <div className="flex-1 relative w-full flex items-end justify-center overflow-hidden min-h-[160px]">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMax meet">
            {/* Base semicircles */}
            <path d="M 30,100 A 20 20 0 0 1 70,100" fill="none" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="1 2" />
            <path d="M 15,100 A 35 35 0 0 1 85,100" fill="none" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="1 2" />
            <path d="M 0,100 A 50 50 0 0 1 100,100" fill="none" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="1 2" />

            {/* Scanning radar line */}
            <motion.path 
              d="M 50,100 L 100,100"
              fill="none" 
              stroke="url(#radarGrad)" 
              strokeWidth="2"
              style={{ transformOrigin: '50px 100px' }}
              animate={{ rotate: [-180, 0] }}
              transition={{ duration: 4, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
            />

            <defs>
              <linearGradient id="radarGrad">
                <stop offset="0%" stopColor="#ff4b1f" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#ff4b1f" stopOpacity="0"/>
              </linearGradient>
            </defs>

            {layers.map((layer, lIdx) => 
               layer.map((dot, dIdx) => (
                 <circle 
                   key={`${lIdx}-${dIdx}`}
                   cx={dot.x} 
                   cy={dot.y} 
                   r={dot.active ? 1.5 : 0.8} 
                   fill={dot.active ? '#ff4b1f' : '#d1d5db'}
                   className="transition-all duration-300"
                 />
               ))
            )}

            {/* Core */}
            <circle cx="50" cy="100" r="4" fill="#1a1a1a" />
            <circle cx="50" cy="100" r="8" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
          </svg>
       </div>

       <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        <div>Frequency</div>
        <div>Severity (Δ)</div>
      </div>
    </Card>
  );
}

function ResponseTimeCurveCard() {
  const points = [
    {x: 0, y: 80},
    {x: 20, y: 75},
    {x: 40, y: 60},
    {x: 60, y: 55},
    {x: 80, y: 30},
    {x: 100, y: 50},
  ];

  const pathD = `M ${points[0].x},${points[0].y} 
                 C 10,${points[0].y} 10,${points[1].y} ${points[1].x},${points[1].y}
                 C 30,${points[1].y} 30,${points[2].y} ${points[2].x},${points[2].y}
                 C 50,${points[2].y} 50,${points[3].y} ${points[3].x},${points[3].y}
                 C 70,${points[3].y} 70,${points[4].y} ${points[4].x},${points[4].y}
                 C 90,${points[4].y} 90,${points[5].y} ${points[5].x},${points[5].y}`;

  return (
    <Card className="h-full flex flex-col">
       <div className="flex justify-between items-start mb-6">
         <div className="bg-white border border-gray-200 shadow-sm px-3 py-1.5 rounded-md text-xs font-bold text-gray-700 flex items-center gap-2">
           Daily Response Trending <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"/>
         </div>
         <div className="text-right">
           <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Today</div>
           <div className="text-xl font-black text-gray-800">124<span className="text-gray-400 font-medium text-sm ml-1">ms</span></div>
         </div>
       </div>

       <div className="flex-1 w-full relative min-h-[120px]">
          {/* Grid lines grid background */}
          <div className="absolute inset-0 z-0" style={{ backgroundImage: 'linear-gradient(to right, #f3f4f6 1px, transparent 1px), linear-gradient(to bottom, #f3f4f6 1px, transparent 1px)', backgroundSize: '10% 25%' }} />
          
          <svg className="w-full h-full relative z-10 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
             <path d={`${pathD} L 100,100 L 0,100 Z`} fill="url(#fillGrad2)" opacity="0.3" />
             <defs>
               <linearGradient id="fillGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                 <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                 <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
               </linearGradient>
             </defs>

             <motion.path 
               d={pathD} 
               fill="none" 
               stroke="#3b82f6" 
               strokeWidth="3"
               initial={{ pathLength: 0 }}
               animate={{ pathLength: 1 }}
               transition={{ duration: 2, ease: "easeInOut" }}
             />

             {points.map((p, i) => (
               <motion.circle 
                 key={i}
                 cx={p.x} cy={p.y} r={2} fill="white" stroke="#3b82f6" strokeWidth="1.5"
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 transition={{ delay: 1 + i * 0.2 }}
               />
             ))}

             <line x1="80" y1="0" x2="80" y2="100" stroke="#f3f4f6" strokeWidth="0.5" strokeDasharray="2 2" />
             <line x1="0" y1="30" x2="100" y2="30" stroke="#f3f4f6" strokeWidth="0.5" strokeDasharray="2 2" />
          </svg>

          <div className="absolute top-[20%] left-0">
             <div className="text-3xl font-black text-gray-900 font-mono tracking-tighter">89 <span className="text-xs text-gray-400 font-sans tracking-widest ml-1">MIN</span></div>
          </div>
       </div>
    </Card>
  );
}

function LivePingTimelineCard() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
     const timer = setInterval(() => {
        setProgress(p => {
           if (p >= 100) return 0;
           return p + 0.5;
        });
     }, 100);
     return () => clearInterval(timer);
  }, []);

  return (
    <Card className="h-full flex flex-col font-mono relative overflow-hidden bg-white">
       <div className="absolute top-0 right-0 p-6 flex items-center gap-2">
         <div className="border border-green-200 text-green-700 px-3 py-1 text-xs rounded-full bg-green-50 uppercase shadow-inner flex items-center gap-2">
           Next Check in <span className="font-bold">42s</span>
         </div>
       </div>

       <div className="flex items-center gap-2 mb-8 z-10 relative">
          <h2 className="text-sm font-bold text-gray-800 tracking-wider">HEALTH CHECK WATERFALL</h2>
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_green]" />
       </div>

       <div className="flex-1 w-full border border-gray-100 rounded-lg p-6 flex flex-col gap-5 relative bg-[linear-gradient(45deg,#f9fafb_25%,transparent_25%,transparent_50%,#f9fafb_50%,#f9fafb_75%,transparent_75%,transparent)]" style={{ backgroundSize: '20px 20px' }}>
          
          <div className="flex justify-between text-[10px] text-gray-400 border-b border-gray-200 pb-2 mb-2 bg-white/80 backdrop-blur -mt-2">
            <span>0ms</span>
            <span>100ms</span>
            <span>200ms</span>
            <span>300ms</span>
            <span>400ms</span>
          </div>

          <div className="flex items-center gap-4 relative z-10 bg-white/60 py-1">
             <div className="w-24 text-xs text-gray-500 font-sans truncate">Auth API</div>
             <div className="flex-1 bg-white border border-gray-200 rounded-sm h-6 flex overflow-hidden">
                <div className="w-[40%] bg-blue-50 border border-blue-200 text-blue-600 text-[10px] flex items-center px-2 shadow-sm relative">
                  DNS Resolving
                  <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-r from-transparent to-blue-500/10" />
                </div>
                <div className="w-[10%]"></div>
                <div className="w-[20%] bg-green-50 border border-green-200 text-green-600 text-[10px] flex items-center justify-center shadow-sm">
                  200 OK
                </div>
             </div>
          </div>

          <div className="flex items-center gap-4 relative z-10 bg-white/60 py-1">
             <div className="w-24 text-xs text-gray-900 font-bold font-sans truncate">Payment Gateway</div>
             <div className="flex-1 bg-white border border-gray-200 rounded-sm h-6 flex relative overflow-hidden">
                <div className="absolute left-[30%] top-0 bottom-0 w-[50%] bg-[#ff4b1f] text-white text-[10px] flex items-center px-2 font-bold shadow-[0_2px_10px_rgba(255,75,31,0.2)]">
                  TLS Handshake
                  <div className="absolute left-0 top-0 bottom-0 bg-white/20" style={{ width: `${progress}%` }} />
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-[20%] bg-gray-100 border-l border-gray-200 text-gray-400 text-[10px] flex items-center justify-center">
                  Waiting...
                </div>
                <div className="absolute top-0 bottom-0 w-px bg-red-500 shadow-[0_0_5px_red] z-20 transition-all duration-75" style={{ left: `${30 + (progress/2)}%` }} />
             </div>
          </div>

          <div className="flex items-center gap-4 relative z-10 bg-white/60 py-1">
             <div className="w-24 text-xs text-gray-500 font-sans truncate">User Service</div>
             <div className="flex-1 border border-transparent h-6 flex gap-2">
                <div className="w-[15%] ml-[5%] border border-green-300 text-green-700 bg-green-50/50 text-[10px] flex items-center justify-center rounded-sm">Sync</div>
                <div className="w-[15%] border border-green-300 text-green-700 bg-green-50/50 text-[10px] flex items-center justify-center rounded-sm">Data</div>
                <div className="w-[30%] ml-[20%] border border-green-400 text-green-800 bg-green-100 text-[10px] flex items-center justify-center rounded-sm shadow-sm font-semibold">200 OK Response</div>
             </div>
          </div>

       </div>
    </Card>
  );
}
