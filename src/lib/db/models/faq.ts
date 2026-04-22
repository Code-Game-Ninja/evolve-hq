// FAQ model
import { Schema, model, models } from "mongoose";

export interface IFAQ {
  _id: string;
  question: string;
  answer: string;
  status: "published" | "draft";
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const FAQSchema = new Schema<IFAQ>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    status: {
      type: String,
      enum: ["published", "draft"],
      default: "draft",
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

FAQSchema.index({ status: 1, order: 1 });

export const FAQ = models.FAQ || model<IFAQ>("FAQ", FAQSchema);
