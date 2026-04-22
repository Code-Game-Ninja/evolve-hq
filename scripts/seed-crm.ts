// Seed script for CRM data
import { config } from "dotenv";
config({ path: ".env.local" });

import { connectDB } from "../src/lib/db/mongodb";
import { Lead, User } from "../src/lib/db/models";

async function seedCRM() {
  await connectDB();
  console.log("Connected to MongoDB for CRM seeding...");

  const admin = await User.findOne({ role: "superadmin" });
  if (!admin) {
    console.error("Admin user not found. Please run scripts/seed.ts first.");
    process.exit(1);
  }

  const sampleLeads = [
    {
      name: "Alex Johnson",
      email: "alex@techflow.io",
      company: "TechFlow Solutions",
      value: 150000,
      source: "Website",
      status: "new",
      priority: "high",
      assignedTo: admin._id,
      notes: "Interested in a full-scale digital transformation.",
      tags: ["Enterprise", "Cloud"],
    },
    {
      name: "Sarah Miller",
      email: "sarah@designhub.com",
      company: "DesignHub",
      value: 45000,
      source: "Referral",
      status: "contacted",
      priority: "medium",
      assignedTo: admin._id,
      notes: "Looking for a modern website redesign.",
      tags: ["Creative", "Web"],
    },
    {
      name: "Michael Chen",
      email: "m.chen@globalinfra.net",
      company: "Global Infra",
      value: 280000,
      source: "LinkedIn",
      status: "qualified",
      priority: "high",
      assignedTo: admin._id,
      notes: "Needs robust internal tools for resource management.",
      tags: ["Internal Tools", "Big Scale"],
    },
    {
      name: "Emma Davis",
      email: "emma@startupkick.com",
      company: "StartupKick",
      value: 12000,
      source: "Website",
      status: "proposal",
      priority: "low",
      assignedTo: admin._id,
      notes: "MVP development for a new fintech idea.",
      tags: ["Fintech", "MVP"],
    },
    {
      name: "Robert Wilson",
      email: "robert@peakperformance.com",
      company: "Peak Performance",
      value: 95000,
      source: "Event",
      status: "won",
      priority: "medium",
      assignedTo: admin._id,
      notes: "Contract signed. Project starts next month.",
      tags: ["Mobile App", "Health"],
    },
    {
      name: "Jessica Lee",
      email: "j.lee@eduplus.org",
      company: "EduPlus",
      value: 65000,
      source: "Website",
      status: "lost",
      priority: "medium",
      assignedTo: admin._id,
      notes: "Budget constraints. May revisit in Q4.",
      tags: ["Education", "Web"],
    },
  ];

  // Clear existing leads to avoid duplicates if needed (optional)
  // await Lead.deleteMany({});

  for (const leadData of sampleLeads) {
    const existing = await Lead.findOne({ email: leadData.email });
    if (!existing) {
      await Lead.create(leadData);
      console.log(`Created lead: ${leadData.name}`);
    } else {
      console.log(`Lead already exists: ${leadData.name}`);
    }
  }

  console.log("CRM Seeding completed!");
  process.exit(0);
}

seedCRM().catch((error) => {
  console.error("CRM Seed failed:", error);
  process.exit(1);
});
