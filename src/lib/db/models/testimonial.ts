// Testimonial model
import { Schema, model, models } from "mongoose";

export interface ITestimonial {
  _id: string;
  quote: string;
  author: string;
  title?: string;
  image?: string;
  status: "published" | "draft";
  featured: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const TestimonialSchema = new Schema<ITestimonial>(
  {
    quote: { type: String, required: true },
    author: { type: String, required: true },
    title: String,
    image: String,
    status: {
      type: String,
      enum: ["published", "draft"],
      default: "draft",
    },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

TestimonialSchema.index({ status: 1, featured: 1, order: 1 });

export const Testimonial =
  models.Testimonial || model<ITestimonial>("Testimonial", TestimonialSchema);
