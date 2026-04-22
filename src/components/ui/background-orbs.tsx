"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function BackgroundOrbs() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1] opacity-40 select-none">
      {/* Primary Warm Orb */}
      <motion.div
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -80, 40, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[120px] bg-gradient-to-br from-[#f3350c] to-[#e87f24] opacity-30"
      />

      {/* Secondary Navy/Deep Orb */}
      <motion.div
        animate={{
          x: [0, -120, 80, 0],
          y: [0, 100, -60, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full blur-[140px] bg-gradient-to-tr from-[#0b1120] to-[#1e293b] opacity-40"
      />

      {/* Accent Golden Orb */}
      <motion.div
        animate={{
          x: [0, 80, -100, 0],
          y: [0, 120, -40, 0],
          scale: [1, 1.3, 0.8, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full blur-[100px] bg-gradient-to-br from-[#ffc81e] to-[#f3350c] opacity-20"
      />

      {/* Subtle Bottom Left Orb */}
      <motion.div
        animate={{
          x: [0, 40, -60, 0],
          y: [0, -50, 70, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-[10%] left-[5%] w-[35vw] h-[35vw] rounded-full blur-[110px] bg-[#73a5ca] opacity-20"
      />
    </div>
  );
}
