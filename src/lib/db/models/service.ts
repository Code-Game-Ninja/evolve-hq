// Service model
import { Schema, model, models } from "mongoose";

export interface IService {
  _id: string;
  title: string;
  description: string;
  icon?: string;
  image?: string;
  imageAlt?: string;
  number?: string;
  tags: string[];
  features: string[];
  examples: string[];
  status: "published" | "draft" | "archived";
  featured: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: String,
    image: String,
    imageAlt: String,
    number: String,
    tags: { type: [String], default: [] },
    features: { type: [String], default: [] },
    examples: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["published", "draft", "archived"],
      default: "published",
    },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ServiceSchema.index({ status: 1, featured: 1, order: 1 });
ServiceSchema.index({ status: 1, order: 1 });

export const Service =
  models.Service || model<IService>("Service", ServiceSchema);
