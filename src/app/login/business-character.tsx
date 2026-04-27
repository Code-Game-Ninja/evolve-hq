"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface BusinessCharacterProps {
  isLoggedIn?: boolean;
  userName?: string;
}

export function BusinessCharacter({ isLoggedIn, userName }: BusinessCharacterProps) {
  const [showGreeting, setShowGreeting] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      setShowGreeting(true);
    }
  }, [isLoggedIn]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Background glow behind character */}
      <motion.div
        className="absolute w-[350px] h-[350px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(243,53,12,0.2) 0%, transparent 60%)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.6, 0.9, 0.6],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Character Container */}
      <motion.div
        className="relative"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      >
        {/* Speech Bubble - appears after login */}
        <AnimatePresence>
          {showGreeting && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.4, type: "spring" }}
              className="absolute -top-16 left-1/2 -translate-x-1/2 z-20"
            >
              <div
                className="px-6 py-4 rounded-2xl relative"
                style={{
                  backgroundColor: "#f3350c",
                  boxShadow: "0 8px 30px rgba(243,53,12,0.4)",
                }}
              >
                <p className="text-white font-semibold text-sm whitespace-nowrap">
                  Good day{userName ? `, ${userName}` : " sir"}! 👋
                </p>
                <p className="text-white/80 text-xs mt-1">
                  Welcome back to work!
                </p>
                {/* Speech bubble tail */}
                <div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
                  style={{ backgroundColor: "#f3350c" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3D Style Business Character SVG */}
        <motion.svg
          width="280"
          height="380"
          viewBox="0 0 280 380"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Shadow */}
          <ellipse
            cx="140"
            cy="360"
            rx="80"
            ry="15"
            fill="rgba(0,0,0,0.3)"
          />

          {/* Legs - Brown pants */}
          <motion.g
            animate={{ rotate: [-2, 2, -2] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "140px 250px" }}
          >
            {/* Left Leg */}
            <path
              d="M 115 250 L 110 340 L 125 340 L 130 250 Z"
              fill="#C4956A"
            />
            {/* Right Leg */}
            <path
              d="M 165 250 L 170 340 L 155 340 L 150 250 Z"
              fill="#C4956A"
            />
            {/* Shoes */}
            <ellipse cx="117" cy="345" rx="15" ry="8" fill="#1a1a1a" />
            <ellipse cx="163" cy="345" rx="15" ry="8" fill="#1a1a1a" />
          </motion.g>

          {/* Torso - Blue shirt */}
          <motion.g
            animate={{ rotate: [-1, 1, -1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "140px 200px" }}
          >
            {/* Shirt body */}
            <path
              d="M 90 180 Q 140 170 190 180 L 185 260 Q 140 270 95 260 Z"
              fill="#4A90A4"
            />
            {/* Shirt collar */}
            <path
              d="M 125 180 L 140 195 L 155 180"
              fill="#3A7A8E"
            />
            {/* Sleeves */}
            <ellipse cx="85" cy="200" rx="20" ry="35" fill="#4A90A4" />
            <ellipse cx="195" cy="200" rx="20" ry="35" fill="#4A90A4" />
            
            {/* Belt */}
            <rect x="95" y="255" width="90" height="12" fill="#5D4E37" rx="2" />
            <rect x="135" y="255" width="10" height="12" fill="#C4956A" rx="1" />
          </motion.g>

          {/* Arms - crossed pose */}
          <motion.g
            animate={{ rotate: [-3, 3, -3] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Left arm */}
            <path
              d="M 75 200 Q 60 240 100 235"
              stroke="#E8C4A0"
              strokeWidth="18"
              strokeLinecap="round"
              fill="none"
            />
            {/* Right arm */}
            <path
              d="M 205 200 Q 220 240 180 235"
              stroke="#E8C4A0"
              strokeWidth="18"
              strokeLinecap="round"
              fill="none"
            />
            {/* Hands */}
            <circle cx="105" cy="235" r="12" fill="#E8C4A0" />
            <circle cx="175" cy="235" r="12" fill="#E8C4A0" />
          </motion.g>

          {/* Neck */}
          <rect x="130" y="165" width="20" height="20" fill="#E8C4A0" />

          {/* Head */}
          <motion.g
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "140px 140px" }}
          >
            {/* Face shape */}
            <ellipse cx="140" cy="130" rx="55" ry="60" fill="#E8C4A0" />
            
            {/* Ears */}
            <ellipse cx="85" cy="130" rx="10" ry="15" fill="#E8C4A0" />
            <ellipse cx="195" cy="130" rx="10" ry="15" fill="#E8C4A0" />

            {/* Hair - Red */}
            <path
              d="M 85 110 Q 90 60 140 55 Q 190 60 195 110 Q 180 85 140 80 Q 100 85 85 110"
              fill="#C44536"
            />
            <ellipse cx="140" cy="75" rx="45" ry="25" fill="#C44536" />
            
            {/* Mustache */}
            <path
              d="M 125 150 Q 140 145 155 150"
              stroke="#8B4513"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            
            {/* Eyebrows */}
            <path
              d="M 115 105 Q 125 100 135 105"
              stroke="#8B4513"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 145 105 Q 155 100 165 105"
              stroke="#8B4513"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />

            {/* Eyes with blinking animation */}
            <motion.g
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
            >
              <ellipse cx="125" cy="115" rx="8" ry="10" fill="#1a1a1a" />
              <ellipse cx="155" cy="115" rx="8" ry="10" fill="#1a1a1a" />
              {/* Eye highlights */}
              <circle cx="127" cy="112" r="3" fill="white" />
              <circle cx="157" cy="112" r="3" fill="white" />
            </motion.g>

            {/* Nose */}
            <path
              d="M 140 120 L 135 140 L 145 140 Z"
              fill="#D4A574"
            />

            {/* Smile */}
            <motion.path
              d="M 120 160 Q 140 170 160 160"
              stroke="#C4956A"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              animate={{ d: ["M 120 160 Q 140 170 160 160", "M 120 160 Q 140 175 160 160", "M 120 160 Q 140 170 160 160"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.g>
        </motion.svg>
      </motion.div>

      {/* Floating decorative elements */}
      <motion.div
        className="absolute top-20 left-10 w-3 h-3 rounded-full bg-[#f3350c]"
        animate={{ y: [0, -15, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-32 right-20 w-2 h-2 rounded-full bg-[#f3350c]"
        animate={{ y: [0, 10, 0], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
      />
      <motion.div
        className="absolute top-40 right-10 w-4 h-4 rounded-full bg-white/20"
        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
      />
    </div>
  );
}
