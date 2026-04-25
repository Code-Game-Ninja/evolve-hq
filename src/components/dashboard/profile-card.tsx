// Profile card with unified accordion menu
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  ChevronDown,
  User,
  CalendarDays,
  Zap,
  Clock,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ProfileCardProps {
  name: string;
  role: string;
  image?: string;
  email?: string;
}

interface LeaveBalanceData {
  casual: { used: number; total: number };
  sick: { used: number; total: number };
  earned: { used: number; total: number };
}

interface UserProfile {
  phone?: string;
  department?: string;
}

interface AccordionItemData {
  label: string;
  icon: React.ElementType;
  badge?: string;
  content: React.ReactNode;
}

export function ProfileCard({ name, role, image, email }: ProfileCardProps) {
  const { status } = useSession();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [profile, setProfile] = useState<UserProfile>({});
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalanceData | null>(null);
  const [recentActivity, setRecentActivity] = useState<{ text: string; time: string }[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Only fetch once session is authenticated
  useEffect(() => {
    if (status !== "authenticated") return;
    async function fetchData() {
      setLoadingProfile(true);
      try {
        // Fetch profile for phone/department
        const profileRes = await fetch("/api/me");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile({
            phone: profileData.phone || "",
            department: profileData.department || "",
          });
        }

        // Fetch leave balances (API returns array, convert to keyed object)
        const leavesRes = await fetch("/api/leaves");
        if (leavesRes.ok) {
          const leavesData = await leavesRes.json();
          if (Array.isArray(leavesData.balances)) {
            const mapped: LeaveBalanceData = {
              casual: { used: 0, total: 0 },
              sick: { used: 0, total: 0 },
              earned: { used: 0, total: 0 },
            };
            for (const b of leavesData.balances) {
              const key = b.type as keyof LeaveBalanceData;
              if (mapped[key]) {
                mapped[key] = { used: b.used ?? 0, total: b.total ?? 0 };
              }
            }
            setLeaveBalance(mapped);
          }
        }

        // Fetch recent attendance for activity
        const now = new Date();
        const attRes = await fetch(`/api/attendance?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
        if (attRes.ok) {
          const attData = await attRes.json();
          const activities: { text: string; time: string }[] = [];
          if (attData.today) {
            const clockIn = attData.today.clockIn
              ? new Date(attData.today.clockIn).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })
              : null;
            if (clockIn) activities.push({ text: `Checked in at ${clockIn}`, time: "Today" });
            if (attData.today.clockOut) {
              const clockOut = new Date(attData.today.clockOut).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
              activities.push({ text: `Checked out at ${clockOut}`, time: "Today" });
            }
          }
          setRecentActivity(activities);
        }
      } catch {
        // Non-critical
      } finally {
        setLoadingProfile(false);
      }
    }
    fetchData();
  }, [status]);

  // Build accordion items dynamically
  const accordionItems: AccordionItemData[] = [
    {
      label: "Personal Info",
      icon: User,
      content: loadingProfile ? (
        <div className="space-y-2.5 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 rounded" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5 text-[13px]">
          {[
            { key: "Email", val: email || "—" },
            { key: "Phone", val: profile.phone || "—" },
            { key: "Department", val: profile.department || "—" },
          ].map((row) => (
            <div key={row.key} className="flex items-center justify-between">
              <span style={{ color: "rgba(255,255,255,0.5)" }}>{row.key}</span>
              <span className="font-medium" style={{ color: "#ffffff" }}>
                {row.val}
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      label: "Leave Summary",
      icon: CalendarDays,
      content: leaveBalance ? (
        <div className="space-y-2.5">
          {[
            { label: "Casual Leave", used: leaveBalance.casual.used, total: leaveBalance.casual.total },
            { label: "Sick Leave", used: leaveBalance.sick.used, total: leaveBalance.sick.total },
            { label: "Earned Leave", used: leaveBalance.earned.used, total: leaveBalance.earned.total },
          ].map((item) => {
            const remaining = item.total - item.used;
            const pct = item.total > 0 ? (item.used / item.total) * 100 : 0;
            return (
              <div key={item.label}>
                <div className="flex justify-between text-[13px]">
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>{item.label}</span>
                  <span className="font-medium" style={{ color: "#ffffff" }}>
                    {remaining} / {item.total}
                  </span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden mt-1"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      backgroundColor: pct > 75 ? "#ef4444" : pct > 50 ? "#f59e0b" : "#22c55e",
                      width: `${pct}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>Loading...</p>
      ),
    },
    {
      label: "Quick Actions",
      icon: Zap,
      content: (
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "Apply Leave", href: "/leaves" },
            { label: "My Tasks", href: "/tasks" },
            { label: "Attendance", href: "/attendance" },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors hover:bg-white/[0.07]"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.7)" }}
            >
              {action.label}
            </Link>
          ))}
        </div>
      ),
    },
    {
      label: "Recent Activity",
      icon: Clock,
      badge: recentActivity.length > 0 ? String(recentActivity.length) : undefined,
      content:
        recentActivity.length > 0 ? (
          <div className="space-y-2">
            {recentActivity.map((item) => (
              <div key={item.text} className="flex items-center justify-between gap-2">
                <p className="text-[12px] truncate" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {item.text}
                </p>
                <span className="text-[10px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            No recent activity
          </p>
        ),
    },
  ];

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div
      className="overflow-hidden h-full flex flex-col backdrop-blur-xl border border-white/10"
      style={{
        backgroundColor: "rgba(11, 17, 32, 0.6)",
        borderRadius: "24px",
      }}
    >
      {/* Photo / Gradient header */}
      <div className="relative h-44 w-full overflow-hidden flex-shrink-0">
        {image && image.length > 0 ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="h-full w-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #f3350c, #ff6b47)",
            }}
          >
            <span className="text-[52px] font-semibold text-white">
              {initials}
            </span>
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-[17px] font-semibold text-white leading-tight">
                {name}
              </h3>
              <p
                className="text-[13px] mt-0.5"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                {role}
              </p>
            </div>
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white"
              style={{ backgroundColor: "#22c55e" }}
            >
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Unified accordion */}
      <div className="flex-1 overflow-y-auto py-1">
        {accordionItems.map((item, index) => (
          <div key={item.label}>
            <button
              onClick={() => toggle(index)}
              className="flex items-center justify-between w-full px-5 py-2.5 transition-colors hover:bg-white/[0.03]"
            >
              <div className="flex items-center gap-2.5">
                <item.icon
                  className="h-4 w-4 flex-shrink-0"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                />
                <span
                  className="text-[13px] font-medium"
                  style={{ color: "#ffffff" }}
                >
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {item.badge && (
                  <span
                    className="min-w-[20px] h-5 flex items-center justify-center rounded-full text-[11px] font-semibold text-white px-1.5"
                    style={{ backgroundColor: "#f3350c" }}
                  >
                    {item.badge}
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    openIndex === index && "rotate-180"
                  )}
                  style={{ color: "rgba(255,255,255,0.4)" }}
                />
              </div>
            </button>
            <div
              className={cn(
                "grid transition-all duration-200 ease-out",
                openIndex === index
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-2.5 pl-[52px]">{item.content}</div>
              </div>
            </div>
            {index < accordionItems.length - 1 && (
              <div
                className="mx-5 h-px"
                style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
