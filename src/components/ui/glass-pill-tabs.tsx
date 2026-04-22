// Animated glass pill tabs — reusable sliding pill component
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface GlassPillTab {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;
}

export interface GlassPillTabsProps {
  tabs: GlassPillTab[];
  activeValue: string;
  onChange?: (value: string) => void;
  layoutId: string;
  variant?: "glass" | "subtle";
  size?: "sm" | "md";
  className?: string;
}

const springConfig = { type: "spring" as const, stiffness: 400, damping: 30 };

export function GlassPillTabs({
  tabs,
  activeValue,
  onChange,
  layoutId,
  variant = "glass",
  size = "md",
  className,
}: GlassPillTabsProps) {
  const isGlass = variant === "glass";

  const containerClass = cn(
    "inline-flex items-center rounded-full p-1 w-fit",
    isGlass && "backdrop-blur-xl border border-white/10",
    size === "sm" ? "gap-0.5" : "gap-1",
    className,
  );

  const containerStyle: React.CSSProperties = {
    backgroundColor: isGlass ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
  };

  const pillBase = cn(
    "relative flex items-center rounded-full font-medium transition-colors whitespace-nowrap cursor-pointer z-[1]",
    size === "sm" ? "gap-1.5 px-3 py-1.5 text-[12px]" : "gap-2 px-4 py-2 text-[13px]",
  );

  const inactiveClass = isGlass
    ? "text-white/40 hover:text-white/70 hover:bg-white/5"
    : "text-white/30";

  return (
    <div className={containerClass} style={containerStyle}>
      {tabs.map((tab) => {
        const isActive = tab.value === activeValue;
        const pillClass = cn(pillBase, isActive ? "text-white" : inactiveClass);

        const inner = (
          <>
            {isActive && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20 -z-[1]"
                transition={springConfig}
              />
            )}
            {tab.icon && <tab.icon className="relative z-10 h-3 w-3" />}
            <span className="relative z-10">{tab.label}</span>
          </>
        );

        if (tab.href) {
          return (
            <Link key={tab.value} href={tab.href} className={pillClass}>
              {inner}
            </Link>
          );
        }

        return (
          <button key={tab.value} onClick={() => onChange?.(tab.value)} className={pillClass}>
            {inner}
          </button>
        );
      })}
    </div>
  );
}
