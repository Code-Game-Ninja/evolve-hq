"use client";

import { useChatStore } from "@/lib/stores/chat-store";
import { Hash, MessageSquare, Plus, Search } from "lucide-react";
import { useEffect } from "react";
import { motion } from "framer-motion";

export function ChatSidebar() {
  const { channels, activeChannelId, setActiveChannel } = useChatStore();

  const publicChannels = channels.filter(c => c.type === "public" || c.type === "private");
  const dms = channels.filter(c => c.type === "dm");

  // Helper for initials
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="w-72 flex-shrink-0 flex flex-col bg-white/[0.02] backdrop-blur-3xl border-r border-white/5 h-full z-10">
      <div className="h-14 px-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <h2 className="font-bold text-lg tracking-tight text-white/90">Messages</h2>
        <button className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-all active:scale-95 group">
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      <div className="px-4 py-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search conversations..." 
            className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:bg-white/[0.05] transition-all"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-8 custom-scrollbar">
        {/* Channels */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-3">
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.15em]">Channels</span>
            <div className="h-[1px] flex-1 bg-white/[0.03] ml-4" />
          </div>
          <div className="space-y-0.5">
            {publicChannels.length === 0 ? (
              <div className="text-[11px] text-white/20 italic px-3 py-2 text-center">No channels yet</div>
            ) : (
              publicChannels.map(channel => {
                const isActive = activeChannelId === channel._id;
                return (
                  <button
                    key={channel._id}
                    onClick={() => setActiveChannel(channel._id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-300 group relative overflow-hidden ${
                      isActive
                        ? "bg-primary/10 text-primary font-semibold shadow-[0_4px_15px_rgba(232,127,36,0.1)]"
                        : "text-white/40 hover:bg-white/[0.03] hover:text-white/80"
                    }`}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="active-channel"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(232,127,36,0.5)]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                    <Hash className={`w-4 h-4 transition-colors ${isActive ? 'text-primary' : 'text-white/20 group-hover:text-white/40'}`} />
                    <span className="truncate tracking-tight">{channel.name || "Unnamed"}</span>
                    {channel.hasUnread && !isActive && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(232,127,36,0.8)] animate-pulse" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Direct Messages */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-3">
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.15em]">Direct Messages</span>
            <div className="h-[1px] flex-1 bg-white/[0.03] ml-4" />
          </div>
          <div className="space-y-0.5">
            {dms.length === 0 ? (
              <div className="text-[11px] text-white/20 italic px-3 py-2 text-center">No messages</div>
            ) : (
              dms.map(channel => {
                const isActive = activeChannelId === channel._id;
                return (
                  <button
                    key={channel._id}
                    onClick={() => setActiveChannel(channel._id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-300 group relative overflow-hidden ${
                      isActive
                        ? "bg-primary/10 text-primary font-semibold shadow-[0_4px_15px_rgba(232,127,36,0.1)]"
                        : "text-white/40 hover:bg-white/[0.03] hover:text-white/80"
                    }`}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="active-dm"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(232,127,36,0.5)]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                    <div className="relative shrink-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${
                        isActive 
                          ? 'bg-primary/20 border-primary/40 text-primary' 
                          : 'bg-white/5 border-white/10 text-white/40 group-hover:border-white/20 group-hover:bg-white/10'
                      }`}>
                        {getInitials(channel.name || "User")}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#0B1120] rounded-full flex items-center justify-center p-[1px]">
                        <div className="w-full h-full bg-green-500 rounded-full" />
                      </div>
                    </div>
                    <span className="truncate tracking-tight">{channel.name || "User"}</span>
                    {channel.hasUnread && !isActive && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(232,127,36,0.8)] animate-pulse" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
