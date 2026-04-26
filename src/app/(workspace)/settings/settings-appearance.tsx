// Settings — Appearance section
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Monitor } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const THEMES = [
  { value: "light", label: "Light", icon: Sun, preview: "#f8f7f3" },
  { value: "dark", label: "Dark", icon: Moon, preview: "#1a1a1a" },
  { value: "system", label: "System", icon: Monitor, preview: "split" },
] as const;

const ACCENT_COLORS = [
  { label: "Red", value: "#f3350c" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Green", value: "#22c55e" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Orange", value: "#f59e0b" },
];

export function SettingsAppearance() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [accent, setAccent] = useState("#f3350c");
  const [compactMode, setCompactMode] = useState(false);
  const [animations, setAnimations] = useState(true);
  const [sidebarPos, setSidebarPos] = useState<"left" | "right">("left");

  const inputClass =
    "w-full h-11 px-4 rounded-xl text-sm outline-none transition-all duration-200 cursor-pointer focus:border-[#0a0a0a] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]";

  return (
    <div className="space-y-5">
      {/* Theme Card */}
      <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariant}>
        <div
          className="rounded-[24px] p-6 backdrop-blur-lg border border-[rgba(255,255,255,0.1)]"
          style={{ backgroundColor: "rgba(26,26,26,0.6)" }}
        >
          <h3 className="text-lg font-semibold" style={{ color: "#ffffff" }}>
            Theme
          </h3>
          <p className="text-[13px] mt-1" style={{ color: "#a0a0a0" }}>
            Choose your preferred theme
          </p>

          <div className="flex flex-wrap gap-3 sm:gap-4 mt-5">
            {THEMES.map((t) => {
              const active = theme === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className="flex flex-col items-center gap-2 w-[calc(33%-8px)] sm:w-[120px] min-w-[90px] p-3 sm:p-4 rounded-2xl transition-all duration-200 cursor-pointer"
                  style={{
                    border: active ? "2px solid #f3350c" : "2px solid rgba(255,255,255,0.1)",
                    backgroundColor: active ? "rgba(26,26,26,0.8)" : "rgba(26,26,26,0.4)",
                    boxShadow: active ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  {/* Preview swatch */}
                  {t.preview === "split" ? (
                    <div className="w-[60px] h-10 rounded-lg overflow-hidden flex">
                      <div className="w-1/2 bg-[rgba(255,255,255,0.1)]" />
                      <div className="w-1/2 bg-[#1a1a1a]" />
                    </div>
                  ) : (
                    <div
                      className="w-[60px] h-10 rounded-lg"
                      style={{ backgroundColor: t.preview }}
                    >
                      <div
                        className="mx-auto mt-2 w-8 h-2 rounded"
                        style={{
                          backgroundColor:
                            t.value === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
                        }}
                      />
                      <div
                        className="mx-auto mt-1 w-5 h-1.5 rounded"
                        style={{
                          backgroundColor:
                            t.value === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
                        }}
                      />
                    </div>
                  )}
                  <t.icon
                    className="h-3.5 w-3.5"
                    style={{ color: active ? "#ffffff" : "#a0a0a0" }}
                  />
                  <span
                    className="text-[13px] font-semibold"
                    style={{ color: "#ffffff" }}
                  >
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Accent Color Card */}
      <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariant}>
        <div
          className="rounded-[24px] p-6 backdrop-blur-lg border border-[rgba(255,255,255,0.1)]"
          style={{ backgroundColor: "rgba(26,26,26,0.6)" }}
        >
          <h3 className="text-lg font-semibold" style={{ color: "#ffffff" }}>
            Accent Color
          </h3>
          <p className="text-[13px] mt-1" style={{ color: "#a0a0a0" }}>
            Customize your accent color
          </p>

          <div className="flex gap-3 mt-4">
            {ACCENT_COLORS.map((c) => {
              const active = accent === c.value;
              return (
                <button
                  key={c.value}
                  onClick={() => setAccent(c.value)}
                  title={c.label}
                  className="w-9 h-9 rounded-full transition-all duration-200 cursor-pointer"
                  style={{
                    backgroundColor: c.value,
                    transform: active ? "scale(1.1)" : "scale(1)",
                    boxShadow: active
                      ? `0 0 0 3px #ffffff, 0 0 0 5px ${c.value}`
                      : "none",
                  }}
                />
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Display Preferences Card */}
      <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariant}>
        <div
          className="rounded-[24px] p-6 backdrop-blur-lg border border-[rgba(255,255,255,0.1)]"
          style={{ backgroundColor: "rgba(26,26,26,0.6)" }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: "#ffffff" }}>
            Display Preferences
          </h3>

          {/* Compact Mode */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: "#ffffff" }}>
                Compact Mode
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#a0a0a0" }}>
                Reduce spacing and font sizes
              </p>
            </div>
            <Switch checked={compactMode} onCheckedChange={setCompactMode} />
          </div>

          <div className="h-px" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />

          {/* Animations */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: "#ffffff" }}>
                Animations
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#a0a0a0" }}>
                Enable smooth transitions and animations
              </p>
            </div>
            <Switch checked={animations} onCheckedChange={setAnimations} />
          </div>

          <div className="h-px" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />

          {/* Sidebar Position */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: "#ffffff" }}>
                Sidebar Position
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#a0a0a0" }}>
                Choose default sidebar position
              </p>
            </div>
            <select
              value={sidebarPos}
              onChange={(e) => setSidebarPos(e.target.value as "left" | "right")}
              className={inputClass}
              style={{
                width: 120,
                backgroundColor: "rgba(26,26,26,0.6)",
                border: "1.5px solid rgba(255,255,255,0.1)",
                color: "#ffffff",
              }}
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
