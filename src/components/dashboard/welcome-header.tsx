// Welcome header with greeting
"use client";

function getGreeting(): string {
  const hour = parseInt(new Date().toLocaleString("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

interface WelcomeHeaderProps {
  name: string;
}

export function WelcomeHeader({ name }: WelcomeHeaderProps) {
  return (
    <h1
      className="text-3xl sm:text-[2.5rem] font-medium leading-tight"
      style={{ color: "#FFFFFF" }}
    >
      {getGreeting()}, {name}
    </h1>
  );
}
