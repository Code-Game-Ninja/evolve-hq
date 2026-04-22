// Notification bell dropdown
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  CalendarCheck,
  CalendarX,
  ClipboardList,
  UserPlus,
  MessageCircle,
  X,
  Trash2,
  Settings,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface NotificationData {
  _id: string;
  type: string;
  title: string;
  description: string;
  href: string;
  read: boolean;
  createdAt: string;
}

interface DisplayNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  timeGroup: "today" | "earlier";
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  read: boolean;
  href: string;
}

// Map notification type to icon/colors
const typeConfig: Record<string, { icon: LucideIcon; iconBg: string; iconColor: string }> = {
  leave_approved: { icon: CalendarCheck, iconBg: "rgba(34,197,94,0.15)", iconColor: "#22c55e" },
  leave_rejected: { icon: CalendarX, iconBg: "rgba(239,68,68,0.15)", iconColor: "#ef4444" },
  task_assigned: { icon: ClipboardList, iconBg: "rgba(59,130,246,0.15)", iconColor: "#3b82f6" },
  task_updated: { icon: ClipboardList, iconBg: "rgba(59,130,246,0.15)", iconColor: "#3b82f6" },
  meeting_reminder: { icon: MessageCircle, iconBg: "rgba(232,127,36,0.15)", iconColor: "#e87f24" },
  attendance: { icon: Check, iconBg: "rgba(255,255,255,0.08)", iconColor: "#94a3b8" },
  team_update: { icon: UserPlus, iconBg: "rgba(139,92,246,0.15)", iconColor: "#8b5cf6" },
  system: { icon: Settings, iconBg: "rgba(255,255,255,0.08)", iconColor: "#94a3b8" },
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24 && date.getDate() === now.getDate()) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth()) return "Yesterday";

  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

function getTimeGroup(dateStr: string): "today" | "earlier" {
  const date = new Date(dateStr);
  const now = new Date();
  return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    ? "today"
    : "earlier";
}

function toDisplay(n: NotificationData): DisplayNotification {
  const config = typeConfig[n.type] || typeConfig.system;
  return {
    id: n._id,
    title: n.title,
    description: n.description,
    time: formatTime(n.createdAt),
    timeGroup: getTimeGroup(n.createdAt),
    icon: config.icon,
    iconBg: config.iconBg,
    iconColor: config.iconColor,
    read: n.read,
    href: n.href,
  };
}

// Animation variants
const panelVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.96 },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

export function NotificationDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<DisplayNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hasFetched = useRef(false);

  const todayNotifications = notifications.filter((n) => n.timeGroup === "today");
  const earlierNotifications = notifications.filter((n) => n.timeGroup === "earlier");

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications((data.notifications ?? []).map(toDisplay));
      setUnreadCount(data.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on first open
  useEffect(() => {
    if (open && !hasFetched.current) {
      hasFetched.current = true;
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  // Re-fetch when dropdown opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const handleNotificationClick = useCallback(async (notification: DisplayNotification) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - (notification.read ? 0 : 1)));
    setOpen(false);
    router.push(notification.href);
    // Persist
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: notification.id }),
    });
  }, [router]);

  const dismissNotification = useCallback(async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.read) setUnreadCount((c) => Math.max(0, c - 1));
    // Persist
    await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }, [notifications]);

  const markAllRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    // Persist
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  }, []);

  // Render a group of notifications
  const renderGroup = (label: string, items: DisplayNotification[], startIndex: number) => {
    if (items.length === 0) return null;
    return (
      <div>
        <div className="px-5 pt-3 pb-1.5">
          <span className="text-[10px] font-semibold tracking-wider uppercase opacity-50 text-white">
            {label}
          </span>
        </div>
        <AnimatePresence mode="popLayout">
          {items.map((notification, idx) => (
            <motion.div
              key={notification.id}
              custom={startIndex + idx}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
              className={cn(
                "group relative flex items-start gap-3 px-5 py-3 transition-colors",
                !notification.read && "bg-white/[0.03]",
                "hover:bg-white/[0.05]"
              )}
            >
              {/* Unread indicator bar */}
              {!notification.read && (
                <div
                  className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
                  style={{ backgroundColor: "var(--primary)" }}
                />
              )}

              {/* Icon */}
              <div
                className="flex items-center justify-center h-9 w-9 rounded-xl flex-shrink-0 mt-0.5"
                style={{ backgroundColor: notification.iconBg }}
              >
                <notification.icon className="h-4 w-4" color={notification.iconColor} />
              </div>

              {/* Content */}
              <button
                onClick={() => handleNotificationClick(notification)}
                className="flex-1 min-w-0 text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <p
                    className={cn("text-[13px] truncate", notification.read ? "font-medium" : "font-semibold")}
                    style={{ color: notification.read ? "rgba(255,255,255,0.7)" : "#ffffff" }}
                  >
                    {notification.title}
                  </p>
                  {!notification.read && (
                    <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--primary)" }} />
                  )}
                </div>
                <p className="text-[12px] mt-0.5 line-clamp-2 text-white/50">
                  {notification.description}
                </p>
                <p className="text-[10px] mt-1 text-white/30 font-medium">
                  {notification.time}
                </p>
              </button>

              {/* Dismiss button — visible on hover */}
              <button
                onClick={() => dismissNotification(notification.id)}
                className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 mt-1 cursor-pointer"
                title="Dismiss"
              >
                <Trash2 className="h-3 w-3 text-white/30" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((prev) => !prev)}
        className="relative hidden md:flex items-center justify-center h-11 w-11 rounded-full hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-xl border border-white/10 cursor-pointer"
        style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-white/70" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full text-[9px] font-bold text-white px-1 shadow-lg shadow-orange-500/20" style={{ backgroundColor: "var(--primary)" }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute right-0 top-full mt-2 w-[380px] max-h-[520px] flex flex-col overflow-hidden rounded-[24px] backdrop-blur-2xl border border-white/10 z-50 shadow-2xl"
            style={{
              backgroundColor: "rgba(11, 17, 32, 0.85)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div className="flex items-center gap-2.5">
                <h3 className="text-[15px] font-semibold text-white">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span
                    className="min-w-[20px] h-5 flex items-center justify-center rounded-full text-[11px] font-semibold text-white px-1.5"
                    style={{ backgroundColor: "var(--primary)" }}
                  >
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors hover:bg-white/5 cursor-pointer"
                    style={{ color: "var(--primary)" }}
                  >
                    <CheckCheck className="h-3 w-3" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5 text-white/50" />
                </button>
              </div>
            </div>

            <div className="mx-5 h-px bg-white/5" />

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-14">
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#bbb" }} />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <div
                    className="h-12 w-12 rounded-2xl flex items-center justify-center bg-white/5"
                  >
                    <Bell className="h-5 w-5 text-white/20" />
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-medium text-white/70">
                      All caught up
                    </p>
                    <p className="text-[11px] mt-0.5 text-white/30">
                      No new notifications right now
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {renderGroup("Today", todayNotifications, 0)}
                  {todayNotifications.length > 0 && earlierNotifications.length > 0 && (
                    <div className="mx-5 h-px bg-white/5" />
                  )}
                  {renderGroup("Earlier", earlierNotifications, todayNotifications.length)}
                </>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <>
                <div className="h-px bg-white/5" />
                <div className="px-5 py-3 flex items-center justify-center">
                  <button
                    className="text-[12px] font-medium transition-colors hover:opacity-80 cursor-pointer"
                    style={{ color: "var(--primary)" }}
                    onClick={() => setOpen(false)}
                  >
                    View all notifications
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
