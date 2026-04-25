// Audit Log seed script
import { config } from "dotenv";
config({ path: ".env.local" });

import { connectDB } from "../src/lib/db/mongodb";
import { User, AuditLog } from "../src/lib/db/models";

async function seed() {
  await connectDB();

  const admin = await User.findOne({ email: "dhananjay@evolve.app" });
  if (!admin) {
    console.error("Admin user not found. Please run npm run seed first.");
    process.exit(1);
  }

  // Clear existing logs
  await AuditLog.deleteMany({});

  const logs = [
    {
      userId: admin._id,
      action: "System Update",
      details: "Database optimization and security patches applied",
      type: "success",
      createdAt: new Date(Date.now() - 1000 * 60 * 5) // 5m ago
    },
    {
      userId: admin._id,
      action: "Leave Approved",
      details: "Approved sick leave for Sarah Johnson",
      type: "success",
      createdAt: new Date(Date.now() - 1000 * 60 * 60) // 1h ago
    },
    {
      userId: admin._id,
      action: "Task Created",
      details: "Assigned 'Q4 Performance Review' to HR team",
      type: "info",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3) // 3h ago
    },
    {
      userId: admin._id,
      action: "Security Alert",
      details: "Multiple failed login attempts detected from IP 192.168.1.100",
      type: "warning",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6) // 6h ago
    },
    {
      userId: admin._id,
      action: "Policy Update",
      details: "Updated Remote Work Policy document",
      type: "success",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1d ago
    }
  ];

  await AuditLog.insertMany(logs);
  console.log("Audit logs seeded successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
