// Admin HR page
import { Metadata } from "next";
import { HRPageClient } from "./hr-page-client";
import { getHRData } from "@/lib/data/hr";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "HR Management | Evolve HQ",
  description: "Manage attendance reports and leave approvals.",
};

export default async function HRPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin" && session.user.role !== "superadmin") {
    redirect("/login");
  }

  const initialData = await getHRData();

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <HRPageClient initialData={initialData} />
    </div>
  );
}
