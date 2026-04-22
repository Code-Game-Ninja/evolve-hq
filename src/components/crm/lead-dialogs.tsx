"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Lead, LeadStatus, LeadPriority, statusConfig, priorityConfig } from "@/app/(crm)/crm/lead-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, User, Mail, Phone, Building2, IndianRupee, Tag, Info, History } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

const leadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
  value: z.number().min(0, "Value must be positive"),
  source: z.string().optional(),
  status: z.enum(["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]),
  priority: z.enum(["high", "medium", "low"]),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(), // We'll split this by comma
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export function NewLeadDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultStatus = "new",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultStatus?: LeadStatus;
}) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      value: 0,
      source: "",
      status: defaultStatus,
      priority: "medium",
      assignedTo: "",
      notes: "",
      tags: "",
    },
  });

  useEffect(() => {
    if (open) {
      fetchUsers();
      form.reset({
        name: "",
        email: "",
        phone: "",
        company: "",
        value: 0,
        source: "",
        status: defaultStatus,
        priority: "medium",
        assignedTo: "",
        notes: "",
        tags: "",
      });
    }
  }, [open, defaultStatus, form]);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/team");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users");
    }
  }

  async function onSubmit(values: LeadFormValues) {
    setLoading(true);
    try {
      const payload = {
        ...values,
        tags: values.tags ? values.tags.split(",").map(t => t.trim()) : [],
      };

      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();
      
      toast.success("Lead created successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create lead");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#0a0a0a]/90 border-white/10 backdrop-blur-2xl text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight">Create <span className="text-white/20">New Lead</span></DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                <Input 
                  {...form.register("name")} 
                  className="bg-white/5 border-white/10 pl-10 h-12 rounded-xl focus:ring-white/20" 
                  placeholder="John Doe"
                />
              </div>
              {form.formState.errors.name && <p className="text-xs text-red-400">{form.formState.errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                <Input 
                  {...form.register("email")} 
                  className="bg-white/5 border-white/10 pl-10 h-12 rounded-xl focus:ring-white/20" 
                  placeholder="john@example.com"
                />
              </div>
              {form.formState.errors.email && <p className="text-xs text-red-400">{form.formState.errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                <Input 
                  {...form.register("phone")} 
                  className="bg-white/5 border-white/10 pl-10 h-12 rounded-xl focus:ring-white/20" 
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Company Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                <Input 
                  {...form.register("company")} 
                  className="bg-white/5 border-white/10 pl-10 h-12 rounded-xl focus:ring-white/20" 
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Deal Value (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                <Input 
                  type="number"
                  {...form.register("value", { valueAsNumber: true })} 
                  className="bg-white/5 border-white/10 pl-10 h-12 rounded-xl focus:ring-white/20" 
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Lead Source</Label>
              <Input 
                {...form.register("source")} 
                className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-white/20" 
                placeholder="Website, Referral, etc."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Status</Label>
              <Select 
                defaultValue={form.getValues("status")}
                onValueChange={(v) => form.setValue("status", v as any)}
              >
                <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10 text-white">
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Priority</Label>
              <Select 
                defaultValue={form.getValues("priority")}
                onValueChange={(v) => form.setValue("priority", v as any)}
              >
                <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl text-white">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10 text-white">
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Assign To</Label>
            <Select 
              defaultValue={form.getValues("assignedTo")}
              onValueChange={(v) => form.setValue("assignedTo", v)}
            >
              <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl text-white">
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent className="bg-black border-white/10 text-white">
                {users.map((user) => (
                  <SelectItem key={user._id} value={user._id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Notes</Label>
            <Textarea 
              {...form.register("notes")} 
              className="bg-white/5 border-white/10 rounded-xl focus:ring-white/20 min-h-[100px]" 
              placeholder="Any initial notes about the lead..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Tags (comma separated)</Label>
            <div className="relative">
              <Tag className="absolute left-3 top-3 h-4 w-4 text-white/20" />
              <Input 
                {...form.register("tags")} 
                className="bg-white/5 border-white/10 pl-10 h-12 rounded-xl focus:ring-white/20" 
                placeholder="tech, enterprise, high-value"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="text-white/40 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest px-8"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditLeadDialog({
  lead,
  open,
  onOpenChange,
  onSuccess,
}: {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [activeTab, setActiveTab] = useState<"details" | "history">("details");

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
  });

  useEffect(() => {
    if (open && lead) {
      fetchUsers();
      form.reset({
        name: lead.name,
        email: lead.email,
        phone: lead.phone || "",
        company: lead.company || "",
        value: lead.value || 0,
        source: lead.source || "",
        status: lead.status,
        priority: lead.priority,
        assignedTo: typeof lead.assignedTo === 'string' ? lead.assignedTo : lead.assignedTo?._id || "",
        notes: lead.notes || "",
        tags: lead.tags?.join(", ") || "",
      });
      setActiveTab("details");
    }
  }, [open, lead, form]);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/team");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users");
    }
  }

  async function onSubmit(values: LeadFormValues) {
    if (!lead) return;
    setLoading(true);
    try {
      const payload = {
        ...values,
        tags: values.tags ? values.tags.split(",").map(t => t.trim()) : [],
      };

      const res = await fetch(`/api/crm/leads/${lead._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();
      
      toast.success("Lead updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update lead");
    } finally {
      setLoading(false);
    }
  }

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#0a0a0a]/90 border-white/10 backdrop-blur-2xl text-white p-0 overflow-hidden">
        <div className="flex h-[700px]">
          {/* Sidebar Tabs */}
          <div className="w-[80px] border-r border-white/10 flex flex-col items-center py-8 gap-8">
            <button 
              onClick={() => setActiveTab("details")}
              className={`p-3 rounded-xl transition-all ${activeTab === "details" ? "bg-white text-black" : "text-white/20 hover:text-white/40"}`}
            >
              <Info className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setActiveTab("history")}
              className={`p-3 rounded-xl transition-all ${activeTab === "history" ? "bg-white text-black" : "text-white/20 hover:text-white/40"}`}
            >
              <History className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col">
            <DialogHeader className="p-8 pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-3xl font-black tracking-tight">{lead.name}</DialogTitle>
                  <p className="text-white/40 text-sm mt-1">{lead.company || "No Company"} • {lead.email}</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest`} style={{ backgroundColor: statusConfig[lead.status].bg, color: statusConfig[lead.status].text }}>
                  {statusConfig[lead.status].label}
                </div>
              </div>
            </DialogHeader>

            <ScrollArea className="flex-1 p-8">
              {activeTab === "details" ? (
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Full Name</Label>
                      <Input {...form.register("name")} className="bg-white/5 border-white/10 h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Email</Label>
                      <Input {...form.register("email")} className="bg-white/5 border-white/10 h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Phone</Label>
                      <Input {...form.register("phone")} className="bg-white/5 border-white/10 h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Deal Value</Label>
                      <Input type="number" {...form.register("value", { valueAsNumber: true })} className="bg-white/5 border-white/10 h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Status</Label>
                      <Select defaultValue={lead.status} onValueChange={(v) => form.setValue("status", v as any)}>
                        <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/10 text-white">
                          {Object.entries(statusConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Priority</Label>
                      <Select defaultValue={lead.priority} onValueChange={(v) => form.setValue("priority", v as any)}>
                        <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/10 text-white">
                          {Object.entries(priorityConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Assign To</Label>
                    <Select defaultValue={typeof lead.assignedTo === 'string' ? lead.assignedTo : lead.assignedTo?._id} onValueChange={(v) => form.setValue("assignedTo", v)}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-white/10 text-white">
                        {users.map((user) => (
                          <SelectItem key={user._id} value={user._id}>{user.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Notes</Label>
                    <Textarea {...form.register("notes")} className="bg-white/5 border-white/10 rounded-xl min-h-[120px]" />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" disabled={loading} className="bg-white text-black hover:bg-white/90">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {lead.activities?.length ? (
                    <div className="relative border-l border-white/10 ml-3 pl-8 space-y-8 py-4">
                      {lead.activities.map((activity, i) => (
                        <div key={i} className="relative">
                          <div className="absolute -left-[37px] top-1 h-4 w-4 rounded-full bg-white border-4 border-[#0a0a0a]" />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold">{typeof activity.performedBy === "string" ? "System" : activity.performedBy.name}</span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
                                {format(new Date(activity.createdAt), "MMM d, h:mm a")}
                              </span>
                            </div>
                            <p className="text-white/60 text-sm leading-relaxed">{activity.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[400px] flex flex-col items-center justify-center text-white/20">
                      <History className="h-12 w-12 mb-4 opacity-50" />
                      <p>No activity history found.</p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
