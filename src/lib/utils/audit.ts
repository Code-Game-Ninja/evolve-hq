import { AuditLog } from "@/lib/db/models";
import { connectDB } from "@/lib/db/mongodb";

interface AuditOptions {
  userId: string;
  action: string;
  details: string;
  type?: "success" | "warning" | "error" | "info";
  targetType?: string;
  targetId?: string;
}

export async function recordAuditLog(options: AuditOptions) {
  try {
    await connectDB();
    const log = await AuditLog.create({
      userId: options.userId,
      action: options.action,
      details: options.details,
      type: options.type || "info",
      targetType: options.targetType,
      targetId: options.targetId,
    });
    return log;
  } catch (error) {
    console.error("Failed to record audit log:", error);
    return null;
  }
}
