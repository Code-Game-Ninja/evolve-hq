"use client";

import { useChatStore } from "@/lib/stores/chat-store";
import { Hash, Plus, Search, MessageSquare, Lock, Globe, Trash2, X, ChevronDown, Users, User } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

interface TeamMember {
  id: string;
  name: string;
  image?: string;
  role: string;
}

// Who can create channels
const CAN_CREATE = ["superadmin", "admin", "manager"];

export function ChatSidebar({ onChannelSelect }: { onChannelSelect?: () => void }) {
  const { data: session } = useSession();
  const channels = useChatStore(state => state.channels);
  const setChannels = useChatStore(state => state.setChannels);
  const activeChannelId = useChatStore(state => state.activeChannelId);
  const setActiveChannel = useChatStore(state => state.setActiveChannel);

  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDMModal, setShowDMModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const role = session?.user?.role || "";
  const canCreate = CAN_CREATE.includes(role);
  const canDelete = role === "superadmin";

  const publicChannels = channels.filter(c =>
    (c.type === "public" || c.type === "private") &&
    (!search || (c.name || "").toLowerCase().includes(search.toLowerCase()))
  );
  const dms = channels.filter(c =>
    c.type === "dm" &&
    (!search || (c.name || "").toLowerCase().includes(search.toLowerCase()))
  );

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const handleDeleteChannel = useCallback(async (channelId: string) => {
    try {
      const res = await fetch(`/api/chat/channels?id=${channelId}`, { method: "DELETE" });
      if (res.ok) {
        setChannels(channels.filter(c => (c as any)._id !== channelId));
        if (activeChannelId === channelId) setActiveChannel(null);
      }
    } catch (err) {
      console.error("Failed to delete channel", err);
    }
    setDeleteTarget(null);
  }, [channels, activeChannelId, setChannels, setActiveChannel]);

  return (
    <div className="w-72 flex-shrink-0 flex flex-col bg-white/[0.02] backdrop-blur-3xl border-r border-white/5 h-full z-10">
      {/* Header */}
      <div className="h-14 px-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <h2 className="font-bold text-base tracking-tight text-white/90">Messages</h2>
        <div className="flex items-center gap-1">
          {/* DM button — all users */}
          <button
            onClick={() => setShowDMModal(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
            title="New Direct Message"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          {/* Create channel — admin/manager/superadmin only */}
          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
              title="New Channel"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:bg-white/[0.05] transition-all"
          />
        </div>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-5 custom-scrollbar">
        {/* Channels section */}
        <div>
          <div className="flex items-center gap-2 px-2 mb-1">
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.15em]">Channels</span>
            <div className="h-[1px] flex-1 bg-white/[0.04]" />
            {canCreate && (
              <button onClick={() => setShowCreateModal(true)} className="text-white/20 hover:text-white/60 transition-colors">
                <Plus className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-0.5">
            {publicChannels.length === 0 ? (
              <p className="text-[11px] text-white/20 italic px-3 py-2 text-center">
                {canCreate ? "No channels yet — create one" : "No channels yet"}
              </p>
            ) : (
              publicChannels.map(channel => {
                const ch = channel as any;
                const isActive = activeChannelId === ch._id;
                return (
                  <div key={ch._id} className="group relative flex items-center">
                    <button
                      onClick={() => { setActiveChannel(ch._id); onChannelSelect?.(); }}
                      className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-white/40 hover:bg-white/[0.04] hover:text-white/80"
                      }`}
                    >
                      {isActive && (
                        <motion.div layoutId="active-channel"
                          className="absolute left-0 top-1 bottom-1 w-0.5 bg-primary rounded-full"
                        />
                      )}
                      {ch.type === "private"
                        ? <Lock className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-primary" : "text-white/20"}`} />
                        : <Hash className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-primary" : "text-white/20"}`} />
                      }
                      <span className="truncate">{ch.name || "Unnamed"}</span>
                      {ch.hasUnread && !isActive && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                      )}
                    </button>
                    {/* Delete — superadmin only */}
                    {canDelete && (
                      <button
                        onClick={() => setDeleteTarget({ id: ch._id, name: ch.name || "this channel" })}
                        className="opacity-0 group-hover:opacity-100 p-1.5 mr-1 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                        title="Delete channel"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* DMs section */}
        <div>
          <div className="flex items-center gap-2 px-2 mb-1">
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.15em]">Direct Messages</span>
            <div className="h-[1px] flex-1 bg-white/[0.04]" />
            <button onClick={() => setShowDMModal(true)} className="text-white/20 hover:text-white/60 transition-colors">
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-0.5">
            {dms.length === 0 ? (
              <p className="text-[11px] text-white/20 italic px-3 py-2 text-center">No messages yet</p>
            ) : (
              dms.map(channel => {
                const ch = channel as any;
                const isActive = activeChannelId === ch._id;
                return (
                  <div key={ch._id} className="group relative flex items-center">
                    <button
                      onClick={() => { setActiveChannel(ch._id); onChannelSelect?.(); }}
                      className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-white/40 hover:bg-white/[0.04] hover:text-white/80"
                      }`}
                    >
                      {isActive && (
                        <motion.div layoutId="active-dm"
                          className="absolute left-0 top-1 bottom-1 w-0.5 bg-primary rounded-full"
                        />
                      )}
                      <div className="relative shrink-0">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold border ${
                          isActive ? "bg-primary/20 border-primary/40 text-primary" : "bg-white/5 border-white/10 text-white/40"
                        }`}>
                          {getInitials(ch.name || "?")}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#0B1120] rounded-full p-[1.5px]">
                          <div className="w-full h-full bg-green-500 rounded-full" />
                        </div>
                      </div>
                      <span className="truncate">{ch.name || "User"}</span>
                      {ch.hasUnread && !isActive && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                      )}
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => setDeleteTarget({ id: ch._id, name: ch.name || "this DM" })}
                        className="opacity-0 group-hover:opacity-100 p-1.5 mr-1 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateChannelModal
            onClose={() => setShowCreateModal(false)}
            onCreated={(ch) => {
              setChannels([ch, ...channels]);
              setActiveChannel((ch as any)._id);
              setShowCreateModal(false);
            }}
          />
        )}
        {showDMModal && (
          <StartDMModal
            currentUserId={session?.user?.id || ""}
            onClose={() => setShowDMModal(false)}
            onCreated={(ch) => {
              const exists = channels.find(c => (c as any)._id === (ch as any)._id);
              if (!exists) setChannels([ch, ...channels]);
              setActiveChannel((ch as any)._id);
              setShowDMModal(false);
            }}
          />
        )}
        {deleteTarget && (
          <DeleteConfirmModal
            name={deleteTarget.name}
            onClose={() => setDeleteTarget(null)}
            onConfirm={() => handleDeleteChannel(deleteTarget.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Create Channel Modal ──────────────────────────────────────────────────────
function CreateChannelModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (ch: any) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"public" | "private">("public");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [allUsers, setAllUsers] = useState<TeamMember[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/team")
      .then(r => r.json())
      .then(data => setAllUsers((data.members || []).map((m: any) => ({
        id: m.id, name: m.name, image: m.image, role: m.role
      }))))
      .catch(() => {});
  }, []);

  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) &&
    !memberIds.includes(u.id)
  );

  const addMember = (u: TeamMember) => {
    setMemberIds(prev => [...prev, u.id]);
    setMembers(prev => [...prev, u]);
    setUserSearch("");
  };

  const removeMember = (id: string) => {
    setMemberIds(prev => prev.filter(m => m !== id));
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Channel name is required"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/chat/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), type, memberIds })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      const ch = await res.json();
      onCreated(ch);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <ModalCard title="New Channel" icon={<Hash className="w-4 h-4 text-primary" />} onClose={onClose}>
        {/* Type toggle */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
          {(["public", "private"] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                type === t ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"
              }`}
            >
              {t === "public" ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <ModalInput label="Channel Name" placeholder="e.g. design-team" value={name} onChange={setName} />
        <ModalInput label="Description (optional)" placeholder="What's this channel about?" value={description} onChange={setDescription} />

        {/* Member picker */}
        <div>
          <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider block mb-1.5">Add Members</label>
          {members.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {members.map(m => (
                <span key={m.id} className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                  {m.name}
                  <button onClick={() => removeMember(m.id)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
            <input
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              placeholder="Search team members..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-primary/40"
            />
          </div>
          {userSearch && filteredUsers.length > 0 && (
            <div className="mt-1 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden max-h-36 overflow-y-auto">
              {filteredUsers.slice(0, 6).map(u => (
                <button key={u.id} onClick={() => addMember(u)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                    {u.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{u.name}</p>
                    <p className="text-[10px] text-white/30 capitalize">{u.role}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <ModalActions onClose={onClose} onSubmit={handleSubmit} loading={loading} submitLabel="Create Channel" />
      </ModalCard>
    </Overlay>
  );
}

// ── Start DM Modal ────────────────────────────────────────────────────────────
function StartDMModal({ currentUserId, onClose, onCreated }: {
  currentUserId: string;
  onClose: () => void;
  onCreated: (ch: any) => void;
}) {
  const [allUsers, setAllUsers] = useState<TeamMember[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/team")
      .then(r => r.json())
      .then(data => setAllUsers(
        (data.members || [])
          .filter((m: any) => m.id !== currentUserId)
          .map((m: any) => ({ id: m.id, name: m.name, image: m.image, role: m.role }))
      ))
      .catch(() => {});
  }, [currentUserId]);

  const filtered = allUsers.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

  const startDM = async (user: TeamMember) => {
    setStarting(user.id);
    try {
      const res = await fetch("/api/chat/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Don't pass name — API resolves it to the other person's name
        body: JSON.stringify({ type: "dm", memberIds: [user.id] })
      });
      if (!res.ok) throw new Error("Failed");
      const ch = await res.json();
      onCreated(ch);
    } catch (e) {
      console.error(e);
    } finally {
      setStarting(null);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <ModalCard title="New Direct Message" icon={<MessageSquare className="w-4 h-4 text-primary" />} onClose={onClose}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search team members..."
            autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/40"
          />
        </div>

        <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
          {filtered.length === 0 ? (
            <p className="text-xs text-white/30 text-center py-6">No team members found</p>
          ) : (
            filtered.map(u => (
              <button key={u.id} onClick={() => startDM(u)} disabled={starting === u.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{u.name}</p>
                  <p className="text-[11px] text-white/30 capitalize">{u.role}</p>
                </div>
                {starting === u.id ? (
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />
                ) : (
                  <MessageSquare className="w-4 h-4 text-white/20 shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      </ModalCard>
    </Overlay>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteConfirmModal({ name, onClose, onConfirm }: {
  name: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Overlay onClose={onClose}>
      <ModalCard title="Delete Channel" icon={<Trash2 className="w-4 h-4 text-red-400" />} onClose={onClose}>
        <p className="text-sm text-white/60 leading-relaxed">
          Are you sure you want to delete <span className="text-white font-semibold">#{name}</span>? This will permanently remove all messages and cannot be undone.
        </p>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors border border-red-500/20"
          >
            Delete
          </button>
        </div>
      </ModalCard>
    </Overlay>
  );
}

// ── Shared UI primitives ──────────────────────────────────────────────────────
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </motion.div>
  );
}

function ModalCard({ title, icon, onClose, children }: {
  title: string;
  icon: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-bold text-white">{title}</h3>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </motion.div>
  );
}

function ModalInput({ label, placeholder, value, onChange }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider block mb-1.5">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-colors"
      />
    </div>
  );
}

function ModalActions({ onClose, onSubmit, loading, submitLabel }: {
  onClose: () => void; onSubmit: () => void; loading: boolean; submitLabel: string;
}) {
  return (
    <div className="flex gap-2 pt-1">
      <button onClick={onClose}
        className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
      >
        Cancel
      </button>
      <button onClick={onSubmit} disabled={loading}
        className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creating...
          </span>
        ) : submitLabel}
      </button>
    </div>
  );
}
