// Top navigation bar (Crextio-style — floating capsule, logo left, rest right)
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Bell, Settings } from "lucide-react";
import { workspaceNavItems } from "@/lib/nav-config";
import { useUIStore } from "@/lib/stores/ui-store";
import { UserDropdown } from "@/components/layout/user-dropdown";
import { GlassPillTabs } from "@/components/ui/glass-pill-tabs";
import { getPusherClient } from "@/lib/pusher";
import { useBrowserNotifications } from "@/lib/hooks/use-browser-notifications";
import { useSound } from "@/lib/hooks/use-sound";

interface TopNavProps {
  navItems?: typeof workspaceNavItems;
}

export function TopNav({ navItems = workspaceNavItems }: TopNavProps) {
  const pathname = usePathname();
  const { toggleNotificationSidebar } = useUIStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const { status, data: session } = useSession();
  const { notifyMessage, notifyTaskAssigned, notifyLeaveStatus, notifyMeeting, requestPermission } = useBrowserNotifications();
  const { playNotificationSound } = useSound();

  // Request browser notification permission on mount
  useEffect(() => {
    if (status === "authenticated") {
      requestPermission();
    }
  }, [status, requestPermission]);

  // Fetch initial unread count
  useEffect(() => {
    if (status !== "authenticated") return;
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error("Failed to fetch unread count");
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 120000);
    return () => clearInterval(interval);
  }, [status]);

  // Real-time notifications via Pusher
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    const userChannel = pusher.subscribe(`user-${session.user.id}`);

    userChannel.bind("new-notification", (notification: any) => {
      // Update badge count
      setUnreadCount((prev) => prev + 1);

      // Play sound
      playNotificationSound();

      // Show browser notification based on type
      switch (notification.type) {
        case "chat_message":
          notifyMessage(
            notification.title.split(" in ")[0] || "Someone",
            notification.description,
            notification.title.includes("#") ? notification.title.split("#")[1] : undefined
          );
          break;
        case "task_assigned":
          notifyTaskAssigned(
            notification.description.split('"')[1] || "New task",
            notification.description.split(" ")[0] || "Someone"
          );
          break;
        case "leave_approved":
          notifyLeaveStatus("approved", "leave");
          break;
        case "leave_rejected":
          notifyLeaveStatus("rejected", "leave");
          break;
        case "meeting_reminder":
          notifyMeeting(
            notification.description.split('"')[1] || "Meeting",
            notification.description.split(" ")[0] || "Someone"
          );
          break;
      }
    });

    return () => {
      userChannel.unbind_all();
      pusher.unsubscribe(`user-${session.user.id}`);
    };
  }, [status, session?.user?.id, notifyMessage, notifyTaskAssigned, notifyLeaveStatus, notifyMeeting, playNotificationSound]);

  return (
    <div className="sticky top-0 z-50 pt-1 md:pt-2 pb-2 pointer-events-none">
      <header
        className="flex items-center h-[52px] md:h-[60px] rounded-full px-4 sm:px-5 md:px-6 mx-auto max-w-[1400px] pointer-events-auto"
      >
        {/* Left: Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <span className="text-lg font-bold tracking-[0.1em] uppercase">
            EVOLVE
          </span>
          <span
            className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded"
            style={{ color: "rgba(255,255,255,0.6)", backgroundColor: "rgba(255,255,255,0.06)" }}
          >
            HQ
          </span>
        </Link>

        {/* Right: Nav pills + Setting button + Bell + Avatar (all grouped) */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 ml-auto">
          {/* Pill navigation (desktop) - reusable glass pill tabs */}
          <nav className="hidden md:flex">
            <GlassPillTabs
              tabs={navItems.map((item) => ({
                label: item.label,
                value: item.href,
                href: item.href,
              }))}
              activeValue={
                navItems.find(
                  (item) =>
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      item.href !== "/admin" &&
                      pathname.startsWith(item.href))
                )?.href ||
                (pathname === "/dashboard"
                  ? "/dashboard"
                  : pathname === "/admin"
                  ? "/admin"
                  : "")
              }
              layoutId="topnav-pill"
            />
          </nav>

          {/* Setting button - outlined pill with icon + text */}
          <Link
            href="/settings"
            className={`hidden md:flex items-center gap-2 px-5 py-3 rounded-full text-[13px] font-medium transition-all duration-200 backdrop-blur-lg border ${
              pathname.startsWith("/settings")
                ? "border-primary/50 text-white bg-primary/20"
                : "border-white/10 text-white/60 hover:border-white/20 hover:text-white hover:bg-white/5"
            }`}
            style={
              !pathname.startsWith("/settings")
                ? { backgroundColor: "rgba(255,255,255,0.03)" }
                : undefined
            }
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
            Setting
          </Link>

          {/* Notification bell trigger */}
          <button
            onClick={toggleNotificationSidebar}
            className="relative flex items-center justify-center h-11 w-11 rounded-full hover:bg-white/10 transition-all duration-300 backdrop-blur-xl border border-white/10"
            style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
          >
            <Bell className="h-5 w-5 text-white/70" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white bg-[#f3350c] shadow-[0_0_10px_rgba(243,53,12,0.5)]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User avatar dropdown (40px) */}
          <UserDropdown size={44} />
        </div>
      </header>
    </div>
  );
}
