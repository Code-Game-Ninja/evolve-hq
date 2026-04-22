// Admin CMS page
import { Suspense } from "react";
import { Metadata } from "next";
import { CMSPageClient } from "./cms-page-client";

export const metadata: Metadata = {
  title: "CMS",
};

export default function CMSPage() {
  return (
    <Suspense>
      <CMSPageClient />
    </Suspense>
  );
}
