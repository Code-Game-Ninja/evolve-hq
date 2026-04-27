"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import LoginForm from "./login-form";
import { BusinessCharacter } from "./business-character";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  // Redirect authenticated users
  useEffect(() => {
    if (status === "authenticated" && session) {
      const targetUrl = session.user?.role === "superadmin" || session.user?.role === "admin"
        ? "/admin"
        : "/dashboard";
      router.push(targetUrl);
    }
  }, [status, session, router]);

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#0a0a0a]">
      {/* Animated background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-1/2 -left-1/2 w-full h-full"
          style={{
            background: "radial-gradient(circle at 30% 30%, rgba(243,53,12,0.15) 0%, transparent 50%)",
          }}
        />
        <div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full"
          style={{
            background: "radial-gradient(circle at 70% 70%, rgba(243,53,12,0.1) 0%, transparent 50%)",
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Left side - Business Character */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative z-[1] p-12">
        <BusinessCharacter isLoggedIn={isLoggedIn} userName={userName} />
      </div>

      {/* Right side - Login Form with drag-in animation */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12 relative z-[1]">
        {/* Connection line between character and form */}
        <motion.div
          className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-[#f3350c] to-transparent"
          initial={{ width: 0 }}
          animate={{ width: 80 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
        />

        <motion.div
          className="w-full max-w-[420px]"
          initial={{ x: 100, opacity: 0, rotateY: -15 }}
          animate={{ x: 0, opacity: 1, rotateY: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94],
            type: "spring",
            stiffness: 100,
          }}
        >
          {/* Dark glass card with connection effect */}
          <motion.div
            className="rounded-[32px] border backdrop-blur-2xl p-8 sm:p-10 relative"
            style={{
              backgroundColor: "rgba(26,26,26,0.6)",
              borderColor: "rgba(255,255,255,0.1)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
            whileHover={{
              boxShadow: "0 12px 50px rgba(243,53,12,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
            transition={{ duration: 0.3 }}
          >
            {/* Drag handle indicator */}
            <motion.div
              className="absolute -left-3 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <div className="w-1 h-1 rounded-full bg-[#f3350c]" />
              <div className="w-1 h-8 rounded-full bg-[#f3350c]/50" />
              <div className="w-1 h-1 rounded-full bg-[#f3350c]" />
            </motion.div>

            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-3xl font-bold tracking-[0.12em] uppercase text-white">
                EVOLVE
              </h1>
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mt-1.5 text-white/50">
                HQ Workspace
              </p>
            </div>

            {/* Header */}
            <div className="mb-8">
              <motion.div
                className="flex items-center gap-2 mb-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <div className="h-1 w-8 rounded-full bg-[#f3350c]" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
                  Secure Access
                </span>
              </motion.div>
              <motion.h2
                className="text-[26px] font-bold tracking-tight text-white"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                Welcome back
              </motion.h2>
              <motion.p
                className="text-[14px] mt-2 text-white/50"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                Sign in to access your workspace
              </motion.p>
            </div>

            <LoginForm onSuccess={(name: string) => {
              setIsLoggedIn(true);
              setUserName(name);
            }} />

            {/* Footer */}
            <motion.div
              className="mt-8 pt-6 border-t border-white/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <p className="text-center text-[12px] text-white/30">
                Protected by enterprise-grade security
              </p>
              <div className="flex items-center justify-center gap-4 mt-3">
                {["Tasks", "CRM", "Team", "Analytics"].map((item, i) => (
                  <motion.span
                    key={item}
                    className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-white/40"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.1 + i * 0.1, duration: 0.3 }}
                  >
                    {item}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
