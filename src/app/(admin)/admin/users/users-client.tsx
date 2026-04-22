// Admin User Management — list users, edit positions/role
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  UserCog,
  Search,
  Loader2,
  Check,
  X,
  Pencil,
  Shield,
  ShieldCheck,
  Crown,
  User as UserIcon,
  Plus,
  KeyRound,
  Copy,
  RotateCcw,
  Trash2,
  Ban,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

// Types
interface UserRecord {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  positions: string[];
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

// Position presets for quick selection
const positionPresets = [
  "BA",
  "BD",
  "HR",
  "Software Developer",
  "Fullstack Developer",
  "Frontend Developer",
  "Backend Developer",
  "UI/UX Designer",
  "Project Manager",
  "QA Engineer",
  "DevOps Engineer",
  "Data Analyst",
  "Marketing",
  "Finance",
];

// Role badge styles
const roleBadge: Record<string, { bg: string; text: string; icon: typeof Shield }> = {
  superadmin: { bg: "rgba(243,53,12,0.12)", text: "#f3350c", icon: Crown },
  admin: { bg: "rgba(243,53,12,0.08)", text: "#f3350c", icon: ShieldCheck },
  manager: { bg: "rgba(0,0,0,0.06)", text: "#1a1a1a", icon: Shield },
  employee: { bg: "rgba(0,0,0,0.04)", text: "#555", icon: UserIcon },
};

interface UserManagementProps {
  embedded?: boolean;
}

export function UserManagementClient({ embedded = false }: UserManagementProps) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPositions, setEditPositions] = useState<string[]>([]);
  const [posInput, setPosInput] = useState("");
  const [showPresets, setShowPresets] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [resetCredentials, setResetCredentials] = useState<{ name: string; email: string; password: string } | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; email: string } | null>(null);

  // Toggle active/inactive
  const toggleActive = async (userId: string, currentlyActive: boolean) => {
    setTogglingId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: !currentlyActive }),
      });
      const data = await res.json();
      if (data.user) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isActive: data.user.isActive } : u))
        );
      }
    } catch (err) {
      console.error("Failed to toggle active:", err);
    } finally {
      setTogglingId(null);
    }
  };

  // Delete user permanently
  const deleteUser = async (userId: string) => {
    setDeletingId(userId);
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u._id !== userId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
    } finally {
      setDeletingId(null);
      setDeleteConfirm(null);
    }
  };

  // Reset password handler
  const resetPassword = async (userId: string) => {
    if (!confirm("Are you sure you want to reset this user's password? A new temporary password will be generated.")) return;
    setResettingId(userId);
    try {
      const res = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to reset password");
        return;
      }
      setResetCredentials({
        name: data.userName,
        email: data.userEmail,
        password: data.tempPassword,
      });
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setResettingId(null);
    }
  };

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Save positions
  const savePositions = async (userId: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, positions: editPositions }),
      });
      const data = await res.json();
      if (data.user) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, positions: data.user.positions || [] } : u))
        );
      }
    } catch (err) {
      console.error("Failed to save positions:", err);
    } finally {
      setSaving(false);
      setEditingId(null);
    }
  };

  // Add a position tag
  const addPosition = (pos: string) => {
    const trimmed = pos.trim();
    if (trimmed && !editPositions.includes(trimmed)) {
      setEditPositions((prev) => [...prev, trimmed]);
    }
    setPosInput("");
    setShowPresets(false);
    inputRef.current?.focus();
  };

  // Remove a position tag
  const removePosition = (pos: string) => {
    setEditPositions((prev) => prev.filter((p) => p !== pos));
  };

  // Handle input keydown
  const handlePosKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && posInput.trim()) {
      e.preventDefault();
      addPosition(posInput);
    } else if (e.key === "Backspace" && !posInput && editPositions.length > 0) {
      setEditPositions((prev) => prev.slice(0, -1));
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  // Start editing
  const startEdit = (user: UserRecord) => {
    setEditingId(user._id);
    setEditPositions(user.positions || []);
    setPosInput("");
    setShowPresets(false);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditPositions([]);
    setPosInput("");
    setShowPresets(false);
  };

  // Filtered users
  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.positions || []).some((p) => p.toLowerCase().includes(search.toLowerCase()))
  );

  // Format date
  const fmtDate = (d?: string) => {
    if (!d) return "Never";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  };

  return (
    <div className={embedded ? "space-y-5" : "space-y-5 pb-12"}>
      {/* Header — hidden when embedded in tabs */}
      {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a]">
              User Management
            </h1>
            <p className="text-sm text-[#737373] mt-1">
              Manage employee positions and access levels
            </p>
          </div>

          {/* Search */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-[#dddddd] backdrop-blur-lg w-full sm:w-80"
            style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
          >
            <Search className="h-4 w-4 text-[#737373] shrink-0" />
            <input
              type="text"
              placeholder="Search by name, email or position..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-[#1a1a1a] placeholder:text-[#bbb] outline-none w-full"
            />
          </div>
        </div>
      )}

      {/* Inline search when embedded */}
      {embedded && (
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-[#1a1a1a] shrink-0">Users</h2>
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-[#dddddd] backdrop-blur-lg w-full sm:w-72"
            style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
          >
            <Search className="h-4 w-4 text-[#737373] shrink-0" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-[#1a1a1a] placeholder:text-[#bbb] outline-none w-full"
            />
          </div>
        </div>
      )}

      {/* Users table */}
      <div
        className="rounded-3xl border border-[#dddddd] backdrop-blur-lg overflow-hidden"
        style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-[#737373]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <UserCog className="h-10 w-10 text-[#bbb] mb-3" />
            <p className="text-sm text-[#737373]">
              {search ? "No users match your search" : "No users found"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#dddddd]">
                  <th className="text-left px-5 py-4 font-semibold text-[#737373] text-xs uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left px-5 py-4 font-semibold text-[#737373] text-xs uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-5 py-4 font-semibold text-[#737373] text-xs uppercase tracking-wider">
                    Positions
                  </th>
                  <th className="text-left px-5 py-4 font-semibold text-[#737373] text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-5 py-4 font-semibold text-[#737373] text-xs uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="text-right px-5 py-4 font-semibold text-[#737373] text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const badge = roleBadge[user.role] || roleBadge.employee;
                  const isEditing = editingId === user._id;
                  const BadgeIcon = badge.icon;

                  return (
                    <tr
                      key={user._id}
                      className="border-b border-[#eeeeee] last:border-b-0 hover:bg-black/[0.02] transition-colors"
                    >
                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.image}
                              alt={user.name}
                              className="h-9 w-9 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div
                              className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                              style={{
                                backgroundColor: badge.bg,
                                color: badge.text,
                              }}
                            >
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-[#1a1a1a]">
                              {user.name}
                            </p>
                            <p className="text-xs text-[#737373]">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.text,
                          }}
                        >
                          <BadgeIcon className="h-3 w-3" />
                          {user.role}
                        </span>
                      </td>

                      {/* Positions */}
                      <td className="px-5 py-4">
                        {isEditing ? (
                          <div className="space-y-2">
                            {/* Tag chips */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              {editPositions.map((pos) => (
                                <span
                                  key={pos}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#0a0a0a] text-white"
                                >
                                  {pos}
                                  <button
                                    onClick={() => removePosition(pos)}
                                    className="h-3.5 w-3.5 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
                                  >
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                </span>
                              ))}
                              {/* Inline input */}
                              <div className="relative">
                                <input
                                  ref={inputRef}
                                  type="text"
                                  value={posInput}
                                  onChange={(e) => {
                                    setPosInput(e.target.value);
                                    setShowPresets(true);
                                  }}
                                  onFocus={() => {
                                    setShowPresets(true);
                                    // Calculate portal position
                                    if (inputRef.current) {
                                      const rect = inputRef.current.getBoundingClientRect();
                                      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
                                    }
                                  }}
                                  onBlur={() => setTimeout(() => setShowPresets(false), 150)}
                                  onKeyDown={handlePosKeyDown}
                                  placeholder={editPositions.length === 0 ? "Add position..." : "+"}
                                  className="bg-transparent text-xs text-[#1a1a1a] placeholder:text-[#bbb] outline-none w-24"
                                  autoFocus
                                />
                              </div>
                            </div>
                            {/* Save / Cancel */}
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => savePositions(user._id)}
                                disabled={saving}
                                className="h-7 w-7 rounded-full flex items-center justify-center bg-[#0a0a0a] text-white hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                              >
                                {saving ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="h-7 w-7 rounded-full flex items-center justify-center border border-[#dddddd] text-[#737373] hover:text-[#1a1a1a] hover:border-[#aaa] transition-colors cursor-pointer"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {user.positions && user.positions.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {user.positions.map((pos) => (
                                  <span
                                    key={pos}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                                    style={{ backgroundColor: "rgba(0,0,0,0.06)", color: "#1a1a1a" }}
                                  >
                                    {pos}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[#bbb] italic text-xs">Not set</span>
                            )}
                            <button
                              onClick={() => startEdit(user)}
                              className="h-6 w-6 rounded-full flex items-center justify-center text-[#bbb] hover:text-[#1a1a1a] hover:bg-black/5 transition-colors cursor-pointer shrink-0"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              user.isActive ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="px-5 py-4 text-[#737373]">
                        {fmtDate(user.lastLogin)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* Toggle active */}
                          <button
                            onClick={() => toggleActive(user._id, user.isActive)}
                            disabled={togglingId === user._id}
                            className="h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer hover:bg-black/5 disabled:opacity-50"
                            title={user.isActive ? "Deactivate user" : "Activate user"}
                          >
                            {togglingId === user._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "#707070" }} />
                            ) : user.isActive ? (
                              <Ban className="h-3.5 w-3.5" style={{ color: "#f59e0b" }} />
                            ) : (
                              <CheckCircle className="h-3.5 w-3.5" style={{ color: "#22c55e" }} />
                            )}
                          </button>

                          {/* Reset password */}
                          <button
                            onClick={() => resetPassword(user._id)}
                            disabled={resettingId === user._id}
                            className="h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer hover:bg-orange-50 disabled:opacity-50"
                            title="Reset password"
                          >
                            {resettingId === user._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "#f59e0b" }} />
                            ) : (
                              <RotateCcw className="h-3.5 w-3.5" style={{ color: "#f59e0b" }} />
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteConfirm({ id: user._id, name: user.name, email: user.email })}
                            disabled={deletingId === user._id}
                            className="h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer hover:bg-red-50 disabled:opacity-50"
                            title="Delete user"
                          >
                            {deletingId === user._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "#ef4444" }} />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" style={{ color: "#ef4444" }} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Position info box */}
      <div
        className="rounded-2xl border border-[#dddddd] backdrop-blur-lg p-5"
        style={{ backgroundColor: "rgba(241,239,237,0.30)" }}
      >
        <p className="text-xs font-semibold text-[#737373] uppercase tracking-wider mb-2">
          Positions determine CRM access
        </p>
        <p className="text-sm text-[#555]">
          Users with a <strong>BA</strong> or <strong>BD</strong> position will see
          the <strong>CRM</strong> link in their profile dropdown. One person can
          have multiple positions (e.g. BA + Finance). Admin and superadmin roles
          always have CRM access.
        </p>
      </div>

      {/* Reset Password Credentials Dialog */}
      <ResetCredentialsDialog
        credentials={resetCredentials}
        onClose={() => setResetCredentials(null)}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        user={deleteConfirm}
        deleting={!!deletingId}
        onConfirm={(id) => deleteUser(id)}
        onClose={() => setDeleteConfirm(null)}
      />

      {/* Portal-based presets dropdown — renders outside table overflow */}
      {showPresets &&
        dropdownPos &&
        createPortal(
          <div
            className="fixed rounded-xl border border-[#dddddd] shadow-xl py-1 max-h-44 overflow-y-auto w-52"
            style={{
              top: dropdownPos.top,
              left: dropdownPos.left,
              zIndex: 9999,
              backgroundColor: "#fff",
            }}
          >
            {positionPresets
              .filter(
                (p) =>
                  !editPositions.includes(p) &&
                  p.toLowerCase().includes(posInput.toLowerCase())
              )
              .map((p) => (
                <button
                  key={p}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addPosition(p)}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#1a1a1a] hover:bg-black/5 transition-colors cursor-pointer"
                >
                  {p}
                </button>
              ))}
            {posInput.trim() &&
              !positionPresets.some(
                (p) => p.toLowerCase() === posInput.toLowerCase()
              ) &&
              !editPositions.some(
                (p) => p.toLowerCase() === posInput.toLowerCase()
              ) && (
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addPosition(posInput)}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#f3350c] hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add &quot;{posInput.trim()}&quot;
                </button>
              )}
          </div>,
          document.body
        )}
    </div>
  );
}

// Reset Credentials Dialog — shown after resetting a user's password
function ResetCredentialsDialog({
  credentials,
  onClose,
}: {
  credentials: { name: string; email: string; password: string } | null;
  onClose: () => void;
}) {
  const [copiedField, setCopiedField] = useState<"email" | "password" | "all" | null>(null);

  if (!credentials) return null;

  const copyToClipboard = async (text: string, field: "email" | "password" | "all") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback
    }
  };

  const allText = `Password Reset for ${credentials.name}\nEmail: ${credentials.email}\nNew Temporary Password: ${credentials.password}\n\nPlease change your password after logging in.`;

  return (
    <Dialog open={!!credentials} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="sm:max-w-[440px] p-0 rounded-3xl border border-[#dddddd] overflow-hidden"
        style={{ backgroundColor: "#f8f7f3" }}
      >
        <DialogTitle className="sr-only">Password Reset Credentials</DialogTitle>
        <div className="px-6 py-6">
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "rgba(245,158,11,0.08)" }}
          >
            <KeyRound className="h-5 w-5" style={{ color: "#f59e0b" }} />
          </div>

          <h3 className="text-base font-semibold text-center" style={{ color: "#1a1a1a" }}>
            Password Reset Successfully
          </h3>
          <p className="text-xs text-center mt-1.5 leading-relaxed" style={{ color: "#737373" }}>
            Share the new temporary password with <strong style={{ color: "#1a1a1a" }}>{credentials.name}</strong>. It is shown only once.
          </p>

          {/* Credential fields */}
          <div className="mt-5 space-y-3">
            {/* Email */}
            <div
              className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
              style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
            >
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#737373" }}>
                  Email
                </p>
                <p className="text-sm font-medium mt-0.5 truncate" style={{ color: "#1a1a1a" }}>
                  {credentials.email}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(credentials.email, "email")}
                className="shrink-0 h-8 w-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer hover:bg-black/5"
                title="Copy email"
              >
                {copiedField === "email" ? (
                  <Check className="h-3.5 w-3.5" style={{ color: "#22c55e" }} />
                ) : (
                  <Copy className="h-3.5 w-3.5" style={{ color: "#707070" }} />
                )}
              </button>
            </div>

            {/* New Password */}
            <div
              className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
              style={{ backgroundColor: "rgba(245,158,11,0.04)" }}
            >
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#737373" }}>
                  New Temporary Password
                </p>
                <p
                  className="text-sm font-mono font-semibold mt-0.5 tracking-wider truncate"
                  style={{ color: "#f59e0b" }}
                >
                  {credentials.password}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(credentials.password, "password")}
                className="shrink-0 h-8 w-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer hover:bg-black/5"
                title="Copy password"
              >
                {copiedField === "password" ? (
                  <Check className="h-3.5 w-3.5" style={{ color: "#22c55e" }} />
                ) : (
                  <Copy className="h-3.5 w-3.5" style={{ color: "#707070" }} />
                )}
              </button>
            </div>
          </div>

          {/* Warning */}
          <div
            className="mt-4 rounded-2xl px-4 py-3 flex items-start gap-2.5"
            style={{ backgroundColor: "rgba(245,158,11,0.06)" }}
          >
            <div className="shrink-0 mt-0.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: "#92700c" }}>
              This password will not be shown again. The user will be asked to change it on first login.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-2 mt-5">
            <button
              onClick={() => copyToClipboard(allText, "all")}
              className="px-5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer hover:bg-black/5 flex items-center gap-1.5"
              style={{ color: "#707070" }}
            >
              {copiedField === "all" ? (
                <><Check className="h-3.5 w-3.5" style={{ color: "#22c55e" }} /> Copied!</>
              ) : (
                <><Copy className="h-3.5 w-3.5" /> Copy All</>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl text-xs font-semibold text-white transition-all duration-200 cursor-pointer hover:opacity-90 active:scale-95"
              style={{ backgroundColor: "#0a0a0a" }}
            >
              Done
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Delete Confirmation Dialog
function DeleteConfirmDialog({
  user,
  deleting,
  onConfirm,
  onClose,
}: {
  user: { id: string; name: string; email: string } | null;
  deleting: boolean;
  onConfirm: (id: string) => void;
  onClose: () => void;
}) {
  if (!user) return null;

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="sm:max-w-[400px] p-0 rounded-3xl border border-[#dddddd] overflow-hidden"
        style={{ backgroundColor: "#f8f7f3" }}
      >
        <DialogTitle className="sr-only">Delete User Confirmation</DialogTitle>
        <div className="px-6 py-6">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "rgba(239,68,68,0.08)" }}
          >
            <AlertTriangle className="h-5 w-5" style={{ color: "#ef4444" }} />
          </div>

          <h3 className="text-base font-semibold text-center" style={{ color: "#1a1a1a" }}>
            Delete User
          </h3>
          <p className="text-xs text-center mt-1.5 leading-relaxed" style={{ color: "#737373" }}>
            Are you sure you want to permanently delete{" "}
            <strong style={{ color: "#1a1a1a" }}>{user.name}</strong> ({user.email})?
            This action cannot be undone. All their sessions will also be removed.
          </p>

          <div className="flex items-center justify-center gap-2 mt-5">
            <button
              onClick={onClose}
              disabled={deleting}
              className="px-5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer hover:bg-black/5 disabled:opacity-50"
              style={{ color: "#707070" }}
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(user.id)}
              disabled={deleting}
              className="px-5 py-2.5 rounded-2xl text-xs font-semibold text-white transition-all duration-200 cursor-pointer hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              style={{ backgroundColor: "#ef4444" }}
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Delete
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
