// Meeting model
import { Schema, model, models, Types } from "mongoose";

export interface IActionItem {
  task: string;
  assignedTo?: Types.ObjectId;
  dueDate?: Date;
  priority: "High" | "Medium" | "Low";
  completed: boolean;
}

export interface IMeeting {
  _id: string;
  title: string;
  description?: string;
  organizerId: Types.ObjectId;
  attendeeIds: Types.ObjectId[];
  startTime: Date;
  endTime: Date;
  location?: string;
  meetingUrl?: string;
  status: "scheduled" | "completed" | "cancelled";
  actionItems: IActionItem[];
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema = new Schema<IMeeting>(
  {
    title: { type: String, required: true },
    description: String,
    organizerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    attendeeIds: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    location: String,
    meetingUrl: String,
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
    actionItems: [
      {
        task: { type: String, required: true },
        assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
        dueDate: Date,
        priority: {
          type: String,
          enum: ["High", "Medium", "Low"],
          default: "Medium",
        },
        completed: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

MeetingSchema.index({ organizerId: 1 });
MeetingSchema.index({ attendeeIds: 1 });
MeetingSchema.index({ startTime: 1 });
MeetingSchema.index({ status: 1 });

export const Meeting =
  models.Meeting || model<IMeeting>("Meeting", MeetingSchema);
