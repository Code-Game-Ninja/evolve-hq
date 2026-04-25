"use client";

import { ChatMain } from "./components/chat-main";
import { ChatThread } from "./components/chat-thread";
import { useChatStore } from "@/lib/stores/chat-store";
import { AnimatePresence } from "framer-motion";

export default function ChatPage() {
  const activeThreadMessageId = useChatStore(state => state.activeThreadMessageId);

  return (
    <div className="flex-1 flex overflow-hidden">
      <ChatMain />
      <AnimatePresence>
        {activeThreadMessageId && <ChatThread />}
      </AnimatePresence>
    </div>
  );
}
