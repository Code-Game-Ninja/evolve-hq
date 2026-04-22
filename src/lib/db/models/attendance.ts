import { Schema, model, models, Types } from "mongoose";

export interface IAttendance {
  _id: string;
  userId: Types.ObjectId;
  date: Date; // Start of day IST
  clockIn: Date;
  clockOut?: Date;
  status: "present" | "late" | "wfh" | "absent" | "half-day" | "active";
  workMode: "office" | "wfh";
  duration?: number; // Total minutes worked
  logs: Array<{
    time: Date;
    type: "in" | "out";
    note?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    clockIn: { type: Date, required: true },
    clockOut: Date,
    status: {
      type: String,
      enum: ["present", "late", "wfh", "absent", "half-day", "active"],
      default: "active",
    },
    workMode: {
      type: String,
      enum: ["office", "wfh"],
      default: "office",
    },
    duration: { type: Number, default: 0 },
    logs: [
      {
        time: { type: Date, required: true },
        type: { type: String, enum: ["in", "out"], required: true },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

// Compound index for efficient daily lookup per user
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: 1 });

export const Attendance = models.Attendance || model<IAttendance>("Attendance", AttendanceSchema);
