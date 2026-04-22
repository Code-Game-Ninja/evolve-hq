import { z } from "zod";

export const inquiryUpdateSchema = z.object({
  id: z.string(),
  status: z.enum(["new", "read", "replied", "archived"]).optional(),
  notes: z.string().optional(),
});

export const leadCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  company: z.string().optional(),
  value: z.number().optional().default(0),
  source: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]).optional().default("medium"),
  notes: z.string().optional(),
});

export const leadUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  value: z.number().optional(),
  status: z.enum(["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]).optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export const inquiryCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  company: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(1, "Message is required"),
  status: z.enum(["new", "read", "replied", "archived"]).optional().default("new"),
  notes: z.string().optional(),
});
