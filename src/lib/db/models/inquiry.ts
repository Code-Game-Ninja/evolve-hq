// Inquiry model
import { Schema, model, models } from "mongoose";

export interface IInquiry {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
  subscribe: boolean;
  status: "new" | "read" | "replied" | "archived";
  notes?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InquirySchema = new Schema<IInquiry>(
  {
    name: { type: String, required: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    phone: { type: String, maxlength: 20 },
    company: String,
    subject: String,
    message: { type: String, required: true, maxlength: 5000 },
    subscribe: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["new", "read", "replied", "archived"],
      default: "new",
    },
    notes: String,
    ipAddress: String,
  },
  { timestamps: true }
);

InquirySchema.index({ status: 1, createdAt: -1 });
InquirySchema.index({ email: 1 });
InquirySchema.index({ createdAt: -1 });

export const Inquiry =
  models.Inquiry || model<IInquiry>("Inquiry", InquirySchema);
