// Subscriber model
import { Schema, model, models } from "mongoose";

export interface ISubscriber {
  _id: string;
  email: string;
  name?: string;
  source?: "footer" | "contact_form" | "hero" | "cta" | "popup";
  status: "active" | "unsubscribed";
  unsubscribedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriberSchema = new Schema<ISubscriber>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: String,
    source: {
      type: String,
      enum: ["footer", "contact_form", "hero", "cta", "popup"],
    },
    status: {
      type: String,
      enum: ["active", "unsubscribed"],
      default: "active",
    },
    unsubscribedAt: Date,
  },
  { timestamps: true }
);

SubscriberSchema.index({ status: 1 });
SubscriberSchema.index({ createdAt: -1 });

export const Subscriber =
  models.Subscriber || model<ISubscriber>("Subscriber", SubscriberSchema);
