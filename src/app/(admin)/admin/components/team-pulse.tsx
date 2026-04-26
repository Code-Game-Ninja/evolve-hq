"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TeamMemberItem {
  name: string;
  role: string;
  status: string;
  avatar: string;
  image?: string | null;
}

const statusDot: Record<string, string> = {
  present: "#22c55e",
  leave: "#f59e0b",
  absent: "#ef4444",
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

export function TeamPulse({ members }: { members: TeamMemberItem[] }) {
  return (
    <motion.div
      custom={5}
      initial="hidden"
      animate="visible"
      variants={cardVariant as any}
      className="rounded-[32px] overflow-hidden backdrop-blur-xl border border-border flex flex-col shadow-2xl group/card h-full bg-card/30"
    >
      <div className="flex items-center justify-between px-8 pt-8 pb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Team Pulse</h2>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">Real-time Presence</p>
        </div>
        <Link
          href="/admin/team"
          className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-bold uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
        >
          Directory
        </Link>
      </div>

      <div className="px-8 pb-4 flex-1">
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground/60">
            <Users size={32} className="mb-2" />
            <p className="text-sm">No team members online</p>
          </div>
        ) : (
          <div className="space-y-1">
            {members.map((member, i) => (
              <div
                key={i}
                className="flex items-center gap-4 py-3.5 transition-all duration-300 rounded-2xl px-3 -mx-3 hover:bg-accent group"
              >
                <div className="relative shrink-0">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-11 h-11 rounded-2xl object-cover ring-1 ring-border group-hover:ring-foreground/20 transition-all"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-[13px] font-bold uppercase tracking-tighter shrink-0 transition-all bg-muted text-foreground border border-border">
                      {member.avatar}
                    </div>
                  )}
                  <div
                    className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-background z-10"
                    style={{
                      backgroundColor: statusDot[member.status] || "#444",
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold truncate text-foreground tracking-tight">
                    {member.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">
                    {member.role}
                  </p>
                </div>

                <div className="hidden sm:block">
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-muted border border-border",
                      member.status === 'present' ? 'text-green-500' : member.status === 'leave' ? 'text-amber-500' : 'text-muted-foreground'
                    )}
                  >
                    {member.status === 'present' ? 'Active' : member.status === 'leave' ? 'On Leave' : 'Offline'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-8 py-5 mt-auto bg-gradient-to-t from-muted/20 to-transparent border-t border-border">
        <Link
          href="/admin/team"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-muted/50 border border-border text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300"
        >
          View Full Roster
        </Link>
      </div>
    </motion.div>
  );
}
