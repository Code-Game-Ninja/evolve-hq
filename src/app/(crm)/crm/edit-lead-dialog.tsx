// Edit Lead Dialog
"use client";

import { useState, useEffect } from "react";
import { X, Mail, Phone, Building2, IndianRupee, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Lead, LeadStatus, LeadPriority } from "./lead-data";
import { inputStyle, selectStyle, labelStyle, handleFocus, handleBlur } from "@/app/(workspace)/tasks/dialog-styles";

interface EditLeadDialogProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Lead>) => void;
  onDelete?: (id: string) => void;
}

export function EditLeadDialog({ lead, open, onClose, onUpdate, onDelete }: EditLeadDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [value, setValue] = useState("0");
  const [status, setStatus] = useState<LeadStatus>("new");
  const [priority, setPriority] = useState<LeadPriority>("medium");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (lead) {
      setName(lead.name);
      setEmail(lead.email);
      setPhone(lead.phone || "");
      setCompany(lead.company || "");
      setValue(lead.value.toString());
      setStatus(lead.status);
      setPriority(lead.priority);
      setNotes(lead.notes || "");
    }
  }, [lead]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lead || !name.trim() || !email.trim()) return;

    onUpdate(lead._id, {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: company.trim(),
      value: parseFloat(value) || 0,
      status,
      priority,
      notes: notes.trim(),
    });
    onClose();
  }

  return (
    <AnimatePresence>
      {open && lead && (
        <>
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              backgroundColor: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(4px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose();
            }}
          >
            <motion.div
              className="w-full max-w-[560px] mx-4 backdrop-blur-xl border border-[#dddddd]"
              style={{
                backgroundColor: "rgba(241,239,237,0.85)",
                borderRadius: "28px",
                boxShadow: "0 24px 64px rgba(0,0,0,0.16)",
                padding: "32px",
              }}
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[#1a1a1a]">Edit Lead</h2>
                  <p className="text-[11px] text-[#999] uppercase tracking-wider font-bold mt-0.5">ID: {lead._id}</p>
                </div>
                <div className="flex items-center gap-2">
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this lead?")) {
                          onDelete(lead._id);
                          onClose();
                        }
                      }}
                      className="flex items-center justify-center h-8 w-8 rounded-full transition-all duration-200 backdrop-blur-lg border border-red-200 hover:border-red-400 hover:bg-red-50 cursor-pointer"
                      style={{ backgroundColor: "rgba(255,255,255,0.45)" }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="flex items-center justify-center h-8 w-8 rounded-full transition-all duration-200 backdrop-blur-lg border border-[#dddddd] hover:border-[#aaaaaa] hover:bg-[#e8e5e2] cursor-pointer"
                    style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
                  >
                    <X className="h-4 w-4" style={{ color: "#737373" }} />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Lead Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Company</label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#b6b6b6]" />
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Company name"
                        style={{ ...inputStyle, paddingLeft: "40px" }}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#b6b6b6]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        style={{ ...inputStyle, paddingLeft: "40px" }}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#b6b6b6]" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91..."
                        style={{ ...inputStyle, paddingLeft: "40px" }}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label style={labelStyle}>Lead Value</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#b6b6b6]" />
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: "40px" }}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as LeadStatus)}
                      style={selectStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="proposal">Proposal</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as LeadPriority)}
                      style={selectStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any internal notes..."
                    rows={3}
                    style={{
                      ...inputStyle,
                      height: "80px",
                      padding: "12px 16px",
                      resize: "none",
                      borderRadius: "16px",
                    }}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                {/* Activity History */}
                {lead.activities && lead.activities.length > 0 && (
                  <div className="mt-4">
                    <label style={labelStyle}>Activity History</label>
                    <div className="mt-2 space-y-3 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                      {lead.activities.map((activity, idx) => (
                        <div key={idx} className="flex gap-3 text-[11px]">
                          <div className="mt-1 h-1.5 w-1.5 rounded-full bg-[#f3350c] shrink-0" />
                          <div className="flex-1">
                            <p className="text-[#1a1a1a] font-medium">{activity.content}</p>
                            <p className="text-[#999]">
                              {typeof activity.performedBy === 'object' ? activity.performedBy.name : 'System'} • {new Date(activity.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 backdrop-blur-lg border border-[#dddddd] hover:border-[#aaaaaa] hover:bg-[#e8e5e2] cursor-pointer"
                    style={{ color: "#4d4d4d", backgroundColor: "rgba(241,239,237,0.45)" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 rounded-full text-sm font-bold transition-all duration-200 backdrop-blur-lg border border-[#dddddd] hover:border-[#aaaaaa] hover:bg-[#e8e5e2] cursor-pointer shadow-sm text-[#f3350c]"
                    style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
