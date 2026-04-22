"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { 
  Mail, 
  Search, 
  Filter, 
  RefreshCw, 
  MoreHorizontal, 
  UserPlus, 
  CheckCircle2, 
  Archive, 
  Trash2,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Clock
} from "lucide-react";
import { useToast } from "@/app/(workspace)/tasks/toast";
import { ToastProvider } from "@/app/(workspace)/tasks/toast";
import { formatDistanceToNow } from "date-fns";
import { NewLeadDialog } from "../new-lead-dialog";
import { motion, AnimatePresence } from "framer-motion";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  createdAt: string;
  notes?: string;
}

export function InquiriesClient() {
  return (
    <ToastProvider>
      <InquiriesClientInner />
    </ToastProvider>
  );
}

function InquiriesClientInner() {
  const { toast } = useToast();
  
  // State
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);

  // Fetch Inquiries
  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/inquiries?limit=100");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setInquiries(data.items || []);
    } catch (err) {
      toast("Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  // Actions
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
      
      setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status: newStatus as any } : inq));
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
      toast(`Inquiry marked as ${newStatus}`);
    } catch (err) {
      toast("Failed to update inquiry");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inquiry?")) return;
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      
      setInquiries(prev => prev.filter(inq => inq.id !== id));
      if (selectedInquiry?.id === id) setSelectedInquiry(null);
      toast("Inquiry deleted");
    } catch (err) {
      toast("Failed to delete inquiry");
    }
  };

  const handleConvertToLead = (inq: Inquiry) => {
    setSelectedInquiry(inq);
    setIsLeadDialogOpen(true);
  };

  const handleLeadSubmit = async (data: any) => {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create lead");
      
      // Also mark inquiry as replied/read if it was new
      if (selectedInquiry && selectedInquiry.status === "new") {
        await handleUpdateStatus(selectedInquiry.id, "read");
      }
      
      toast("Lead created from inquiry");
      setIsLeadDialogOpen(false);
    } catch (err) {
      toast("Failed to create lead");
    }
  };

  // Derived
  const filteredInquiries = useMemo(() => {
    return inquiries.filter(inq => {
      const matchesSearch = 
        inq.name.toLowerCase().includes(search.toLowerCase()) ||
        inq.email.toLowerCase().includes(search.toLowerCase()) ||
        inq.subject?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || inq.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [inquiries, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: inquiries.length,
      new: inquiries.filter(i => i.status === "new").length,
      replied: inquiries.filter(i => i.status === "replied").length,
    };
  }, [inquiries]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Mail className="h-5 w-5 text-[#f3350c]" />
            <h1 className="text-2xl font-bold text-[#1a1a1a]">Inquiries</h1>
          </div>
          <p className="text-sm text-[#999]">Manage contact form submissions from your website</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchInquiries}
            className="h-11 w-11 flex items-center justify-center rounded-2xl border border-[#dddddd] bg-white hover:bg-[#f1efed] transition-colors"
          >
            <RefreshCw className={`h-4 w-4 text-[#666] ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Inquiries", value: stats.total, color: "#1a1a1a" },
          { label: "New Submissions", value: stats.new, color: "#f3350c" },
          { label: "Replied", value: stats.replied, color: "#12b76a" },
        ].map((s) => (
          <div 
            key={s.label}
            className="rounded-[24px] border border-[#dddddd] p-5 backdrop-blur-md"
            style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-[#999] mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-[#1a1a1a]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#999]" />
          <input
            type="text"
            placeholder="Search inquiries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-2xl border border-[#dddddd] bg-white/50 backdrop-blur-md focus:bg-white focus:border-[#f3350c] focus:outline-none transition-all text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-4 rounded-2xl border border-[#dddddd] bg-white/50 text-xs font-bold text-[#666] outline-none focus:border-[#f3350c] transition-all"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Content Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* List */}
        <div className="lg:col-span-5 space-y-3">
          {loading && inquiries.length === 0 ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-3xl border border-[#dddddd] bg-white/20 animate-pulse" />
            ))
          ) : filteredInquiries.length === 0 ? (
            <div className="py-20 text-center rounded-3xl border border-dashed border-[#dddddd] bg-white/10">
              <Mail className="h-10 w-10 text-[#cccccc] mx-auto mb-3" />
              <p className="text-sm text-[#999]">No inquiries found</p>
            </div>
          ) : (
            filteredInquiries.map((inq) => (
              <button
                key={inq.id}
                onClick={() => setSelectedInquiry(inq)}
                className={`w-full text-left p-4 rounded-3xl border transition-all duration-200 group ${
                  selectedInquiry?.id === inq.id 
                    ? "border-[#f3350c] bg-white shadow-lg shadow-black/5" 
                    : "border-[#dddddd]/50 bg-white/40 hover:bg-white hover:border-[#bbbbbb]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${
                    inq.status === 'new' ? 'text-[#f3350c]' : 'text-[#999]'
                  }`}>
                    {inq.status}
                  </span>
                  <span className="text-[10px] text-[#bbb]">
                    {formatDistanceToNow(new Date(inq.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <h3 className="font-bold text-[#1a1a1a] truncate">{inq.name}</h3>
                <p className="text-xs text-[#666] line-clamp-1 mt-0.5">{inq.subject || "No Subject"}</p>
              </button>
            ))
          )}
        </div>

        {/* Detail View */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {selectedInquiry ? (
              <motion.div
                key={selectedInquiry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-[32px] border border-[#dddddd] bg-white p-8 sticky top-6 shadow-xl shadow-black/[0.02]"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-[#f1efed] flex items-center justify-center text-xl font-bold text-[#1a1a1a]">
                      {selectedInquiry.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#1a1a1a]">{selectedInquiry.name}</h2>
                      <div className="flex items-center gap-3 mt-1 text-xs text-[#999]">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {selectedInquiry.email}</span>
                        {selectedInquiry.phone && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {selectedInquiry.phone}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleConvertToLead(selectedInquiry)}
                      className="h-10 px-4 rounded-xl bg-[#f3350c]/10 text-[#f3350c] text-xs font-bold flex items-center gap-2 hover:bg-[#f3350c]/20 transition-colors"
                    >
                      <UserPlus className="h-4 w-4" />
                      Convert to Lead
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(selectedInquiry.id, "archived")}
                      className="h-10 w-10 flex items-center justify-center rounded-xl border border-[#dddddd] text-[#666] hover:bg-[#f1efed] transition-colors"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(selectedInquiry.id)}
                      className="h-10 w-10 flex items-center justify-center rounded-xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#bbb] mb-2">Subject</h4>
                    <p className="text-base font-bold text-[#1a1a1a]">{selectedInquiry.subject || "No Subject provided"}</p>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#bbb] mb-2">Message</h4>
                    <div className="bg-[#f9f8f7] rounded-2xl p-5 text-sm text-[#444] leading-relaxed whitespace-pre-wrap min-h-[120px]">
                      {selectedInquiry.message}
                    </div>
                  </div>

                  {selectedInquiry.company && (
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#bbb] mb-2">Company</h4>
                      <p className="text-sm font-medium text-[#1a1a1a]">{selectedInquiry.company}</p>
                    </div>
                  )}

                  <div className="pt-6 border-t border-[#f1efed] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {selectedInquiry.status !== 'replied' && (
                        <button 
                          onClick={() => handleUpdateStatus(selectedInquiry.id, "replied")}
                          className="flex items-center gap-2 text-xs font-bold text-[#12b76a] hover:underline"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Mark as Replied
                        </button>
                      )}
                      {selectedInquiry.status === 'new' && (
                        <button 
                          onClick={() => handleUpdateStatus(selectedInquiry.id, "read")}
                          className="flex items-center gap-2 text-xs font-bold text-[#666] hover:underline"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Mark as Read
                        </button>
                      )}
                    </div>
                    
                    <a 
                      href={`mailto:${selectedInquiry.email}?subject=Re: ${selectedInquiry.subject || 'Inquiry from Evolve'}`}
                      className="flex items-center gap-2 bg-[#1a1a1a] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#333] transition-all"
                    >
                      Reply via Email
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-[400px] rounded-[32px] border border-dashed border-[#dddddd] bg-[#f1efed]/20 flex flex-col items-center justify-center text-[#bbb]">
                <Mail className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-sm font-medium">Select an inquiry to view details</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Convert Dialog */}
      {selectedInquiry && (
        <NewLeadDialog 
          open={isLeadDialogOpen}
          onClose={() => setIsLeadDialogOpen(false)}
          onSubmit={handleLeadSubmit}
          initialStatus="new"
          // We can't pass initial values to NewLeadDialog currently, 
          // let's just use the selectedInquiry in the submit handler
        />
      )}
    </div>
  );
}
