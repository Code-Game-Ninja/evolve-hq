import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage extends Document {
  channelId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  attachments: {
    url: string;
    name: string;
    type: string;
    size: number;
  }[];
  reactions: {
    emoji: string;
    users: mongoose.Types.ObjectId[];
  }[];
  threadParentId?: mongoose.Types.ObjectId;
  replyCount: number;
  isPinned: boolean;
  isEdited: boolean;
  editedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    channelId: { type: Schema.Types.ObjectId, ref: "Channel", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    attachments: [
      {
        url: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, required: true },
        size: { type: Number, required: true },
      },
    ],
    reactions: [
      {
        emoji: { type: String, required: true },
        users: [{ type: Schema.Types.ObjectId, ref: "User" }],
      },
    ],
    threadParentId: { type: Schema.Types.ObjectId, ref: "Message" },
    replyCount: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

export const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", messageSchema);
