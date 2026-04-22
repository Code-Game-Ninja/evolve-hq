// DailyUpdate model — standup notes
import { Schema, model, models, Types } from "mongoose";

export interface IDailyUpdate {
  _id: string;
  userId: Types.ObjectId;
  date: Date;
  yesterday: string;
  today: string;
  createdAt: Date;
  updatedAt: Date;
}

const DailyUpdateSchema = new Schema<IDailyUpdate>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    yesterday: { type: String, default: "" },
    today: { type: String, default: "" },
  },
  { timestamps: true }
);

// One update per user per day
DailyUpdateSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyUpdate =
  models.DailyUpdate || model<IDailyUpdate>("DailyUpdate", DailyUpdateSchema);
