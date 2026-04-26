"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ChatSidebar } from "./components/chat-sidebar";
import { useChatStore } from "@/lib/stores/chat-store";
import { Loader2, MessageSquare } from "lucide-react";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const setChannels = useChatStore(state => state.setChannels);
  const activeChannelId = useChatStore(state => state.activeChannelId);
  const [loading, setLoading] = useState(true);
  // Mobile: sidebar visible by default when no channel selected
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
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
  }, [status, setChannels]);

  // On mobile: auto-hide sidebar when a channel is selected
  useEffect(() => {
    if (activeChannelId) setSidebarOpen(false);
  }, [activeChannelId]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-140px)] w-full items-center justify-center rounded-2xl border border-white/5 bg-white/5 backdrop-blur-xl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100svh-140px)] w-full rounded-2xl overflow-hidden border border-white/10 bg-glass-bg backdrop-blur-xl shadow-2xl relative">
      {/* Sidebar — full screen on mobile when open, fixed width on desktop */}
      <div className={`
        absolute inset-0 z-20 md:relative md:z-auto md:flex
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        md:w-72 md:flex-shrink-0
      `}>
        <ChatSidebar onChannelSelect={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className={`
        flex-1 flex flex-col relative border-l border-white/5 overflow-hidden
        ${sidebarOpen ? "hidden md:flex" : "flex"}
      `}>
        {/* Mobile back button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/[0.02] text-white/50 hover:text-white text-sm font-medium transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span>All Channels</span>
        </button>
        {children}
      </div>
    </div>
  );
}
