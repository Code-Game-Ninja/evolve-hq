// Project model
import { Schema, model, models } from "mongoose";

export interface IProjectGalleryImage {
  url: string;
  caption?: string;
  alt?: string;
}

export interface IProjectTestimonial {
  quote?: string;
  author?: string;
  role?: string;
}

export interface IProject {
  _id: string;
  slug: string;
  title: string;
  description?: string;
  longDescription?: string;
  challenge?: string;
  solution?: string;
  result?: string;
  image?: string;
  images: string[];
  galleryImages: IProjectGalleryImage[];
  category?:
    | "Web Development"
    | "Mobile Development"
    | "AI & ML Solutions"
    | "Custom Software"
    | "Web3 & Blockchain";
  technologies: string[];
  year?: number;
  projectType: "completed" | "ongoing";
  progressPercentage: number;
  client?: string;
  link?: string;
  githubLink?: string;
  completedDate?: Date;
  expectedCompletionDate?: Date;
  highlights: string[];
  testimonial?: IProjectTestimonial;
  status: "published" | "draft" | "archived";
  featured: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true },
    description: String,
    longDescription: String,
    challenge: String,
    solution: String,
    result: String,
    image: String,
    images: { type: [String], default: [] },
    galleryImages: {
      type: [
        {
          url: String,
          caption: String,
          alt: String,
        },
      ],
      default: [],
    },
    category: {
      type: String,
      enum: [
        "Web Development",
        "Website Development",
        "Mobile Development",
        "AI & ML Solutions",
        "Custom Software",
        "Custom Software Development",
        "Web3 & Blockchain",
      ],
    },
    technologies: { type: [String], default: [] },
    year: Number,
    projectType: {
      type: String,
      enum: ["completed", "ongoing"],
      default: "completed",
    },
    progressPercentage: { type: Number, min: 0, max: 100, default: 0 },
    client: String,
    link: String,
    githubLink: String,
    completedDate: Date,
    expectedCompletionDate: Date,
    highlights: { type: [String], default: [] },
    testimonial: {
      type: {
        quote: String,
        author: String,
        role: String,
      },
      default: undefined,
    },
    status: {
      type: String,
      enum: ["published", "draft", "archived"],
      default: "draft",
    },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProjectSchema.index({ status: 1, featured: 1, order: 1 });
ProjectSchema.index({ category: 1 });
ProjectSchema.index({ status: 1, order: 1 });

export const Project =
  models.Project || model<IProject>("Project", ProjectSchema);
