// Daily Update / Standup card
"use client";

import { useState, useEffect } from "react";
import { Send, CheckCircle, Clock, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DailyUpdateCardProps {
  // Shift config — will come from API/admin settings per employee
  shiftStart?: string; // e.g. "09:00"
  shiftEnd?: string; // e.g. "18:00"
  workDays?: number[]; // 0=Sun, 1=Mon ... 6=Sat. Default Mon-Fri
}

function isWithinShift(
  shiftStart: string,
  shiftEnd: string,
  workDays: number[]
): boolean {
  const now = new Date();
  const day = now.getDay();
  if (!workDays.includes(day)) return false;

  const [sh, sm] = shiftStart.split(":").map(Number);
  const [eh, em] = shiftEnd.split(":").map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;

  // Handle overnight shifts (e.g. 22:00 - 06:00)
  if (endMins < startMins) {
    return nowMins >= startMins || nowMins <= endMins;
  }
  return nowMins >= startMins && nowMins <= endMins;
}

function formatShiftLabel(start: string, end: string): string {
  const fmt12 = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };
  return `${start} (${fmt12(start)}) — ${end} (${fmt12(end)})`;
}

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DailyUpdateCard({
  shiftStart = "09:00",
  shiftEnd = "18:00",
  workDays = [1, 2, 3, 4, 5],
}: DailyUpdateCardProps) {
  const [yesterday, setYesterday] = useState("");
  const [today, setToday] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [withinShift, setWithinShift] = useState(true);

  useEffect(() => {
    setWithinShift(isWithinShift(shiftStart, shiftEnd, workDays));
    const interval = setInterval(() => {
      setWithinShift(isWithinShift(shiftStart, shiftEnd, workDays));
    }, 60_000);
    return () => clearInterval(interval);
  }, [shiftStart, shiftEnd, workDays]);

  // Check if today's update already submitted
  useEffect(() => {
    async function checkExisting() {
      try {
        const res = await fetch("/api/daily-updates");
        if (!res.ok) return;
        const data = await res.json();
        if (data.update) {
          setYesterday(data.update.yesterday || "");
          setToday(data.update.today || "");
          setSubmitted(true);
        }
      } catch {
        // Non-critical
      }
    }
    checkExisting();
  }, []);

  const handleSubmit = async () => {
    if (!yesterday.trim() && !today.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/daily-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yesterday: yesterday.trim(), today: today.trim() }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      // Show inline error feedback
      alert("Failed to submit update. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentDay = new Date().getDay();
  const todayDate = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });

  return (
    <div
      className="overflow-hidden h-full flex flex-col backdrop-blur-xl border border-white/10 bg-glass-bg"
      style={{
        borderRadius: "24px",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <CalendarCheck className="h-4 w-4 text-primary" />
          <h3
            className="text-[14px] font-semibold text-white/90"
          >
            Daily Update
          </h3>
        </div>
        <span className="text-[11px] font-medium text-white/40">
          {todayDate}
        </span>
      </div>

      {/* Shift indicator */}
      <div className="px-5 pb-3 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-white/30" />
          <span className="text-[11px] text-white/50">
            {formatShiftLabel(shiftStart, shiftEnd)}
          </span>
        </div>
        {/* Work day dots */}
        <div className="flex gap-1">
          {dayLabels.map((d, i) => (
            <span
              key={d}
              className={cn(
                "text-[9px] font-medium w-5 h-5 flex items-center justify-center rounded-full transition-colors",
                workDays.includes(i)
                  ? i === currentDay
                    ? "text-white shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]"
                    : "text-white/20"
                  : "text-white/10"
              )}
              style={
                i === currentDay && workDays.includes(i)
                  ? { backgroundColor: "var(--primary)" }
                  : i === currentDay
                  ? { backgroundColor: "rgba(255,255,255,0.06)" }
                  : {}
              }
            >
              {d[0]}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-5 h-px" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />

      {/* Content */}
      <div className="flex-1 px-5 py-3 flex flex-col gap-3 overflow-y-auto">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center gap-2"
            >
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(34,197,94,0.1)" }}
              >
                <CheckCircle className="h-5 w-5" style={{ color: "#22c55e" }} />
              </div>
              <p
                className="text-[13px] font-medium"
                style={{ color: "#ffffff" }}
              >
                Update submitted
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setYesterday("");
                  setToday("");
                }}
                className="text-[12px] font-medium mt-1 transition-opacity hover:opacity-70 text-primary"
              >
                Edit response
              </button>
            </motion.div>
          ) : !withinShift ? (
            <motion.div
              key="outside"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center gap-2 text-center"
            >
              <Clock className="h-5 w-5" style={{ color: "rgba(255,255,255,0.3)" }} />
              <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                Daily update is available during your shift hours
              </p>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                {formatShiftLabel(shiftStart, shiftEnd)}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-3 flex-1"
            >
              {/* Yesterday */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  What did you do yesterday?
                </label>
                <textarea
                  value={yesterday}
                  onChange={(e) => setYesterday(e.target.value)}
                  placeholder="Completed design review, fixed auth bug..."
                  rows={2}
                  className="w-full resize-none rounded-xl px-3 py-2 text-[13px] border border-white/10 bg-white/5 text-white outline-none transition-all focus:border-primary/40 focus:bg-white/10 placeholder:text-white/20"
                />
              </div>

              {/* Today */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  What are you planning today?
                </label>
                <textarea
                  value={today}
                  onChange={(e) => setToday(e.target.value)}
                  placeholder="Sprint planning, deploy v2.1..."
                  rows={2}
                  className="w-full resize-none rounded-xl px-3 py-2 text-[13px] border border-white/10 bg-white/5 text-white outline-none transition-all focus:border-primary/40 focus:bg-white/10 placeholder:text-white/20"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting || (!yesterday.trim() && !today.trim())}
                className={cn(
                  "mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all",
                  yesterday.trim() || today.trim()
                    ? "bg-white text-black hover:bg-white/90 active:scale-[0.98]"
                    : "bg-white/5 text-white/20 cursor-not-allowed"
                )}
              >
                {submitting ? (
                  <div
                    className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                  />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Submit Update
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
