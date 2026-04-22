// Settings sidebar — vertical nav with animated pill
"use client";

import { motion } from "framer-motion";
import {
  User,
  ShieldCheck,
  Palette,
  Bell,
  Lock,
  Shield,
} from "lucide-react";

export type SettingsSection =
  | "profile"
  | "account"
  | "appearance"
  | "notifications"
  | "privacy"
  | "team";

interface NavItem {
  value: SettingsSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

export const settingsNavItems: NavItem[] = [
  { value: "profile", label: "Profile", icon: User },
  { value: "account", label: "Account & Security", icon: ShieldCheck },
  { value: "appearance", label: "Appearance", icon: Palette },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "privacy", label: "Privacy", icon: Lock },
  { value: "team", label: "Team Settings", icon: Shield, adminOnly: true },
];

const springConfig = { type: "spring" as const, stiffness: 400, damping: 30 };

interface SettingsSidebarProps {
  active: SettingsSection;
  onChange: (section: SettingsSection) => void;
  isAdmin: boolean;
}

export function SettingsSidebar({ active, onChange, isAdmin }: SettingsSidebarProps) {
  return (
    <div
      className="rounded-[24px] p-2 sticky top-[80px] hidden md:block backdrop-blur-lg border border-[#dddddd]"
      style={{
        backgroundColor: "rgba(241,239,237,0.45)",
      }}
    >
      <nav className="flex flex-col gap-0.5">
        {settingsNavItems.map((item) => {
          // Admin-only: locked for non-admins
          if (item.adminOnly && !isAdmin) {
            return (
              <div key={item.value}>
                <div className="h-px mx-4 my-2" style={{ backgroundColor: "rgba(0,0,0,0.05)" }} />
                <div
                  className="flex items-center gap-2.5 h-11 px-4 rounded-2xl cursor-not-allowed"
                  title="Admin access required"
                >
                  <item.icon className="h-4 w-4 text-[#b6b6b6]" />
                  <span className="text-sm font-medium text-[#b6b6b6]">
                    {item.label}
                  </span>
                  <Lock className="h-3 w-3 ml-auto text-[#b6b6b6]" />
                </div>
              </div>
            );
          }

          // Admin section with divider
          if (item.adminOnly && isAdmin) {
            return (
              <div key={item.value}>
                <div className="h-px mx-4 my-2" style={{ backgroundColor: "rgba(0,0,0,0.05)" }} />
                <SidebarButton
                  item={item}
                  isActive={active === item.value}
                  onClick={() => onChange(item.value)}
                />
              </div>
            );
          }

          return (
            <SidebarButton
              key={item.value}
              item={item}
              isActive={active === item.value}
              onClick={() => onChange(item.value)}
            />
          );
        })}
      </nav>
    </div>
  );
}

// Sidebar nav button with animated pill
function SidebarButton({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2.5 h-11 w-full px-4 rounded-2xl cursor-pointer transition-colors duration-200 ${
        isActive
          ? "text-white"
          : "text-[#4d4d4d] hover:bg-[rgba(0,0,0,0.04)] hover:text-[#000000]"
      }`}
    >
      {isActive && (
        <motion.span
          layoutId="settings-nav-pill"
          className="absolute inset-0 rounded-2xl bg-[#0a0a0a] -z-[1]"
          transition={springConfig}
        />
      )}
      <item.icon className="h-4 w-4 relative z-10" />
      <span className="text-sm font-medium relative z-10">{item.label}</span>
    </button>
  );
}
