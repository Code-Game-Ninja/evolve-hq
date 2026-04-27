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

interface ClientsClientProps {
  initialData?: Lead[];
}

export function ClientsClient({ initialData }: ClientsClientProps) {
  return (
    <ToastProvider>
      <ClientsClientInner initialData={initialData} />
    </ToastProvider>
  );
}

function ClientsClientInner({ initialData }: ClientsClientProps) {
  const { toast } = useToast();
  
  // State
  const [clients, setClients] = useState<Lead[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Lead | null>(null);

  // Fetch Clients
  const fetchClients = useCallback(async () => {
    if (!initialData) setLoading(true);
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
  }, [toast, initialData]);

  useEffect(() => {
    if (initialData && clients.length > 0) return;
    fetchClients();
  }, [fetchClients, initialData, clients.length]);

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
            <h1 className="text-2xl font-bold" style={{ color: "#ffffff" }}>Client Directory</h1>
          </div>
          <p className="text-sm" style={{ color: "#a0a0a0" }}>Manage your global list of clients, partners, and prospects</p>
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#a0a0a0" }} />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-2xl border backdrop-blur-md focus:outline-none transition-all text-sm"
              style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(26,26,26,0.6)", color: "#ffffff" }}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-12 px-4 rounded-2xl border backdrop-blur-md text-sm focus:outline-none min-w-[140px]"
              style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(26,26,26,0.6)", color: "#a0a0a0" }}
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

        <button className="h-11 px-4 flex items-center gap-2 rounded-2xl border text-xs font-bold transition-all w-full sm:w-auto justify-center" style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(26,26,26,0.6)", color: "#a0a0a0" }}>
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {/* Table Container */}
      <div className="rounded-[32px] border backdrop-blur-xl overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(26,26,26,0.6)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: "#a0a0a0" }}>Client</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: "#a0a0a0" }}>Company</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: "#a0a0a0" }}>Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: "#a0a0a0" }}>Value</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: "#a0a0a0" }}>Added</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: "#a0a0a0" }}></th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
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
                      <Users className="h-12 w-12" style={{ color: "rgba(255,255,255,0.2)" }} />
                      <p className="text-sm font-medium" style={{ color: "#a0a0a0" }}>No clients found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr 
                    key={client._id}
                    className="group transition-colors cursor-pointer hover:bg-white/5"
                    onClick={() => setEditingClient(client)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: "rgba(243,53,12,0.1)", color: "#f3350c" }}>
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: "#ffffff" }}>{client.name}</p>
                          <p className="text-xs" style={{ color: "#a0a0a0" }}>{client.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm" style={{ color: "#a0a0a0" }}>
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
                      <p className="text-sm font-bold" style={{ color: "#ffffff" }}>
                        {formatCurrency(client.value)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs" style={{ color: "#a0a0a0" }}>
                        {format(new Date(client.createdAt), "MMM d, yyyy")}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors">
                        <MoreHorizontal className="h-4 w-4" style={{ color: "#a0a0a0" }} />
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
