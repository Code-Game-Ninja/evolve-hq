// Admin bottom navigation bar for mobile — glass effect matching theme
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { motion } from "framer-motion";
import { adminNavItems } from "@/lib/admin-nav-config";
import { cn } from "@/lib/utils";

// Nav items + Settings for bottom bar
const bottomItems = [
  ...adminNavItems,
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pointer-events-none">
      {/* Fade-out gradient above the bar */}
      <div
        className="h-6"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(0,0,0,0.4))",
        }}
      />

      {/* Nav bar */}
      <nav
        className="pointer-events-auto mx-3 mb-3 rounded-2xl px-1 py-1.5 backdrop-blur-2xl border border-white/10 shadow-2xl"
        style={{ 
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          marginBottom: "max(0.75rem, env(safe-area-inset-bottom))"
        }}
      >
        <div className="flex items-center justify-around">
          {bottomItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[48px] transition-all duration-200 z-[1]",
                  isActive ? "text-white" : "text-white/40 active:scale-95"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="admin-bottomnav-pill"
                    className="absolute inset-0 rounded-xl bg-white -z-[1]"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    isActive ? "text-black" : "text-white/40"
                  )}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span
                  className={cn(
                    "text-[10px] leading-tight font-bold transition-colors",
                    isActive ? "text-black" : "text-white/40"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
