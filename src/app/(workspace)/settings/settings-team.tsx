// Settings — Team Settings section (admin only)
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

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface LeaveType {
  type: string;
  color: string;
  days: number;
  carryForward: boolean;
  maxCarry: number;
}

const inputClass =
  "w-full h-11 px-4 rounded-xl text-sm outline-none transition-all duration-200 focus:border-[#0a0a0a] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]";
const inputStyle: React.CSSProperties = {
  backgroundColor: "#f8f7f3",
  border: "1.5px solid #f1efed",
  color: "#1a1a1a",
};
const labelClass = "text-[13px] font-semibold block mb-1.5";

export function SettingsTeam() {
  // Organization
  const [companyName, setCompanyName] = useState("EVOLVE PRIVATE LIMITED");
  const [website, setWebsite] = useState("https://evolve.agency");
  const [supportEmail, setSupportEmail] = useState("hello@evolve.agency");
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  // Work schedule
  const [workDays, setWorkDays] = useState([true, true, true, true, true, false, false]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [targetHours, setTargetHours] = useState(8);

  // Leave policy
  const [leaveYearStart, setLeaveYearStart] = useState("April");
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([
    { type: "Casual", color: "#3b82f6", days: 4, carryForward: false, maxCarry: 0 },
    { type: "Sick", color: "#f59e0b", days: 4, carryForward: false, maxCarry: 0 },
    { type: "Earned", color: "#22c55e", days: 4, carryForward: true, maxCarry: 2 },
  ]);

  const [savingOrg, setSavingOrg] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [savingLeave, setSavingLeave] = useState(false);

  const toggleDay = (i: number) => {
    setWorkDays((d) => d.map((v, j) => (j === i ? !v : v)));
  };

  const updateLeaveType = (i: number, field: keyof LeaveType, value: any) => {
    setLeaveTypes((prev) =>
      prev.map((lt, j) => (j === i ? { ...lt, [field]: value } : lt))
    );
  };

  const handleSave = async (setter: (v: boolean) => void) => {
    setter(true);
    await new Promise((r) => setTimeout(r, 800));
    setter(false);
  };

  return (
    <div className="space-y-5">
      {/* Organization Info */}
      <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariant}>
        <div
          className="rounded-[24px] p-6 backdrop-blur-lg border border-[#dddddd]"
          style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
        >
          <h3 className="text-lg font-semibold mb-5" style={{ color: "#000000" }}>
            Organization Info
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
            <div>
              <label className={labelClass} style={{ color: "#1a1a1a" }}>Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={{ color: "#1a1a1a" }}>Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={{ color: "#1a1a1a" }}>Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={{ color: "#1a1a1a" }}>Time Zone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={inputClass + " cursor-pointer"}
                style={inputStyle}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
            <button
              className="h-10 px-6 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer hover:bg-[#f1efed]"
              style={{ backgroundColor: "transparent", border: "1px solid #dddddd", color: "#707070" }}
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave(setSavingOrg)}
              disabled={savingOrg}
              className="h-10 px-6 rounded-full text-sm font-semibold text-white transition-all duration-200 cursor-pointer active:scale-[0.97] disabled:opacity-50 hover:shadow-[0_4px_16px_rgba(243,53,12,0.25)]"
              style={{ backgroundColor: "#f3350c" }}
            >
              {savingOrg ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Work Schedule */}
      <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariant}>
        <div
          className="rounded-[24px] p-6 backdrop-blur-lg border border-[#dddddd]"
          style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
        >
          <h3 className="text-lg font-semibold mb-5" style={{ color: "#000000" }}>
            Work Schedule
          </h3>

          {/* Work Days */}
          <div>
            <label className={labelClass} style={{ color: "#1a1a1a" }}>Work Days</label>
            <div className="flex gap-2 mt-1">
              {DAYS.map((d, i) => (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className="w-10 h-10 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer"
                  style={{
                    backgroundColor: workDays[i] ? "#0a0a0a" : "#f8f7f3",
                    color: workDays[i] ? "#ffffff" : "#707070",
                    border: workDays[i] ? "none" : "1.5px solid #f1efed",
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Work Hours */}
          <div className="grid grid-cols-2 gap-4 mt-5">
            <div>
              <label className={labelClass} style={{ color: "#1a1a1a" }}>Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={{ color: "#1a1a1a" }}>End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Daily Target */}
          <div className="mt-5">
            <label className={labelClass} style={{ color: "#1a1a1a" }}>
              Daily Target Hours
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={targetHours}
                onChange={(e) => setTargetHours(Number(e.target.value))}
                min={1}
                max={24}
                className={inputClass}
                style={{ ...inputStyle, width: 80, textAlign: "center" }}
              />
              <span className="text-[13px]" style={{ color: "#707070" }}>hours</span>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
            <button
              className="h-10 px-6 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer hover:bg-[#f1efed]"
              style={{ backgroundColor: "transparent", border: "1px solid #dddddd", color: "#707070" }}
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave(setSavingSchedule)}
              disabled={savingSchedule}
              className="h-10 px-6 rounded-full text-sm font-semibold text-white transition-all duration-200 cursor-pointer active:scale-[0.97] disabled:opacity-50 hover:shadow-[0_4px_16px_rgba(243,53,12,0.25)]"
              style={{ backgroundColor: "#f3350c" }}
            >
              {savingSchedule ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Leave Policy */}
      <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariant}>
        <div
          className="rounded-[24px] p-6 backdrop-blur-lg border border-[#dddddd]"
          style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
        >
          <h3 className="text-lg font-semibold mb-5" style={{ color: "#000000" }}>
            Leave Policy
          </h3>

          {/* Leave Year Start */}
          <div className="mb-5">
            <label className={labelClass} style={{ color: "#1a1a1a" }}>
              Leave Year Start
            </label>
            <select
              value={leaveYearStart}
              onChange={(e) => setLeaveYearStart(e.target.value)}
              className={inputClass + " cursor-pointer"}
              style={{ ...inputStyle, maxWidth: 200 }}
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Leave Quotas */}
          <div className="overflow-x-auto -mx-2 px-2">
            <div className="min-w-[400px]">
            <p className="text-[13px] font-semibold mb-3" style={{ color: "#1a1a1a" }}>
              Leave Quotas (per year)
            </p>

            {/* Header */}
            <div
              className="flex items-center py-3 px-4 rounded-t-xl"
              style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
            >
              <span className="flex-1 text-xs font-semibold uppercase" style={{ color: "#707070" }}>
                Type
              </span>
              <span className="w-[80px] text-center text-xs font-semibold uppercase" style={{ color: "#707070" }}>
                Days
              </span>
              <span className="w-[160px] sm:w-[200px] text-center text-xs font-semibold uppercase" style={{ color: "#707070" }}>
                Carry Forward
              </span>
            </div>

            {/* Rows */}
            {leaveTypes.map((lt, i) => (
              <div
                key={lt.type}
                className="flex items-center py-3.5 px-4"
                style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
              >
                <div className="flex-1 flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: lt.color }}
                  />
                  <span className="text-sm font-medium" style={{ color: "#000000" }}>
                    {lt.type}
                  </span>
                </div>
                <div className="w-[80px] flex justify-center">
                  <input
                    type="number"
                    value={lt.days}
                    min={0}
                    max={30}
                    onChange={(e) => updateLeaveType(i, "days", Number(e.target.value))}
                    className="w-[52px] h-8 rounded-lg text-sm text-center outline-none transition-all duration-200 focus:border-[#0a0a0a] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
                    style={inputStyle}
                  />
                </div>
                <div className="w-[160px] sm:w-[200px] flex items-center justify-center gap-2">
                  <Switch
                    size="sm"
                    checked={lt.carryForward}
                    onCheckedChange={(v) => updateLeaveType(i, "carryForward", v)}
                  />
                  {lt.carryForward && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs" style={{ color: "#707070" }}>Max</span>
                      <input
                        type="number"
                        value={lt.maxCarry}
                        min={0}
                        max={lt.days}
                        onChange={(e) => updateLeaveType(i, "maxCarry", Number(e.target.value))}
                        className="w-[44px] h-7 rounded-lg text-xs text-center outline-none transition-all duration-200 focus:border-[#0a0a0a] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
                        style={inputStyle}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}            </div>          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
            <button
              className="h-10 px-6 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer hover:bg-[#f1efed]"
              style={{ backgroundColor: "transparent", border: "1px solid #dddddd", color: "#707070" }}
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave(setSavingLeave)}
              disabled={savingLeave}
              className="h-10 px-6 rounded-full text-sm font-semibold text-white transition-all duration-200 cursor-pointer active:scale-[0.97] disabled:opacity-50 hover:shadow-[0_4px_16px_rgba(243,53,12,0.25)]"
              style={{ backgroundColor: "#f3350c" }}
            >
              {savingLeave ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
