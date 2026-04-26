"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface ActivityItem {
  name: string;
  action: string;
  time: string;
  type: string;
}

const activityDot: Record<string, string> = {
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
};

const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.08 * i,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

export function RecentActivity({ activities }: { activities: ActivityItem[] }) {
  return (
    <motion.div
      custom={6}
      initial="hidden"
      animate="visible"
      variants={cardVariant as any}
      className="rounded-[32px] overflow-hidden backdrop-blur-xl border border-border flex flex-col shadow-2xl h-full bg-card/30"
    >
      <div className="flex items-center justify-between px-8 pt-8 pb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Recent Activity</h2>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">Audit Trail</p>
        </div>
      </div>

      <div className="px-8 pb-4 flex-1">
        <div className="space-y-4">
          {activities.map((item, i) => (
            <div key={i} className="flex gap-4 group">
              <div className="relative flex flex-col items-center">
                <div
                  className="w-2 h-2 rounded-full mt-2 ring-4 ring-background"
                  style={{
                    backgroundColor: activityDot[item.type] || "#444",
                  }}
                />
                {i !== activities.length - 1 && (
                  <div className="w-px h-full bg-border my-1" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-bold text-foreground/80 group-hover:text-foreground transition-colors">
                    {item.name}
                  </p>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {item.time}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">
                  {item.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-8 py-5 mt-auto bg-gradient-to-t from-muted/20 to-transparent border-t border-border">
        <Link
          href="/admin/hr"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-muted/50 border border-border text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300"
        >
          Activity Logs <ArrowRight size={12} />
        </Link>
      </div>
    </motion.div>
  );
}
