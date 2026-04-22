// Settings — Notifications section
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";

const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

interface NotifCategory {
  label: string;
  push: boolean;
  email: boolean;
}

const DEFAULT_CATEGORIES: NotifCategory[] = [
  { label: "Task Assignments", push: true, email: true },
  { label: "Leave Approvals", push: true, email: true },
  { label: "Attendance Alerts", push: true, email: false },
  { label: "System Updates", push: false, email: true },
  { label: "Team Announcements", push: true, email: false },
];

export function SettingsNotifications() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [saving, setSaving] = useState(false);

  const toggleCategory = (index: number, field: "push" | "email") => {
    setCategories((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: !c[field] } : c))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      {/* Notification Preferences */}
      <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariant}>
        <div
          className="rounded-[24px] p-6 backdrop-blur-lg border border-[#dddddd]"
          style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: "#000000" }}>
            Notification Preferences
          </h3>

          {/* Push Notifications */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: "#000000" }}>
                Push Notifications
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#707070" }}>
                Receive browser push notifications
              </p>
            </div>
            <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
          </div>

          <div className="h-px" style={{ backgroundColor: "rgba(0,0,0,0.05)" }} />

          {/* Email */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: "#000000" }}>
                Email Notifications
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#707070" }}>
                Receive email alerts for important updates
              </p>
            </div>
            <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
          </div>

          <div className="h-px" style={{ backgroundColor: "rgba(0,0,0,0.05)" }} />

          {/* Sound */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: "#000000" }}>
                Sound
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#707070" }}>
                Play a sound for new notifications
              </p>
            </div>
            <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
          </div>
        </div>
      </motion.div>

      {/* Notification Categories */}
      <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariant}>
        <div
          className="rounded-[24px] p-6 backdrop-blur-lg border border-[#dddddd]"
          style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: "#000000" }}>
            Notification Categories
          </h3>

          {/* Table header */}
          <div className="flex items-center py-2">
            <span
              className="flex-1 text-xs font-semibold uppercase"
              style={{ color: "#707070" }}
            >
              Category
            </span>
            <span
              className="w-[60px] text-center text-xs font-semibold uppercase"
              style={{ color: "#707070" }}
            >
              Push
            </span>
            <span
              className="w-[60px] text-center text-xs font-semibold uppercase"
              style={{ color: "#707070" }}
            >
              Email
            </span>
          </div>

          {/* Rows */}
          {categories.map((cat, i) => (
            <div key={cat.label}>
              <div className="h-px" style={{ backgroundColor: "rgba(0,0,0,0.05)" }} />
              <div className="flex items-center py-3.5">
                <span className="flex-1 text-sm font-medium" style={{ color: "#000000" }}>
                  {cat.label}
                </span>
                <div className="w-[60px] flex justify-center">
                  <button
                    onClick={() => toggleCategory(i, "push")}
                    className="w-[18px] h-[18px] rounded flex items-center justify-center transition-all duration-200 cursor-pointer"
                    style={{
                      backgroundColor: cat.push ? "#0a0a0a" : "#ffffff",
                      border: cat.push ? "none" : "1.5px solid #dddddd",
                    }}
                  >
                    {cat.push && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="w-[60px] flex justify-center">
                  <button
                    onClick={() => toggleCategory(i, "email")}
                    className="w-[18px] h-[18px] rounded flex items-center justify-center transition-all duration-200 cursor-pointer"
                    style={{
                      backgroundColor: cat.email ? "#0a0a0a" : "#ffffff",
                      border: cat.email ? "none" : "1.5px solid #dddddd",
                    }}
                  >
                    {cat.email && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end mt-5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-10 px-6 rounded-full text-sm font-semibold text-white transition-all duration-200 cursor-pointer active:scale-[0.97] disabled:opacity-50 hover:shadow-[0_4px_16px_rgba(243,53,12,0.25)]"
              style={{ backgroundColor: "#f3350c" }}
              onMouseEnter={(e) => {
                if (!saving) e.currentTarget.style.backgroundColor = "#c82c09";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f3350c";
              }}
            >
              {saving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
