"use client";

import { motion } from "framer-motion";

interface AttendanceDay {
  day: string;
  present: number;
  total: number;
  percent: number;
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

function barColor(percent: number) {
  if (percent >= 90) return "#22c55e";
  if (percent >= 70) return "#f59e0b";
  return "#ef4444";
}

export function AttendanceOverview({ data }: { data: AttendanceDay[] }) {
  return (
    <motion.div
      custom={7}
      initial="hidden"
      animate="visible"
      variants={cardVariant as any}
      className="rounded-[32px] overflow-hidden backdrop-blur-xl border border-white/10 flex flex-col shadow-2xl group/card h-full"
      style={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}
    >
      <div className="flex items-center justify-between px-8 pt-8 pb-8">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Workforce Efficiency</h2>
          <p className="text-[11px] font-medium text-white/30 uppercase tracking-widest mt-0.5">7-Day Attendance Trend</p>
        </div>
      </div>

      <div className="px-8 pb-8 flex-1 flex items-end justify-between gap-3">
        {data.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
            <div className="w-full relative flex flex-col items-center">
              {/* Tooltip on hover */}
              <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                <div className="bg-white text-black text-[10px] font-black px-2 py-1 rounded-md whitespace-nowrap">
                  {item.present} / {item.total}
                </div>
                <div className="w-2 h-2 bg-white rotate-45 mx-auto -mt-1" />
              </div>

              {/* Bar */}
              <div className="w-full bg-white/5 rounded-full h-[180px] flex items-end overflow-hidden">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${item.percent}%` }}
                  transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: "easeOut" }}
                  className="w-full rounded-full transition-colors duration-500"
                  style={{
                    backgroundColor: barColor(item.percent),
                    boxShadow: `0 0 20px ${barColor(item.percent)}44`,
                  }}
                />
              </div>
            </div>
            <span className="text-[11px] font-bold text-white/20 group-hover:text-white/60 transition-colors">
              {item.day}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
