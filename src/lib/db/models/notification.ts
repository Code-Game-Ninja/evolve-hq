// Notification model
import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: "leave_approved" | "leave_rejected" | "task_assigned" | "task_updated" | "meeting_reminder" | "attendance" | "team_update" | "system";
  title: string;
  description: string;
  href: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["leave_approved", "leave_rejected", "task_assigned", "task_updated", "meeting_reminder", "attendance", "team_update", "system", "chat_message"],
      required: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 500 },
    href: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for fetching user's recent notifications efficiently
NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);
