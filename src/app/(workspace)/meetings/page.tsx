// My Meetings Page
import { Metadata } from "next";
import { MeetingsClient } from "./meetings-client";

export const metadata: Metadata = {
  title: "My Meetings",
};

export default function MeetingsPage() {
  return <MeetingsClient />;
}
