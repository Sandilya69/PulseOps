"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Server,
  Ticket,
  ShieldCheck,
} from "lucide-react";

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-[#1e293b]/50 backdrop-blur-sm rounded-3xl p-6 border border-[#334155] relative overflow-hidden group hover:border-[#06b6d4]/30 transition-all duration-500 ${className}`}>
    {children}
  </div>
);

function UptimeCard() {
  const [bars, setBars] = useState(() => Array.from({length: 30}, () => Math.random() * 20 + 80));
  
  useEffect(() => {
    const timer = setInterval(() => {
      setBars(prev => {
        const next = [...prev.slice(1), 100];
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="flex flex-col">
      <div className="flex justify-between items-start mb-6 w-full">
        <h3 className="text-xs uppercase font-bold tracking-widest text-green-400 flex items-center gap-2 bg-green-500/10 px-3 py-1 rounded-full w-min whitespace-nowrap border border-green-500/20">
          <ShieldCheck className="w-3 h-3" /> UPTIME
        </h3>
        <div className="text-[10px] font-bold text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full bg-green-500/10">Global</div>
      </div>
      
      <div className="flex-1 flex items-end justify-between gap-[2px] h-32 relative z-0 mt-4 opacity-80">
        {bars.map((h, i) => (
          <motion.div 
            key={i}
            initial={{ height: h }}
            animate={{ height: `${h}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className={`w-full rounded-t-sm ${i === 29 ? 'bg-green-500' : 'bg-[#334155]'}`}
          />
        ))}
        <div className="absolute bottom-0 left-[90%] w-[10%] h-full bg-gradient-to-t from-green-500/20 to-transparent blur-xl pointer-events-none" />
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div className="text-5xl font-black tracking-tighter">99.9<span className="text-2xl text-[#64748b] font-medium ml-1">%</span></div>
        <div className="text-xs font-semibold text-[#64748b] pb-1">API UPTIME</div>
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
    <Card className="flex flex-col relative bg-gradient-to-b from-blue-500/10 to-transparent">
      <h3 className="text-xs uppercase font-bold tracking-widest text-blue-400 flex items-center gap-2 bg-blue-500/10 px-3 py-1 rounded-full w-min whitespace-nowrap border border-blue-500/20 absolute top-6 z-10 left-6">
        <Server className="w-3 h-3" /> APIS
      </h3>

      <div className="flex-1 flex items-center justify-center relative min-h-[140px] mt-6">
        {[3, 2, 1].map((layer) => (
          <motion.div 
            key={`${pulse}-${layer}`}
            initial={{ scale: 0.8, opacity: 0.5, borderWidth: '1px' }}
            animate={{ scale: layer * 1.5, opacity: 0, borderWidth: '0px' }}
            transition={{ duration: 2.5, ease: "easeOut", delay: layer * 0.2 }}
            className="absolute rounded-full border-blue-500/50 pointer-events-none"
            style={{ width: 40, height: 40 }}
          />
        ))}
        {[30, 60, 90, 120].map((size, i) => (
          <div 
            key={`static-${i}`} 
            className="absolute rounded-full border border-[#334155]/60"
            style={{ width: size, height: size }}
          />
        ))}
        <div className="absolute w-8 h-8 bg-blue-500/20 rounded-full animate-pulse flex items-center justify-center">
          <div className="w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
        </div>
      </div>

      <div className="mt-auto flex items-end justify-between relative z-10">
        <div className="text-5xl font-black tracking-tighter">15<span className="text-3xl text-[#64748b] font-bold mx-2">/</span>15</div>
        <div className="text-xs font-semibold text-[#64748b] pb-1">APIS OPERATIONAL</div>
      </div>
    </Card>
  );
}

function OpenTicketsCard() {
  return (
    <Card className="flex flex-col bg-gradient-to-br from-indigo-500/10 to-transparent">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xs uppercase font-bold tracking-widest text-indigo-400 flex items-center gap-2 bg-indigo-500/10 px-3 py-1 rounded-full w-min whitespace-nowrap border border-indigo-500/20">
          <Ticket className="w-3 h-3" /> TICKETS
        </h3>
      </div>
      
      <div className="flex-1 relative flex items-center h-32 ml-4">
         <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
           <path d="M 0,50 C 30,50 30,20 60,20" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3"/>
           <path d="M 0,50 C 30,50 30,80 60,80" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3"/>
           
           <path d="M 60,20 C 80,20 80,10 100,10" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3"/>
           <path d="M 60,20 C 80,20 80,30 100,30" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3"/>
           
           <path d="M 60,80 C 80,80 80,70 100,70" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3"/>
           <path d="M 60,80 C 80,80 80,90 100,90" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3"/>
           
           {[
             {x: 0, y: 50, color: "#6366f1", size: 4},
             {x: 60, y: 20, color: "#a1a1aa", size: 2},
             {x: 60, y: 80, color: "#6366f1", size: 3},
             {x: 100, y: 70, color: "#6366f1", size: 2.5},
             {x: 100, y: 90, color: "#6366f1", size: 2.5},
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
        <div className="text-xs font-semibold text-[#64748b] pb-1">OPEN TICKETS</div>
      </div>
    </Card>
  );
}

function ActiveIncidentsCard() {
  const [points, setPoints] = useState(() => Array.from({length: 60}, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    active: Math.random() > 0.95
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
    <Card className="flex flex-col bg-gradient-to-b from-[#ff4b1f]/10 to-transparent">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xs uppercase font-bold tracking-widest text-[#ff4b1f] flex items-center gap-2 bg-[#ff4b1f]/10 px-3 py-1 rounded-full w-min whitespace-nowrap border border-[#ff4b1f]/20">
          <AlertCircle className="w-3 h-3" /> INCIDENTS
        </h3>
      </div>
      
      <div className="flex-1 relative flex items-center justify-center mt-2 h-32">
        <div className="w-32 h-32 rounded-full border border-[#334155] relative overflow-hidden bg-[#1e293b]/50 shadow-inner">
          <div className="absolute inset-x-0 h-px bg-[#334155] top-1/2" />
          <div className="absolute inset-y-0 w-px bg-[#334155] left-1/2" />
          {points.map((p, i) => (
             <motion.div 
               key={i}
               initial={false}
               animate={{ 
                 backgroundColor: p.active ? '#ff4b1f' : '#475569',
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
        <div className="text-xs font-semibold text-[#64748b] pb-1 flex flex-col items-end">
          <span>ACTIVE</span>
          <span>INCIDENTS</span>
        </div>
      </div>
    </Card>
  );
}

function GlobalLatencyCard() {
  const [dataList, setDataList] = useState<number[]>(() => {
    return Array.from({length: 120}, (_, i) => {
      const val = Math.sin(i * 0.1) * 30 + Math.sin(i * 0.05) * 20 + 50;
      return Math.max(5, val + (Math.random() * 15 - 7.5));
    });
  });
  
  useEffect(() => {
    let t = 0;
    const timer = setInterval(() => {
      t += 0.2;
      setDataList(prev => {
        const next = [...prev.slice(1)];
        const spike = Math.random() > 0.95 ? Math.random() * 80 : 0;
        const val = Math.sin(t) * 30 + Math.sin(t * 0.5) * 20 + 50 + spike;
        next.push(Math.max(5, Math.min(100, val)));
        return next;
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="h-full flex flex-col border-[#334155]">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-xs text-[#94a3b8] font-bold uppercase tracking-widest mb-1">Global Performance</h2>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-2">
            Regional <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] to-[#ff4b1f]">latency.</span>
          </h1>
        </div>
        <div className="flex gap-4 text-[10px] font-bold text-[#64748b] uppercase tracking-widest">
          <div>Y: Latency (ms)</div>
          <div>X: Real-time</div>
        </div>
      </div>

      <div className="flex-1 relative flex items-end gap-[3px] mt-4 z-10 w-full min-h-[160px]">
        <div className="absolute top-[20%] w-full flex items-center z-0">
          <div className="w-full h-px border-t border-dashed border-[#ff4b1f]/30" />
          <span className="text-[9px] text-[#ff4b1f] ml-2">500ms</span>
        </div>
        <div className="absolute top-[50%] w-full h-px border-t border-dashed border-[#334155] z-0" />
        <div className="absolute top-[80%] w-full h-px border-t border-dashed border-[#334155] z-0" />

        {dataList.map((val, i) => {
          let color = val > 80 ? 'bg-[#ff4b1f]' : val > 50 ? 'bg-white' : 'bg-[#64748b]';
          if (i > 115) color = 'bg-[#06b6d4]';
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
      
      <div className="mt-4 pt-4 border-t border-[#334155] flex justify-between text-[10px] font-bold text-[#64748b] uppercase tracking-widest">
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
    <Card className="h-full flex flex-col border-[#334155]">
       <div className="mb-8">
          <h2 className="text-xs text-[#94a3b8] font-bold uppercase tracking-widest mb-1">Alert Matrix</h2>
          <h1 className="text-xl font-bold text-white">Incident Distribution</h1>
       </div>

       <div className="flex-1 relative w-full flex items-end justify-center overflow-hidden min-h-[160px]">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMax meet">
            <path d="M 30,100 A 20 20 0 0 1 70,100" fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="1 2" />
            <path d="M 15,100 A 35 35 0 0 1 85,100" fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="1 2" />
            <path d="M 0,100 A 50 50 0 0 1 100,100" fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="1 2" />

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
                   fill={dot.active ? '#ff4b1f' : '#475569'}
                   className="transition-all duration-300"
                 />
               ))
            )}

            <circle cx="50" cy="100" r="4" fill="#0c0f1d" />
            <circle cx="50" cy="100" r="8" fill="none" stroke="#334155" strokeWidth="0.5" />
          </svg>
       </div>

       <div className="mt-4 pt-4 border-t border-[#334155] flex justify-between text-[10px] font-bold text-[#64748b] uppercase tracking-widest">
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
         <div className="bg-[#1e293b] border border-[#334155] shadow-sm px-3 py-1.5 rounded-md text-xs font-bold text-[#06b6d4] flex items-center gap-2">
           Daily Response Trending <div className="w-2 h-2 rounded-full bg-[#06b6d4] animate-pulse"/>
         </div>
         <div className="text-right">
           <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1">Today</div>
           <div className="text-xl font-black text-white">124<span className="text-[#64748b] font-medium text-sm ml-1">ms</span></div>
         </div>
       </div>

       <div className="flex-1 w-full relative min-h-[120px]">
          <div className="absolute inset-0 z-0" style={{ backgroundImage: 'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)', backgroundSize: '10% 25%' }} />
          
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
                 cx={p.x} cy={p.y} r={2} fill="#0c0f1d" stroke="#3b82f6" strokeWidth="1.5"
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 transition={{ delay: 1 + i * 0.2 }}
               />
             ))}

             <line x1="80" y1="0" x2="80" y2="100" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
             <line x1="0" y1="30" x2="100" y2="30" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
          </svg>

          <div className="absolute top-[20%] left-0">
             <div className="text-3xl font-black text-white font-mono tracking-tighter">89 <span className="text-xs text-[#64748b] font-sans tracking-widest ml-1">MIN</span></div>
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
    <Card className="h-full flex flex-col font-mono relative overflow-hidden bg-[#1e293b]/50">
       <div className="absolute top-0 right-0 p-6 flex items-center gap-2">
         <div className="border border-green-500/30 text-green-400 px-3 py-1 text-xs rounded-full bg-green-500/10 uppercase shadow-inner flex items-center gap-2">
           Next Check in <span className="font-bold">42s</span>
         </div>
       </div>

       <div className="flex items-center gap-2 mb-8 z-10 relative">
          <h2 className="text-sm font-bold text-white tracking-wider">HEALTH CHECK WATERFALL</h2>
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
       </div>

       <div className="flex-1 w-full border border-[#334155] rounded-lg p-6 flex flex-col gap-5 relative bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%,transparent_50%,#1e293b_50%,#1e293b_75%,transparent_75%,transparent)]" style={{ backgroundSize: '20px 20px' }}>
           
           <div className="flex justify-between text-[10px] text-[#64748b] border-b border-[#334155] pb-2 mb-2 bg-[#1e293b]/80 backdrop-blur -mt-2">
             <span>0ms</span>
             <span>100ms</span>
             <span>200ms</span>
             <span>300ms</span>
             <span>400ms</span>
           </div>

           <div className="flex items-center gap-4 relative z-10 bg-[#1e293b]/60 py-1">
              <div className="w-24 text-xs text-[#94a3b8] font-sans truncate">Auth API</div>
              <div className="flex-1 bg-[#1e293b] border border-[#334155] rounded-sm h-6 flex overflow-hidden">
                 <div className="w-[40%] bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] flex items-center px-2 shadow-sm relative">
                   DNS Resolving
                   <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-r from-transparent to-blue-500/10" />
                 </div>
                 <div className="w-[10%]"></div>
                 <div className="w-[20%] bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] flex items-center justify-center shadow-sm">
                   200 OK
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-4 relative z-10 bg-[#1e293b]/60 py-1">
              <div className="w-24 text-xs text-white font-bold font-sans truncate">Payment Gateway</div>
              <div className="flex-1 bg-[#1e293b] border border-[#334155] rounded-sm h-6 flex relative overflow-hidden">
                 <div className="absolute left-[30%] top-0 bottom-0 w-[50%] bg-[#ff4b1f] text-white text-[10px] flex items-center px-2 font-bold shadow-[0_2px_10px_rgba(255,75,31,0.2)]">
                   TLS Handshake
                   <div className="absolute left-0 top-0 bottom-0 bg-white/20" style={{ width: `${progress}%` }} />
                 </div>
                 <div className="absolute right-0 top-0 bottom-0 w-[20%] bg-[#334155] border-l border-[#475569] text-[#94a3b8] text-[10px] flex items-center justify-center">
                   Waiting...
                 </div>
                 <div className="absolute top-0 bottom-0 w-px bg-red-500 shadow-[0_0_5px_red] z-20 transition-all duration-75" style={{ left: `${30 + (progress/2)}%` }} />
              </div>
           </div>

           <div className="flex items-center gap-4 relative z-10 bg-[#1e293b]/60 py-1">
              <div className="w-24 text-xs text-[#94a3b8] font-sans truncate">User Service</div>
              <div className="flex-1 border border-transparent h-6 flex gap-2">
                 <div className="w-[15%] ml-[5%] border border-green-500/30 text-green-400 bg-green-500/10 text-[10px] flex items-center justify-center rounded-sm">Sync</div>
                 <div className="w-[15%] border border-green-500/30 text-green-400 bg-green-500/10 text-[10px] flex items-center justify-center rounded-sm">Data</div>
                 <div className="w-[30%] ml-[20%] border border-green-500/50 text-green-300 bg-green-500/20 text-[10px] flex items-center justify-center rounded-sm shadow-sm font-semibold">200 OK Response</div>
              </div>
           </div>

       </div>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-[#94a3b8] mt-1">Real-time overview of your infrastructure health</p>
        </div>
        <div className="flex items-center gap-2 bg-[#1e293b]/50 px-3 py-1.5 rounded-full border border-[#334155]">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-green-400">ALL SYSTEMS OPERATIONAL</span>
        </div>
      </div>

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ResponseTimeCurveCard />
        </div>
        <div className="lg:col-span-2">
          <LivePingTimelineCard />
        </div>
      </div>
    </div>
  );
}