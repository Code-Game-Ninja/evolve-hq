"use client";

import { useUIStore } from "@/lib/stores/ui-store";
import { NotificationSidebar } from "@/components/layout/notification-sidebar";

export function GlobalSidebar() {
  const { isNotificationSidebarOpen, setNotificationSidebarOpen } = useUIStore();

  return (
    <NotificationSidebar 
      open={isNotificationSidebarOpen} 
      onClose={() => setNotificationSidebarOpen(false)} 
    />
  );
}
