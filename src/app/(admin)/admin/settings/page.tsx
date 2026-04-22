// Admin Personal Settings — profile, account, appearance, notifications, privacy
import { Suspense } from "react";
import { Metadata } from "next";
import { SettingsClient } from "@/app/(workspace)/settings/settings-client";

export const metadata: Metadata = { title: "Personal Settings" };

export default function AdminSettingsPage() {
  return (
    <Suspense>
      <SettingsClient basePath="/settings" pageTitle="Personal Settings" />
    </Suspense>
  );
}
