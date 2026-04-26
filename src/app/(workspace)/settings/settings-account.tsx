// Settings — Account & Security section
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Shield,
  ShieldCheck,
  ShieldOff,
  Copy,
  Download,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  LogOut,
} from "lucide-react";

const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

function getPasswordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: "Weak", color: "#ef4444", pct: 33 };
  if (score <= 2) return { label: "Medium", color: "#fbbf24", pct: 66 };
  return { label: "Strong", color: "#4ade80", pct: 100 };
}

const inputClass =
  "w-full h-11 px-4 rounded-xl text-sm outline-none transition-all duration-200 focus:border-[rgba(255,255,255,0.3)] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.05)]";
const inputStyle: React.CSSProperties = {
  backgroundColor: "rgba(26,26,26,0.6)",
  border: "1.5px solid rgba(255,255,255,0.1)",
  color: "#ffffff",
};
const labelClass = "text-[13px] font-semibold block mb-1.5";

export function SettingsAccount() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const strength = getPasswordStrength(newPw);
  const requirements = [
    { label: "8+ characters", met: newPw.length >= 8 },
    { label: "1 uppercase letter", met: /[A-Z]/.test(newPw) },
    { label: "1 number", met: /[0-9]/.test(newPw) },
    { label: "1 special character", met: /[^A-Za-z0-9]/.test(newPw) },
  ];
  const canUpdate =
    currentPw.length > 0 &&
    newPw.length >= 8 &&
    confirmPw === newPw &&
    confirmPw.length > 0;

  const handleUpdate = async () => {
    setUpdating(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update password.");
        return;
      }
      setSuccess("Password updated successfully.");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Change Password */}
      <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariant}>
        <div
          className="rounded-[24px] p-6 backdrop-blur-lg border border-[rgba(255,255,255,0.1)]"
          style={{ backgroundColor: "rgba(26,26,26,0.6)" }}
        >
          <h3 className="text-lg font-semibold mb-5" style={{ color: "#ffffff" }}>
            Change Password
          </h3>

          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label className={labelClass} style={{ color: "#ffffff" }}>
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {showCurrent ? (
                    <EyeOff className="h-4 w-4" style={{ color: "#a0a0a0" }} />
                  ) : (
                    <Eye className="h-4 w-4" style={{ color: "#a0a0a0" }} />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className={labelClass} style={{ color: "#ffffff" }}>
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {showNew ? (
                    <EyeOff className="h-4 w-4" style={{ color: "#a0a0a0" }} />
                  ) : (
                    <Eye className="h-4 w-4" style={{ color: "#a0a0a0" }} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className={labelClass} style={{ color: "#ffffff" }}>
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Re-enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" style={{ color: "#a0a0a0" }} />
                  ) : (
                    <Eye className="h-4 w-4" style={{ color: "#a0a0a0" }} />
                  )}
                </button>
              </div>
            </div>

            {/* Strength meter */}
            {newPw.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <div
                  className="h-1 rounded-full w-[200px]"
                  style={{ backgroundColor: "rgba(0,0,0,0.05)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${strength.pct}%`, backgroundColor: strength.color }}
                  />
                </div>
                <span className="text-xs font-medium" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}

            {/* Requirements */}
            {newPw.length > 0 && (
              <div className="space-y-1 mt-2">
                {requirements.map((r) => (
                  <div key={r.label} className="flex items-center gap-2">
                    {r.met ? (
                      <Check className="h-3 w-3" style={{ color: "#22c55e" }} />
                    ) : (
                      <X className="h-3 w-3" style={{ color: "#b6b6b6" }} />
                    )}
                    <span
                      className="text-xs"
                      style={{ color: r.met ? "#22c55e" : "#b6b6b6" }}
                    >
                      {r.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Mismatch warning */}
            {confirmPw.length > 0 && confirmPw !== newPw && (
              <p className="text-xs mt-1" style={{ color: "#ef4444" }}>
                Passwords do not match
              </p>
            )}

            {/* Error message */}
            {error && (
              <div
                className="px-4 py-2.5 rounded-2xl text-xs font-medium mt-3"
                style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444" }}
              >
                {error}
              </div>
            )}

            {/* Success message */}
            {success && (
              <div
                className="px-4 py-2.5 rounded-2xl text-xs font-medium mt-3"
                style={{ backgroundColor: "rgba(34,197,94,0.08)", color: "#22c55e" }}
              >
                {success}
              </div>
            )}

            <div className="flex justify-end mt-5">
              <button
                onClick={handleUpdate}
                disabled={!canUpdate || updating}
                className="h-10 px-6 rounded-full text-sm font-semibold text-white transition-all duration-200 cursor-pointer active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)] flex items-center gap-2"
                style={{ backgroundColor: "#0a0a0a" }}
              >
                {updating && <Loader2 className="h-4 w-4 animate-spin" />}
                {updating ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Two-Factor Authentication */}
      <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariant}>
        <TwoFactorSection />
      </motion.div>

      {/* Active Sessions */}
      <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariant}>
        <ActiveSessionsSection />
      </motion.div>

      {/* Danger Zone */}
      <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariant}>
        <div
          className="rounded-[24px] p-6 backdrop-blur-lg border border-[rgba(239,68,68,0.2)]"
          style={{ backgroundColor: "rgba(26,26,26,0.6)" }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
            <div className="flex-1">
              <h3 className="text-base font-semibold" style={{ color: "#ef4444" }}>
                Delete Account
              </h3>
              <p className="text-[13px] mt-1" style={{ color: "#a0a0a0" }}>
                Permanently delete your account and all associated data. This action cannot
                be undone. Contact your administrator to request account deletion.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// 2FA setup/disable component
type TwoFactorStep = "idle" | "setup" | "verify" | "backup" | "disable";

function TwoFactorSection() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [step, setStep] = useState<TwoFactorStep>("idle");
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState(["", "", "", "", "", ""]);
  const [disableCode, setDisableCode] = useState(["", "", "", "", "", ""]);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const verifyRefs = useRef<(HTMLInputElement | null)[]>([]);
  const disableRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Fetch 2FA status on mount
  useEffect(() => {
    fetch("/api/auth/2fa/status")
      .then((r) => r.json())
      .then((d) => setEnabled(d.enabled ?? false))
      .catch(() => setEnabled(false));
  }, []);

  const handleCodeInput = (
    codes: string[],
    setCodes: (c: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    index: number,
    value: string
  ) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...codes];
    next[index] = value.slice(-1);
    setCodes(next);
    if (value && index < 5) refs.current[index + 1]?.focus();
  };

  const handleCodeKeyDown = (
    codes: string[],
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    index: number,
    e: React.KeyboardEvent
  ) => {
    if (e.key === "Backspace" && !codes[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (
    setCodes: (c: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    e: React.ClipboardEvent
  ) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || "";
    setCodes(next);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // Start 2FA setup
  const startSetup = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to start setup"); return; }
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep("setup");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  // Verify code to enable 2FA
  const verifyAndEnable = async () => {
    const code = verifyCode.join("");
    if (code.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid code");
        setVerifyCode(["", "", "", "", "", ""]);
        verifyRefs.current[0]?.focus();
        return;
      }
      setBackupCodes(data.backupCodes);
      setEnabled(true);
      setStep("backup");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  // Disable 2FA
  const disableTwoFactor = async () => {
    const code = disableCode.join("");
    if (code.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid code");
        setDisableCode(["", "", "", "", "", ""]);
        disableRefs.current[0]?.focus();
        return;
      }
      setEnabled(false);
      setStep("idle");
      setDisableCode(["", "", "", "", "", ""]);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
  };

  const downloadBackupCodes = () => {
    const text = `EVOLVE HQ — 2FA Backup Codes\nGenerated: ${new Date().toISOString()}\n\n${backupCodes.join("\n")}\n\nKeep these in a safe place. Each code can only be used once.`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "evolve-2fa-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };



  if (enabled === null) {
    return (
      <div
        className="rounded-[24px] p-6 backdrop-blur-lg border border-[rgba(255,255,255,0.1)] flex items-center gap-3"
        style={{ backgroundColor: "rgba(26,26,26,0.6)" }}
      >
        <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#a0a0a0" }} />
        <span className="text-sm" style={{ color: "#a0a0a0" }}>Loading 2FA status...</span>
      </div>
    );
  }

  return (
    <div
      className="rounded-[24px] p-6 backdrop-blur-lg border border-[rgba(255,255,255,0.1)]"
      style={{ backgroundColor: "rgba(26,26,26,0.6)" }}
    >
      <AnimatePresence mode="wait">
        {/* Idle state — show status and enable/disable button */}
        {step === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start gap-3">
              {enabled ? (
                <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
              ) : (
                <Shield className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#a0a0a0" }} />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold" style={{ color: "#ffffff" }}>
                    Two-Factor Authentication
                  </h3>
                  {enabled && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e" }}
                    >
                      Enabled
                    </span>
                  )}
                </div>
                <p className="text-[13px] mt-1" style={{ color: "#a0a0a0" }}>
                  {enabled
                    ? "Your account is protected with TOTP-based two-factor authentication."
                    : "Add an extra layer of security by requiring a verification code from your authenticator app."}
                </p>
                <div className="mt-4">
                  {enabled ? (
                    <button
                      onClick={() => { setStep("disable"); setError(""); }}
                      className="h-9 px-5 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer border flex items-center gap-2"
                      style={{ borderColor: "rgba(239,68,68,0.3)", color: "#ef4444", backgroundColor: "rgba(239,68,68,0.05)" }}
                    >
                      <ShieldOff className="h-3.5 w-3.5" />
                      Disable 2FA
                    </button>
                  ) : (
                    <button
                      onClick={startSetup}
                      disabled={loading}
                      className="h-9 px-5 rounded-full text-sm font-semibold text-white transition-all duration-200 cursor-pointer flex items-center gap-2 disabled:opacity-60"
                      style={{ backgroundColor: "#0a0a0a" }}
                    >
                      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
                      Enable 2FA
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Setup step — show QR code */}
        {step === "setup" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" style={{ color: "#f3350c" }} />
              <h3 className="text-lg font-semibold" style={{ color: "#ffffff" }}>
                Set Up Two-Factor Authentication
              </h3>
            </div>

            <div className="space-y-4">
              <p className="text-[13px]" style={{ color: "#a0a0a0" }}>
                Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.)
              </p>

              {/* QR Code */}
              <div className="flex justify-center">
                <div
                  className="p-4 rounded-2xl border"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.1)" }}
                >
                  {qrCode && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrCode} alt="2FA QR Code" width={200} height={200} />
                  )}
                </div>
              </div>

              {/* Manual secret */}
              <div className="text-center">
                <p className="text-[11px] mb-1" style={{ color: "#aaa" }}>
                  Or enter this key manually:
                </p>
                <code
                  className="text-[13px] font-mono px-3 py-1.5 rounded-lg select-all"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "#ffffff" }}
                >
                  {secret}
                </code>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => { setStep("idle"); setError(""); }}
                className="h-9 px-5 rounded-full text-sm font-medium cursor-pointer transition-colors"
                style={{ color: "#a0a0a0" }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setStep("verify"); setError(""); }}
                className="h-9 px-5 rounded-full text-sm font-semibold text-white cursor-pointer transition-all duration-200"
                style={{ backgroundColor: "#0a0a0a" }}
              >
                Next
              </button>
            </div>
          </motion.div>
        )}

        {/* Verify step — enter code to confirm */}
        {step === "verify" && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" style={{ color: "#f3350c" }} />
              <h3 className="text-lg font-semibold" style={{ color: "#ffffff" }}>
                Verify Setup
              </h3>
            </div>

            <p className="text-[13px]" style={{ color: "#707070" }}>
              Enter the 6-digit code from your authenticator app to verify setup.
            </p>

            <div className="flex justify-center gap-3" onPaste={(e) => handleCodePaste(setVerifyCode, verifyRefs, e)}>
              {verifyCode.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { verifyRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeInput(verifyCode, setVerifyCode, verifyRefs, i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(verifyCode, verifyRefs, i, e)}
                  disabled={loading}
                  className="w-12 h-14 text-center text-[20px] font-bold rounded-2xl border-2 outline-none transition-all duration-200 disabled:opacity-50 focus:ring-2 focus:ring-[rgba(243,53,12,0.15)] focus:border-[#f3350c] selection:bg-transparent caret-[#f3350c]"
                  style={{
                    backgroundColor: digit ? "rgba(243,53,12,0.1)" : "rgba(26,26,26,0.8)",
                    borderColor: digit ? "#f3350c" : "rgba(255,255,255,0.1)",
                    color: "#ffffff",
                  }}
                />
              ))}
            </div>

            {error && (
              <div
                className="px-4 py-2.5 rounded-2xl text-xs font-medium text-center"
                style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444" }}
              >
                {error}
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => { setStep("setup"); setError(""); setVerifyCode(["", "", "", "", "", ""]); }}
                className="h-9 px-5 rounded-full text-sm font-medium cursor-pointer transition-colors"
                style={{ color: "#a0a0a0" }}
              >
                Back
              </button>
              <button
                onClick={verifyAndEnable}
                disabled={loading || verifyCode.join("").length !== 6}
                className="h-9 px-5 rounded-full text-sm font-semibold text-white cursor-pointer transition-all duration-200 flex items-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: "#0a0a0a" }}
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Verify & Enable
              </button>
            </div>
          </motion.div>
        )}

        {/* Backup codes step */}
        {step === "backup" && (
          <motion.div
            key="backup"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" style={{ color: "#22c55e" }} />
              <h3 className="text-lg font-semibold" style={{ color: "#ffffff" }}>
                2FA Enabled Successfully
              </h3>
            </div>

            <div
              className="p-4 rounded-2xl border"
              style={{ backgroundColor: "rgba(34,197,94,0.04)", borderColor: "rgba(34,197,94,0.15)" }}
            >
              <p className="text-[13px] font-medium mb-3" style={{ color: "#ffffff" }}>
                Save these backup codes in a safe place. Each code can only be used once.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, i) => (
                  <code
                    key={i}
                    className="text-[13px] font-mono px-3 py-1.5 rounded-lg text-center select-all"
                    style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "#ffffff" }}
                  >
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyBackupCodes}
                className="h-9 px-4 rounded-full text-sm font-medium border cursor-pointer transition-all duration-200 flex items-center gap-1.5"
                style={{ borderColor: "rgba(255,255,255,0.1)", color: "#ffffff", backgroundColor: "rgba(26,26,26,0.8)" }}
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
              <button
                onClick={downloadBackupCodes}
                className="h-9 px-4 rounded-full text-sm font-medium border cursor-pointer transition-all duration-200 flex items-center gap-1.5"
                style={{ borderColor: "rgba(255,255,255,0.1)", color: "#ffffff", backgroundColor: "rgba(26,26,26,0.8)" }}
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => { setStep("idle"); setBackupCodes([]); setVerifyCode(["", "", "", "", "", ""]); }}
                className="h-9 px-5 rounded-full text-sm font-semibold text-white cursor-pointer transition-all duration-200"
                style={{ backgroundColor: "#0a0a0a" }}
              >
                Done
              </button>
            </div>
          </motion.div>
        )}

        {/* Disable step — confirm with code */}
        {step === "disable" && (
          <motion.div
            key="disable"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <div className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5" style={{ color: "#ef4444" }} />
              <h3 className="text-lg font-semibold" style={{ color: "#ffffff" }}>
                Disable Two-Factor Authentication
              </h3>
            </div>

            <p className="text-[13px]" style={{ color: "#a0a0a0" }}>
              Enter a code from your authenticator app to confirm disabling 2FA.
            </p>

            <div className="flex justify-center gap-3" onPaste={(e) => handleCodePaste(setDisableCode, disableRefs, e)}>
              {disableCode.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { disableRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeInput(disableCode, setDisableCode, disableRefs, i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(disableCode, disableRefs, i, e)}
                  disabled={loading}
                  className="w-12 h-14 text-center text-[20px] font-bold rounded-2xl border-2 outline-none transition-all duration-200 disabled:opacity-50 focus:ring-2 focus:ring-[rgba(243,53,12,0.15)] focus:border-[#f3350c] selection:bg-transparent caret-[#f3350c]"
                  style={{
                    backgroundColor: digit ? "rgba(243,53,12,0.1)" : "rgba(26,26,26,0.8)",
                    borderColor: digit ? "#f3350c" : "rgba(255,255,255,0.1)",
                    color: "#ffffff",
                  }}
                />
              ))}
            </div>

            {error && (
              <div
                className="px-4 py-2.5 rounded-2xl text-xs font-medium text-center"
                style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444" }}
              >
                {error}
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => { setStep("idle"); setError(""); setDisableCode(["", "", "", "", "", ""]); }}
                className="h-9 px-5 rounded-full text-sm font-medium cursor-pointer transition-colors"
                style={{ color: "#a0a0a0" }}
              >
                Cancel
              </button>
              <button
                onClick={disableTwoFactor}
                disabled={loading || disableCode.join("").length !== 6}
                className="h-9 px-5 rounded-full text-sm font-semibold text-white cursor-pointer transition-all duration-200 flex items-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: "#ef4444" }}
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Disable 2FA
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Active Sessions Section
interface SessionItem {
  id: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  lastActive: string;
  createdAt: string;
  isCurrent: boolean;
}

function DeviceIcon({ device }: { device: string }) {
  const d = device.toLowerCase();
  if (d.includes("mobile") || d.includes("phone")) return <Smartphone className="h-5 w-5" style={{ color: "#a0a0a0" }} />;
  if (d.includes("tablet")) return <Tablet className="h-5 w-5" style={{ color: "#a0a0a0" }} />;
  return <Monitor className="h-5 w-5" style={{ color: "#a0a0a0" }} />;
}

function sessionLabel(browser: string, os: string) {
  const b = browser && browser !== "Unknown" ? browser : "";
  const o = os && os !== "Unknown" ? os : "";
  if (b && o) return `${b} on ${o}`;
  if (b) return b;
  if (o) return o;
  return "Unknown device";
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

function ActiveSessionsSection() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const revokeSession = async (id: string) => {
    setRevoking(id);
    try {
      const res = await fetch(`/api/sessions?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {
      // ignore
    } finally {
      setRevoking(null);
    }
  };

  const revokeAllOther = async () => {
    setRevokingAll(true);
    try {
      const res = await fetch("/api/sessions", { method: "DELETE" });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.isCurrent));
      }
    } catch {
      // ignore
    } finally {
      setRevokingAll(false);
    }
  };

  const otherCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div
      className="rounded-[24px] p-6 backdrop-blur-lg border border-[rgba(255,255,255,0.1)]"
      style={{ backgroundColor: "rgba(26,26,26,0.6)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5" style={{ color: "#f3350c" }} />
          <div>
            <h3 className="text-base font-semibold" style={{ color: "#ffffff" }}>
              Active Sessions
            </h3>
            <p className="text-[13px] mt-0.5" style={{ color: "#a0a0a0" }}>
              Devices where you&apos;re currently signed in
            </p>
          </div>
        </div>
        {otherCount > 0 && (
          <button
            onClick={revokeAllOther}
            disabled={revokingAll}
            className="h-9 px-4 rounded-full text-[13px] font-semibold transition-all duration-200 cursor-pointer active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            style={{ color: "#ef4444", border: "1.5px solid rgba(239,68,68,0.3)" }}
          >
            {revokingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
            Log out all others
          </button>
        )}
      </div>

      {/* Session list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#a0a0a0" }} />
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-[13px] text-center py-6" style={{ color: "#a0a0a0" }}>
          No active sessions found.
        </p>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {sessions.map((s) => (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-4 rounded-2xl px-4 py-3 transition-colors duration-150"
                style={{
                  backgroundColor: s.isCurrent ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.05)",
                  border: s.isCurrent ? "1px solid rgba(34,197,94,0.2)" : "1px solid transparent",
                }}
              >
                <DeviceIcon device={s.device} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate" style={{ color: "#ffffff" }}>
                      {sessionLabel(s.browser, s.os)}
                    </span>
                    {s.isCurrent && (
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                        style={{ backgroundColor: "rgba(34,197,94,0.12)", color: "#16a34a" }}
                      >
                        This device
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[12px]" style={{ color: "#999" }}>
                      {s.ip && s.ip !== "::1" && s.ip !== "127.0.0.1" ? s.ip : "Local"}
                    </span>
                    <span className="text-[12px]" style={{ color: "#666" }}>·</span>
                    <span className="text-[12px]" style={{ color: "#999" }}>
                      {timeAgo(s.lastActive)}
                    </span>
                  </div>
                </div>

                {!s.isCurrent && (
                  <button
                    onClick={() => revokeSession(s.id)}
                    disabled={revoking === s.id}
                    className="h-8 px-3 rounded-full text-[12px] font-semibold transition-all duration-200 cursor-pointer active:scale-[0.97] disabled:opacity-50 shrink-0 flex items-center gap-1"
                    style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
                  >
                    {revoking === s.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <LogOut className="h-3 w-3" />
                    )}
                    Log out
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
