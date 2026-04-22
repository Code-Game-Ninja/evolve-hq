"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Building2, 
  ExternalLink,
  Download,
  Trash2,
  Edit,
  History,
  Tag as TagIcon
} from "lucide-react";
import { useToast, ToastProvider } from "@/app/(workspace)/tasks/toast";
import { type Lead, type LeadStatus, leadStatusColors, formatCurrency } from "../lead-data";
import { EditLeadDialog } from "../edit-lead-dialog";
import { NewLeadDialog } from "../new-lead-dialog";
import { format } from "date-fns";

export function ClientsClient() {
  return (
    <ToastProvider>
      <ClientsClientInner />
    </ToastProvider>
  );
}

function ClientsClientInner() {
  const { toast } = useToast();
  
  // State
  const [clients, setClients] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Lead | null>(null);

  // Fetch Clients
  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setClients(data);
    } catch (err) {
      toast("Failed to load client directory");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Actions
  const handleUpdateClient = async (id: string, updates: Partial<Lead>) => {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast("Client updated");
      fetchClients();
    } catch (err) {
      toast("Failed to update client");
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast("Client removed");
      fetchClients();
    } catch (err) {
      toast("Failed to delete client");
    }
  };

  const handleCreateClient = async (data: Omit<Lead, "_id" | "createdAt" | "tags">) => {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      toast("Client added successfully");
      fetchClients();
    } catch (err) {
      toast("Failed to add client");
    }
  };

  // Filtering
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.company?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [clients, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-5 w-5 text-[#f3350c]" />
            <h1 className="text-2xl font-bold text-[#1a1a1a]">Client Directory</h1>
          </div>
          <p className="text-sm text-[#999]">Manage your global list of clients, partners, and prospects</p>
        </div>
        
        <button 
          onClick={() => setIsNewDialogOpen(true)}
          className="flex items-center gap-2 bg-[#0a0a0a] text-white px-5 py-3 rounded-2xl text-sm font-bold hover:bg-[#222] transition-all shadow-lg shadow-black/10 self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 py-2">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto flex-1">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#999]" />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-2xl border border-[#dddddd] bg-white/50 backdrop-blur-md focus:bg-white focus:border-[#f3350c] focus:outline-none transition-all text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-12 px-4 rounded-2xl border border-[#dddddd] bg-white/50 backdrop-blur-md text-sm focus:outline-none min-w-[140px]"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
              <option value="won">Won (Client)</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>

        <button className="h-11 px-4 flex items-center gap-2 rounded-2xl border border-[#dddddd] bg-white/50 text-xs font-bold text-[#666] hover:bg-[#f1efed] transition-all w-full sm:w-auto justify-center">
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {/* Table Container */}
      <div className="rounded-[32px] border border-[#dddddd] bg-white/40 backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#dddddd]/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#999]">Client</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#999]">Company</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#999]">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#999]">Value</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#999]">Added</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#999]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dddddd]/30">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8">
                      <div className="h-10 bg-black/5 rounded-2xl w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-12 w-12 text-[#dddddd]" />
                      <p className="text-sm font-medium text-[#999]">No clients found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr 
                    key={client._id}
                    className="group hover:bg-[#f1efed]/30 transition-colors cursor-pointer"
                    onClick={() => setEditingClient(client)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#f3350c]/10 flex items-center justify-center text-[#f3350c] font-bold text-sm">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1a1a1a]">{client.name}</p>
                          <p className="text-xs text-[#999]">{client.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-[#666]">
                        <Building2 className="h-3.5 w-3.5" />
                        {client.company || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span 
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                        style={{ 
                          backgroundColor: `${leadStatusColors[client.status].dot}15`, 
                          color: leadStatusColors[client.status].dot 
                        }}
                      >
                        {leadStatusColors[client.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-[#1a1a1a]">
                        {formatCurrency(client.value)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-[#999]">
                        {format(new Date(client.createdAt), "MMM d, yyyy")}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="h-8 w-8 rounded-lg hover:bg-black/5 flex items-center justify-center transition-colors">
                        <MoreHorizontal className="h-4 w-4 text-[#999]" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialogs */}
      <NewLeadDialog 
        open={isNewDialogOpen}
        onClose={() => setIsNewDialogOpen(false)}
        onSubmit={handleCreateClient}
      />

      <EditLeadDialog
        lead={editingClient}
        open={editingClient !== null}
        onClose={() => setEditingClient(null)}
        onUpdate={handleUpdateClient}
        onDelete={handleDeleteClient}
      />
    </div>
  );
}
