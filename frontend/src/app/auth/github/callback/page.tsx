"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

function GithubCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      toast.error("GitHub authorization failed.");
      router.push("/login");
      return;
    }

    const processGithubLogin = async () => {
      try {
        const response = await api.post("/auth/github", { code });
        if (response.data.success) {
          toast.success("GitHub authentication complete");
          login(
            response.data.data.user,
            response.data.data.tokens,
            response.data.data.organization
          );
          router.push("/dashboard");
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to authenticate with GitHub");
        router.push("/login");
      }
    };

    processGithubLogin();
  }, [searchParams, router, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white flex-col space-y-4">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
        <Loader2 className="w-12 h-12 text-blue-500" />
      </motion.div>
      <p className="text-zinc-400 animate-pulse">Establishing uplink with GitHub servers...</p>
    </div>
  );
}

export default function GithubCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">Loading...</div>}>
      <GithubCallbackHandler />
    </Suspense>
  );
}
