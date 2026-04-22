"use client";

// Force-change-password page (S1)
// Shown when session.user.mustChangePassword === true

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Eye, EyeOff, Lock } from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { update } = useSession();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to change password.");
        return;
      }

      // Refresh session so mustChangePassword flag is cleared
      await update({ mustChangePassword: false });
      router.replace("/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#f8f7f3" }}
    >
      {/* Floating orbs */}
      <div
        className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(243,53,12,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(243,53,12,0.04) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div
        className="relative w-full max-w-md p-8 border border-[#dddddd] backdrop-blur-lg"
        style={{
          backgroundColor: "rgba(241,239,237,0.55)",
          borderRadius: "24px",
        }}
      >
        {/* Icon */}
        <div
          className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#dddddd]"
          style={{ backgroundColor: "rgba(241,239,237,0.8)" }}
        >
          <Lock className="h-5 w-5" style={{ color: "#f3350c" }} />
        </div>

        <h1 className="text-center text-xl font-semibold text-[#1a1a1a] mb-1">
          Change your password
        </h1>
        <p className="text-center text-sm mb-8" style={{ color: "#737373" }}>
          You must set a new password before continuing.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current password */}
          <div>
            <label className="block text-xs font-medium text-[#1a1a1a] mb-1.5">
              Current password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-[#dddddd] bg-white/60 px-4 py-2.5 text-sm text-[#1a1a1a] outline-none focus:border-[#f3350c] transition-colors"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "#737373" }}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-xs font-medium text-[#1a1a1a] mb-1.5">
              New password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-[#dddddd] bg-white/60 px-4 py-2.5 text-sm text-[#1a1a1a] outline-none focus:border-[#f3350c] transition-colors"
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "#737373" }}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-xs font-medium text-[#1a1a1a] mb-1.5">
              Confirm new password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-[#dddddd] bg-white/60 px-4 py-2.5 text-sm text-[#1a1a1a] outline-none focus:border-[#f3350c] transition-colors"
              placeholder="Repeat new password"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ backgroundColor: "#f3350c" }}
          >
            {loading ? "Saving…" : "Set new password"}
          </button>
        </form>
      </div>
    </div>
  );
}
