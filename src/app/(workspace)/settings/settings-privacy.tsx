// Settings — Privacy section
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const VISIBILITY_OPTIONS = [
  { value: "everyone", label: "Everyone in organization" },
  { value: "team", label: "Team members only" },
  { value: "managers", label: "Managers & admins only" },
];

export function SettingsPrivacy() {
  const [visibility, setVisibility] = useState("team");
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [activityStatus, setActivityStatus] = useState(true);
  const [readReceipts, setReadReceipts] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setExporting(false);
  };

  return (
    <div className="space-y-5">
      {/* Profile Visibility */}
      <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariant}>
        <div
          className="rounded-[24px] p-6 backdrop-blur-lg border border-[#dddddd]"
          style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
        >
          <h3 className="text-lg font-semibold" style={{ color: "#000000" }}>
            Profile Visibility
          </h3>
          <p className="text-[13px] mt-1" style={{ color: "#707070" }}>
            Who can see your profile
          </p>

          <div className="space-y-2 mt-4">
            {VISIBILITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setVisibility(opt.value)}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl transition-colors duration-200 cursor-pointer hover:bg-[#f8f7f3]"
              >
                {/* Radio circle */}
                <span
                  className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0"
                  style={{
                    border:
                      visibility === opt.value
                        ? "2px solid #0a0a0a"
                        : "2px solid #dddddd",
                  }}
                >
                  {visibility === opt.value && (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: "#0a0a0a" }}
                    />
                  )}
                </span>
                <span className="text-sm font-medium" style={{ color: "#000000" }}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Data & Activity */}
      <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariant}>
        <div
          className="rounded-[24px] p-6 backdrop-blur-lg border border-[#dddddd]"
          style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: "#000000" }}>
            Data & Activity
          </h3>

          {/* Online Status */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: "#000000" }}>
                Show Online Status
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#707070" }}>
                Let others see when you&apos;re active
              </p>
            </div>
            <Switch checked={onlineStatus} onCheckedChange={setOnlineStatus} />
          </div>

          <div className="h-px" style={{ backgroundColor: "rgba(0,0,0,0.05)" }} />

          {/* Activity Status */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: "#000000" }}>
                Show Activity Status
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#707070" }}>
                Display your current activity to team members
              </p>
            </div>
            <Switch checked={activityStatus} onCheckedChange={setActivityStatus} />
          </div>

          <div className="h-px" style={{ backgroundColor: "rgba(0,0,0,0.05)" }} />

          {/* Read Receipts */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: "#000000" }}>
                Read Receipts
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#707070" }}>
                Let others know when you&apos;ve read their messages
              </p>
            </div>
            <Switch checked={readReceipts} onCheckedChange={setReadReceipts} />
          </div>
        </div>
      </motion.div>

      {/* Data Export */}
      <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariant}>
        <div
          className="rounded-[24px] p-6 backdrop-blur-lg border border-[#dddddd]"
          style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
        >
          <h3 className="text-lg font-semibold" style={{ color: "#000000" }}>
            Data Export
          </h3>
          <p className="text-[13px] mt-1 max-w-[480px]" style={{ color: "#707070" }}>
            Download your personal data. Get a copy of your data including profile,
            attendance, leaves, and task history.
          </p>
          <div className="mt-4">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 h-10 px-6 rounded-full text-sm font-semibold text-white transition-all duration-200 cursor-pointer active:scale-[0.97] disabled:opacity-50 hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
              style={{ backgroundColor: "#0a0a0a" }}
            >
              <Download className="h-4 w-4" />
              {exporting ? "Preparing..." : "Request Data Export"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
