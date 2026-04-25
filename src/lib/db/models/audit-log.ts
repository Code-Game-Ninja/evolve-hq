import { Schema, model, models, Types } from "mongoose";

export interface IAuditLog {
  _id: string;
  userId: Types.ObjectId;
  action: string;
  details: string;
  type: "success" | "warning" | "error" | "info";
  targetType?: string;
  targetId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    details: { type: String, required: true },
    type: {
      type: String,
      enum: ["success", "warning", "error", "info"],
      default: "info",
    },
    targetType: String,
    targetId: String,
  },
  { timestamps: true }
);

// Index for efficient queries
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ type: 1 });

export const AuditLog =
  models.AuditLog || model<IAuditLog>("AuditLog", AuditLogSchema);
