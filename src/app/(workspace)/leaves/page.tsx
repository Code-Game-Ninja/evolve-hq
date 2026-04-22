// My Leaves page
import type { Metadata } from "next";
import { LeavesClient } from "./leaves-client";

export const metadata: Metadata = {
  title: "My Leaves",
};

export default function LeavesPage() {
  return <LeavesClient />;
}
