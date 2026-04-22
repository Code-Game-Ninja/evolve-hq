"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Clock, 
  MapPin, 
  Home, 
  History, 
  Calendar as CalendarIcon,
  Play,
  Square,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GlassPillTabs } from "@/components/ui/glass-pill-tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

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

export function AttendanceClient() {
  const [activeTab, setActiveTab] = useState<"Today" | "History">("Today");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [workMode, setWorkMode] = useState<"office" | "wfh">("office");
  const [elapsedTime, setElapsedTime] = useState(0);

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance");
      if (!res.ok) throw new Error("Failed to fetch attendance");
      const data = await res.json();
      setRecords(data.records || []);
      setTodayRecord(data.today || null);
      if (data.today?.workMode) {
        setWorkMode(data.today.workMode);
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not load attendance data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Timer for active session
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (todayRecord?.status === "active") {
      // Calculate initial elapsed time
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

  const handleClockIn = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "in", workMode })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to clock in");
      }

      const updated = await res.json();
      setTodayRecord(updated);
      toast.success("Clocked in successfully!");
      fetchAttendance(); // Refresh history
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "out" })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to clock out");
      }

      const updated = await res.json();
      setTodayRecord(updated);
      toast.success("Clocked out successfully!");
      fetchAttendance(); // Refresh history
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/20">Active</Badge>;
      case "present": return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/20">Present</Badge>;
      case "late": return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/20">Late</Badge>;
      case "wfh": return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/20">WFH</Badge>;
      case "half-day": return <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/20">Half Day</Badge>;
      case "absent": return <Badge className="bg-rose-500/20 text-rose-500 border-rose-500/20">Absent</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Attendance</h1>
          <p className="text-slate-400 mt-1">Track your daily work hours and manage your schedule.</p>
        </div>

        <div className="flex items-center gap-3">
          <GlassPillTabs
            tabs={[
              { label: "Today", value: "Today", icon: Clock },
              { label: "History", value: "History", icon: History },
            ]}
            activeValue={activeTab}
            onChange={(val) => setActiveTab(val as any)}
            layoutId="attendance-tabs"
            size="sm"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "Today" ? (
          <motion.div
            key="today"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Status Card */}
            <Card className="lg:col-span-2 bg-slate-900/50 border-white/5 backdrop-blur-xl p-8 rounded-[32px] overflow-hidden relative">
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-[100px] -mr-32 -mt-32" />
              
              <div className="relative flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                      <Clock className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 font-medium">Daily Status</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-white font-semibold">
                          {todayRecord ? (todayRecord.status === "active" ? "Currently Working" : "Shift Ended") : "Not Clocked In"}
                        </span>
                        {todayRecord && getStatusBadge(todayRecord.status)}
                      </div>
                    </div>
                  </div>

                  {!todayRecord || todayRecord.status === "active" ? (
                    <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Work Mode</span>
                        <div className="flex items-center gap-2">
                          {workMode === "office" ? <MapPin className="w-3.5 h-3.5 text-orange-500" /> : <Home className="w-3.5 h-3.5 text-blue-500" />}
                          <span className="text-sm font-medium text-white capitalize">{workMode}</span>
                        </div>
                      </div>
                      <Select 
                        value={workMode} 
                        onValueChange={(val: any) => setWorkMode(val)}
                        disabled={todayRecord?.status === "active"}
                      >
                        <SelectTrigger className="w-[40px] h-[40px] p-0 bg-transparent border-none shadow-none focus:ring-0">
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          <SelectItem value="office" className="text-white focus:bg-white/10">Office</SelectItem>
                          <SelectItem value="wfh" className="text-white focus:bg-white/10">Work From Home</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                </div>

                <div className="flex-1 flex flex-col items-center justify-center py-10">
                  <div className="text-[5rem] font-bold tracking-tighter text-white tabular-nums leading-none">
                    {formatTime(elapsedTime)}
                  </div>
                  <p className="text-slate-400 mt-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    Total work time recorded for today
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <Button
                    size="lg"
                    className={`rounded-2xl h-16 text-lg font-bold transition-all duration-300 ${
                      todayRecord?.status === "active" 
                        ? "bg-slate-800 text-slate-400 cursor-not-allowed" 
                        : "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                    }`}
                    onClick={handleClockIn}
                    disabled={actionLoading || todayRecord?.status === "active"}
                  >
                    <Play className="w-5 h-5 mr-2 fill-current" />
                    Clock In
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className={`rounded-2xl h-16 text-lg font-bold border-white/10 hover:bg-white/5 transition-all duration-300 ${
                      todayRecord?.status !== "active"
                        ? "text-slate-500 cursor-not-allowed opacity-50"
                        : "text-white"
                    }`}
                    onClick={handleClockOut}
                    disabled={actionLoading || todayRecord?.status !== "active"}
                  >
                    <Square className="w-5 h-5 mr-2 fill-current" />
                    Clock Out
                  </Button>
                </div>
              </div>
            </Card>

            {/* Timeline Card */}
            <Card className="bg-slate-900/50 border-white/5 backdrop-blur-xl p-8 rounded-[32px]">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <History className="w-5 h-5 text-orange-500" />
                Session Timeline
              </h3>

              <div className="space-y-6 relative">
                {/* Vertical Line */}
                <div className="absolute left-4 top-2 bottom-2 w-px bg-white/10" />

                {!todayRecord || todayRecord.logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <AlertCircle className="w-6 h-6 text-slate-600" />
                    </div>
                    <p className="text-slate-500 text-sm">No logs recorded for today yet.</p>
                  </div>
                ) : (
                  todayRecord.logs.map((log, i) => (
                    <div key={i} className="relative pl-10">
                      <div className={`absolute left-0 top-1.5 w-8 h-8 rounded-full border-4 border-[#0b1120] flex items-center justify-center ${
                        log.type === "in" ? "bg-emerald-500" : "bg-rose-500"
                      }`}>
                        {log.type === "in" ? <Play className="w-2.5 h-2.5 text-white fill-current" /> : <Square className="w-2.5 h-2.5 text-white fill-current" />}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {log.type === "in" ? "Clocked In" : "Clocked Out"}
                        </p>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {format(new Date(log.time), "hh:mm:ss a")}
                          {log.note && <span className="ml-2 italic">• {log.note}</span>}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {todayRecord?.clockOut && (
                <div className="mt-8 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <p className="text-sm text-emerald-200/70">
                    Shift completed for today. Great work!
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-slate-900/50 border-white/5 backdrop-blur-xl rounded-[32px] overflow-hidden">
              <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Attendance History</h3>
                  <p className="text-sm text-slate-400">View your past attendance records and work hours.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" className="rounded-xl border-white/10 text-white">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Select Month
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-slate-400 py-4 px-8">Date</TableHead>
                      <TableHead className="text-slate-400 py-4">Status</TableHead>
                      <TableHead className="text-slate-400 py-4">Work Mode</TableHead>
                      <TableHead className="text-slate-400 py-4">Clock In</TableHead>
                      <TableHead className="text-slate-400 py-4">Clock Out</TableHead>
                      <TableHead className="text-slate-400 py-4">Duration</TableHead>
                      <TableHead className="text-slate-400 py-4 text-right px-8">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="border-white/5">
                          <TableCell className="px-8 py-4"><div className="h-5 w-24 bg-white/5 rounded animate-pulse" /></TableCell>
                          <TableCell><div className="h-5 w-20 bg-white/5 rounded animate-pulse" /></TableCell>
                          <TableCell><div className="h-5 w-16 bg-white/5 rounded animate-pulse" /></TableCell>
                          <TableCell><div className="h-5 w-20 bg-white/5 rounded animate-pulse" /></TableCell>
                          <TableCell><div className="h-5 w-20 bg-white/5 rounded animate-pulse" /></TableCell>
                          <TableCell><div className="h-5 w-16 bg-white/5 rounded animate-pulse" /></TableCell>
                          <TableCell className="text-right px-8"><div className="h-8 w-8 ml-auto bg-white/5 rounded animate-pulse" /></TableCell>
                        </TableRow>
                      ))
                    ) : records.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={7} className="h-64 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <History className="w-12 h-12 text-slate-700 mb-4" />
                            <p className="text-slate-500 font-medium">No records found for this period.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      records.map((record) => (
                        <TableRow key={record._id} className="border-white/5 group hover:bg-white/[0.02] transition-colors">
                          <TableCell className="px-8 py-4 font-medium text-white">
                            {format(new Date(record.date), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-slate-300">
                              {record.workMode === "office" ? <MapPin className="w-3.5 h-3.5 text-orange-500" /> : <Home className="w-3.5 h-3.5 text-blue-500" />}
                              <span className="capitalize">{record.workMode}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300">{format(new Date(record.clockIn), "hh:mm a")}</TableCell>
                          <TableCell className="text-slate-300">{record.clockOut ? format(new Date(record.clockOut), "hh:mm a") : "—"}</TableCell>
                          <TableCell className="text-slate-300">
                            {record.duration ? `${Math.floor(record.duration / 60)}h ${record.duration % 60}m` : "—"}
                          </TableCell>
                          <TableCell className="text-right px-8">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 group-hover:text-white transition-colors">
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
