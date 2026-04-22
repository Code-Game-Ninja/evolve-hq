// Database seed script
import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { connectDB } from "../src/lib/db/mongodb";
import { User } from "../src/lib/db/models/user";

async function seed() {
  await connectDB();

  const seedPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!seedPassword) {
    throw new Error("SEED_ADMIN_PASSWORD not set. Run with: SEED_ADMIN_PASSWORD=yourpass npm run db:seed");
  }

  const existingAdmin = await User.findOne({ email: "dhananjay@evolve.app" });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(seedPassword, 12);

    await User.create({
      name: "Dhananjay",
      email: "dhananjay@evolve.app",
      password: hashedPassword,
      role: "superadmin",
      isActive: true,
      phone: "+91 98765 43210",
      employeeId: "SAM-001",
      department: "Engineering",
      bio: "Full-stack developer & co-founder at EVOLVE. Passionate about building products that matter.",
      location: "Mumbai, India",
      workType: "office",
      shift: { start: "09:00 AM", end: "06:00 PM" },
      skills: ["Next.js", "React", "TypeScript", "Node.js", "MongoDB", "Tailwind CSS", "GSAP", "Docker"],
    });

    console.log("Admin user created: dhananjay@evolve.app");
  } else {
    // Update existing admin with profile fields if missing
    const updates: Record<string, unknown> = {};
    if (!existingAdmin.phone) updates.phone = "+91 98765 43210";
    if (!existingAdmin.employeeId) updates.employeeId = "SAM-001";
    if (!existingAdmin.department) updates.department = "Engineering";
    if (!existingAdmin.bio) updates.bio = "Full-stack developer & co-founder at EVOLVE. Passionate about building products that matter.";
    if (!existingAdmin.location) updates.location = "Mumbai, India";
    if (!existingAdmin.workType) updates.workType = "office";
    if (!existingAdmin.shift) updates.shift = { start: "09:00 AM", end: "06:00 PM" };
    if (!existingAdmin.skills || existingAdmin.skills.length === 0) {
      updates.skills = ["Next.js", "React", "TypeScript", "Node.js", "MongoDB", "Tailwind CSS", "GSAP", "Docker"];
    }

    if (Object.keys(updates).length > 0) {
      await User.updateOne({ _id: existingAdmin._id }, { $set: updates });
      console.log("Admin user updated with profile fields");
    } else {
      console.log("Admin user already exists with complete profile");
    }
  }

  console.log("Seed completed!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
