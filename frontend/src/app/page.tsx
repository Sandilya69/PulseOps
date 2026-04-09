"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Play, Activity, Bell, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Advanced Scroll Animations
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroY = useTransform(scrollY, [0, 500], [0, 100]);
  const videoScale = useTransform(scrollY, [0, 500], [1, 1.1]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Performance enhancement: Pause video when out of viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(() => {});
        } else {
          videoRef.current?.pause();
        }
      },
      { threshold: 0 }
    );
    
    if (videoRef.current) {
      observer.observe(videoRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-blue-500/30">
      
      {/* NAVBAR */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out px-6 md:px-12 py-4 flex items-center justify-between ${
          isScrolled 
            ? "bg-zinc-950/80 backdrop-blur-lg border-b border-white/10 py-3 shadow-lg" 
            : "bg-transparent"
        }`}
      >
        <div className="flex items-center gap-2">
         <img src="/photos/homelogo.png" alt="PulseOps Logo" className="h-20 md:h-32 w-auto object-contain drop-shadow-md" />
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#solutions" className="hover:text-white transition-colors">Solutions</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="#about" className="hover:text-white transition-colors">About</Link>
        </nav>
        
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition">
            Login
          </Link>
          <Link href="/signup">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-6 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)]">
              Sign Up
            </Button>
          </Link>
        </div>
      </header>

      {/* HERO SECTION (80vh) */}
      <section className="relative w-full h-[80vh] overflow-hidden flex items-center justify-center bg-black">
        {/* Background Video w/ Zoom Scroll Animation */}
        <motion.div style={{ scale: videoScale }} className="absolute inset-0 w-full h-full">
          <video
            ref={videoRef}
            src="/videos/home.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </motion.div>
        
        {/* Dark Gradient Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.8) 40%, rgba(0,0,0,0.95) 100%)' }} 
        />

        {/* Hero Content */}
        <motion.div 
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mt-12"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
              Real-Time API Monitoring.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                Zero Downtime Stress.
              </span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          >
            <p className="text-lg md:text-xl text-zinc-300 mb-10 max-w-2xl font-medium leading-relaxed">
              Highly scalable monitoring, intelligent alerting, and seamless incident management to keep your systems reliable and always available.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 w-full justify-center"
          >
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white rounded-full px-8 h-14 text-[1rem] shadow-[0_0_20px_rgba(37,99,235,0.4)] border-none">
                Start Monitoring <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full px-8 h-14 text-[1rem] bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white backdrop-blur">
                <Play className="mr-2 w-4 h-4 fill-white" /> Request a Demo
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* WHITE SECTIONS BELOW HERO */}
      <div className="bg-white relative z-20">
        
        {/* LOGOS / SOCIAL PROOF */}
        <section className="py-12 border-b border-zinc-100 bg-zinc-50/50">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-8">Trusted by elite engineering teams</p>
            <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale">
              {/* Replace with actual SVGs or icons */}
              <div className="text-xl font-bold flex items-center gap-2"><div className="w-6 h-6 bg-zinc-800 rounded-sm" /> Acme Corp</div>
              <div className="text-xl font-bold flex items-center gap-2"><div className="w-6 h-6 bg-zinc-800 rounded-sm" /> Globex</div>
              <div className="text-xl font-bold flex items-center gap-2"><div className="w-6 h-6 bg-zinc-800 rounded-full" /> Soylent API</div>
              <div className="text-xl font-bold flex items-center gap-2"><div className="w-6 h-6 bg-zinc-800 rotate-45" /> Initech</div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-24 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 tracking-tight mb-4">Everything you need to stay online.</h2>
            <p className="text-lg text-zinc-500 max-w-2xl mx-auto">PulseOps provides an end-to-end mission control room for your infrastructure. Know before your customers do.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Activity className="w-6 h-6 text-blue-600" />}
              title="Global Uptime Tracking"
              desc="Monitor your endpoints from 12+ regions worldwide with custom timeout intervals."
            />
            <FeatureCard 
              icon={<Bell className="w-6 h-6 text-blue-600" />}
              title="Intelligent Alerting"
              desc="Cut the noise. Smart on-call routing policies via Email, SMS, Slack, and Discord."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-6 h-6 text-blue-600" />}
              title="Zero Maintenance"
              desc="We scale dynamically. You focus on shipping features instead of managing ops tools."
            />
          </div>
        </section>

        {/* WHY PULSEOPS SECTION */}
        <section id="solutions" className="py-24 max-w-7xl mx-auto px-6 border-t border-zinc-100">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 tracking-tight mb-6">Designed for speed. <br />Built for scale.</h2>
              <p className="text-lg text-zinc-600 mb-8 leading-relaxed">
                Incident response shouldn't be stressful. We built PulseOps to give your entire team the clarity they need during an outage, combining world-class telemetry with instant automated runbooks.
              </p>
              <ul className="space-y-4">
                {['Sub-second global latency detection', 'Real-time collaborative incident war-rooms', 'Automated SLA & performance reporting'].map((text, i) => (
                  <li key={i} className="flex items-center gap-3 text-zinc-700 font-medium">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Zap className="w-3 h-3" />
                    </div>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 w-full bg-zinc-100 rounded-3xl aspect-[4/3] flex items-center justify-center text-zinc-400 border border-zinc-200 shadow-inner overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.05),transparent_70%)]" />
              <Activity className="w-24 h-24 opacity-20" />
            </div>
          </div>
        </section>

      </div>

      {/* FOOTER */}
      <footer className="bg-zinc-950 text-zinc-400 py-16 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12 mb-16">
          <div className="col-span-2 md:col-span-1">
            <img src="/photos/homelogo.png" alt="PulseOps Logo" className="h-12 md:h-16 w-auto object-contain mb-4" />
            <p className="text-sm leading-relaxed mb-6">Real-time infrastructure monitoring for modern development teams.</p>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 cursor-pointer transition border border-zinc-700/50" />
              <div className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 cursor-pointer transition border border-zinc-700/50" />
              <div className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 cursor-pointer transition border border-zinc-700/50" />
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Platform</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-blue-400 transition">API Monitoring</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">Incident Management</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">On-Call Routing</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">Status Pages</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Solutions</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-blue-400 transition">Enterprise</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">Startups</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">E-Commerce</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">Logistics</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-blue-400 transition">Documentation</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">API Reference</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">Blog</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">Community</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-blue-400 transition">About Us</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">Careers</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">Legal</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">Contact</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 border-t border-zinc-800/80 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
          <p>&copy; {new Date().getFullYear()} PulseOps Inc. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="#" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition">System Status</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-3xl bg-zinc-50 border border-zinc-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group">
      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-zinc-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-zinc-900 mb-3">{title}</h3>
      <p className="text-zinc-600 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}
