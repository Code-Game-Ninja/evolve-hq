"use client";

import { useChatStore } from "@/lib/stores/chat-store";
import { Send, Smile, Paperclip, MessageSquare, Edit2, Trash, Hash, Pin, Loader2 } from "lucide-react";
import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { getPusherClient } from "@/lib/pusher";
import { Theme } from "emoji-picker-react";
import { useSound } from "@/lib/hooks/use-sound";
import { useBrowserNotifications } from "@/lib/hooks/use-browser-notifications";

// Lazy-load EmojiPicker — ~500KB, only needed when emoji button is clicked
const EmojiPicker = lazy(() => import("emoji-picker-react"));

export function ChatMain() {
  const activeChannelId = useChatStore(state => state.activeChannelId);
  const channels = useChatStore(state => state.channels);
  const allMessages = useChatStore(state => state.messages);
  const setMessages = useChatStore(state => state.setMessages);
  const addMessage = useChatStore(state => state.addMessage);
  const updateMessage = useChatStore(state => state.updateMessage);
  const deleteMessage = useChatStore(state => state.deleteMessage);
  const markChannelRead = useChatStore(state => state.markChannelRead);
  const setActiveThread = useChatStore(state => state.setActiveThread);
  const togglePin = useChatStore(state => state.togglePin);

  // Derive these outside of selectors — no inline .find()/.filter() in useChatStore calls
  const activeMessages = activeChannelId ? (allMessages[activeChannelId] || []) : [];
  const activeChannel = channels.find(c => c._id === activeChannelId);

  const { data: session } = useSession();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { playMessageSound, playSuccessSound } = useSound();
  const { notifyMessage, requestPermission } = useBrowserNotifications();

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showMainEmojiPicker, setShowMainEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Request browser notification permission
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if (!activeChannelId) return;

    const loadMessages = async () => {
      try {
        // Auto-join public channel if not already a member
        await fetch(`/api/chat/channels/${activeChannelId}/join`, { method: "POST" }).catch(() => {});

        const res = await fetch(`/api/chat/messages?channelId=${activeChannelId}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setMessages(activeChannelId, data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadMessages();

    if (activeChannel?.hasUnread) {
      fetch('/api/chat/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: activeChannelId })
      }).then(() => markChannelRead(activeChannelId)).catch(console.error);
    }

    const pusher = getPusherClient();
    if (pusher) {
      const channelName = `chat_${activeChannelId}`;
      const channel = pusher.subscribe(channelName);

      channel.bind('new-message', (data: any) => {
        const isOwnMessage = data.senderId?._id === session?.user?.id || data.senderId?.id === session?.user?.id;

        if (data.threadParentId) {
          useChatStore.getState().addThreadMessage(data);
        } else {
          useChatStore.getState().addMessage(data);
        }

        // Play sound and show notification for messages from others
        if (!isOwnMessage) {
          playMessageSound();

          // Show browser notification if tab is not visible
          if (document.hidden || document.visibilityState !== "visible") {
            const senderName = data.senderId?.name || "Someone";
            // Get fresh channel name from store to avoid stale closure
            const currentChannel = useChatStore.getState().channels.find(c => c._id === activeChannelId);
            const channelName = currentChannel?.name || "Chat";
            notifyMessage(senderName, data.content, channelName);
          }
        }
      });
      channel.bind('message-updated', (data: any) => {
        useChatStore.getState().updateMessage(activeChannelId, data._id, data);
      });
      channel.bind('message-deleted', (data: any) => {
        useChatStore.getState().deleteMessage(activeChannelId, data.messageId);
      });

      return () => {
        channel.unbind_all();
        pusher.unsubscribe(channelName);
      };
    }
  }, [activeChannelId, session?.user?.id, session?.user?.name, playMessageSound, notifyMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages]);

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || !activeChannelId) return;
    const content = input;
    const currentAttachments = [...attachments];
    setInput("");
    setAttachments([]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: activeChannelId,
          content: content || (currentAttachments.length > 0 ? "Shared a file" : ""),
          attachments: currentAttachments
        })
      });
      if (res.ok) {
        const newMessage = await res.json();
        addMessage(newMessage);
        playSuccessSound();
      }
    } catch (err) {
      console.error("Failed to send", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setAttachments(prev => [...prev, { url: data.url, name: data.name, type: data.type, size: data.size }]);
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditSave = async (msgId: string) => {
    if (!editInput.trim() || !activeChannelId) return;
    try {
      const res = await fetch(`/api/chat/messages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msgId, content: editInput })
      });
      if (res.ok) {
        updateMessage(activeChannelId, msgId, { content: editInput });
        setEditingMessageId(null);
      }
    } catch (err) {
      console.error("Failed to edit", err);
    }
  };

  const handleDelete = async (msgId: string) => {
    if (!activeChannelId) return;
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      const res = await fetch(`/api/chat/messages?messageId=${msgId}`, { method: "DELETE" });
      if (res.ok) {
        deleteMessage(activeChannelId, msgId);
        setActiveThread(null);
      }
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!activeChannelId || !session?.user?.id) return;
    const { toggleReaction } = useChatStore.getState();
    toggleReaction(activeChannelId, messageId, emoji, session.user.id);
    try {
      const res = await fetch("/api/chat/messages/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, emoji })
      });
      if (!res.ok) toggleReaction(activeChannelId, messageId, emoji, session.user.id);
    } catch (err) {
      console.error("Failed to toggle reaction", err);
      toggleReaction(activeChannelId, messageId, emoji, session.user.id);
    }
    setShowEmojiPicker(null);
  };

  const handleTogglePin = async (msgId: string, currentPinned: boolean) => {
    if (!activeChannelId) return;
    togglePin(activeChannelId, msgId);
    try {
      await fetch(`/api/chat/messages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msgId, isPinned: !currentPinned })
      });
    } catch (err) {
      console.error("Failed to pin", err);
      togglePin(activeChannelId, msgId);
    }
  };

  const commonEmojis = ["👍", "❤️", "🔥", "😂", "😮", "😢", "🙏", "✅"];

  if (!activeChannelId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-background/30 h-full">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 opacity-50" />
        </div>
        <p className="text-lg">Select a channel to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-black/10 relative overflow-hidden">
      {/* Channel header */}
      <div className="h-14 border-b border-white/5 flex items-center px-6 shrink-0 bg-white/5 backdrop-blur-md z-10">
        <h3 className="font-semibold text-white/90 flex items-center gap-2">
          {activeChannel?.type !== "dm" ? (
            <Hash className="w-4 h-4 text-primary" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          )}
          {activeChannel?.name || "Chat"}
        </h3>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {activeMessages.length === 0 ? (
          <div className="text-center text-muted-foreground py-10 mt-auto">
            <p>This is the beginning of the chat.</p>
          </div>
        ) : (
          <div className="space-y-6 mt-auto flex flex-col justify-end min-h-full">
            <AnimatePresence initial={false}>
              {activeMessages.map((msg, index) => {
                const isOwner = session?.user?.id === msg.senderId?._id || session?.user?.id === msg.senderId?.id;
                return (
                  <motion.div
                    key={msg._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.max(0, Math.min((activeMessages.length - index - 1) * 0.03, 0.15)) }}
                    className={`flex gap-4 group relative px-2 py-1 rounded-xl transition-colors ${msg.isPinned ? 'bg-primary/[0.03] border border-primary/5' : 'hover:bg-white/[0.02]'}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 shrink-0 overflow-hidden border border-white/10 shadow-lg">
                      {msg.senderId?.image ? (
                        <img src={msg.senderId.image} alt={msg.senderId.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold">
                          {msg.senderId?.name?.charAt(0) || "U"}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-[14px] text-white/90">{msg.senderId?.name || "User"}</span>
                        <span className="text-[10px] text-white/30 font-medium uppercase tracking-tight">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.isPinned && (
                          <div className="flex items-center gap-1 text-[10px] text-primary/60 font-bold uppercase tracking-wider ml-1 animate-pulse">
                            <Pin className="w-2.5 h-2.5" />
                            <span>Pinned</span>
                          </div>
                        )}
                      </div>

                      {editingMessageId === msg._id ? (
                        <div className="mt-1 flex flex-col gap-2">
                          <textarea
                            value={editInput}
                            onChange={e => setEditInput(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-md p-2 text-sm text-white resize-none w-full focus:outline-none focus:ring-1 focus:ring-primary/50"
                            rows={2}
                            autoFocus
                          />
                          <div className="flex gap-2 text-xs">
                            <button onClick={() => setEditingMessageId(null)} className="text-muted-foreground hover:text-white transition-colors">Cancel</button>
                            <button onClick={() => handleEditSave(msg._id)} className="text-primary hover:text-primary/80 font-bold transition-colors">Save</button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[15px] text-white/80 mt-0.5 whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>

                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {msg.attachments.map((file: any, i: number) => {
                                const isImage = file.type?.startsWith("image/");
                                return (
                                  <a key={i} href={file.url} target="_blank" rel="noopener noreferrer"
                                    className="block max-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                                  >
                                    {isImage ? (
                                      <img src={file.url} alt={file.name} className="w-full h-auto object-cover max-h-[150px]" />
                                    ) : (
                                      <div className="p-3 flex items-center gap-2">
                                        <Paperclip className="w-4 h-4 text-primary" />
                                        <span className="text-xs truncate">{file.name}</span>
                                      </div>
                                    )}
                                  </a>
                                );
                              })}
                            </div>
                          )}

                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {msg.reactions.map((r) => {
                                const hasReacted = r.users.includes(session?.user?.id);
                                return (
                                  <button key={r.emoji} onClick={() => handleToggleReaction(msg._id, r.emoji)}
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all border ${hasReacted ? "bg-primary/20 border-primary/40 text-primary" : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:bg-white/10"}`}
                                  >
                                    <span>{r.emoji}</span>
                                    <span className="font-bold">{r.users.length}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {msg.replyCount ? (
                        <button onClick={() => setActiveThread(msg._id)}
                          className="mt-3 text-[11px] font-bold text-primary/80 flex items-center gap-1.5 hover:text-primary transition-colors group/replies"
                        >
                          <div className="flex -space-x-1.5 mr-1">
                            {[...Array(Math.min(msg.replyCount, 3))].map((_, i) => (
                              <div key={i} className="w-4 h-4 rounded-full border border-black bg-primary/20 flex items-center justify-center text-[8px] text-primary">
                                {i === 0 ? "R" : ""}
                              </div>
                            ))}
                          </div>
                          {msg.replyCount} {msg.replyCount === 1 ? "reply" : "replies"}
                          <span className="opacity-0 group-hover/replies:opacity-100 transition-opacity ml-1">View thread</span>
                        </button>
                      ) : null}
                    </div>

                    {/* Hover Actions */}
                    <div className="absolute right-4 top-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0 flex items-center gap-1">
                      <div className="flex items-center bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1">
                        <button onClick={() => handleToggleReaction(msg._id, "👍")} className="p-1.5 hover:bg-white/10 text-white/50 hover:text-white transition-colors rounded-lg" title="Thumbs Up">
                          <span className="text-sm">👍</span>
                        </button>
                        <button onClick={() => handleToggleReaction(msg._id, "❤️")} className="p-1.5 hover:bg-white/10 text-white/50 hover:text-white transition-colors rounded-lg" title="Heart">
                          <span className="text-sm">❤️</span>
                        </button>
                        <button onClick={() => handleToggleReaction(msg._id, "🔥")} className="p-1.5 hover:bg-white/10 text-white/50 hover:text-white transition-colors rounded-lg" title="Fire">
                          <span className="text-sm">🔥</span>
                        </button>

                        <div className="w-[1px] h-4 bg-white/10 mx-1" />

                        <div className="relative">
                          <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg._id ? null : msg._id)}
                            className="p-2 hover:bg-white/10 text-white/50 hover:text-white transition-colors rounded-lg" title="Add reaction"
                          >
                            <Smile className="w-4 h-4" />
                          </button>
                          <AnimatePresence>
                            {showEmojiPicker === msg._id && (
                              <motion.div
                                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                className="absolute bottom-full right-0 mb-2 z-50 shadow-2xl"
                              >
                                <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-1 mb-2 flex gap-0.5">
                                  {commonEmojis.slice(0, 5).map(emoji => (
                                    <button key={emoji} onClick={() => handleToggleReaction(msg._id, emoji)}
                                      className="p-1.5 hover:bg-white/10 rounded-lg text-lg transition-transform hover:scale-125"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                                <Suspense fallback={<div className="w-[300px] h-[400px] bg-zinc-900/95 rounded-xl" />}>
                                  <EmojiPicker theme={Theme.DARK} onEmojiClick={(d) => handleToggleReaction(msg._id, d.emoji)} width={300} height={400} lazyLoadEmojis />
                                </Suspense>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <button onClick={() => setActiveThread(msg._id)} className="p-2 hover:bg-white/10 text-white/50 hover:text-white transition-colors rounded-lg" title="Reply in thread">
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleTogglePin(msg._id, !!msg.isPinned)}
                          className={`p-2 transition-colors rounded-lg ${msg.isPinned ? 'text-primary bg-primary/10' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                          title={msg.isPinned ? "Unpin message" : "Pin message"}
                        >
                          <Pin className="w-4 h-4" />
                        </button>
                        {isOwner && (
                          <>
                            <button onClick={() => { setEditingMessageId(msg._id); setEditInput(msg.content); }}
                              className="p-2 hover:bg-white/10 text-white/50 hover:text-white transition-colors rounded-lg" title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(msg._id)}
                              className="p-2 hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors rounded-lg" title="Delete"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-6 shrink-0 z-10">
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((file, i) => (
              <div key={i} className="bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/70 flex items-center gap-2">
                <Paperclip className="w-3 h-3 text-primary" />
                <span className="max-w-[100px] truncate">{file.name}</span>
                <button onClick={() => removeAttachment(i)} className="ml-1 text-white/30 hover:text-white">
                  <Trash className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-2xl p-2 focus-within:border-primary/40 focus-within:bg-white/[0.08] transition-all shadow-2xl backdrop-blur-xl">
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="p-2.5 text-white/30 hover:text-white rounded-xl hover:bg-white/5 transition-all shrink-0 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={`Message ${activeChannel?.name || "..."}`}
            className="flex-1 bg-transparent border-0 focus:ring-0 resize-none max-h-32 min-h-[44px] text-[15px] py-3 px-2 text-white placeholder:text-white/20 custom-scrollbar leading-relaxed"
            rows={1}
            disabled={loading}
          />
          <div className="flex items-center gap-1 shrink-0 pb-1 pr-1 relative">
            <button onClick={() => setShowMainEmojiPicker(!showMainEmojiPicker)}
              className={`p-2.5 rounded-xl transition-all ${showMainEmojiPicker ? 'text-primary bg-primary/10' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
            >
              <Smile className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {showMainEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full right-0 mb-4 z-50 shadow-2xl"
                >
                  <Suspense fallback={<div className="w-[350px] h-[450px] bg-zinc-900/95 rounded-xl" />}>
                    <EmojiPicker theme={Theme.DARK} onEmojiClick={(d) => { setInput(prev => prev + d.emoji); setShowMainEmojiPicker(false); }} width={350} height={450} />
                  </Suspense>
                </motion.div>
              )}
            </AnimatePresence>
            <button onClick={handleSend} disabled={!input.trim() || loading}
              className="p-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:grayscale active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
