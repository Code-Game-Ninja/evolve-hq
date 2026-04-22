import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChannel extends Document {
  name?: string;
  description?: string;
  type: "public" | "private" | "dm";
  members: {
    userId: mongoose.Types.ObjectId;
    role: "owner" | "admin" | "member";
    joinedAt: Date;
  }[];
  createdBy: mongoose.Types.ObjectId;
  avatar?: string;
  lastMessageAt?: Date;
  pinnedMessages: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const channelSchema = new Schema<IChannel>(
  {
    name: { type: String },
    description: { type: String },
    type: { type: String, enum: ["public", "private", "dm"], required: true },
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        role: { type: String, enum: ["owner", "admin", "member"], default: "member" },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    avatar: { type: String },
    lastMessageAt: { type: Date },
    pinnedMessages: [{ type: Schema.Types.ObjectId, ref: "Message" }],
  },
  { timestamps: true }
);

export const Channel: Model<IChannel> =
  mongoose.models.Channel || mongoose.model<IChannel>("Channel", channelSchema);
