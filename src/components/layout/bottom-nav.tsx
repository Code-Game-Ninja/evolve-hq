// Bottom navigation bar for mobile — glass effect matching theme
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { motion } from "framer-motion";
import { workspaceNavItems } from "@/lib/nav-config";
import { cn } from "@/lib/utils";

// Nav items + Settings for bottom bar
const bottomNavItems = [
  ...workspaceNavItems,
  { label: "Settings", href: "/settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pointer-events-none">
      {/* Fade-out gradient above the bar */}
      <div
        className="h-6"
        style={{
          background:
            "linear-gradient(to bottom, transparent, oklch(0.15 0.03 260 / 0.8))",
        }}
      />

      {/* Nav bar */}
      <nav
        className="pointer-events-auto mx-4 mb-4 rounded-2xl px-1 py-1.5 backdrop-blur-2xl border border-white/10 shadow-2xl"
        style={{ 
          backgroundColor: "rgba(11, 17, 32, 0.85)",
          marginBottom: "max(1rem, env(safe-area-inset-bottom))"
        }}
      >
        <div className="flex items-center justify-around">
          {bottomNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            // Shorter labels for bottom nav
            const shortLabel = item.label.replace("My ", "");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[48px] transition-all duration-300 z-[1]",
                  isActive
                    ? "text-white"
                    : "text-white/40 active:scale-95"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="bottomnav-pill"
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20 -z-[1]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    isActive ? "text-white" : "text-white/40"
                  )}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span
                  className={cn(
                    "text-[10px] leading-tight font-medium transition-colors",
                    isActive ? "text-white" : "text-white/40"
                  )}
                >
                  {shortLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
