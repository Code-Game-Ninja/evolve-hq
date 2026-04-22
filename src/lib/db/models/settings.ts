// SiteSettings mongoose model
import { Schema, model, models } from "mongoose";

interface ISiteSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
    github: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string[];
    ogImage: string;
  };
  maintenance: boolean;
  updatedAt?: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    siteName: { type: String, default: "EVOLVE" },
    siteDescription: { type: String, default: "Web Development, Mobile Apps & AI Solutions" },
    contactEmail: { type: String, default: "info@evolve.agency" },
    contactPhone: { type: String, default: "" },
    address: { type: String, default: "" },
    socialLinks: {
      facebook: { type: String, default: "" },
      twitter: { type: String, default: "" },
      instagram: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      github: { type: String, default: "" },
    },
    seo: {
      metaTitle: { type: String, default: "EVOLVE — Web Development, Mobile & AI" },
      metaDescription: { type: String, default: "EVOLVE builds custom web apps, mobile apps, and AI solutions." },
      metaKeywords: { type: [String], default: ["web development", "mobile apps", "AI", "EVOLVE"] },
      ogImage: { type: String, default: "" },
    },
    maintenance: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const SiteSettings =
  models.SiteSettings || model<ISiteSettings>("SiteSettings", SiteSettingsSchema);
