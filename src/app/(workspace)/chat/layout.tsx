"use client";

import { useEffect, useState } from "react";
import { ChatSidebar } from "./components/chat-sidebar";
import { useChatStore } from "@/lib/stores/chat-store";
import { Loader2 } from "lucide-react";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setChannels } = useChatStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChannels() {
      try {
        const res = await fetch("/api/chat/channels");
        if (res.ok) {
          const data = await res.json();
          setChannels(data);
        }
      } catch (err) {
        console.error("Failed to load channels", err);
      } finally {
        setLoading(false);
      }
    }
    loadChannels();
  }, [setChannels]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-140px)] w-full items-center justify-center rounded-2xl border border-white/5 bg-white/5 backdrop-blur-xl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] w-full rounded-2xl overflow-hidden border border-white/10 bg-glass-bg backdrop-blur-xl shadow-2xl relative">
      <ChatSidebar />
      <div className="flex-1 flex flex-col relative border-l border-white/5 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
