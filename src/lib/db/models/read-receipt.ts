import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReadReceipt extends Document {
  channelId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  lastReadMessageId?: mongoose.Types.ObjectId;
  lastReadAt: Date;
}

const readReceiptSchema = new Schema<IReadReceipt>(
  {
    channelId: { type: Schema.Types.ObjectId, ref: "Channel", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastReadMessageId: { type: Schema.Types.ObjectId, ref: "Message" },
    lastReadAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Ensure a user only has one read receipt per channel
readReceiptSchema.index({ channelId: 1, userId: 1 }, { unique: true });

export const ReadReceipt: Model<IReadReceipt> =
  mongoose.models.ReadReceipt || mongoose.model<IReadReceipt>("ReadReceipt", readReceiptSchema);
