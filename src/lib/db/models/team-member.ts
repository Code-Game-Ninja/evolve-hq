// TeamMember model — public-facing team profile for evolve.agency
import { Schema, model, models, type Types } from "mongoose";

export interface IEducation {
  degree: string;
  institution: string;
  field?: string;
  startYear?: number;
  endYear?: number;
  current?: boolean;
  description?: string;
}

export interface IExperience {
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  location?: string;
  description?: string;
  achievements?: string[];
}

export interface ICertification {
  name: string;
  issuer: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface ISocialLinks {
  linkedin?: string;
  twitter?: string;
  github?: string;
  instagram?: string;
  website?: string;
  youtube?: string;
}

export interface ITeamMember {
  _id: string;
  name: string;
  slug: string;
  role: string;
  title?: string;
  bio?: string;
  longBio?: string;
  image?: string;
  imageAlt?: string;
  email?: string;
  phone?: string;
  calendly?: string;
  location?: string;
  timezone?: string;
  languages: string[];
  socialLinks: ISocialLinks;
  expertise: string[];
  skills: string[];
  education: IEducation[];
  experience: IExperience[];
  certifications: ICertification[];
  status: "active" | "inactive";
  featured: boolean;
  showOnHomepage: boolean;
  showOnAboutPage: boolean;
  availableForContact: boolean;
  contactPriority: number;
  contactType: "founder" | "lead" | "member" | "advisor";
  order: number;
  linkedUserId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EducationSchema = new Schema<IEducation>(
  {
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    field: String,
    startYear: Number,
    endYear: Number,
    current: { type: Boolean, default: false },
    description: String,
  },
  { _id: false }
);

const ExperienceSchema = new Schema<IExperience>(
  {
    company: { type: String, required: true },
    role: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: String,
    current: { type: Boolean, default: false },
    location: String,
    description: String,
    achievements: { type: [String], default: [] },
  },
  { _id: false }
);

const CertificationSchema = new Schema<ICertification>(
  {
    name: { type: String, required: true },
    issuer: { type: String, required: true },
    issueDate: String,
    expiryDate: String,
    credentialId: String,
    credentialUrl: String,
  },
  { _id: false }
);

const SocialLinksSchema = new Schema<ISocialLinks>(
  {
    linkedin: String,
    twitter: String,
    github: String,
    instagram: String,
    website: String,
    youtube: String,
  },
  { _id: false }
);

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    role: { type: String, required: true },
    title: String,
    bio: String,
    longBio: String,
    image: String,
    imageAlt: String,
    email: String,
    phone: String,
    calendly: String,
    location: String,
    timezone: String,
    languages: { type: [String], default: [] },
    socialLinks: { type: SocialLinksSchema, default: () => ({}) },
    expertise: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    education: { type: [EducationSchema], default: [] },
    experience: { type: [ExperienceSchema], default: [] },
    certifications: { type: [CertificationSchema], default: [] },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    featured: { type: Boolean, default: false },
    showOnHomepage: { type: Boolean, default: false },
    showOnAboutPage: { type: Boolean, default: false },
    availableForContact: { type: Boolean, default: false },
    contactPriority: { type: Number, default: 999 },
    contactType: {
      type: String,
      enum: ["founder", "lead", "member", "advisor"],
      default: "member",
    },
    order: { type: Number, default: 0 },
    linkedUserId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Indexes (slug index auto-created by unique: true)
TeamMemberSchema.index({ status: 1, order: 1 });
TeamMemberSchema.index({ status: 1, featured: 1 });

export const TeamMember =
  models.TeamMember || model<ITeamMember>("TeamMember", TeamMemberSchema);
