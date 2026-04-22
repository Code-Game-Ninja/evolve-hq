"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Clock, 
  MapPin, 
  Home, 
  Play, 
  Square, 
  ChevronRight,
  BarChart3,
  Timer
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import Link from "next/link";
import { GlassPillTabs } from "@/components/ui/glass-pill-tabs";

interface AttendanceRecord {
  _id: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  status: "present" | "late" | "wfh" | "absent" | "half-day" | "active";
  workMode: "office" | "wfh";
  duration?: number;
  logs: Array<{
    time: string;
    type: "in" | "out";
    note?: string;
  }>;
}

export function AttendanceWidget() {
  const [activeTab, setActiveTab] = useState<"tracker" | "progress">("tracker");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [workMode, setWorkMode] = useState<"office" | "wfh">("office");
  const [elapsedTime, setElapsedTime] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const now = new Date();
      const res = await fetch(`/api/attendance?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
      if (!res.ok) throw new Error("Failed to fetch data");
      const data = await res.json();
      setTodayRecord(data.today || null);
      setHistory(data.records || []);
      if (data.today?.workMode) {
        setWorkMode(data.today.workMode);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Timer for active session
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (todayRecord?.status === "active") {
      const calculateElapsed = () => {
        let totalMs = 0;
        let lastIn: number | null = null;
        
        todayRecord.logs.forEach(log => {
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
        
        setElapsedTime(Math.floor(totalMs / 1000));
      };

      calculateElapsed();
      interval = setInterval(calculateElapsed, 1000);
    } else {
      setElapsedTime((todayRecord?.duration || 0) * 60);
    }

    return () => clearInterval(interval);
  }, [todayRecord]);

  const handleClockAction = async (type: "in" | "out") => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, workMode })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `Failed to clock ${type}`);
      }

      const updated = await res.json();
      setTodayRecord(updated);
      
      // Update history as well if it's already there
      setHistory(prev => {
        const index = prev.findIndex(r => r._id === updated._id);
        if (index > -1) {
          const newHistory = [...prev];
          newHistory[index] = updated;
          return newHistory;
        }
        return [updated, ...prev];
      });

      toast.success(`Successfully clocked ${type}!`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="h-full bg-slate-900/50 border border-white/5 backdrop-blur-xl rounded-3xl p-6 animate-pulse">
        <div className="flex justify-between mb-8">
          <div className="h-8 w-32 bg-white/5 rounded-full" />
          <div className="h-8 w-8 bg-white/5 rounded-full" />
        </div>
        <div className="h-10 w-48 bg-white/5 rounded mb-4" />
        <div className="h-4 w-32 bg-white/5 rounded mb-12" />
        <div className="h-12 w-full bg-white/5 rounded-2xl" />
      </div>
    );
  }

  const isActive = todayRecord?.status === "active";

  // Weekly progress calculation
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const weeklyStats = weekDays.map(day => {
    const record = history.find(r => isSameDay(new Date(r.date), day)) || 
                   (isSameDay(new Date(todayRecord?.date || ""), day) ? todayRecord : null);
    
    let hours = (record?.duration || 0) / 60;
    
    // If it's today and active, add the live elapsed time
    if (isSameDay(day, new Date()) && isActive) {
      hours = elapsedTime / 3600;
    }

    return {
      day: format(day, "EEE"),
      hours,
      isToday: isSameDay(day, new Date()),
      status: record?.status
    };
  });

  const totalWeeklyHours = weeklyStats.reduce((sum, s) => sum + s.hours, 0);

  return (
    <div className="h-full bg-slate-900/50 border border-white/5 backdrop-blur-xl rounded-3xl p-5 flex flex-col relative overflow-hidden group">
      {/* Background glow */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[60px] transition-all duration-700 ${
        isActive ? "bg-orange-500/20 scale-150" : "bg-slate-500/10"
      }`} />

      {/* Tabs */}
      <div className="flex items-center justify-between mb-4 z-10">
        <GlassPillTabs
          tabs={[
            { label: "Tracker", value: "tracker", icon: Timer },
            { label: "Progress", value: "progress", icon: BarChart3 },
          ]}
          activeValue={activeTab}
          onChange={(val) => setActiveTab(val as "tracker" | "progress")}
          layoutId="attendance-widget-tab"
          variant="subtle"
          size="sm"
        />
        <Link 
          href="/attendance" 
          className="p-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "tracker" ? (
            <motion.div
              key="tracker"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="h-full flex flex-col"
            >
              <div className="flex-1 flex flex-col justify-center py-2">
                <div className="text-[2.5rem] font-bold text-white tabular-nums tracking-tight leading-none mb-1">
                  {formatTime(elapsedTime)}
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`} />
                  <span className="text-xs text-slate-400 font-medium">
                    {isActive 
                      ? `Clocked in at ${format(new Date(todayRecord!.clockIn), "hh:mm a")}` 
                      : todayRecord?.clockOut 
                        ? `Finished at ${format(new Date(todayRecord.clockOut), "hh:mm a")}`
                        : "Ready to start shift"}
                  </span>
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-3">
                {!isActive && !todayRecord?.clockOut && (
                  <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
                    <button
                      onClick={() => setWorkMode("office")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
                        workMode === "office" ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Office
                    </button>
                    <button
                      onClick={() => setWorkMode("wfh")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
                        workMode === "wfh" ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <Home className="w-3.5 h-3.5" />
                      WFH
                    </button>
                  </div>
                )}

                <Button
                  size="lg"
                  onClick={() => handleClockAction(isActive ? "out" : "in")}
                  disabled={actionLoading || (!!todayRecord?.clockOut && !isActive)}
                  className={`w-full h-12 rounded-2xl font-bold text-sm transition-all duration-300 ${
                    isActive 
                      ? "bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md" 
                      : todayRecord?.clockOut 
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
                        : "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25"
                  }`}
                >
                  {isActive ? (
                    <>
                      <Square className="w-4 h-4 mr-2 fill-current" />
                      Clock Out
                    </>
                  ) : todayRecord?.clockOut ? (
                    "Shift Completed"
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2 fill-current" />
                      Start Work
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="progress"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="h-full flex flex-col"
            >
              <div className="mb-4">
                <div className="text-3xl font-bold text-white leading-none">
                  {totalWeeklyHours.toFixed(1)}h
                </div>
                <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-1">
                  Total work this week
                </div>
              </div>

              <div className="flex-1 flex items-end justify-between gap-1 mt-2">
                {weeklyStats.map((s, i) => {
                  const barHeight = Math.max((s.hours / 10) * 100, 4); // max 10h scale
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar">
                      <div className="relative w-full flex flex-col items-center">
                        <AnimatePresence>
                          {s.hours > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute -top-7 opacity-0 group-hover/bar:opacity-100 transition-opacity z-20"
                            >
                              <div className="bg-white text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xl whitespace-nowrap">
                                {s.hours.toFixed(1)}h
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${barHeight}%` }}
                          className={`w-full max-w-[14px] rounded-t-md transition-all duration-500 ${
                            s.isToday 
                              ? "bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]" 
                              : s.hours > 0 ? "bg-slate-700 group-hover/bar:bg-slate-600" : "bg-white/5"
                          }`}
                        />
                      </div>
                      <span className={`text-[10px] font-bold ${s.isToday ? "text-orange-500" : "text-slate-500"}`}>
                        {s.day[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-slate-400 font-medium">Avg: {(totalWeeklyHours / 5).toFixed(1)}h/day</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  Goal: 40h
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

