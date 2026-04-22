// Admin Team page
import { Suspense } from "react";
import { Metadata } from "next";
import { TeamPageClient } from "./team-page-client";

export const metadata: Metadata = {
  title: "Team",
};

export default function TeamPage() {
  return (
    <Suspense>
      <TeamPageClient />
    </Suspense>
  );
}
