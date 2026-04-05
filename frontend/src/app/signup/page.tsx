"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Activity, ArrowRight, Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(/[A-Z]/, { message: "Must contain an uppercase letter." })
    .regex(/[a-z]/, { message: "Must contain a lowercase letter." })
    .regex(/[0-9]/, { message: "Must contain a number." }),
  organizationName: z.string().min(2, { message: "Organization name is required." }),
});

export default function SignupPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      organizationName: "",
    },
  });

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/signup", values);
      if (response.data.success) {
        toast.success("Account created! Welcome to PulseOps.");
        login(
          response.data.data.user,
          response.data.data.tokens,
          response.data.data.organization
        );
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const nextStep = async () => {
    const fieldsToValidate = step === 1 
      ? ["name", "email"] as const 
      : ["organizationName", "password"] as const;
      
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden selection:bg-primary/30">
      {/* Cinematic Background Gradients */}
      <div className="absolute top-[0%] right-[0%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[0%] left-[0%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md p-6 relative z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 p-2 rounded-xl border border-primary/30">
               <Activity className="h-6 w-6 text-primary" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">PulseOps</span>
          </div>
        </div>

        <Card className="bg-zinc-950/60 border-zinc-800/80 backdrop-blur-xl shadow-2xl overflow-hidden relative">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 h-1 bg-zinc-800 w-full">
             <motion.div 
               className="h-full bg-primary" 
               initial={{ width: "50%" }}
               animate={{ width: step === 1 ? "50%" : "100%" }}
               transition={{ duration: 0.4 }}
             />
          </div>

          <CardHeader className="space-y-1 pb-6 pt-8">
            <CardTitle className="text-2xl font-semibold tracking-tight text-white">
              {step === 1 ? "Create an account" : "Set up your workspace"}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {step === 1 ? "Enter your details to get started" : "Tell us about your organization and secure your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                
                <AnimatePresence mode="wait">
                  {step === 1 ? (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-300">Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="John Doe" 
                                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-primary/50" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-300">Work Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="john@acme.com" 
                                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-primary/50" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="button" 
                        onClick={nextStep}
                        className="w-full mt-6 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold transition-all group" 
                      >
                        Continue <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="organizationName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-300">Organization Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Acme Inc." 
                                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-primary/50" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-300">Create Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-primary/50" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-3 pt-2">
                         <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setStep(1)}
                          className="w-full bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white" 
                        >
                          Back
                        </Button>
                        <Button 
                          type="submit" 
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all" 
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                            />
                          ) : (
                            <span className="flex items-center">Complete Setup <Check className="ml-2 w-4 h-4" /></span>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-zinc-800/80 pt-6">
            <p className="text-sm text-zinc-400">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
