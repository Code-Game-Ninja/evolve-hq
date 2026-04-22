"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff, ArrowRight, ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const fieldVariant = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.1, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const stepVariant = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.2 } },
};

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState(["", "", "", "", "", ""]);
  const [savedCredentials, setSavedCredentials] = useState<{ email: string; password: string; preAuthToken: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Auto-submit when all 6 digits entered
  const fullCode = twoFactorCode.join("");

  const handleTwoFactorSubmit = useCallback(async (code: string) => {
    if (!savedCredentials || code.length !== 6) return;
    setIsVerifying(true);
    try {
      // Validate 2FA code via API first
      const validateRes = await fetch("/api/auth/2fa/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preAuthToken: savedCredentials.preAuthToken, code }),
      });

      if (!validateRes.ok) {
        toast.error("Invalid verification code");
        setTwoFactorCode(["", "", "", "", "", ""]);
        codeInputRefs.current[0]?.focus();
        return;
      }

      // Code is valid — sign in with preAuthToken (no bcrypt in authorize)
      let result;
      try {
        result = await signIn("credentials", {
          email: savedCredentials.email,
          preAuthToken: savedCredentials.preAuthToken,
          twoFactorCode: code,
          redirect: false,
        });
      } catch (signInErr) {
        console.error("signIn threw:", signInErr);
        toast.error("Sign in failed. Please try again.");
        setTwoFactorCode(["", "", "", "", "", ""]);
        codeInputRefs.current[0]?.focus();
        return;
      }

      if (result?.error) {
        toast.error("Authentication failed");
        setTwoFactorCode(["", "", "", "", "", ""]);
        codeInputRefs.current[0]?.focus();
        return;
      }

      // Fetch session to check role for redirection
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = session?.user?.role;

      toast.success("Signed in successfully");
      const params = new URLSearchParams(window.location.search);
      let callbackUrl = params.get("callbackUrl");

      if (!callbackUrl || callbackUrl === "/dashboard") {
        if (role === "superadmin" || role === "admin") {
          callbackUrl = "/admin";
        } else {
          callbackUrl = "/dashboard";
        }
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      console.error("2FA submit error:", err);
      toast.error("Something went wrong. Please try again.");
      setTwoFactorCode(["", "", "", "", "", ""]);
      codeInputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  }, [savedCredentials, router]);

  useEffect(() => {
    if (fullCode.length === 6 && twoFactorStep) {
      handleTwoFactorSubmit(fullCode);
    }
  }, [fullCode, twoFactorStep, handleTwoFactorSubmit]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...twoFactorCode];
    newCode[index] = value.slice(-1);
    setTwoFactorCode(newCode);
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !twoFactorCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newCode = [...twoFactorCode];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || "";
    }
    setTwoFactorCode(newCode);
    const focusIndex = Math.min(pasted.length, 5);
    codeInputRefs.current[focusIndex]?.focus();
  };

  const onSubmit = async (data: LoginFormValues) => {
    try {
      // Check if 2FA is required before attempting signIn
      const checkRes = await fetch("/api/auth/2fa/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
      const checkData = await checkRes.json();

      if (!checkRes.ok) {
        toast.error("Invalid email or password");
        return;
      }

      if (checkData.requires2FA) {
        setSavedCredentials({ email: data.email, password: data.password, preAuthToken: checkData.preAuthToken });
        setTwoFactorStep(true);
        return;
      }

      // No 2FA — proceed with signIn using preAuthToken (bcrypt already done)
      const result = await signIn("credentials", {
        email: data.email,
        preAuthToken: checkData.preAuthToken,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password");
        return;
      }

      // Fetch session to check role for redirection
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = session?.user?.role;

      toast.success("Signed in successfully");
      const params = new URLSearchParams(window.location.search);
      let callbackUrl = params.get("callbackUrl");

      if (!callbackUrl || callbackUrl === "/dashboard") {
        if (role === "superadmin" || role === "admin") {
          callbackUrl = "/admin";
        } else {
          callbackUrl = "/dashboard";
        }
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <AnimatePresence mode="wait">
      {!twoFactorStep ? (
        <motion.form
          key="login-step"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          initial={false}
          animate="center"
          exit="exit"
          variants={stepVariant}
        >
          {/* Email */}
          <motion.div className="space-y-1.5" custom={0} variants={fieldVariant} initial="hidden" animate="visible">
            <label htmlFor="email" className="text-[13px] font-medium" style={{ color: "#555" }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@evolve.agencym"
              autoComplete="email"
              autoFocus
              {...register("email")}
              className="w-full h-11 px-4 rounded-xl text-[14px] outline-none border transition-all duration-200 placeholder:text-[#bbb]"
              style={{
                backgroundColor: "rgba(255,255,255,0.5)",
                borderColor: errors.email ? "#ef4444" : "rgba(0,0,0,0.08)",
                color: "#1a1a1a",
              }}
              onFocus={(e) => {
                if (!errors.email) e.currentTarget.style.borderColor = "rgba(243,53,12,0.4)";
              }}
              onBlur={(e) => {
                if (!errors.email) e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
              }}
            />
            {errors.email && (
              <p className="text-[11px] font-medium" style={{ color: "#ef4444" }}>
                {errors.email.message}
              </p>
            )}
          </motion.div>

          {/* Password */}
          <motion.div className="space-y-1.5" custom={1} variants={fieldVariant} initial="hidden" animate="visible">
            <label htmlFor="password" className="text-[13px] font-medium" style={{ color: "#555" }}>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                {...register("password")}
                className="w-full h-11 px-4 pr-11 rounded-xl text-[14px] outline-none border transition-all duration-200 placeholder:text-[#bbb]"
                style={{
                  backgroundColor: "rgba(255,255,255,0.5)",
                  borderColor: errors.password ? "#ef4444" : "rgba(0,0,0,0.08)",
                  color: "#1a1a1a",
                }}
                onFocus={(e) => {
                  if (!errors.password) e.currentTarget.style.borderColor = "rgba(243,53,12,0.4)";
                }}
                onBlur={(e) => {
                  if (!errors.password) e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                style={{ color: "#aaa" }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] font-medium" style={{ color: "#ef4444" }}>
                {errors.password.message}
              </p>
            )}
          </motion.div>

          {/* Submit */}
          <motion.div custom={2} variants={fieldVariant} initial="hidden" animate="visible" className="pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="group w-full h-11 flex items-center justify-center gap-2 rounded-xl text-[14px] font-semibold text-white transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "#f3350c",
                boxShadow: "0 2px 12px rgba(243,53,12,0.25)",
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) e.currentTarget.style.backgroundColor = "#c82c09";
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) e.currentTarget.style.backgroundColor = "#f3350c";
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </motion.div>

          <motion.p
            custom={3}
            variants={fieldVariant}
            initial="hidden"
            animate="visible"
            className="text-center text-[11px] pt-2"
            style={{ color: "#bbb" }}
          >
            Contact your admin if you don&apos;t have an account.
          </motion.p>
        </motion.form>
      ) : (
        <motion.div
          key="2fa-step"
          className="space-y-6"
          variants={stepVariant}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <div
              className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(243,53,12,0.08)" }}
            >
              <ShieldCheck size={22} style={{ color: "#f3350c" }} />
            </div>
            <h3 className="text-[16px] font-semibold" style={{ color: "#1a1a1a" }}>
              Two-Factor Authentication
            </h3>
            <p className="text-[13px]" style={{ color: "#888" }}>
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {/* Code inputs */}
          <div className="flex justify-center gap-3" onPaste={handleCodePaste}>
            {twoFactorCode.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { codeInputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(i, e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(i, e)}
                autoFocus={i === 0}
                disabled={isVerifying}
                className="w-12 h-14 text-center text-[20px] font-bold rounded-2xl border-2 outline-none transition-all duration-200 disabled:opacity-50 focus:ring-2 focus:ring-[rgba(243,53,12,0.15)] focus:border-[#f3350c] selection:bg-transparent caret-[#f3350c]"
                style={{
                  backgroundColor: digit ? "rgba(243,53,12,0.04)" : "rgba(255,255,255,0.5)",
                  borderColor: digit ? "#f3350c" : "rgba(0,0,0,0.1)",
                  color: "#1a1a1a",
                }}
              />
            ))}
          </div>

          {/* Verify button */}
          <button
            onClick={() => handleTwoFactorSubmit(fullCode)}
            disabled={isVerifying || fullCode.length !== 6}
            className="group w-full h-11 flex items-center justify-center gap-2 rounded-xl text-[14px] font-semibold text-white transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "#f3350c",
              boxShadow: "0 2px 12px rgba(243,53,12,0.25)",
            }}
            onMouseEnter={(e) => {
              if (!isVerifying) e.currentTarget.style.backgroundColor = "#c82c09";
            }}
            onMouseLeave={(e) => {
              if (!isVerifying) e.currentTarget.style.backgroundColor = "#f3350c";
            }}
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Verify
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </>
            )}
          </button>

          {/* Back button */}
          <button
            onClick={() => {
              setTwoFactorStep(false);
              setTwoFactorCode(["", "", "", "", "", ""]);
              setSavedCredentials(null);
            }}
            disabled={isVerifying}
            className="w-full flex items-center justify-center gap-1.5 text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-50"
            style={{ color: "#888" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#555"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; }}
          >
            <ArrowLeft size={14} />
            Back to login
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
