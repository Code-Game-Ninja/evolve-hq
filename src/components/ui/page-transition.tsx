"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

// Simplified transition — the original 4-panel shutter created 4 fixed full-viewport
// divs on every route change while orb animations were already running, causing jank.
// A clean fade+slide is imperceptible in speed but costs almost nothing to render.
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
