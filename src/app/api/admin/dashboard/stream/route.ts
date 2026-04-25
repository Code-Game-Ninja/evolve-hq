import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { AuditLog, Task } from "@/lib/db/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DashboardVersionSnapshot = {
  latestAuditAt: number;
  latestTaskAt: number;
  auditCount: number;
  taskCount: number;
};

function toTimestamp(value: Date | string | undefined) {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(value);
  const timestamp = date.getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function encodeSSE(event: string, payload: Record<string, unknown>) {
  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  return new TextEncoder().encode(message);
}

async function getVersionSnapshot(): Promise<DashboardVersionSnapshot> {
  const [latestAudit, latestTask, auditCount, taskCount] = await Promise.all([
    AuditLog.findOne()
      .sort({ updatedAt: -1 })
      .select("updatedAt createdAt")
      .lean<{ updatedAt?: Date; createdAt?: Date }>(),
    Task.findOne()
      .sort({ updatedAt: -1 })
      .select("updatedAt createdAt")
      .lean<{ updatedAt?: Date; createdAt?: Date }>(),
    AuditLog.countDocuments(),
    Task.countDocuments(),
  ]);

  return {
    latestAuditAt: toTimestamp(latestAudit?.updatedAt ?? latestAudit?.createdAt),
    latestTaskAt: toTimestamp(latestTask?.updatedAt ?? latestTask?.createdAt),
    auditCount,
    taskCount,
  };
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { role } = session.user;
  if (!role || !["admin", "superadmin"].includes(role)) {
    return new Response("Forbidden", { status: 403 });
  }

  await connectDB();

  let snapshot = await getVersionSnapshot();
  let isClosed = false;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const cleanup = () => {
        if (isClosed) return;
        isClosed = true;
        if (pollTimer) clearInterval(pollTimer);
        if (keepAliveTimer) clearInterval(keepAliveTimer);
        try {
          controller.close();
        } catch {
          // Stream is already closed.
        }
      };

      const send = (event: string, payload: Record<string, unknown>) => {
        if (isClosed) return;
        controller.enqueue(encodeSSE(event, payload));
      };

      request.signal.addEventListener("abort", cleanup);
      send("connected", { ts: Date.now() });

      let isChecking = false;
      pollTimer = setInterval(async () => {
        if (isClosed || isChecking) return;

        isChecking = true;
        try {
          const nextSnapshot = await getVersionSnapshot();
          const auditChanged =
            nextSnapshot.latestAuditAt !== snapshot.latestAuditAt ||
            nextSnapshot.auditCount !== snapshot.auditCount;
          const taskChanged =
            nextSnapshot.latestTaskAt !== snapshot.latestTaskAt ||
            nextSnapshot.taskCount !== snapshot.taskCount;

          if (auditChanged || taskChanged) {
            snapshot = nextSnapshot;

            if (auditChanged) {
              send("audit-update", {
                channel: "audit",
                latestAuditAt: snapshot.latestAuditAt,
                auditCount: snapshot.auditCount,
                ts: Date.now(),
              });
            }

            if (taskChanged) {
              send("tasks-update", {
                channel: "tasks",
                latestTaskAt: snapshot.latestTaskAt,
                taskCount: snapshot.taskCount,
                ts: Date.now(),
              });
            }

            send("dashboard-update", {
              auditChanged,
              taskChanged,
              latestAuditAt: snapshot.latestAuditAt,
              latestTaskAt: snapshot.latestTaskAt,
              auditCount: snapshot.auditCount,
              taskCount: snapshot.taskCount,
              ts: Date.now(),
            });
          }
        } catch (error) {
          console.error("SSE dashboard stream polling failed:", error);
        } finally {
          isChecking = false;
        }
      }, 4000);

      keepAliveTimer = setInterval(() => {
        send("keepalive", { ts: Date.now() });
      }, 15000);
    },
    cancel() {
      isClosed = true;
      if (pollTimer) clearInterval(pollTimer);
      if (keepAliveTimer) clearInterval(keepAliveTimer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
