"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full"
      >
        {/* Shutter segments */}
        <motion.div
          className="fixed inset-0 z-[100] flex pointer-events-none"
          variants={{
            initial: { opacity: 1 },
            animate: { opacity: 0, transition: { duration: 0.05, delay: 0.2 } },
            exit: { opacity: 1 },
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="h-full bg-[#f3350c]"
              variants={{
                initial: { scaleY: 1 },
                animate: {
                  scaleY: 0,
                  transition: {
                    duration: 0.25,
                    ease: [0.65, 0, 0.35, 1],
                    delay: i * 0.02,
                  },
                },
                exit: {
                  scaleY: 1,
                  transition: {
                    duration: 0.25,
                    ease: [0.65, 0, 0.35, 1],
                    delay: i * 0.02,
                  },
                },
              }}
              style={{
                width: "25%",
                transformOrigin: "top",
              }}
            />
          ))}
        </motion.div>

        {/* Content Fade */}
        <motion.div
          variants={{
            initial: { opacity: 0, y: 10 },
            animate: { 
              opacity: 1, 
              y: 0,
              transition: { duration: 0.25, delay: 0.2 } 
            },
            exit: { 
              opacity: 0, 
              y: -10,
              transition: { duration: 0.2 } 
            },
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
