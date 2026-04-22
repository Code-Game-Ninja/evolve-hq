// Settings page — main client with sidebar + section switching
"use client";

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  SettingsSidebar,
  settingsNavItems,
  type SettingsSection,
} from "./settings-sidebar";
import { GlassPillTabs } from "@/components/ui/glass-pill-tabs";
import { SettingsProfile } from "./settings-profile";
import { SettingsAccount } from "./settings-account";
import { SettingsAppearance } from "./settings-appearance";
import { SettingsNotifications } from "./settings-notifications";
import { SettingsPrivacy } from "./settings-privacy";
import { SettingsTeam } from "./settings-team";

const VALID_SECTIONS: SettingsSection[] = [
  "profile", "account", "appearance", "notifications", "privacy", "team",
];

interface SettingsClientProps {
  basePath?: string;
  pageTitle?: string;
}

export function SettingsClient({ basePath = "/settings", pageTitle = "Settings" }: SettingsClientProps) {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read active tab from URL, fallback to "profile"
  const tabParam = searchParams.get("tab") as SettingsSection | null;
  const active: SettingsSection =
    tabParam && VALID_SECTIONS.includes(tabParam) ? tabParam : "profile";

  const user = session?.user;
  const isAdmin = ["admin", "superadmin"].includes(user?.role || "");

  // Update URL when tab changes
  const setActive = useCallback(
    (section: SettingsSection) => {
      const params = new URLSearchParams(searchParams.toString());
      if (section === "profile") {
        params.delete("tab");
      } else {
        params.set("tab", section);
      }
      const query = params.toString();
      router.replace(`${basePath}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [searchParams, router, basePath],
  );

  // Loading skeleton
  if (status === "loading") {
    return (
      <div className="space-y-5 pb-12 animate-pulse">
        <div>
          <div className="h-9 w-40 rounded-xl" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
          <div className="h-4 w-80 mt-2 rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.04)" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-5">
          <div className="hidden md:block h-[360px] rounded-3xl" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
          <div className="space-y-5">
            <div className="h-[200px] rounded-3xl" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
            <div className="h-[400px] rounded-3xl" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
          </div>
        </div>
      </div>
    );
  }

  const sectionContent: Record<SettingsSection, React.ReactNode> = {
    profile: <SettingsProfile user={user} />,
    account: <SettingsAccount />,
    appearance: <SettingsAppearance />,
    notifications: <SettingsNotifications />,
    privacy: <SettingsPrivacy />,
    team: <SettingsTeam />,
  };

  // Mobile nav tabs
  const mobileTabs = settingsNavItems
    .filter((item) => !item.adminOnly || isAdmin)
    .map((item) => ({ label: item.label, value: item.value }));

  return (
    <div className="space-y-5 pb-12">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <h1
          className="text-2xl sm:text-[2rem] font-semibold leading-tight"
          style={{ color: "#1a1a1a" }}
        >
          {pageTitle}
        </h1>
        <p className="text-sm mt-1" style={{ color: "#737373" }}>
          Manage your account, preferences and workspace settings.
        </p>
      </motion.div>

      {/* Mobile nav — horizontal glass pill strip */}
      <div className="md:hidden overflow-x-auto -mx-4 px-4 scrollbar-none">
        <GlassPillTabs
          tabs={mobileTabs}
          activeValue={active}
          onChange={(v) => setActive(v as SettingsSection)}
          layoutId="settings-mobile-pill"
          size="sm"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-5">
        {/* Sidebar (desktop) */}
        <SettingsSidebar active={active} onChange={setActive} isAdmin={isAdmin} />

        {/* Right panel — active section */}
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {sectionContent[active]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
