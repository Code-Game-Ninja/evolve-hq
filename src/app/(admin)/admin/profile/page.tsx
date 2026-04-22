// Admin Profile — reuses workspace profile component inside admin layout
import { Metadata } from "next";
import { ProfileClient } from "@/app/(workspace)/profile/profile-client";

export const metadata: Metadata = { title: "My Profile" };

export default function AdminProfilePage() {
  return (
    <ProfileClient
      settingsPath="/settings"
      tasksPath="/tasks"
    />
  );
}
