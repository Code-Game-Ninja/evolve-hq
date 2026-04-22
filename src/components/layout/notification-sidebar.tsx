"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Bell, 
  X, 
  CheckCheck, 
  Search, 
  Filter, 
  Trash2, 
  CalendarCheck, 
  CalendarX, 
  ClipboardList, 
  MessageCircle, 
  UserPlus, 
  Settings,
  BellOff,
  MoreVertical,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { getPusherClient } from "@/lib/pusher";

interface Notification {
  _id: string;
  type: 'leave_approved' | 'leave_rejected' | 'task_assigned' | 'task_updated' | 'meeting_reminder' | 'attendance' | 'team_update' | 'system';
  title: string;
  description: string;
  href: string;
  read: boolean;
  createdAt: string;
}

interface NotificationSidebarProps {
  open: boolean;
  onClose: () => void;
}

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  leave_approved: { icon: CalendarCheck, color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  leave_rejected: { icon: CalendarX, color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  task_assigned: { icon: ClipboardList, color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  task_updated: { icon: ClipboardList, color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  meeting_reminder: { icon: MessageCircle, color: "#f3350c", bg: "rgba(243,53,12,0.1)" },
  attendance: { icon: CheckCheck, color: "#94a3b8", bg: "rgba(255,255,255,0.05)" },
  team_update: { icon: UserPlus, color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
  system: { icon: Settings, color: "#94a3b8", bg: "rgba(255,255,255,0.05)" },
};

const categories = [
  { label: "All", value: "all" },
  { label: "Tasks", value: "task" },
  { label: "Leaves", value: "leave" },
  { label: "System", value: "system" },
];

export function NotificationSidebar({ open, onClose }: NotificationSidebarProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications");
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  // Pusher Real-time updates
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe("global-notifications");
    channel.bind("new-notification", (newNotif: Notification) => {
      setNotifications(prev => [newNotif, ...prev]);
    });

    return () => {
      pusher.unsubscribe("global-notifications");
    };
  }, []);

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  };

  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n._id !== id));
    await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || 
                         n.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || n.type.includes(filter);
    return matchesSearch && matchesFilter;
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[420px] bg-[#0a0a0a] border-l border-white/10 z-[101] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[#f3350c]/10 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-[#f3350c]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Notifications</h2>
                    <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Activity Feed</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="h-10 w-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors text-white/50 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input 
                    type="text" 
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#f3350c]/50 transition-all"
                  />
                </div>
                <button 
                  onClick={markAllRead}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-white/60 hover:bg-white/5 hover:text-white transition-all"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Read All
                </button>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setFilter(cat.value)}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                      filter === cat.value 
                        ? "bg-white text-black" 
                        : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                  <BellOff className="h-12 w-12 mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest text-white">No notifications</p>
                  <p className="text-xs text-white mt-1">We'll let you know when something happens</p>
                </div>
              ) : (
                filteredNotifications.map((notif, idx) => {
                  const config = typeConfig[notif.type] || typeConfig.system;
                  const Icon = config.icon;
                  
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={notif._id}
                      className={cn(
                        "group relative p-4 rounded-[24px] border transition-all duration-300",
                        notif.read 
                          ? "bg-transparent border-white/5 opacity-60 hover:opacity-100" 
                          : "bg-white/[0.03] border-white/10 shadow-lg shadow-black/20"
                      )}
                    >
                      {!notif.read && (
                        <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-[#f3350c] shadow-[0_0_10px_rgba(243,53,12,0.5)]" />
                      )}
                      
                      <div className="flex gap-4">
                        <div 
                          className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: config.bg }}
                        >
                          <Icon className="h-5 w-5" style={{ color: config.color }} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className={cn("text-sm font-bold text-white truncate", !notif.read && "pr-4")}>
                              {notif.title}
                            </h4>
                          </div>
                          <p className="text-xs text-white/50 leading-relaxed mb-3 line-clamp-2">
                            {notif.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-tight">
                              {format(new Date(notif.createdAt), "MMM d, h:mm a")}
                            </span>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notif.read && (
                                <button 
                                  onClick={() => markAsRead(notif._id)}
                                  className="h-7 px-2 rounded-lg hover:bg-white/10 text-[10px] font-bold text-white/60 transition-colors"
                                >
                                  Mark Read
                                </button>
                              )}
                              <button 
                                onClick={() => deleteNotification(notif._id)}
                                className="h-7 w-7 rounded-lg hover:bg-red-500/20 text-red-500/60 flex items-center justify-center transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {notif.href && (
                        <a 
                          href={notif.href}
                          className="absolute inset-0 z-0"
                          onClick={(e) => {
                            if (!notif.read) markAsRead(notif._id);
                            onClose();
                          }}
                        />
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 bg-white/[0.02]">
              <Link 
                href="/settings?tab=notifications"
                onClick={onClose}
                className="flex items-center justify-between w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <Settings className="h-4 w-4 text-white/40" />
                  </div>
                  <span className="text-sm font-bold text-white/60">Notification Settings</span>
                </div>
                <ChevronRight className="h-4 w-4 text-white/20 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
