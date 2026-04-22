// User model
import { Schema, model, models } from "mongoose";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  image?: string;
  role: "superadmin" | "admin" | "manager" | "employee";
  positions: string[];
  isActive: boolean;
  mustChangePassword: boolean;
  lastLogin?: Date;
  // 2FA fields
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
  // Profile fields
  phone?: string;
  employeeId?: string;
  department?: string;
  bio?: string;
  location?: string;
  discordId?: string;
  workType?: "office" | "remote" | "hybrid";
  shift?: { start: string; end: string };
  skills?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: String,
    image: String,
    role: {
      type: String,
      enum: ["superadmin", "admin", "manager", "employee"],
      default: "employee",
    },
    positions: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },
    lastLogin: Date,
    // 2FA fields
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    twoFactorBackupCodes: { type: [String], select: false },
    // Profile fields
    phone: String,
    employeeId: String,
    department: String,
    bio: String,
    location: String,
    discordId: { type: String, sparse: true, unique: true },
    workType: {
      type: String,
      enum: ["office", "remote", "hybrid"],
    },
    shift: {
      start: String,
      end: String,
    },
    skills: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const User = models.User || model<IUser>("User", UserSchema);
