"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  Calendar, 
  ArrowRight, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Archive,
  User,
  Plus,
  X,
  ExternalLink,
  MessageSquare,
  Building,
  Tag,
  Star
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GlassPillTabs } from "@/components/ui/glass-pill-tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Inquiry {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  notes?: string;
  createdAt: string;
}

interface Lead {
  _id: string;
  name: string;
  email: string;
  company?: string;
  status: "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
  priority: "high" | "medium" | "low";
  value: number;
  createdAt: string;
  updatedAt: string;
}

const TABS = [
  { label: "Public Inquiries", value: "inquiries", icon: MessageSquare },
  { label: "Sales Leads", value: "leads", icon: Star },
];

export default function CRMConsoleClient() {
  const [activeTab, setActiveTab] = useState("inquiries");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selection/Detail State
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notes, setNotes] = useState("");
  const [leadNotes, setLeadNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "inquiries") {
        const res = await fetch("/api/admin/crm/inquiries");
        const data = await res.json();
        if (res.ok) setInquiries(data);
      } else {
        const res = await fetch("/api/crm/leads");
        const data = await res.json();
        if (res.ok) setLeads(data);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load CRM data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInquiryStatus = async (id: string, status: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/admin/crm/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        toast.success(`Status updated to ${status}`);
        setInquiries(prev => prev.map(inv => inv._id === id ? { ...inv, status: status as any } : inv));
        if (selectedInquiry?._id === id) {
          setSelectedInquiry(prev => prev ? { ...prev, status: status as any } : null);
        }
      }
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateInquiryNotes = async () => {
    if (!selectedInquiry) return;
    setIsUpdating(true);
    try {
      const res = await fetch("/api/admin/crm/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedInquiry._id, notes }),
      });
      if (res.ok) {
        toast.success("Notes updated");
        setInquiries(prev => prev.map(inv => inv._id === selectedInquiry._id ? { ...inv, notes } : inv));
        setSelectedInquiry(prev => prev ? { ...prev, notes } : null);
      }
    } catch (error) {
      toast.error("Failed to update notes");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inquiry?")) return;
    try {
      const res = await fetch(`/api/admin/crm/inquiries?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Inquiry deleted");
        setInquiries(prev => prev.filter(inv => inv._id !== id));
        if (selectedInquiry?._id === id) setSelectedInquiry(null);
      }
    } catch (error) {
      toast.error("Failed to delete inquiry");
    }
  };

  const promoteToLead = async (inquiry: Inquiry) => {
    try {
      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inquiry.name,
          email: inquiry.email,
          company: inquiry.company,
          phone: inquiry.phone,
          source: "Website Inquiry",
          notes: `Promoted from Inquiry: ${inquiry.subject}\n\nOriginal Message:\n${inquiry.message}`,
          priority: "medium"
        }),
      });
      if (res.ok) {
        toast.success("Inquiry promoted to Sales Lead!");
        handleUpdateInquiryStatus(inquiry._id, "archived");
        setSelectedInquiry(null);
      }
    } catch (error) {
      toast.error("Failed to promote to lead");
    }
  };

  const handleUpdateLead = async (id: string, updates: Partial<Lead>) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/crm/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updatedLead = await res.json();
        setLeads(prev => prev.map(l => l._id === id ? { ...l, ...updates } : l));
        if (selectedLead?._id === id) {
          setSelectedLead(prev => prev ? { ...prev, ...updates } : null);
        }
        toast.success("Lead updated successfully");
      }
    } catch (error) {
      toast.error("Failed to update lead");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/crm/leads/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Lead deleted");
        setLeads(prev => prev.filter(l => l._id !== id));
        if (selectedLead?._id === id) setSelectedLead(null);
      }
    } catch (error) {
      toast.error("Failed to delete lead");
    }
  };

  const filteredInquiries = inquiries.filter(inv => 
    inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new": return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">New</Badge>;
      case "read": return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Read</Badge>;
      case "replied": return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Replied</Badge>;
      case "archived": return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Archived</Badge>;
      // Lead statuses
      case "contacted": return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Contacted</Badge>;
      case "won": return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Won</Badge>;
      case "lost": return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Lost</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">High</Badge>;
      case "medium": return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Medium</Badge>;
      case "low": return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Low</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">CRM Console</h1>
          <p className="text-white/50">Manage public inquiries and track sales opportunities.</p>
        </div>
        <GlassPillTabs 
          tabs={TABS} 
          activeValue={activeTab} 
          onChange={setActiveTab} 
          layoutId="crm-tabs"
        />
      </div>

      <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden">
        <CardHeader className="pb-0 pt-6 px-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input 
                placeholder={`Search ${activeTab}...`}
                className="pl-10 bg-white/5 border-white/10 focus:border-orange-500/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button variant="outline" className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add {activeTab === "inquiries" ? "Inquiry" : "Lead"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="rounded-md border border-white/5 mx-6 mb-6">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-transparent border-white/10">
                  <TableHead className="text-white/60">Contact</TableHead>
                  <TableHead className="text-white/60">{activeTab === "inquiries" ? "Subject" : "Company"}</TableHead>
                  <TableHead className="text-white/60">Status</TableHead>
                  {activeTab === "leads" && <TableHead className="text-white/60">Priority</TableHead>}
                  <TableHead className="text-white/60">Date</TableHead>
                  <TableHead className="text-right text-white/60">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-white/5">
                      <TableCell colSpan={6} className="h-16 animate-pulse bg-white/5" />
                    </TableRow>
                  ))
                ) : (activeTab === "inquiries" ? filteredInquiries : filteredLeads).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-white/40">
                      No {activeTab} found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (activeTab === "inquiries" ? filteredInquiries : filteredLeads).map((item: any) => (
                  <TableRow 
                    key={item._id} 
                    className="group border-white/5 hover:bg-white/5 cursor-pointer"
                    onClick={() => {
                      if (activeTab === "inquiries") {
                        setSelectedInquiry(item);
                        setNotes(item.notes || "");
                      } else {
                        setSelectedLead(item);
                        setLeadNotes(item.notes || "");
                      }
                    }}
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{item.name}</span>
                        <span className="text-xs text-white/40">{item.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-white/80 line-clamp-1">
                          {activeTab === "inquiries" ? item.subject || "No Subject" : item.company || "N/A"}
                        </span>
                        {activeTab === "leads" && item.value > 0 && (
                          <span className="text-xs text-orange-400 font-medium">${item.value.toLocaleString()}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.status)}
                    </TableCell>
                    {activeTab === "leads" && (
                      <TableCell>
                        {getPriorityBadge(item.priority)}
                      </TableCell>
                    )}
                    <TableCell className="text-white/40 text-xs">
                      {format(new Date(item.createdAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-white/40 hover:text-white hover:bg-white/10">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => {
                            if (activeTab === "inquiries") setSelectedInquiry(item);
                            else setSelectedLead(item);
                          }}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-orange-400 focus:text-orange-400">
                            Edit
                          </DropdownMenuItem>
                          {activeTab === "inquiries" && (
                            <DropdownMenuItem onClick={() => promoteToLead(item)}>
                              Promote to Lead
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="bg-white/5" />
                          <DropdownMenuItem 
                            className="text-red-400 focus:text-red-400"
                            onClick={() => {
                              if (activeTab === "inquiries") handleDeleteInquiry(item._id);
                              else handleDeleteLead(item._id);
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Inquiry Detail Modal */}
      <Dialog open={!!selectedInquiry} onOpenChange={(open) => !open && setSelectedInquiry(null)}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-orange-500" />
                  Inquiry Details
                </DialogTitle>
                <DialogDescription className="text-white/40">
                  Received on {selectedInquiry && format(new Date(selectedInquiry.createdAt), "PPP p")}
                </DialogDescription>
              </div>
              {selectedInquiry && getStatusBadge(selectedInquiry.status)}
            </div>
          </DialogHeader>

          {selectedInquiry && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Sender Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-orange-500/70" />
                      <span className="text-sm font-medium">{selectedInquiry.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-orange-500/70" />
                      <span className="text-sm">{selectedInquiry.email}</span>
                    </div>
                    {selectedInquiry.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-orange-500/70" />
                        <span className="text-sm">{selectedInquiry.phone}</span>
                      </div>
                    )}
                    {selectedInquiry.company && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-orange-500/70" />
                        <span className="text-sm">{selectedInquiry.company}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Internal Management</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="bg-white/5 border-white/10 text-[11px] h-7"
                        onClick={() => handleUpdateInquiryStatus(selectedInquiry._id, "read")}
                        disabled={selectedInquiry.status === "read" || isUpdating}
                      >
                        Mark Read
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="bg-white/5 border-white/10 text-[11px] h-7"
                        onClick={() => handleUpdateInquiryStatus(selectedInquiry._id, "replied")}
                        disabled={selectedInquiry.status === "replied" || isUpdating}
                      >
                        Mark Replied
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="bg-white/5 border-white/10 text-[11px] h-7"
                        onClick={() => handleUpdateInquiryStatus(selectedInquiry._id, "archived")}
                        disabled={selectedInquiry.status === "archived" || isUpdating}
                      >
                        Archive
                      </Button>
                    </div>
                    <Button 
                      className="w-full bg-orange-600 hover:bg-orange-700 text-sm h-9"
                      onClick={() => promoteToLead(selectedInquiry)}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Convert to Sales Lead
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 h-full flex flex-col">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Message</h4>
                  <div className="flex-1 overflow-y-auto max-h-[150px] text-sm text-white/80 leading-relaxed whitespace-pre-wrap italic bg-black/20 p-3 rounded border border-white/5">
                    "{selectedInquiry.message}"
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40">Internal Notes</h4>
                    <Textarea 
                      placeholder="Add notes about this inquiry..."
                      className="bg-white/5 border-white/10 text-xs min-h-[80px]"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <Button 
                      size="sm" 
                      className="w-full bg-white/10 hover:bg-white/20 text-[11px] h-7"
                      onClick={handleUpdateInquiryNotes}
                      disabled={isUpdating}
                    >
                      Save Notes
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lead Detail Modal */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <Star className="h-5 w-5 text-orange-500" />
                  Lead Details
                </DialogTitle>
                <DialogDescription className="text-white/40">
                  Created on {selectedLead && format(new Date(selectedLead.createdAt), "PPP p")}
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                {selectedLead && getPriorityBadge(selectedLead.priority)}
                {selectedLead && getStatusBadge(selectedLead.status)}
              </div>
            </div>
          </DialogHeader>

          {selectedLead && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Lead Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-orange-500/70" />
                      <span className="text-sm font-medium">{selectedLead.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-orange-500/70" />
                      <span className="text-sm">{selectedLead.email}</span>
                    </div>
                    {selectedLead.company && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-orange-500/70" />
                        <span className="text-sm">{selectedLead.company}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                      <Tag className="h-4 w-4 text-orange-500/70" />
                      <span className="text-sm font-bold text-orange-400">
                        Value: ${selectedLead.value?.toLocaleString() || "0"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Management</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-white/40 uppercase">Status</label>
                      <div className="grid grid-cols-2 gap-2">
                        {["contacted", "qualified", "proposal", "negotiation", "won", "lost"].map((s) => (
                          <Button 
                            key={s}
                            size="sm" 
                            variant="outline" 
                            className={`text-[10px] h-7 capitalize ${selectedLead.status === s ? "bg-orange-500/20 border-orange-500/50 text-orange-400" : "bg-white/5 border-white/10 text-white/60"}`}
                            onClick={() => handleUpdateLead(selectedLead._id, { status: s as any })}
                            disabled={isUpdating}
                          >
                            {s}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] text-white/40 uppercase">Priority</label>
                      <div className="flex gap-2">
                        {["low", "medium", "high"].map((p) => (
                          <Button 
                            key={p}
                            size="sm" 
                            variant="outline" 
                            className={`flex-1 text-[10px] h-7 capitalize ${selectedLead.priority === p ? "bg-orange-500/20 border-orange-500/50 text-orange-400" : "bg-white/5 border-white/10 text-white/60"}`}
                            onClick={() => handleUpdateLead(selectedLead._id, { priority: p as any })}
                            disabled={isUpdating}
                          >
                            {p}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 h-full flex flex-col">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Deal Notes</h4>
                  <Textarea 
                    placeholder="Add progress notes, deal blockers, or next steps..."
                    className="flex-1 bg-white/5 border-white/10 text-sm min-h-[150px] focus:border-orange-500/50"
                    value={leadNotes}
                    onChange={(e) => setLeadNotes(e.target.value)}
                  />
                  <Button 
                    size="sm" 
                    className="mt-3 w-full bg-orange-600 hover:bg-orange-700 text-xs h-9"
                    onClick={() => handleUpdateLead(selectedLead._id, { notes: leadNotes } as any)}
                    disabled={isUpdating}
                  >
                    Save Progress Notes
                  </Button>
                  
                  <div className="mt-6 pt-6 border-t border-white/5">
                    <Button 
                      variant="ghost" 
                      className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-8"
                      onClick={() => handleDeleteLead(selectedLead._id)}
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete Lead Record
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
