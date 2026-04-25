"use client";

import { useChatStore } from "@/lib/stores/chat-store";
import { Send, Smile, Paperclip, X, MessageCircle, Hash, MoreHorizontal, Edit2, Trash, Pin, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker, { Theme } from "emoji-picker-react";

export function ChatThread() {
  const { data: session } = useSession();

  // Select primitives and stable references only — never inline .find()/.filter() in selectors
  const activeChannelId = useChatStore(state => state.activeChannelId);
  const activeThreadMessageId = useChatStore(state => state.activeThreadMessageId);
  const messages = useChatStore(state => state.messages);
  const threads = useChatStore(state => state.threads);
  const addThreadMessage = useChatStore(state => state.addThreadMessage);
  const setThreadMessages = useChatStore(state => state.setThreadMessages);
  const updateMessage = useChatStore(state => state.updateMessage);
  const deleteMessage = useChatStore(state => state.deleteMessage);
  const toggleReaction = useChatStore(state => state.toggleReaction);
  const togglePin = useChatStore(state => state.togglePin);
  const setActiveThread = useChatStore(state => state.setActiveThread);

  // Derive outside selectors — safe, no new reference on every render
  const parentMessage = activeChannelId && activeThreadMessageId
    ? (messages[activeChannelId] || []).find(m => m._id === activeThreadMessageId) ?? null
    : null;
  const activeMessages = activeThreadMessageId ? (threads[activeThreadMessageId] || []) : [];

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const [showMessageEmojiPicker, setShowMessageEmojiPicker] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const commonEmojis = ["👍", "❤️", "🔥", "😂", "😮", "😢", "🙏", "✅"];

  useEffect(() => {
    if (activeThreadMessageId && activeChannelId) {
      fetch(`/api/chat/messages?channelId=${activeChannelId}&threadParentId=${activeThreadMessageId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setThreadMessages(activeThreadMessageId, data);
          }
        })
        .catch(console.error);
    }
  }, [activeThreadMessageId, activeChannelId, setThreadMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages]);

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || !activeChannelId || !activeThreadMessageId) return;
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
          threadParentId: activeThreadMessageId,
          attachments: currentAttachments
        })
      });

      if (res.ok) {
        const newMessage = await res.json();
        addThreadMessage(newMessage);
      }
    } catch (err) {
      console.error("Failed to send thread reply", err);
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
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setAttachments(prev => [...prev, {
          url: data.url,
          name: data.name,
          type: data.type,
          size: data.size
        }]);
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
        updateMessage(activeChannelId, msgId, { content: editInput, isEdited: true });
        setEditingMessageId(null);
      }
    } catch (err) {
      console.error("Failed to edit", err);
    }
  };

  const handleDelete = async (msgId: string) => {
    if (!activeChannelId) return;
    if (!confirm("Are you sure you want to delete this reply?")) return;
    try {
      const res = await fetch(`/api/chat/messages?messageId=${msgId}`, { method: "DELETE" });
      if (res.ok) {
        deleteMessage(activeChannelId, msgId);
      }
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!activeChannelId || !session?.user?.id) return;
    
    toggleReaction(activeChannelId, messageId, emoji, session.user.id);
    
    try {
      await fetch("/api/chat/messages/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, emoji })
      });
    } catch (err) {
      console.error("Failed to toggle reaction", err);
      toggleReaction(activeChannelId, messageId, emoji, session.user.id); // Revert
    }
    setShowMessageEmojiPicker(null);
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
      togglePin(activeChannelId, msgId); // Revert
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (!activeThreadMessageId) return null;

  return (
    <motion.div 
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="w-[380px] flex flex-col h-full bg-black/40 backdrop-blur-3xl border-l border-white/10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] relative z-20"
    >
      <div className="h-14 border-b border-white/10 flex items-center justify-between px-5 shrink-0 bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-white/90 text-sm tracking-tight uppercase">Thread</h3>
        </div>
        <button 
          onClick={() => setActiveThread(null)}
          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        {/* Parent Message Section */}
        {parentMessage && (
          <div className="p-5 border-b border-white/5 bg-white/[0.03] relative group">
            <div className="flex gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 shrink-0 overflow-hidden border border-white/10 shadow-lg">
                {parentMessage.senderId?.image ? (
                  <img src={parentMessage.senderId.image} alt={parentMessage.senderId.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                    {getInitials(parentMessage.senderId?.name || "U")}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm text-white/90">{parentMessage.senderId?.name || "User"}</span>
                  <span className="text-[10px] text-white/20 font-medium">
                    {new Date(parentMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {parentMessage.isPinned && (
                    <Pin className="w-2.5 h-2.5 text-primary animate-pulse" />
                  )}
                </div>
                <p className="text-sm text-white/80 mt-1 leading-relaxed break-words whitespace-pre-wrap">{parentMessage.content}</p>
                
                {parentMessage.attachments && parentMessage.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {parentMessage.attachments.map((file: any, i: number) => {
                      const isImage = file.type?.startsWith("image/");
                      return (
                        <a 
                          key={i} 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block max-w-[150px] overflow-hidden rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          {isImage ? (
                            <img src={file.url} alt={file.name} className="w-full h-auto object-cover max-h-[100px]" />
                          ) : (
                            <div className="p-2 flex items-center gap-2">
                              <Paperclip className="w-3 h-3 text-primary" />
                              <span className="text-[10px] truncate">{file.name}</span>
                            </div>
                          )}
                        </a>
                      );
                    })}
                  </div>
                )}
                
                {parentMessage.reactions && parentMessage.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {parentMessage.reactions.map((r) => {
                      const hasReacted = r.users.includes(session?.user?.id);
                      return (
                        <button
                          key={r.emoji}
                          onClick={() => handleToggleReaction(parentMessage._id, r.emoji)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] transition-all border ${
                            hasReacted 
                              ? "bg-primary/20 border-primary/40 text-primary" 
                              : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                          }`}
                        >
                          <span>{r.emoji}</span>
                          <span className="font-bold">{r.users.length}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-[11px] text-white/20 font-bold uppercase tracking-[0.2em] pl-1 relative">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <span className="shrink-0 bg-zinc-900/40 px-3 py-0.5 rounded-full border border-white/5">Replies</span>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          </div>
        )}

        <div className="p-5 space-y-6">
          <AnimatePresence initial={false}>
          {activeMessages.map((msg, index) => {
            const isOwner = session?.user?.id === msg.senderId?._id || session?.user?.id === msg.senderId?.id;
            
            return (
              <motion.div 
                key={msg._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: Math.max(0, (activeMessages.length - index - 1) * 0.05) }}
                className="flex gap-3 group relative"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 shrink-0 overflow-hidden border border-white/10 transition-transform group-hover:scale-105 shadow-md">
                  {msg.senderId?.image ? (
                    <img src={msg.senderId.image} alt={msg.senderId.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-[10px] font-bold">
                      {getInitials(msg.senderId?.name || "U")}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[13px] text-white/90">{msg.senderId?.name || "User"}</span>
                      {msg.isEdited && <span className="text-[9px] text-white/20 font-medium">(edited)</span>}
                      {msg.isPinned && <Pin className="w-2 h-2 text-primary/60" />}
                    </div>
                    <span className="text-[9px] text-white/30 font-medium">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  {editingMessageId === msg._id ? (
                    <div className="mt-1 flex flex-col gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
                      <textarea
                        value={editInput}
                        onChange={e => setEditInput(e.target.value)}
                        className="bg-transparent border-0 text-[13px] text-white resize-none w-full focus:ring-0 p-0"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 text-[10px]">
                        <button onClick={() => setEditingMessageId(null)} className="text-white/40 hover:text-white transition-colors">Cancel</button>
                        <button onClick={() => handleEditSave(msg._id)} className="text-primary font-bold hover:text-primary/80 transition-colors uppercase tracking-wider">Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/[0.04] border border-white/5 rounded-2xl rounded-tl-none p-3 shadow-inner group-hover:bg-white/[0.06] transition-all relative">
                      <p className="text-[13px] text-white/80 leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                      
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {msg.attachments.map((file: any, i: number) => {
                            const isImage = file.type?.startsWith("image/");
                            return (
                              <a 
                                key={i} 
                                href={file.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block max-w-[150px] overflow-hidden rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                              >
                                {isImage ? (
                                  <img src={file.url} alt={file.name} className="w-full h-auto object-cover max-h-[100px]" />
                                ) : (
                                  <div className="p-2 flex items-center gap-2">
                                    <Paperclip className="w-3 h-3 text-primary" />
                                    <span className="text-[10px] truncate">{file.name}</span>
                                  </div>
                                )}
                              </a>
                            );
                          })}
                        </div>
                      )}
                      
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {msg.reactions.map((r) => {
                            const hasReacted = r.users.includes(session?.user?.id);
                            return (
                              <button
                                key={r.emoji}
                                onClick={() => handleToggleReaction(msg._id, r.emoji)}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] transition-all border ${
                                  hasReacted 
                                    ? "bg-primary/20 border-primary/40 text-primary" 
                                    : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                                }`}
                              >
                                <span>{r.emoji}</span>
                                <span className="font-bold">{r.users.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Hover Actions Menu */}
                      <div className="absolute -top-3 -right-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0 z-10">
                        <div className="flex items-center bg-zinc-900 border border-white/10 rounded-lg shadow-2xl p-0.5 scale-90 origin-right">
                          <button 
                            onClick={() => handleToggleReaction(msg._id, "👍")}
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            <span className="text-xs">👍</span>
                          </button>
                          <button 
                            onClick={() => handleToggleReaction(msg._id, "❤️")}
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            <span className="text-xs">❤️</span>
                          </button>
                          <button 
                            onClick={() => setShowMessageEmojiPicker(showMessageEmojiPicker === msg._id ? null : msg._id)}
                            className="p-1 hover:bg-white/10 text-white/40 hover:text-white rounded"
                          >
                            <Smile className="w-3.5 h-3.5" />
                          </button>
                          <div className="w-[1px] h-3 bg-white/10 mx-0.5" />
                          <button 
                            onClick={() => handleTogglePin(msg._id, !!msg.isPinned)}
                            className={`p-1 rounded ${msg.isPinned ? 'text-primary' : 'text-white/40 hover:text-white'}`}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          {isOwner && (
                            <>
                              <button 
                                onClick={() => {
                                  setEditingMessageId(msg._id);
                                  setEditInput(msg.content);
                                }}
                                className="p-1 hover:bg-white/10 text-white/40 hover:text-white rounded"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDelete(msg._id)}
                                className="p-1 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                        
                        <AnimatePresence>
                          {showMessageEmojiPicker === msg._id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="absolute bottom-full right-0 mb-1 p-1 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl flex gap-0.5 z-20"
                            >
                              {commonEmojis.slice(0, 5).map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => handleToggleReaction(msg._id, emoji)}
                                  className="p-1 hover:bg-white/10 rounded text-sm transition-transform hover:scale-125"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
          
          {activeMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 opacity-20">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3 border border-white/10">
                <MessageCircle className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]">No replies yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 shrink-0 bg-white/5 backdrop-blur-3xl border-t border-white/10">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileUpload}
        />

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((file, i) => (
              <div key={i} className="relative bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white/70 flex items-center gap-1.5">
                <Paperclip className="w-2.5 h-2.5 text-primary" />
                <span className="max-w-[80px] truncate">{file.name}</span>
                <button 
                  onClick={() => removeAttachment(i)}
                  className="text-white/30 hover:text-white"
                >
                  <Trash className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 bg-black/40 border border-white/10 rounded-2xl p-2 focus-within:border-primary/40 focus-within:bg-black/60 transition-all shadow-xl">
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 text-white/30 hover:text-white rounded-xl hover:bg-white/5 transition-all shrink-0 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Reply in thread..."
            className="flex-1 bg-transparent border-0 focus:ring-0 resize-none max-h-32 min-h-[40px] text-sm py-2.5 px-2 text-white placeholder:text-white/20 custom-scrollbar leading-relaxed"
            rows={1}
            disabled={loading}
          />
          <div className="flex items-center gap-1 shrink-0 pb-1 pr-1 relative">
            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2 rounded-xl transition-all ${showEmojiPicker ? 'text-primary bg-primary/10' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
            >
              <Smile className="w-4 h-4" />
            </button>
            
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full right-0 mb-4 z-50 shadow-2xl"
                >
                  <EmojiPicker 
                    theme={Theme.DARK}
                    onEmojiClick={(emojiData) => {
                      setInput(prev => prev + emojiData.emoji);
                      setShowEmojiPicker(false);
                    }}
                    width={350}
                    height={450}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="p-2 bg-primary hover:bg-primary/90 text-white rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:grayscale active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
