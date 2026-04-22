import { AttendanceClient } from "./attendance-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Attendance | Evolve HQ",
  description: "Track your work hours and attendance history.",
};

export default function AttendancePage() {
  return <AttendanceClient />;
}
