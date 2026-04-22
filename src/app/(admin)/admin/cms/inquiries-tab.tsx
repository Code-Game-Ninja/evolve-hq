// Inquiries tab — Contact Messages + Newsletter Subscribers sub-tabs
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  MailWarning,
  MailCheck,
  Users,
  X,
  Phone,
  Building2,
  Download,
  Reply,
  Calendar,
  Bell,
  Send,
  Archive,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { GlassPillTabs } from "@/components/ui/glass-pill-tabs";
import {
  type Contact,
  type ContactStatus,
  type Subscriber,
  contactStatusConfig,
  subscriberStatusConfig,
  sourceColors,
  contactStatusOptions,
  subscriberStatusOptions,
  subscriberSourceOptions,
  sortOptions,
} from "./cms-data";
import { useToast } from "./toast";
import {
  StatCard,
  StatusBadge,
  FilterDropdown,
  SearchInput,
  MoreMenu,
  EmptyState,
} from "./cms-shared";

// Sub-tabs
const subTabs = [
  { label: "Contact Messages", value: "contacts" },
  { label: "Newsletter Subscribers", value: "subscribers" },
];

export function InquiriesTab() {
  const [subTab, setSubTab] = useState("contacts");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [subscribersLoading, setSubscribersLoading] = useState(true);

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    setContactsLoading(true);
    try {
      const res = await fetch("/api/admin/inquiries?page=1&limit=50");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setContacts(data.items ?? []);
    } catch {
      // keep existing
    } finally {
      setContactsLoading(false);
    }
  }, []);

  // Fetch subscribers
  const fetchSubscribers = useCallback(async () => {
    setSubscribersLoading(true);
    try {
      const res = await fetch("/api/admin/subscribers?page=1&limit=100");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSubscribers(data.items ?? []);
    } catch {
      // keep existing
    } finally {
      setSubscribersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
    fetchSubscribers();
  }, [fetchContacts, fetchSubscribers]);

  // Stats
  const stats = useMemo(() => {
    const totalMessages = contacts.length;
    const newCount = contacts.filter((c) => c.status === "new").length;
    const replied = contacts.filter((c) => c.status === "replied").length;
    const totalSubs = subscribers.length;
    return { totalMessages, newCount, replied, totalSubs };
  }, [contacts, subscribers]);

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Mail} iconColor="#f3350c" iconBg="rgba(243,53,12,0.1)" label="Total Messages" value={stats.totalMessages} description="All inquiries" index={0} />
        <StatCard icon={MailWarning} iconColor="#f59e0b" iconBg="rgba(245,158,11,0.1)" label="New (Unread)" value={stats.newCount} description="Needs response" index={1} />
        <StatCard icon={MailCheck} iconColor="#22c55e" iconBg="rgba(34,197,94,0.1)" label="Replied" value={stats.replied} description="Responded" index={2} />
        <StatCard icon={Users} iconColor="#8b5cf6" iconBg="rgba(139,92,246,0.1)" label="Subscribers" value={stats.totalSubs} description="Newsletter" index={3} />
      </div>

      {/* Sub-tabs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <GlassPillTabs
          tabs={subTabs}
          activeValue={subTab}
          onChange={setSubTab}
          layoutId="cms-inquiry-subtabs"
          variant="subtle"
          size="sm"
        />
      </motion.div>

      {/* Sub-tab content */}
      <motion.div
        key={subTab}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {subTab === "contacts" ? (
          <ContactsList contacts={contacts} setContacts={setContacts} loading={contactsLoading} onRefetch={fetchContacts} />
        ) : (
          <SubscribersList subscribers={subscribers} setSubscribers={setSubscribers} loading={subscribersLoading} onRefetch={fetchSubscribers} />
        )}
      </motion.div>
    </div>
  );
}

// Contacts list
function ContactsList({
  contacts,
  setContacts,
  loading,
  onRefetch,
}: {
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  loading: boolean;
  onRefetch: () => void;
}) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const filtered = useMemo(() => {
    const result = contacts.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.subject && c.subject.toLowerCase().includes(q)) ||
        c.message.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
    result.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sort === "newest" ? db - da : da - db;
    });
    return result;
  }, [contacts, search, statusFilter, sort]);

  async function updateStatus(id: string, status: ContactStatus) {
    const original = contacts.find((c) => c.id === id);
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
    } catch {
      if (original) setContacts((prev) => prev.map((c) => (c.id === id ? original : c)));
      toast("Failed to update status", "error");
    }
  }

  async function deleteContact(id: string) {
    const snapshot = [...contacts];
    setContacts((prev) => prev.filter((c) => c.id !== id));
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("Inquiry deleted");
    } catch {
      setContacts(snapshot);
      toast("Failed to delete", "error");
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Kolkata" });
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-[20px] border border-[#dddddd] h-24 animate-pulse" style={{ backgroundColor: "rgba(241,239,237,0.45)" }} />
        ))}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={Mail}
        title="No inquiries yet"
        description="Contact form submissions from evolve.agency will appear here"
      />
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search contacts..." />
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <FilterDropdown label="Status" value={statusFilter} options={contactStatusOptions} onChange={setStatusFilter} />
          </div>
          <div className="hidden sm:block">
            <FilterDropdown label="Sort" value={sort} options={sortOptions} onChange={setSort} />
          </div>
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer backdrop-blur-lg border border-[#dddddd] hover:border-[#aaaaaa]"
            style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
            title="Export CSV"
          >
            <Download className="h-4 w-4" style={{ color: "#707070" }} />
          </button>
        </div>
      </div>

      {/* Contact cards */}
      {filtered.length === 0 ? (
        <div
          className="rounded-[24px] border border-[#dddddd] backdrop-blur-lg p-8 text-center"
          style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
        >
          <p className="text-sm" style={{ color: "#737373" }}>No contacts match your filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((contact, i) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              index={i}
              onView={() => setSelectedContact(contact)}
              onUpdateStatus={updateStatus}
              onDelete={() => deleteContact(contact.id)}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      {/* Detail sheet */}
      <AnimatePresence>
        {selectedContact && (
          <ContactDetailSheet
            contact={selectedContact}
            onClose={() => setSelectedContact(null)}
            onUpdateStatus={(status) => {
              updateStatus(selectedContact.id, status);
              setSelectedContact((prev) => (prev ? { ...prev, status } : null));
            }}
            formatDate={formatDate}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Contact card
function ContactCard({
  contact,
  index,
  onView,
  onUpdateStatus,
  onDelete,
  formatDate,
}: {
  contact: Contact;
  index: number;
  onView: () => void;
  onUpdateStatus: (id: string, status: ContactStatus) => void;
  onDelete: () => void;
  formatDate: (iso: string) => string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const statusCfg = contactStatusConfig[contact.status];
  const isNew = contact.status === "new";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-[20px] backdrop-blur-lg border border-[#dddddd] p-4 sm:px-5 transition-all duration-200 hover:border-[#bbbbbb] hover:shadow-sm"
      style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusCfg.dot }} />
          <span
            className="text-sm"
            style={{ color: "#1a1a1a", fontWeight: isNew ? 700 : 600 }}
          >
            {contact.name}
          </span>
        </div>
        <span className="text-xs shrink-0" style={{ color: "#b6b6b6" }}>
          {formatDate(contact.createdAt)}
        </span>
      </div>

      {/* Contact info */}
      <p className="text-xs mt-1" style={{ color: "#707070" }}>
        {contact.email}
        {contact.phone && ` · ${contact.phone}`}
        {contact.company && ` · ${contact.company}`}
      </p>

      {/* Subject */}
      {contact.subject && (
        <p className="text-[13px] font-medium mt-1" style={{ color: "#4d4d4d" }}>
          Subject: {contact.subject}
        </p>
      )}

      {/* Message preview */}
      <p className="text-[13px] italic line-clamp-1 mt-0.5" style={{ color: "#737373" }}>
        &ldquo;{contact.message}&rdquo;
      </p>

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <StatusBadge {...statusCfg} />
          {contact.notes && (
            <span className="text-xs italic" style={{ color: "#707070" }}>
              Note: &ldquo;{contact.notes}&rdquo;
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onView}
            className="px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer"
            style={{ backgroundColor: "rgba(0,0,0,0.04)", color: "#4d4d4d" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)")}
          >
            View
          </button>
          <MoreMenu
            open={menuOpen}
            onToggle={() => setMenuOpen(!menuOpen)}
            items={[
              ...(contact.status !== "read"
                ? [{ label: "Mark as Read", onClick: () => onUpdateStatus(contact.id, "read") }]
                : []),
              ...(contact.status !== "replied"
                ? [{ label: "Mark as Replied", onClick: () => onUpdateStatus(contact.id, "replied") }]
                : []),
              ...(contact.status !== "archived"
                ? [{ label: "Archive", onClick: () => onUpdateStatus(contact.id, "archived") }]
                : []),
              { label: "Delete", onClick: onDelete, destructive: true },
            ]}
          />
        </div>
      </div>
    </motion.div>
  );
}

// Contact detail side sheet
function ContactDetailSheet({
  contact,
  onClose,
  onUpdateStatus,
  formatDate,
}: {
  contact: Contact;
  onClose: () => void;
  onUpdateStatus: (status: ContactStatus) => void;
  formatDate: (iso: string) => string;
}) {
  const [notes, setNotes] = useState(contact.notes || "");
  const [replyMode, setReplyMode] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);
  const { toast } = useToast();

  // Save admin notes to API
  async function handleSaveNote() {
    try {
      const res = await fetch(`/api/admin/inquiries/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error();
      toast("Note saved");
    } catch {
      toast("Failed to save note", "error");
    }
  }
  const [now] = useState(() => Date.now());
  const statusCfg = contactStatusConfig[contact.status];

  // Initials for avatar
  const initials = contact.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Close on ESC
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Copy email
  function handleCopyEmail() {
    navigator.clipboard.writeText(contact.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  }

  // Handle reply send
  function handleSendReply() {
    if (!replyText.trim()) return;
    // In production, this would call an API to send email
    onUpdateStatus("replied");
    setReplyMode(false);
    setReplyText("");
  }

  // Time ago helper
  function timeAgo(iso: string) {
    const diff = now - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80]"
        style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 right-0 bottom-0 z-[80] w-full sm:w-[440px] overflow-y-auto"
        style={{ backgroundColor: "#f8f7f3", borderLeft: "1px solid #dddddd" }}
      >
        {/* Hero header */}
        <div className="px-6 pt-6 pb-5">
          {/* Close button */}
          <div className="flex items-center justify-end gap-2 mb-4">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors"
              style={{ backgroundColor: "rgba(0,0,0,0.04)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)")}
            >
              <X className="h-4 w-4" style={{ color: "#707070" }} />
            </button>
          </div>

          {/* Avatar + Name + Status */}
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
              style={{ backgroundColor: "#f3350c", color: "#ffffff" }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold truncate" style={{ color: "#1a1a1a" }}>
                {contact.name}
              </h2>
              {contact.company && (
                <p className="text-sm font-medium mt-0.5" style={{ color: "#707070" }}>
                  {contact.company}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge {...statusCfg} />
                <span className="text-xs" style={{ color: "#b6b6b6" }}>
                  {timeAgo(contact.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px mx-6" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />

        {/* Contact info rows */}
        <div className="px-6 py-4 space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 shrink-0" style={{ color: "#b6b6b6" }} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase font-medium tracking-wider" style={{ color: "#737373" }}>Email</p>
              <p className="text-sm font-medium truncate" style={{ color: "#1a1a1a" }}>{contact.email}</p>
            </div>
            <button
              onClick={handleCopyEmail}
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors"
              style={{ backgroundColor: "rgba(0,0,0,0.04)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)")}
              title="Copy email"
            >
              {copiedEmail
                ? <Check className="h-3.5 w-3.5" style={{ color: "#22c55e" }} />
                : <Copy className="h-3.5 w-3.5" style={{ color: "#707070" }} />
              }
            </button>
          </div>
          {contact.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0" style={{ color: "#b6b6b6" }} />
              <div>
                <p className="text-[11px] uppercase font-medium tracking-wider" style={{ color: "#737373" }}>Phone</p>
                <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>{contact.phone}</p>
              </div>
            </div>
          )}
          {contact.company && (
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 shrink-0" style={{ color: "#b6b6b6" }} />
              <div>
                <p className="text-[11px] uppercase font-medium tracking-wider" style={{ color: "#737373" }}>Company</p>
                <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>{contact.company}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 shrink-0" style={{ color: "#b6b6b6" }} />
            <div>
              <p className="text-[11px] uppercase font-medium tracking-wider" style={{ color: "#737373" }}>Received</p>
              <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>{formatDate(contact.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Bell className="h-4 w-4 shrink-0" style={{ color: "#b6b6b6" }} />
            <div>
              <p className="text-[11px] uppercase font-medium tracking-wider" style={{ color: "#737373" }}>Newsletter</p>
              <p className="text-sm font-medium" style={{ color: contact.subscribe ? "#22c55e" : "#999" }}>
                {contact.subscribe ? "Subscribed" : "Not subscribed"}
              </p>
            </div>
          </div>
        </div>

        <div className="h-px mx-6" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />

        {/* Subject + Message */}
        <div className="px-6 py-4">
          {contact.subject && (
            <div className="mb-3">
              <p className="text-[11px] uppercase font-semibold tracking-wider mb-1" style={{ color: "#737373" }}>
                Subject
              </p>
              <p className="text-sm font-bold" style={{ color: "#1a1a1a" }}>
                {contact.subject}
              </p>
            </div>
          )}
          <p className="text-[11px] uppercase font-semibold tracking-wider mb-2" style={{ color: "#737373" }}>
            Message
          </p>
          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
          >
            <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "#4d4d4d" }}>
              {contact.message}
            </p>
          </div>
        </div>

        <div className="h-px mx-6" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />

        {/* Reply section */}
        <div className="px-6 py-4">
          <AnimatePresence mode="wait">
            {replyMode ? (
              <motion.div
                key="reply-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-[11px] uppercase font-semibold tracking-wider mb-2" style={{ color: "#737373" }}>
                  Reply to {contact.name.split(" ")[0]}
                </p>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  placeholder={`Hi ${contact.name.split(" ")[0]}, thanks for reaching out...`}
                  autoFocus
                  className="w-full rounded-2xl text-[13px] outline-none transition-all border border-[#dddddd] focus:border-[#0a0a0a] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)] p-3"
                  style={{ backgroundColor: "#ffffff", color: "#1a1a1a", resize: "vertical" }}
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold cursor-pointer transition-all"
                    style={{
                      backgroundColor: replyText.trim() ? "#f3350c" : "rgba(0,0,0,0.06)",
                      color: replyText.trim() ? "#ffffff" : "#b6b6b6",
                    }}
                    onMouseEnter={(e) => {
                      if (replyText.trim()) e.currentTarget.style.backgroundColor = "#d42d0a";
                    }}
                    onMouseLeave={(e) => {
                      if (replyText.trim()) e.currentTarget.style.backgroundColor = "#f3350c";
                    }}
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send Reply
                  </button>
                  <button
                    onClick={() => { setReplyMode(false); setReplyText(""); }}
                    className="px-4 py-2 rounded-full text-[13px] font-medium cursor-pointer transition-colors"
                    style={{ color: "#707070" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="reply-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setReplyMode(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-semibold cursor-pointer transition-all border border-dashed"
                style={{ borderColor: "#dddddd", color: "#4d4d4d" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#f3350c";
                  e.currentTarget.style.color = "#f3350c";
                  e.currentTarget.style.backgroundColor = "rgba(243,53,12,0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#dddddd";
                  e.currentTarget.style.color = "#4d4d4d";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Reply className="h-4 w-4" />
                Reply to {contact.name.split(" ")[0]}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div className="h-px mx-6" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />

        {/* Status */}
        <div className="px-6 py-4">
          <p className="text-[11px] uppercase font-semibold tracking-wider mb-2" style={{ color: "#737373" }}>
            Status
          </p>
          <select
            value={contact.status}
            onChange={(e) => onUpdateStatus(e.target.value as ContactStatus)}
            className="h-10 px-4 rounded-full text-[13px] font-medium outline-none transition-all border border-[#dddddd] focus:border-[#0a0a0a] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)] cursor-pointer"
            style={{
              backgroundColor: "rgba(241,239,237,0.45)",
              color: "#1a1a1a",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23707070' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 14px center",
              paddingRight: "36px",
            }}
          >
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="h-px mx-6" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />

        {/* Admin Notes */}
        <div className="px-6 py-4">
          <p className="text-[11px] uppercase font-semibold tracking-wider mb-2" style={{ color: "#737373" }}>
            Admin Notes
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add internal notes about this inquiry..."
            className="w-full rounded-2xl text-[13px] font-medium outline-none transition-all border border-[#dddddd] focus:border-[#0a0a0a] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)] p-3"
            style={{ backgroundColor: "rgba(241,239,237,0.45)", color: "#1a1a1a", resize: "vertical" }}
          />
          <button
            onClick={handleSaveNote}
            className="mt-2 px-4 py-1.5 rounded-full text-[12px] font-semibold cursor-pointer transition-colors"
            style={{ backgroundColor: "#0a0a0a", color: "#ffffff" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#333333")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0a0a0a")}
          >
            Save Note
          </button>
        </div>

        {/* Footer action bar */}
        <div
          className="sticky bottom-0 px-6 py-4 flex items-center gap-2"
          style={{ backgroundColor: "#f8f7f3", borderTop: "1px solid rgba(0,0,0,0.06)" }}
        >
          {/* Quick reply via mailto */}
          <a
            href={`mailto:${contact.email}?subject=Re: ${contact.subject || "Your inquiry"}`}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-semibold cursor-pointer transition-colors"
            style={{ backgroundColor: "#f3350c", color: "#ffffff" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#d42d0a")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f3350c")}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Reply via Email
          </a>
          {contact.status !== "archived" && (
            <button
              onClick={() => onUpdateStatus("archived")}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-medium border border-[#dddddd] cursor-pointer transition-colors"
              style={{ color: "#707070" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <Archive className="h-3.5 w-3.5" />
              Archive
            </button>
          )}
          {contact.status !== "replied" && (
            <button
              onClick={() => onUpdateStatus("replied")}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-semibold cursor-pointer transition-colors"
              style={{ backgroundColor: "#22c55e", color: "#ffffff" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#16a34a")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#22c55e")}
            >
              <Check className="h-3.5 w-3.5" />
              Replied
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}

// Subscribers list
function SubscribersList({
  subscribers,
  setSubscribers,
  loading,
  onRefetch,
}: {
  subscribers: Subscriber[];
  setSubscribers: React.Dispatch<React.SetStateAction<Subscriber[]>>;
  loading: boolean;
  onRefetch: () => void;
}) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  const filtered = useMemo(() => {
    const result = subscribers.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        s.email.toLowerCase().includes(q) ||
        (s.name && s.name.toLowerCase().includes(q));
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      const matchSource = sourceFilter === "all" || s.source === sourceFilter;
      return matchSearch && matchStatus && matchSource;
    });
    result.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sort === "newest" ? db - da : da - db;
    });
    return result;
  }, [subscribers, search, statusFilter, sourceFilter, sort]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", { month: "short", day: "numeric", timeZone: "Asia/Kolkata" });
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-[24px] border border-[#dddddd] h-14 animate-pulse" style={{ backgroundColor: "rgba(241,239,237,0.45)" }} />
        ))}
      </div>
    );
  }

  if (subscribers.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No subscribers yet"
        description="Newsletter subscribers from evolve.agency will appear here"
      />
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search subscribers..." />
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <FilterDropdown label="Status" value={statusFilter} options={subscriberStatusOptions} onChange={setStatusFilter} />
          </div>
          <div className="hidden sm:block">
            <FilterDropdown label="Source" value={sourceFilter} options={subscriberSourceOptions} onChange={setSourceFilter} />
          </div>
          <div className="hidden lg:block">
            <FilterDropdown label="Sort" value={sort} options={sortOptions} onChange={setSort} />
          </div>
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer backdrop-blur-lg border border-[#dddddd] hover:border-[#aaaaaa]"
            style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
            title="Export CSV"
          >
            <Download className="h-4 w-4" style={{ color: "#707070" }} />
          </button>
        </div>
      </div>

      {/* Subscriber rows */}
      {filtered.length === 0 ? (
        <div
          className="rounded-[24px] border border-[#dddddd] backdrop-blur-lg p-8 text-center"
          style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
        >
          <p className="text-sm" style={{ color: "#737373" }}>No subscribers match your filters</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative overflow-hidden backdrop-blur-lg border border-[#dddddd]"
          style={{ backgroundColor: "rgba(241,239,237,0.45)", borderRadius: "24px" }}
        >
          <div className="p-5 sm:p-6">
          {filtered.map((sub, i) => {
            const statusCfg = subscriberStatusConfig[sub.status];
            const srcCfg = sourceColors[sub.source];

            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex items-center gap-3 py-3 transition-colors"
                style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                {/* Email + name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#1a1a1a" }}>
                    {sub.email}
                  </p>
                  {(sub.name || sub.phone) && (
                    <p className="text-xs truncate" style={{ color: "#707070" }}>
                      {sub.name}
                      {sub.name && sub.phone && " · "}
                      {sub.phone}
                    </p>
                  )}
                </div>

                {/* Status badge */}
                <StatusBadge {...statusCfg} />

                {/* Source badge (hidden on mobile) */}
                <span
                  className="hidden sm:inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full shrink-0"
                  style={{ backgroundColor: srcCfg.bg, color: srcCfg.text }}
                >
                  {srcCfg.label}
                </span>

                {/* Date (hidden on mobile) */}
                <span className="hidden sm:block text-xs shrink-0" style={{ color: "#b6b6b6" }}>
                  {formatDate(sub.createdAt)}
                </span>

                {/* Actions */}
                <SubscriberActions sub={sub} setSubscribers={setSubscribers} toast={toast} />
              </motion.div>
            );
          })}
          </div>
        </motion.div>
      )}
    </>
  );
}

// Subscriber row actions
function SubscriberActions({
  sub,
  setSubscribers,
  toast,
}: {
  sub: Subscriber;
  setSubscribers: React.Dispatch<React.SetStateAction<Subscriber[]>>;
  toast: (msg: string, type?: "success" | "error" | "info") => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleToggleStatus() {
    const nextStatus = sub.status === "active" ? "unsubscribed" : "active";
    setSubscribers((prev) => prev.map((s) => (s.id === sub.id ? { ...s, status: nextStatus } : s)));
    try {
      const res = await fetch(`/api/admin/subscribers/${sub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setSubscribers((prev) => prev.map((s) => (s.id === sub.id ? { ...s, status: sub.status } : s)));
      toast("Failed to update subscriber", "error");
    }
  }

  async function handleDelete() {
    setSubscribers((prev) => prev.filter((s) => s.id !== sub.id));
    try {
      const res = await fetch(`/api/admin/subscribers/${sub.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("Subscriber deleted");
    } catch {
      toast("Failed to delete subscriber", "error");
    }
  }

  return (
    <MoreMenu
      open={menuOpen}
      onToggle={() => setMenuOpen(!menuOpen)}
      items={[
        sub.status === "active"
          ? { label: "Unsubscribe", onClick: handleToggleStatus }
          : { label: "Resubscribe", onClick: handleToggleStatus },
        { label: "Delete", onClick: handleDelete, destructive: true },
      ]}
    />
  );
}
