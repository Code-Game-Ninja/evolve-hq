// Lead model for CRM
import { Schema, model, models, Types } from "mongoose";

export interface ILeadActivity {
  _id?: string;
  type: "status_change" | "note_added" | "contacted" | "system";
  content: string;
  performedBy: Types.ObjectId; // User ID
  createdAt: Date;
}

export interface ILead {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  value?: number; // Potential deal value
  source?: string; // Website, Referral, etc.
  status: "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
  priority: "high" | "medium" | "low";
  assignedTo?: Types.ObjectId; // User ID
  notes?: string;
  tags: string[];
  activities: ILeadActivity[];
  lastContactedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    phone: String,
    company: String,
    value: { type: Number, default: 0 },
    source: String,
    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"],
      default: "new",
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    notes: String,
    tags: { type: [String], default: [] },
    activities: [
      {
        type: {
          type: String,
          enum: ["status_change", "note_added", "contacted", "system"],
          required: true,
        },
        content: { type: String, required: true },
        performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    lastContactedAt: Date,
  },
  { timestamps: true }
);

LeadSchema.index({ status: 1 });
LeadSchema.index({ email: 1 });
LeadSchema.index({ assignedTo: 1 });
LeadSchema.index({ source: 1 });
LeadSchema.index({ createdAt: -1 });

export const Lead = models.Lead || model<ILead>("Lead", LeadSchema);
