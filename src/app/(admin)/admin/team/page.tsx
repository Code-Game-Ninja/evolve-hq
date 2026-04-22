// Admin Team page
import { Metadata } from "next";
import { getTeamData } from "@/lib/data/team";
import { TeamPageClient } from "./team-page-client";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Team Management | Evolve HQ",
  description: "Manage your agency team members and roles.",
};

export default async function TeamPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin" && session.user.role !== "superadmin") {
    redirect("/login");
  }

  const initialData = await getTeamData();

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <TeamPageClient initialData={initialData} />
    </div>
  );
}
