"use client";

import { useEffect, useCallback, useRef } from "react";

interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  onClick?: () => void;
}

export function useBrowserNotifications() {
  const permissionRef = useRef<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      permissionRef.current = Notification.permission;
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }

    // Update from current state in case it changed externally
    permissionRef.current = Notification.permission;

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission === "denied") {
      return false;
    }

    const result = await Notification.requestPermission();
    permissionRef.current = result;
    return result === "granted";
  }, []);

  const showNotification = useCallback(
    async (options: NotificationOptions): Promise<Notification | null> => {
      if (typeof window === "undefined" || !("Notification" in window)) {
        return null;
      }

      // Auto-request permission if not granted
      if (Notification.permission !== "granted") {
        const granted = await requestPermission();
        if (!granted) return null;
      }

      // Don't show notifications if tab is active (optional - can be removed)
      if (document.visibilityState === "visible") {
        // Still show, but could skip if desired
      }

      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || "/evolve-icon.png",
        badge: options.badge || "/evolve-icon.png",
        tag: options.tag || "default",
        requireInteraction: options.requireInteraction || false,
        silent: false,
      });

      if (options.onClick) {
        notification.onclick = () => {
          window.focus();
          options.onClick?.();
          notification.close();
        };
      }

      // Auto-close after 10 seconds unless requireInteraction
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 10000);
      }

      return notification;
    },
    [requestPermission]
  );

  const notifyMessage = useCallback(
    async (senderName: string, message: string, channelName?: string) => {
      const title = channelName
        ? `${senderName} in #${channelName}`
        : `Message from ${senderName}`;
      const body = message.length > 100 ? message.slice(0, 100) + "..." : message;

      return showNotification({
        title,
        body,
        tag: "chat-message",
        onClick: () => {
          window.location.href = "/chat";
        },
      });
    },
    [showNotification]
  );

  const notifyTaskAssigned = useCallback(
    async (taskTitle: string, assignedByName: string) => {
      return showNotification({
        title: "New Task Assigned",
        body: `${assignedByName} assigned you: "${taskTitle}"`,
        tag: "task-assigned",
        onClick: () => {
          window.location.href = "/dashboard";
        },
      });
    },
    [showNotification]
  );

  const notifyLeaveStatus = useCallback(
    async (status: "approved" | "rejected", leaveType: string) => {
      return showNotification({
        title: `Leave ${status === "approved" ? "Approved" : "Rejected"}`,
        body: `Your ${leaveType} leave has been ${status}`,
        tag: `leave-${status}`,
        onClick: () => {
          window.location.href = "/leaves";
        },
      });
    },
    [showNotification]
  );

  const notifyMeeting = useCallback(
    async (meetingTitle: string, organizerName: string) => {
      return showNotification({
        title: "Meeting Invitation",
        body: `${organizerName} invited you to: "${meetingTitle}"`,
        tag: "meeting-invite",
        onClick: () => {
          window.location.href = "/meetings";
        },
      });
    },
    [showNotification]
  );

  return {
    permission: permissionRef.current,
    requestPermission,
    showNotification,
    notifyMessage,
    notifyTaskAssigned,
    notifyLeaveStatus,
    notifyMeeting,
    isSupported: typeof window !== "undefined" && "Notification" in window,
  };
}
