// Leads Client Component — Orchestrates the CRM leads pipeline
"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { TrendingUp, Plus, Search, Filter, Download, LayoutGrid, List as ListIcon, RefreshCw } from "lucide-react";
import { LeadBoard } from "../lead-board";
import { NewLeadDialog } from "../new-lead-dialog";
import { EditLeadDialog } from "../edit-lead-dialog";
import { type Lead, type LeadStatus, type LeadPriority, formatCurrency } from "../lead-data";
import { useToast } from "@/app/(workspace)/tasks/toast";
import { ToastProvider } from "@/app/(workspace)/tasks/toast";

export function LeadsClient({ initialData }: { initialData?: Lead[] }) {
  return (
    <ToastProvider>
      <LeadsClientInner initialData={initialData} />
    </ToastProvider>
  );
}

function LeadsClientInner({ initialData }: { initialData?: Lead[] }) {
  const { toast } = useToast();
  
  // State
  const [leads, setLeads] = useState<Lead[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [search, setSearch] = useState("");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [initialStatus, setInitialStatus] = useState<LeadStatus>("new");

  // Fetch Leads
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      toast("Failed to load leads pipeline");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!initialData) {
      fetchLeads();
    }
  }, [fetchLeads, initialData]);

  // Actions
  const handleStatusChange = useCallback(async (id: string, newStatus: LeadStatus) => {
    const originalLeads = [...leads];
    setLeads(prev => prev.map(l => l._id === id ? { ...l, status: newStatus } : l));
    
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast(`Lead status updated to ${newStatus}`);
    } catch (err) {
      setLeads(originalLeads);
      toast("Failed to update lead status");
    }
  }, [leads, toast]);

  const handleCreateLead = useCallback(async (data: Omit<Lead, "_id" | "createdAt" | "tags">) => {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      toast("Lead created successfully");
      fetchLeads();
    } catch (err) {
      toast("Failed to create lead");
    }
  }, [fetchLeads, toast]);

  const handleUpdateLead = useCallback(async (id: string, updates: Partial<Lead>) => {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast("Lead updated");
      fetchLeads();
    } catch (err) {
      toast("Failed to update lead");
    }
  }, [fetchLeads, toast]);

  const handleDeleteLead = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast("Lead removed from pipeline");
      fetchLeads();
    } catch (err) {
      toast("Failed to delete lead");
    }
  }, [fetchLeads, toast]);

  // Derived Stats
  const stats = useMemo(() => {
    const total = leads.length;
    const value = leads.reduce((sum, l) => sum + l.value, 0);
    const wonCount = leads.filter(l => l.status === "won").length;
    return { total, value, wonCount };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    if (!search) return leads;
    const q = search.toLowerCase();
    return leads.filter(l => 
      l.name.toLowerCase().includes(q) || 
      l.company?.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q)
    );
  }, [leads, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-5 w-5 text-[#f3350c]" />
            <h1 className="text-2xl font-bold text-[#1a1a1a]">Leads Pipeline</h1>
          </div>
          <p className="text-sm text-[#999]">Manage your sales funnel and conversion stages</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchLeads}
            className="h-11 w-11 flex items-center justify-center rounded-2xl border border-[#dddddd] bg-white hover:bg-[#f1efed] transition-colors"
          >
            <RefreshCw className={`h-4 w-4 text-[#666] ${loading ? "animate-spin" : ""}`} />
          </button>
          <button 
            onClick={() => { setInitialStatus("new"); setIsNewDialogOpen(true); }}
            className="flex items-center gap-2 bg-[#0a0a0a] text-white px-5 py-3 rounded-2xl text-sm font-bold hover:bg-[#222] transition-all shadow-lg shadow-black/10"
          >
            <Plus className="h-4 w-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Stats Quick Look */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Pipeline Value", value: formatCurrency(stats.value), color: "#f3350c" },
          { label: "Active Leads", value: stats.total, color: "#1a1a1a" },
          { label: "Won Deals", value: stats.wonCount, color: "#12b76a" },
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
            placeholder="Search by name, company or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-2xl border border-[#dddddd] bg-white/50 backdrop-blur-md focus:bg-white focus:border-[#f3350c] focus:outline-none transition-all text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex bg-[#f1efed]/80 rounded-2xl p-1 border border-[#dddddd]/50 backdrop-blur-sm">
            <button className="h-9 px-4 rounded-xl bg-white shadow-sm flex items-center gap-2 text-xs font-bold text-[#1a1a1a]">
              <LayoutGrid className="h-3.5 w-3.5" />
              Kanban
            </button>
            <button className="h-9 px-4 rounded-xl flex items-center gap-2 text-xs font-bold text-[#666] hover:text-[#1a1a1a] transition-colors">
              <ListIcon className="h-3.5 w-3.5" />
              List
            </button>
          </div>
          <button className="h-11 px-4 flex items-center gap-2 rounded-2xl border border-[#dddddd] bg-white/50 text-xs font-bold text-[#666] hover:bg-[#f1efed] transition-all">
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      {loading && leads.length === 0 ? (
        <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="min-w-[280px] h-[500px] rounded-[28px] border border-[#dddddd] bg-[#f1efed]/20 animate-pulse" />
          ))}
        </div>
      ) : (
        <LeadBoard 
          leads={filteredLeads} 
          onStatusChange={handleStatusChange}
          onEditLead={setEditingLead}
          onNewLead={(st) => { setInitialStatus(st || "new"); setIsNewDialogOpen(true); }}
        />
      )}

      {/* Dialogs */}
      <NewLeadDialog 
        open={isNewDialogOpen}
        onClose={() => setIsNewDialogOpen(false)}
        onSubmit={handleCreateLead}
        initialStatus={initialStatus}
      />

      <EditLeadDialog
        lead={editingLead}
        open={editingLead !== null}
        onClose={() => setEditingLead(null)}
        onUpdate={handleUpdateLead}
        onDelete={handleDeleteLead}
      />
    </div>
  );
}
