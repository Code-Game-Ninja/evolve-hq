"use client";

import { motion } from "framer-motion";
import { Loader2, CheckSquare, Clock } from "lucide-react";

interface PendingLeaveItem {
  id: string;
  name: string;
  avatar: string;
  image?: string | null;
  type: string;
  dates: string;
}

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

export function PendingLeaves({ 
  leaves, 
  onAction,
  processingId 
}: { 
  leaves: PendingLeaveItem[];
  onAction: (id: string, action: "approved" | "rejected") => void;
  processingId: string | null;
}) {
  return (
    <motion.div
      custom={8}
      initial="hidden"
      animate="visible"
      variants={cardVariant as any}
      className="rounded-[32px] overflow-hidden backdrop-blur-xl border border-border flex flex-col shadow-2xl group/card h-full bg-card/30"
    >
      <div className="flex items-center justify-between px-8 pt-8 pb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Leave Approvals</h2>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">Pending Requests</p>
        </div>
        <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
          <Clock size={16} className="text-amber-500" />
        </div>
      </div>

      <div className="px-8 pb-6 flex-1">
        {leaves.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground/60">
            <CheckSquare size={32} className="mb-2" />
            <p className="text-sm">All caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leaves.map((leave, i) => (
              <div
                key={leave.id}
                className="flex items-center gap-4 p-4 rounded-2xl bg-card/50 border border-border group/item hover:bg-accent transition-all duration-300"
              >
                {/* User Info */}
                <div className="relative shrink-0">
                  {leave.image ? (
                    <img
                      src={leave.image}
                      alt={leave.name}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground">
                      {leave.avatar}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{leave.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                      {leave.type}
                    </span>
                    <span className="text-[10px] text-muted-foreground">•</span>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {leave.dates}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    disabled={!!processingId}
                    onClick={() => onAction(leave.id, "approved")}
                    className="p-2 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all disabled:opacity-50"
                  >
                    {processingId === leave.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckSquare size={16} />
                    )}
                  </button>
                  <button
                    disabled={!!processingId}
                    onClick={() => onAction(leave.id, "rejected")}
                    className="p-2 rounded-xl bg-muted text-muted-foreground hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
