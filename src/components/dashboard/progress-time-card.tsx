// Combined progress + time tracker card with tab switch
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { BarChart3, Timer, Headphones, Clock } from "lucide-react";
import { GlassPillTabs } from "@/components/ui/glass-pill-tabs";

const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
const maxHours = 10;

// Shared data shape from parent
interface AttendanceData {
  records: Array<{ date: string; duration?: number; status?: string }>;
  today: {
    clockIn?: string;
    clockOut?: string;
    duration?: number;
    status?: string;
    logs: Array<{ time: string; type: "in" | "out"; note?: string }>;
  } | null;
}

// Progress content — receives data from parent
function ProgressContent({ data, loading }: { data: AttendanceData | null; loading: boolean }) {
  const now = new Date();
  const currentDay = now.getDay();

  if (loading || !data) {
    return (
      <div className="flex-1 flex flex-col pt-3 animate-pulse">
        <div className="h-8 w-20 rounded" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
        <div className="h-3 w-28 mt-2 rounded" style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />
        <div className="flex items-end justify-between gap-1.5 mt-auto" style={{ height: "100px" }}>
          {dayLabels.map((_, i) => (
            <div key={i} className="flex-1 rounded-t" style={{ height: `${20 + i * 8}px`, backgroundColor: "rgba(255,255,255,0.05)" }} />
          ))}
        </div>
      </div>
    );
  }

  // Build hours per day-of-week from records in this week
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - currentDay);
  weekStart.setHours(0, 0, 0, 0);

  const hoursMap: number[] = [0, 0, 0, 0, 0, 0, 0];
  for (const rec of data.records || []) {
    const recDate = new Date(rec.date);
    if (recDate >= weekStart && recDate <= now) {
      const dayIdx = recDate.getDay();
      hoursMap[dayIdx] = (rec.duration || 0) / 60;
    }
  }

  // If today is active, show live hours (base + current session)
  if (data.today?.status === "active") {
    let totalMs = 0;
    let lastIn: number | null = null;
    
    data.today.logs.forEach(log => {
      if (log.type === "in") {
        lastIn = new Date(log.time).getTime();
      } else if (log.type === "out" && lastIn !== null) {
        totalMs += new Date(log.time).getTime() - lastIn;
        lastIn = null;
      }
    });

    if (lastIn !== null) {
      totalMs += Date.now() - lastIn;
    }
    
    hoursMap[currentDay] = Math.max(hoursMap[currentDay], totalMs / 3600000);
  }

  const weekData = dayLabels.map((day, i) => ({
    day,
    hours: i > currentDay ? 0 : Math.round(hoursMap[i] * 10) / 10,
    isToday: i === currentDay,
  }));

  const totalHours = weekData.reduce((sum, d) => sum + d.hours, 0);

  return (
    <div className="flex-1 flex flex-col pt-3">
      <div>
        <span
          className="text-[2rem] font-bold leading-none"
          style={{ color: "#ffffff" }}
        >
          {totalHours.toFixed(1)}h
        </span>
        <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
          Work time this week
        </p>
      </div>

      <div
        className="flex items-end justify-between gap-1.5 mt-auto"
        style={{ height: "100px" }}
      >
        {weekData.map((d, i) => {
          const height =
            d.hours > 0 ? Math.max((d.hours / maxHours) * 100, 6) : 6;

          return (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
              {d.isToday && d.hours > 0 && (
                <div className="relative">
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold text-white whitespace-nowrap"
                    style={{ backgroundColor: "#f3350c" }}
                  >
                    {Math.floor(d.hours)}h {Math.round((d.hours % 1) * 60)}m
                  </span>
                  <div
                    className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-1.5 h-1.5 rotate-45"
                    style={{ backgroundColor: "#f3350c" }}
                  />
                </div>
              )}
              <div
                className="w-full transition-all duration-300"
                style={{
                  height: `${height}px`,
                  minHeight: "6px",
                  backgroundColor:
                    d.hours > 0
                      ? d.isToday
                        ? "#f3350c"
                        : "#0a0a0a"
                      : "rgba(0,0,0,0.05)",
                  borderRadius: "5px 5px 0 0",
                  maxWidth: "20px",
                }}
              />
              <span
                className="text-[10px] font-medium"
                style={{ color: d.isToday ? "#f3350c" : "#bbb" }}
              >
                {d.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Time tracker content — receives elapsed/source from parent
function TimeTrackerContent({
  elapsedSec,
  isActive,
  source,
  loading,
}: {
  elapsedSec: number;
  isActive: boolean;
  source: string | null;
  loading: boolean;
}) {
  const target = 8 * 3600;
  const progress = Math.min(elapsedSec / target, 1);

  const hours = Math.floor(elapsedSec / 3600);
  const minutes = Math.floor((elapsedSec % 3600) / 60);
  const seconds = elapsedSec % 60;
  const timeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const size = 120;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const SourceIcon = Clock;
  const sourceLabel = "Work Time";

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center pt-2 animate-pulse">
        <div className="rounded-full" style={{ width: size, height: size, backgroundColor: "rgba(255,255,255,0.05)" }} />
        <div className="h-3 w-20 mt-3 rounded" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center pt-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(0,0,0,0.05)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f3350c"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-[1.5rem] font-bold leading-none tabular-nums"
            style={{ color: "#ffffff" }}
          >
            {timeStr}
          </span>
        </div>
      </div>

      {/* Source + status */}
      <div className="flex items-center gap-1.5 mt-2">
        {source && (
          <SourceIcon
            className="w-3.5 h-3.5"
            style={{ color: source === "discord" ? "#6366f1" : "#737373" }}
          />
        )}
        <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>
          {isActive ? "Tracking..." : sourceLabel} ({Math.round(progress * 100)}%)
        </span>
      </div>
    </div>
  );
}

export function ProgressTimeCard() {
  const [activeTab, setActiveTab] = useState<"Progress" | "Time Tracker">("Time Tracker");

  // Shared attendance data — single fetch for both tabs
  const [attData, setAttData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);

  // Timer state — managed here so it survives tab switches
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasActiveRef = useRef(false);

  const fetchAttendance = useCallback(async () => {
    try {
      const now = new Date();
      const res = await fetch(`/api/attendance?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
      if (!res.ok) return;
      const data = await res.json();
      setAttData(data);

      // Update timer state from today's record
      if (data.today) {
        if (data.today.status === "active") {
          if (!wasActiveRef.current) {
            let totalMs = 0;
            let lastIn: number | null = null;
            
            data.today.logs.forEach((log: any) => {
              if (log.type === "in") {
                lastIn = new Date(log.time).getTime();
              } else if (log.type === "out" && lastIn !== null) {
                totalMs += new Date(log.time).getTime() - lastIn;
                lastIn = null;
              }
            });

            if (lastIn !== null) {
              totalMs += Date.now() - lastIn;
            }
            setElapsedSec(Math.floor(totalMs / 1000));
          }
          wasActiveRef.current = true;
          setIsActive(true);
        } else {
          wasActiveRef.current = false;
          setElapsedSec((data.today.duration || 0) * 60);
          setIsActive(false);
        }
      } else {
        wasActiveRef.current = false;
        setElapsedSec(0);
        setIsActive(false);
      }
    } catch {
      // keep current state
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAttendance().finally(() => setLoading(false));
  }, [fetchAttendance]);

  // Poll every 15s — lightweight (single findOne query), picks up Discord join/leave quickly
  useEffect(() => {
    const poll = setInterval(fetchAttendance, 15_000);
    return () => clearInterval(poll);
  }, [fetchAttendance]);

  // Live tick when active
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setElapsedSec((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  return (
    <div
      className="h-full flex flex-col overflow-hidden backdrop-blur-xl border border-white/10"
      style={{
        backgroundColor: "rgba(11, 17, 32, 0.6)",
        borderRadius: "24px",
      }}
    >
      {/* Header with tab switch */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <GlassPillTabs
          tabs={[
            { label: "Time Tracker", value: "Time Tracker", icon: Timer },
            { label: "Progress", value: "Progress", icon: BarChart3 },
          ]}
          activeValue={activeTab}
          onChange={(val) => setActiveTab(val as "Progress" | "Time Tracker")}
          layoutId="progress-time-tab"
          variant="subtle"
          size="sm"
        />
      </div>

      <div className="mx-5 h-px" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />

      {/* Tab content — both rendered always, inactive hidden via CSS to preserve state */}
      <div className="flex-1 px-5 pb-4">
        <div className={`flex-1 flex flex-col h-full ${activeTab !== "Time Tracker" ? "hidden" : ""}`}>
          <TimeTrackerContent elapsedSec={elapsedSec} isActive={isActive} source={source} loading={loading} />
        </div>
        <div className={`flex-1 flex flex-col h-full ${activeTab !== "Progress" ? "hidden" : ""}`}>
          <ProgressContent data={attData} loading={loading} />
        </div>
      </div>
    </div>
  );
}
