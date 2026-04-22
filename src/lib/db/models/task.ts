// Task model
import { Schema, model, models, Types } from "mongoose";

export interface ITask {
  _id: string;
  title: string;
  description?: string;
  assigneeId: Types.ObjectId;
  assignedById: Types.ObjectId;
  project?: string;
  priority: "high" | "medium" | "low";
  status: "todo" | "in-progress" | "done";
  dueDate?: Date;
  tags: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, maxlength: 2000 },
    assigneeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    project: String,
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
    },
    dueDate: Date,
    tags: { type: [String], default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

TaskSchema.index({ assigneeId: 1, status: 1 });
TaskSchema.index({ status: 1, order: 1 });
TaskSchema.index({ assignedById: 1 });
TaskSchema.index({ dueDate: 1 });

export const Task = models.Task || model<ITask>("Task", TaskSchema);
