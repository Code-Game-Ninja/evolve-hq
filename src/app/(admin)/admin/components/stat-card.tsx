"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatItem {
  label: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  description: string;
}

// Count-up hook
function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  const hasAnimated = useRef(false);
  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
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

export function StatCard({
  stat,
  index,
}: {
  stat: StatItem;
  index: number;
}) {
  const animated = useCountUp(stat.value);
  const Icon = stat.icon;

  return (
    <motion.div
      custom={index + 1}
      initial="hidden"
      animate="visible"
      variants={cardVariant as any}
      className="relative overflow-hidden backdrop-blur-xl border border-border/50 group hover:border-border transition-all duration-300 shadow-2xl bg-card/30 rounded-[24px] p-6"
    >
      <div
        className="mb-4 w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
        style={{ backgroundColor: stat.iconBg }}
      >
        <Icon size={22} style={{ color: stat.iconColor }} />
      </div>
      <p className="text-[11px] uppercase font-bold tracking-[0.15em] text-muted-foreground mb-1">
        {stat.label}
      </p>
      <div className="flex items-baseline gap-1">
        <p className="text-3xl font-bold tracking-tight text-foreground">
          {animated}
        </p>
      </div>
      <p className="text-[11px] mt-1.5 text-muted-foreground/60 font-medium">
        {stat.description}
      </p>

      {/* Decorative gradient flare */}
      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </motion.div>
  );
}
