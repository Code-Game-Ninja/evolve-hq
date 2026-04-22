// CMS types, mock data, status configs, and color tokens


// Gallery image with caption & alt for rich project showcase
export interface GalleryImage {
  url: string;
  caption?: string;
  alt?: string;
}

// Project types
export type ProjectStatus = "published" | "draft" | "archived";
export type ProjectType = "completed" | "ongoing";
export type ProjectCategory =
  | "Web Development"
  | "Website Development"
  | "Mobile Development"
  | "AI & ML Solutions"
  | "Custom Software"
  | "Custom Software Development"
  | "Web3 & Blockchain";

export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription?: string;
  image?: string;
  images?: string[];
  galleryImages?: GalleryImage[];
  category: ProjectCategory;
  technologies: string[];
  year: number;
  status: ProjectStatus;
  featured: boolean;
  projectType: ProjectType;
  progressPercentage?: number;
  client?: string;
  link?: string;
  githubLink?: string;
  completedDate?: string;
  expectedCompletionDate?: string;
  order: number;

  // TODO: Build these sections on main website project detail page during backend phase
  // These fields enhance the case study narrative (Problem → Solution → Result)
  challenge?: string;
  solution?: string;
  result?: string;
  testimonial?: { quote: string; author: string; role: string };
  highlights?: string[];
}

// Service types
export type ServiceStatus = "published" | "draft" | "archived";

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  image?: string;
  imageAlt?: string;
  number?: string;
  tags: string[];
  features: string[];
  examples: string[];
  status: ServiceStatus;
  featured: boolean;
  order: number;
}

// Contact types
export type ContactStatus = "new" | "read" | "replied" | "archived";

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
  subscribe: boolean;
  status: ContactStatus;
  notes?: string;
  createdAt: string;
}

// Subscriber types
export type SubscriberStatus = "active" | "unsubscribed";
export type SubscriberSource = "footer" | "contact_form" | "hero" | "cta" | "popup";

export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  source: SubscriberSource;
  status: SubscriberStatus;
  createdAt: string;
}

// Testimonial types
export type TestimonialStatus = "published" | "draft";

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  title: string;
  image?: string;
  status: TestimonialStatus;
  featured: boolean;
  order: number;
}

// FAQ types
export type FAQStatus = "published" | "draft";

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  status: FAQStatus;
  order: number;
}

// Status config maps
export const projectStatusConfig: Record<ProjectStatus, { label: string; dot: string; bg: string; text: string }> = {
  published: { label: "Published", dot: "#22c55e", bg: "rgba(34,197,94,0.1)", text: "#22c55e" },
  draft: { label: "Draft", dot: "#f59e0b", bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
  archived: { label: "Archived", dot: "#b6b6b6", bg: "#f1efed", text: "#b6b6b6" },
};

export const serviceStatusConfig: Record<ServiceStatus, { label: string; dot: string; bg: string; text: string }> = {
  published: { label: "Published", dot: "#22c55e", bg: "rgba(34,197,94,0.1)", text: "#22c55e" },
  draft: { label: "Draft", dot: "#f59e0b", bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
  archived: { label: "Archived", dot: "#b6b6b6", bg: "#f1efed", text: "#b6b6b6" },
};

export const contactStatusConfig: Record<ContactStatus, { label: string; dot: string; bg: string; text: string }> = {
  new: { label: "New", dot: "#f59e0b", bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
  read: { label: "Read", dot: "#3b82f6", bg: "rgba(59,130,246,0.1)", text: "#3b82f6" },
  replied: { label: "Replied", dot: "#22c55e", bg: "rgba(34,197,94,0.1)", text: "#22c55e" },
  archived: { label: "Archived", dot: "#b6b6b6", bg: "#f1efed", text: "#b6b6b6" },
};

export const subscriberStatusConfig: Record<SubscriberStatus, { label: string; dot: string; bg: string; text: string }> = {
  active: { label: "Active", dot: "#22c55e", bg: "rgba(34,197,94,0.1)", text: "#22c55e" },
  unsubscribed: { label: "Unsubscribed", dot: "#b6b6b6", bg: "#f1efed", text: "#b6b6b6" },
};

export const testimonialStatusConfig: Record<TestimonialStatus, { label: string; dot: string; bg: string; text: string }> = {
  published: { label: "Published", dot: "#22c55e", bg: "rgba(34,197,94,0.1)", text: "#22c55e" },
  draft: { label: "Draft", dot: "#f59e0b", bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
};

export const faqStatusConfig: Record<FAQStatus, { label: string; dot: string; bg: string; text: string }> = {
  published: { label: "Published", dot: "#22c55e", bg: "rgba(34,197,94,0.1)", text: "#22c55e" },
  draft: { label: "Draft", dot: "#f59e0b", bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
};

// Category color config
export const categoryColors: Record<ProjectCategory, { bg: string; text: string }> = {
  "Web Development": { bg: "rgba(243,53,12,0.1)", text: "#f3350c" },
  "Website Development": { bg: "rgba(243,53,12,0.1)", text: "#f3350c" },
  "Mobile Development": { bg: "rgba(59,130,246,0.1)", text: "#3b82f6" },
  "AI & ML Solutions": { bg: "rgba(139,92,246,0.1)", text: "#8b5cf6" },
  "Custom Software": { bg: "rgba(34,197,94,0.1)", text: "#22c55e" },
  "Custom Software Development": { bg: "rgba(34,197,94,0.1)", text: "#22c55e" },
  "Web3 & Blockchain": { bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
};

// Subscriber source config
export const sourceColors: Record<SubscriberSource, { bg: string; text: string; label: string }> = {
  footer: { bg: "rgba(59,130,246,0.1)", text: "#3b82f6", label: "Footer" },
  contact_form: { bg: "rgba(139,92,246,0.1)", text: "#8b5cf6", label: "Contact Form" },
  hero: { bg: "rgba(243,53,12,0.1)", text: "#f3350c", label: "Hero" },
  cta: { bg: "rgba(245,158,11,0.1)", text: "#f59e0b", label: "CTA" },
  popup: { bg: "rgba(34,197,94,0.1)", text: "#22c55e", label: "Popup" },
};

// Category filter options
export const categoryOptions = [
  { label: "All Categories", value: "all" },
  { label: "Web Development", value: "Web Development" },
  { label: "Mobile Development", value: "Mobile Development" },
  { label: "AI & ML Solutions", value: "AI & ML Solutions" },
  { label: "Custom Software", value: "Custom Software" },
  { label: "Website Development", value: "Website Development" },
  { label: "Custom Software Development", value: "Custom Software Development" },
  { label: "Web3 & Blockchain", value: "Web3 & Blockchain" },
];

// Project status filter options
export const projectStatusOptions = [
  { label: "All Status", value: "all" },
  { label: "Published", value: "published" },
  { label: "Draft", value: "draft" },
  { label: "Archived", value: "archived" },
];

// Contact status filter options
export const contactStatusOptions = [
  { label: "All Status", value: "all" },
  { label: "New", value: "new" },
  { label: "Read", value: "read" },
  { label: "Replied", value: "replied" },
  { label: "Archived", value: "archived" },
];

// Subscriber status filter options
export const subscriberStatusOptions = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Unsubscribed", value: "unsubscribed" },
];

// Subscriber source filter options
export const subscriberSourceOptions = [
  { label: "All Sources", value: "all" },
  { label: "Footer", value: "footer" },
  { label: "Contact Form", value: "contact_form" },
  { label: "Hero", value: "hero" },
  { label: "CTA", value: "cta" },
  { label: "Popup", value: "popup" },
];

// Sort options
export const sortOptions = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
];
