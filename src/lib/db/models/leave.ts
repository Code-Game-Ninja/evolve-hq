// Leave model
import { Schema, model, models, Types } from "mongoose";

export interface ILeave {
  _id: string;
  userId: Types.ObjectId;
  type: "casual" | "sick" | "earned";
  fromDate: Date;
  toDate: Date;
  days: number;
  isHalfDay: boolean;
  halfDayPeriod?: "first" | "second";
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  reviewNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema = new Schema<ILeave>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["casual", "sick", "earned"],
      required: true,
    },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    days: { type: Number, required: true },
    isHalfDay: { type: Boolean, default: false },
    halfDayPeriod: { type: String, enum: ["first", "second"] },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    reviewNote: String,
  },
  { timestamps: true }
);

// Index for efficient queries
LeaveSchema.index({ userId: 1, status: 1 });
LeaveSchema.index({ userId: 1, fromDate: 1 });

export const Leave =
  models.Leave || model<ILeave>("Leave", LeaveSchema);
