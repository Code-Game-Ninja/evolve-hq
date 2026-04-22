// Admin HR page
import { Suspense } from "react";
import { Metadata } from "next";
import { HRPageClient } from "./hr-page-client";

export const metadata: Metadata = {
  title: "HR",
};

export default function HRPage() {
  return (
    <Suspense>
      <HRPageClient />
    </Suspense>
  );
}
