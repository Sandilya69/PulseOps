"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Mail, Phone, Sun, Moon } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "@/store/authStore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { api } from "@/lib/axios";

// Step 1 Schema
const detailsSchema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Valid phone required"),
  gender: z.enum(["male", "female", "other"]),
  password: z.string().min(6, "Password required")
});

export default function SignupPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [step, setStep] = useState(1);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [otpMethod, setOtpMethod] = useState<"email" | "phone" | null>(null);
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(60);
  const [isLoading, setIsLoading] = useState(false);

  // Toggle dark/light class
  useEffect(() => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [theme]);

  // Timer logic for OTP
  useEffect(() => {
    if (step === 3 && timer > 0) {
      const id = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(id);
    }
  }, [timer, step]);

  const form = useForm<z.infer<typeof detailsSchema>>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { name: "", email: "", phone: "", gender: "male", password: "" },
  });

  // Step 1 -> 2
  const onDetailsSubmit = async (values: z.infer<typeof detailsSchema>) => {
    setStep(2);
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await api.post("/auth/google", { accessToken: tokenResponse.access_token });
        if (response.data.success) {
          toast.success("Google signup complete");
          login(
            response.data.data.user,
            response.data.data.tokens,
            response.data.data.organization
          );
          router.push("/dashboard");
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Google signup failed.");
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

  // Step 2 -> 3
  const handleOtpMethodSelect = (method: "email" | "phone") => {
    setOtpMethod(method);
    setTimer(60);
    // Future: Hit API to dispatch OTP here
    toast.success(`OTP sent via ${method}`);
    setStep(3);
  };

  // Step 3 -> 4
  const verifyOtp = async () => {
    setIsLoading(true);
    // Mock API Verification & Account creation
    setTimeout(() => {
      setIsLoading(false);
      if (otp.length === 6) {
        setStep(4);
      } else {
        toast.error("Invalid OTP code.");
      }
    }, 1500);
  };

  return (
    <div className="relative min-h-screen w-full flex overflow-hidden bg-background">
      
      {/* VIDEO BG */}
      <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none overflow-hidden">
        <video
          key={theme}
          autoPlay loop muted playsInline
          className="absolute inset-0 min-w-full min-h-full object-cover transition-opacity duration-1000"
        >
          <source src={theme === "dark" ? "/videos/dark.mp4" : "/videos/light.mp4"} type="video/mp4" />
        </video>
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

      {/* FLOATING RIGHT SIDE CONTAINER - RIGHT ALIGNED */}
      <div className="relative z-10 w-full min-h-screen flex items-center justify-end p-6 md:pr-16 lg:pr-32">
        
        <div className="w-full max-w-[400px]">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)]" />
            <span className="text-white font-semibold uppercase tracking-wider text-sm">Onboarding Protocol</span>
          </div>

          <div className="p-8 rounded-3xl bg-white/20 dark:bg-zinc-950/40 border border-white/30 dark:border-white/10 shadow-2xl relative overflow-hidden">
            <AnimatePresence mode="wait">
              
              {/* STEP 1: Details */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Create Identity</h2>
                  
                  {/* OAUTH SECTION */}
                  <div className="space-y-3 mb-6">
                    <Button type="button" onClick={() => handleGoogleLogin()} variant="outline" className="w-full rounded-full bg-white/50 dark:bg-zinc-900/50 border-white/30 dark:border-white/10 hover:bg-white/70 dark:hover:bg-zinc-800/80 transition-all font-medium h-12 text-zinc-900 dark:text-white">
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                      Sign up with Google
                    </Button>
                    <Button type="button" onClick={handleGithubLogin} variant="outline" className="w-full rounded-full bg-white/50 dark:bg-zinc-900/50 border-white/30 dark:border-white/10 hover:bg-white/70 dark:hover:bg-zinc-800/80 transition-all font-medium h-12 text-zinc-900 dark:text-white">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path></svg>
                      Sign up with GitHub
                    </Button>
                  </div>

                  {/* DIVIDER */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-zinc-400/30 dark:border-zinc-600/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white/10 dark:bg-black/30 backdrop-blur-sm px-2 text-zinc-500 rounded-md">Or register via email</span>
                    </div>
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onDetailsSubmit)} className="space-y-4">
                      {['name', 'email', 'phone', 'password'].map((field) => (
                        <FormField key={field} control={form.control} name={field as any} render={({ field: formField }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                type={field === 'password' ? 'password' : 'text'}
                                placeholder={field.charAt(0).toUpperCase() + field.slice(1)} 
                                className="h-12 rounded-xl bg-white/40 dark:bg-black/40 border-white/30 dark:border-white/10 text-zinc-900 dark:text-white" 
                                {...formField} 
                              />
                            </FormControl>
                            <FormMessage className="text-red-400 text-xs" />
                          </FormItem>
                        )} />
                      ))}
                      
                      <div className="flex gap-2">
                        {['male', 'female', 'other'].map(g => (
                          <div 
                            key={g} 
                            onClick={() => form.setValue('gender', g as any)}
                            className={`flex-1 h-12 flex items-center justify-center rounded-xl cursor-pointer border transition-all ${form.watch('gender') === g ? 'bg-blue-600/20 border-blue-500 text-blue-500 font-medium' : 'bg-white/10 border-white/20 text-zinc-400'}`}
                          >
                            {g.charAt(0).toUpperCase() + g.slice(1)}
                          </div>
                        ))}
                      </div>

                      <Button type="submit" className="w-full h-12 rounded-full mt-4 bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                        Continue Setup <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </form>
                  </Form>
                </motion.div>
              )}

              {/* STEP 2: Delivery Method */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Verify Identity</h2>
                  <p className="text-zinc-400 text-sm mb-6">Choose how you want to receive your security code.</p>
                  
                  <div className="space-y-4">
                    <button onClick={() => handleOtpMethodSelect('email')} className="w-full flex items-center p-4 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all text-left group">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mr-4 group-hover:scale-110 transition-transform"><Mail className="w-5 h-5"/></div>
                      <div>
                        <div className="font-medium text-white">Email Address</div>
                        <div className="text-xs text-zinc-400">Send code to {form.getValues('email')}</div>
                      </div>
                    </button>
                    <button onClick={() => handleOtpMethodSelect('phone')} className="w-full flex items-center p-4 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all text-left group">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 mr-4 group-hover:scale-110 transition-transform"><Phone className="w-5 h-5"/></div>
                      <div>
                        <div className="font-medium text-white">Phone Number</div>
                        <div className="text-xs text-zinc-400">SMS code to {form.getValues('phone')}</div>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: OTP Input */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Enter Passcode</h2>
                  <p className="text-zinc-400 text-sm mb-6">We sent a 6-digit code to your {otpMethod}.</p>
                  
                  <Input 
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="h-16 text-center text-3xl font-mono tracking-[0.5em] rounded-2xl bg-black/40 border-white/20 text-white mb-4"
                    placeholder="------"
                  />
                  
                  <div className="flex justify-between text-sm mb-6">
                    <button onClick={() => setTimer(60)} disabled={timer > 0} className={`${timer > 0 ? 'text-zinc-600' : 'text-blue-400 hover:text-blue-300'}`}>
                      Resend Code
                    </button>
                    <span className="text-zinc-400">00:{timer.toString().padStart(2, '0')}</span>
                  </div>

                  <Button onClick={verifyOtp} disabled={otp.length !== 6 || isLoading} className="w-full h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all font-semibold tracking-wide">
                    {isLoading ? "Verifying..." : "Verify Identity"}
                  </Button>
                </motion.div>
              )}

              {/* STEP 4: Success */}
              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-6">
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Access Granted</h2>
                  <p className="text-zinc-400 text-sm mb-8">Your identity has been verified and registered.</p>
                  <Button onClick={() => router.push('/dashboard')} className="w-full h-12 rounded-full bg-white text-black hover:bg-zinc-200 font-semibold tracking-wide">
                    Enter Dashboard
                  </Button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          <p className="text-center mt-6 text-sm text-zinc-400 font-medium">
            Already registered? <Link href="/login" className="text-blue-400 hover:underline">Sign in</Link>
          </p>

        </div>
      </div>
    </div>
  );
}
