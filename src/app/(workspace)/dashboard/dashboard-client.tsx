// Dashboard client component — Bento grid layout
"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useProfile } from "@/contexts/profile-context";
import { WelcomeHeader } from "@/components/dashboard/welcome-header";
import { ProfileCard } from "@/components/dashboard/profile-card";
import { AttendanceWidget } from "@/components/attendance/AttendanceWidget";
import { WeeklyScheduleCard } from "@/components/dashboard/weekly-schedule-card";
import { UpcomingTasksCard } from "@/components/dashboard/upcoming-tasks-card";
import { DailyUpdateCard } from "@/components/dashboard/daily-update-card";

// Animation variants
const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.08 * i,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

export function DashboardClient() {
  const { data: session, status } = useSession();
  const { name: profileName, image: profileImage } = useProfile();
  const displayName = profileName || session?.user?.name || "User";
  const firstName = displayName.split(" ")[0] || "User";

  // Loading skeleton
  if (status === "loading") {
    return (
      <div className="space-y-5 pb-12 animate-pulse">
        {/* Header skeleton */}
        <div className="h-10 w-72 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
        {/* Grid skeleton matching layout */}
        <div
          className="hidden lg:grid gap-5"
          style={{
            gridTemplateColumns: "1fr 1fr 1fr",
            gridTemplateRows: "auto auto auto",
          }}
        >
          <div className="rounded-3xl" style={{ backgroundColor: "rgba(255,255,255,0.06)", gridArea: "1 / 1 / 3 / 2", height: "560px" }} />
          <div className="rounded-3xl" style={{ backgroundColor: "rgba(255,255,255,0.06)", gridArea: "1 / 2 / 2 / 3", height: "270px" }} />
          <div className="rounded-3xl" style={{ backgroundColor: "rgba(255,255,255,0.08)", gridArea: "1 / 3 / 2 / 4", height: "270px" }} />
          <div className="rounded-3xl" style={{ backgroundColor: "rgba(255,255,255,0.06)", gridArea: "2 / 2 / 4 / 4", height: "560px" }} />
          <div className="rounded-3xl" style={{ backgroundColor: "rgba(255,255,255,0.06)", gridArea: "3 / 1 / 4 / 2", height: "270px" }} />
        </div>
        {/* Mobile skeleton */}
        <div className="lg:hidden flex flex-col gap-5">
          {[560, 270, 270, 560, 270].map((h, i) => (
            <div key={i} className="rounded-3xl" style={{ backgroundColor: "rgba(255,255,255,0.06)", height: h }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <WelcomeHeader name={firstName} />
      </motion.div>

      {/* Bento Grid — 3 cols, 3 rows with CSS grid-area on desktop */}
      <div className="grid gap-5 dashboard-grid" style={{ gridTemplateColumns: "1fr" }}>
          {/* div1: Profile (row 1-2, col 1) */}
          <motion.div
            className="grid-profile"
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariant}
          >
            <ProfileCard
              name={displayName}
              role={session?.user?.role || "employee"}
              image={profileImage || session?.user?.image || ""}
              email={session?.user?.email || ""}
            />
          </motion.div>

          {/* div2: Progress / Time Tracker (row 1, col 2) */}
          <motion.div
            className="grid-progress"
            custom={1}
            initial="hidden"
            animate="visible"
            variants={cardVariant}
          >
            <AttendanceWidget />
          </motion.div>

          {/* div3: Upcoming Tasks (row 1, col 3) */}
          <motion.div
            className="grid-tasks"
            custom={2}
            initial="hidden"
            animate="visible"
            variants={cardVariant}
          >
            <UpcomingTasksCard />
          </motion.div>

          {/* div4: Calendar (row 2-3, col 2-3) */}
          <motion.div
            className="grid-calendar"
            custom={3}
            initial="hidden"
            animate="visible"
            variants={cardVariant}
          >
            <WeeklyScheduleCard />
          </motion.div>

          {/* div5: Daily Update (row 3, col 1) */}
          <motion.div
            className="grid-daily"
            custom={4}
            initial="hidden"
            animate="visible"
            variants={cardVariant}
          >
            <DailyUpdateCard />
          </motion.div>
      </div>
    </div>
  );
}
