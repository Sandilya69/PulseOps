"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { Github, Mail, Moon, Sun } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Toggle dark/light class on body
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", values);
      if (response.data.success) {
        toast.success("Welcome back!");
        login(
          response.data.data.user,
          response.data.data.tokens,
          response.data.data.organization
        );
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid credentials.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await api.post("/auth/google", { accessToken: tokenResponse.access_token });
        if (response.data.success) {
          toast.success("Google login complete");
          login(
            response.data.data.user,
            response.data.data.tokens,
            response.data.data.organization
          );
          router.push("/dashboard");
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Google login failed.");
      }
    }
  });

  const handleGithubLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    if (!clientId) {
      toast.error("GitHub Client ID is missing. Check .env.local");
      return;
    }
    const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/auth/github/callback` : '';
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
  };

  return (
    <div className="relative min-h-screen w-full flex overflow-hidden bg-background text-foreground transition-colors duration-500">
      
      {/* FULL SCREEN VIDEO BACKGROUND */}
      <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none overflow-hidden">
        <video
          key={theme}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 min-w-full min-h-full object-cover transition-opacity duration-1000"
        >
          <source 
            src={theme === "dark" ? "/videos/dark.mp4" : "/videos/light.mp4"} 
            type="video/mp4" 
          />
        </video>
        {/* Extremely subtle dim overlay just for text readability, NO BLUR */}
        <div className="absolute inset-0 bg-black/20 dark:bg-black/30" />
      </div>

      {/* Top Branding & Theme Toggle */}
      <div className="absolute top-6 left-0 right-0 px-6 md:px-12 z-50 flex items-center justify-between pointer-events-none">
        <img src="/photos/logo.png" alt="PulseOps Logo" className="h-16 md:h-20 w-auto object-contain drop-shadow-lg" />
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full bg-white/10 shadow-lg backdrop-blur-md border-white/20 hover:bg-white/20 pointer-events-auto transition-all"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-5 w-5 text-white" /> : <Moon className="h-5 w-5 text-black" />}
        </Button>
      </div>

      {/* FLOATING FORM CONTAINER - RIGHT ALIGNED */}
      <div className="relative z-10 w-full min-h-screen flex items-center justify-end p-6 md:pr-16 lg:pr-32">
        
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-[380px]"
        >
          {/* Header */}
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Sign In</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2 text-sm">
              Access the PulseOps dashboard.
            </p>
          </div>

          {/* Glass Card */}
          <div className="p-8 rounded-3xl bg-white/20 dark:bg-black/40 border border-white/30 dark:border-white/10 shadow-2xl backdrop-blur-xl">
            
            {/* OAUTH SECTION */}
            <div className="space-y-3 mb-6">
              <Button type="button" onClick={() => handleGoogleLogin()} variant="outline" className="w-full rounded-full bg-white/50 dark:bg-zinc-900/50 border-white/30 dark:border-white/10 hover:bg-white/70 dark:hover:bg-zinc-800/80 transition-all font-medium h-12 text-zinc-900 dark:text-white">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                Sign in with Google
              </Button>
              <Button type="button" onClick={handleGithubLogin} variant="outline" className="w-full rounded-full bg-white/50 dark:bg-zinc-900/50 border-white/30 dark:border-white/10 hover:bg-white/70 dark:hover:bg-zinc-800/80 transition-all font-medium h-12 text-zinc-900 dark:text-white">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path></svg>
                Sign in with GitHub
              </Button>
            </div>

            {/* DIVIDER */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-400/30 dark:border-zinc-600/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#e4e4e7] dark:bg-[#18181b] px-2 text-zinc-500 rounded-md">Or</span>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          placeholder="Email Address" 
                          className="h-12 rounded-xl bg-white/50 dark:bg-zinc-900/50 border-white/40 dark:border-zinc-700/50 text-zinc-900 dark:text-white placeholder:text-zinc-500 backdrop-blur-sm" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Password" 
                          className="h-12 rounded-xl bg-white/50 dark:bg-zinc-900/50 border-white/40 dark:border-zinc-700/50 text-zinc-900 dark:text-white placeholder:text-zinc-500 backdrop-blur-sm" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs" />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between mt-2">
                  <label className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
                    <input type="checkbox" className="rounded border-zinc-400 bg-transparent text-primary focus:ring-primary/50" />
                    <span>Remember me</span>
                  </label>
                  <Link href="/forgot-password" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-full mt-4 bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] transition-all font-semibold tracking-wide" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    "Initialize Uplink"
                  )}
                </Button>
              </form>
            </Form>
            
          </div>

          <p className="text-center mt-8 text-sm text-zinc-600 dark:text-zinc-400 font-medium">
            Don't have an account?{" "}
            <Link href="/signup" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
              Sign up here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
