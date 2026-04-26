// Notification Service - Helper for creating and sending notifications consistently
import { connectDB } from "@/lib/db/mongodb";
import { Notification } from "@/lib/db/models";
import { pusherServer } from "@/lib/pusher";

// Safe date formatting helper
function formatDateSafe(dateInput: string | Date | undefined): string {
  if (!dateInput) return "Invalid Date";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleDateString("en-IN");
}

export type NotificationType =
  | "leave_approved"
  | "leave_rejected"
  | "task_assigned"
  | "task_updated"
  | "meeting_reminder"
  | "attendance"
  | "team_update"
  | "system"
  | "chat_message";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  description: string;
  href: string;
}

interface BulkNotificationParams {
  userIds: string[];
  type: NotificationType;
  title: string;
  description: string;
  href: string;
  excludeUserId?: string; // Optional: exclude a specific user (e.g., the sender)
}

/**
 * Create a single notification for a user
 */
export async function createNotification({
  userId,
  type,
  title,
  description,
  href,
}: CreateNotificationParams) {
  await connectDB();

  const notification = await Notification.create({
    userId,
    type,
    title,
    description,
    href,
    read: false,
  });

  // Push real-time notification via Pusher
  try {
    await pusherServer.trigger(`user-${userId}`, "new-notification", notification);
  } catch (e) {
    // Non-critical - notification is already saved in DB
    console.warn("Pusher notification trigger failed:", e);
  }

  return notification;
}

/**
 * Create bulk notifications for multiple users
 */
export async function createBulkNotifications({
  userIds,
  type,
  title,
  description,
  href,
  excludeUserId,
}: BulkNotificationParams) {
  await connectDB();

  const recipientIds = excludeUserId
    ? userIds.filter((id) => id !== excludeUserId)
    : userIds;

  if (recipientIds.length === 0) return [];

  const notifications = await Notification.insertMany(
    recipientIds.map((userId) => ({
      userId,
      type,
      title,
      description,
      href,
      read: false,
    }))
  );

  // Push real-time notifications via Pusher to each recipient
  for (let i = 0; i < recipientIds.length; i++) {
    try {
      await pusherServer.trigger(
        `user-${recipientIds[i]}`,
        "new-notification",
        notifications[i]
      );
    } catch (e) {
      // Non-critical - notification is already saved in DB
    }
  }

  return notifications;
}

/**
 * Notify task assignee when a task is assigned
 */
export async function notifyTaskAssigned({
  assigneeId,
  assigneeName,
  taskTitle,
  assignedByName,
}: {
  assigneeId: string;
  assigneeName: string;
  taskTitle: string;
  assignedByName: string;
}) {
  return createNotification({
    userId: assigneeId,
    type: "task_assigned",
    title: "New task assigned",
    description: `${assignedByName} assigned you a task: "${taskTitle}"`,
    href: "/dashboard",
  });
}

/**
 * Notify user when their leave is approved
 */
export async function notifyLeaveApproved({
  userId,
  userName,
  leaveType,
  fromDate,
  toDate,
}: {
  userId: string;
  userName: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
}) {
  const fromStr = formatDateSafe(fromDate);
  const toStr = formatDateSafe(toDate);
  const dateRange = fromStr === toStr ? fromStr : `${fromStr} - ${toStr}`;

  return createNotification({
    userId,
    type: "leave_approved",
    title: "Leave approved",
    description: `Your ${leaveType} leave for ${dateRange} has been approved`,
    href: "/leaves",
  });
}

/**
 * Notify user when their leave is rejected
 */
export async function notifyLeaveRejected({
  userId,
  userName,
  leaveType,
  fromDate,
  toDate,
  reviewNote,
}: {
  userId: string;
  userName: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reviewNote?: string;
}) {
  const fromStr = formatDateSafe(fromDate);
  const toStr = formatDateSafe(toDate);
  const dateRange = fromStr === toStr ? fromStr : `${fromStr} - ${toStr}`;

  const description = reviewNote
    ? `Your ${leaveType} leave for ${dateRange} was rejected. Reason: ${reviewNote}`
    : `Your ${leaveType} leave for ${dateRange} was rejected`;

  return createNotification({
    userId,
    type: "leave_rejected",
    title: "Leave rejected",
    description,
    href: "/leaves",
  });
}

/**
 * Notify attendees when they are added to a meeting
 */
export async function notifyMeetingInvite({
  attendeeIds,
  meetingTitle,
  organizerName,
  startTime,
}: {
  attendeeIds: string[];
  meetingTitle: string;
  organizerName: string;
  startTime: string;
}) {
  const formattedTime = new Date(startTime).toLocaleString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return createBulkNotifications({
    userIds: attendeeIds,
    type: "meeting_reminder",
    title: "Meeting invitation",
    description: `${organizerName} invited you to "${meetingTitle}" on ${formattedTime}`,
    href: "/meetings",
  });
}

/**
 * Notify admin/HR when a new leave is applied
 */
export async function notifyLeaveApplied({
  adminIds,
  applicantName,
  leaveType,
  fromDate,
  toDate,
}: {
  adminIds: string[];
  applicantName: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
}) {
  const fromStr = formatDateSafe(fromDate);
  const toStr = formatDateSafe(toDate);
  const dateRange = fromStr === toStr ? fromStr : `${fromStr} - ${toStr}`;

  return createBulkNotifications({
    userIds: adminIds,
    type: "team_update",
    title: "New leave request",
    description: `${applicantName} applied for ${leaveType} leave (${dateRange})`,
    href: "/admin/hr",
  });
}
