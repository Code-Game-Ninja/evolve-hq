// Admin Team page — tabs: Members, User Management
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GlassPillTabs } from "@/components/ui/glass-pill-tabs";
import { UserManagementClient } from "../users/users-client";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  UserCog,
  Search,
  Crown,
  ShieldCheck,
  Shield,
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  MapPin,
  CheckSquare,
  Clock,
  X,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Check,
  Loader2,
  KeyRound,
  Headphones,
} from "lucide-react";

// Count-up hook (re-animates when target changes)
function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(target);
  useEffect(() => {
    const from = prevTarget.current !== target ? prevTarget.current : 0;
    prevTarget.current = target;
    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + eased * (target - from)));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

// Animation variants
const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.08 * i,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

// Role config
const roleConfig: Record<
  string,
  { icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; bg: string; text: string; label: string }
> = {
  superadmin: { icon: Crown, bg: "rgba(243,53,12,0.12)", text: "#f3350c", label: "Super Admin" },
  admin: { icon: ShieldCheck, bg: "rgba(243,53,12,0.08)", text: "#f3350c", label: "Admin" },
  manager: { icon: Shield, bg: "rgba(0,0,0,0.06)", text: "#1a1a1a", label: "Manager" },
  employee: { icon: User, bg: "rgba(0,0,0,0.04)", text: "#555", label: "Employee" },
};

// Status config
const statusConfig: Record<string, { color: string; label: string }> = {
  active: { color: "#22c55e", label: "Active" },
  leave: { color: "#f59e0b", label: "On Leave" },
  absent: { color: "#ef4444", label: "Absent" },
};

// Member type
interface TeamMember {
  id: string;
  name: string;
  role: string;
  position: string;
  status: string;
  avatar: string;
  image?: string | null;
  email: string;
  phone: string;
  department: string;
  joinedDate: string;
  location: string;
  discordId?: string;
  tasksCompleted: number;
  tasksInProgress: number;
  recentActivity: { action: string; time: string }[];
}

const tabs = [
  { label: "Members", value: "members", icon: Users },
  { label: "User Management", value: "users", icon: UserCog },
];

export function TeamPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") || "members";
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", val);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1
            className="text-2xl sm:text-[2rem] font-semibold leading-tight"
            style={{ color: "#1a1a1a" }}
          >
            Team
          </h1>
          <p className="text-sm mt-1" style={{ color: "#737373" }}>
            Manage team members, roles and permissions
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay: 0.08,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        <GlassPillTabs
          tabs={tabs.map((t) => ({ label: t.label, value: t.value }))}
          activeValue={activeTab}
          onChange={handleTabChange}
          layoutId="admin-team-tabs"
          variant="subtle"
          size="sm"
        />
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.35,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        {activeTab === "members" && <TeamMembersContent />}
        {activeTab === "users" && <UserManagementClient embedded />}
      </motion.div>
    </div>
  );
}

// Stat card with count-up
function StatCard({
  label,
  value,
  index,
}: {
  label: string;
  value: number;
  index: number;
}) {
  const animated = useCountUp(value);

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={cardVariant}
      className="backdrop-blur-lg border border-[#dddddd]"
      style={{
        backgroundColor: "rgba(241,239,237,0.45)",
        borderRadius: "24px",
        padding: "16px 20px",
      }}
    >
      <p
        className="text-xs uppercase font-medium tracking-wider"
        style={{ color: "#737373" }}
      >
        {label}
      </p>
      <p className="text-2xl font-bold mt-1" style={{ color: "#1a1a1a" }}>
        {animated}
      </p>
    </motion.div>
  );
}

// Role badge component
function RoleBadge({ role }: { role: string }) {
  const config = roleConfig[role] || roleConfig.employee;
  const Icon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      <Icon size={10} style={{ color: config.text }} />
      {config.label}
    </span>
  );
}

// Status dot + label
function StatusIndicator({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.active;

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      <span className="text-xs font-medium" style={{ color: config.color }}>
        {config.label}
      </span>
    </div>
  );
}

// Team Members content
function TeamMembersContent() {
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TeamMember | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [credentials, setCredentials] = useState<{ name: string; email: string; password: string } | null>(null);

  // Fetch team members from API
  useEffect(() => {
    async function fetchTeam() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/team");
        if (res.ok) {
          const json = await res.json();
          setMembers(
            (json.members || []).map((m: TeamMember & { recentActivity?: unknown[] }) => ({
              ...m,
              recentActivity: m.recentActivity || [],
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch team:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTeam();
  }, []);

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.position.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase())
  );

  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === "active").length;
  const departments = new Set(members.map((m) => m.department)).size;

  // Add member — calls real API to create user with credentials
  const handleAddMember = useCallback(async (member: TeamMember) => {
    setIsCreating(true);
    setCreateError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: member.name,
          email: member.email,
          role: member.role,
          position: member.position,
          department: member.department,
          location: member.location,
          phone: member.phone,
          discordId: member.discordId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error || "Failed to create user");
        setIsCreating(false);
        return;
      }

      // Add to local list
      setMembers((prev) => [...prev, { ...member, id: data.user._id }]);
      setDialogOpen(false);

      // Show credentials dialog
      setCredentials({
        name: data.user.name,
        email: data.user.email,
        password: data.tempPassword,
      });
    } catch {
      setCreateError("Network error. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }, []);

  // Edit member — update via API
  const handleEditMember = useCallback(async (updated: TeamMember) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: updated.id,
          name: updated.name,
          email: updated.email,
          userRole: updated.role,
          positions: [updated.position].filter(Boolean),
          isActive: updated.status === "active",
          discordId: updated.discordId?.trim() || null,
          phone: updated.phone,
          department: updated.department,
          location: updated.location,
        }),
      });

      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.id === updated.id ? updated : m))
        );
        setSelectedMember(updated);
      }
    } catch (err) {
      console.error("Failed to update member:", err);
    }
    setEditingMember(null);
  }, []);

  // Delete member via API
  const handleDeleteMember = useCallback(async (member: TeamMember) => {
    try {
      const res = await fetch(`/api/admin/users?id=${member.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== member.id));
      } else {
        const data = await res.json();
        console.error("Failed to remove member:", data.error);
      }
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
    setDeleteConfirm(null);
    setSelectedMember(null);
  }, []);

  // Open edit from detail sheet
  const handleEditFromSheet = useCallback((member: TeamMember) => {
    setSelectedMember(null);
    setTimeout(() => setEditingMember(member), 200);
  }, []);

  // Open delete confirm from detail sheet
  const handleDeleteFromSheet = useCallback((member: TeamMember) => {
    setSelectedMember(null);
    setTimeout(() => setDeleteConfirm(member), 200);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[80px] rounded-3xl" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
          ))}
        </div>
        <div className="rounded-3xl p-6" style={{ backgroundColor: "rgba(0,0,0,0.06)" }}>
          <div className="h-10 w-56 rounded-xl mb-4" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[180px] rounded-2xl" style={{ backgroundColor: "rgba(0,0,0,0.04)" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Members" value={totalMembers} index={0} />
        <StatCard label="Active Now" value={activeMembers} index={1} />
        <StatCard label="Departments" value={departments} index={2} />
      </div>

      {/* Members Grid Card */}
      <motion.div
        custom={3}
        initial="hidden"
        animate="visible"
        variants={cardVariant}
        className="rounded-[24px] overflow-hidden backdrop-blur-lg border border-[#dddddd]"
        style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
      >
        {/* Card header with search + add */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 pt-6 pb-4">
          <h2 className="text-base font-semibold" style={{ color: "#1a1a1a" }}>
            Team Members
          </h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div
              className="flex items-center gap-2 rounded-2xl px-4 py-2.5 backdrop-blur-lg border border-[#dddddd] flex-1 sm:w-56"
              style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
            >
              <Search className="h-4 w-4 shrink-0" style={{ color: "#737373" }} />
              <input
                type="text"
                placeholder="Search team..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none text-sm w-full placeholder:text-[#bbb]"
                style={{ color: "#1a1a1a" }}
              />
            </div>
            <button
              onClick={() => { setEditingMember(null); setDialogOpen(true); }}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-semibold text-white transition-all duration-200 cursor-pointer hover:opacity-90 active:scale-95"
              style={{ backgroundColor: "#0a0a0a" }}
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add Member</span>
            </button>
          </div>
        </div>

        {/* Member cards grid */}
        <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((member, i) => (
            <motion.div
              key={member.email}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariant}
              className="rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01] cursor-pointer"
              style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
              onClick={() => setSelectedMember(member)}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.03)")
              }
            >
              {/* Avatar */}
              {member.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-base font-semibold"
                  style={{ backgroundColor: "#f1efed", color: "#707070" }}
                >
                  {member.avatar}
                </div>
              )}

              {/* Name */}
              <p
                className="text-sm font-semibold mt-3 truncate"
                style={{ color: "#1a1a1a" }}
              >
                {member.name}
              </p>

              {/* Role badge */}
              <div className="mt-2">
                <RoleBadge role={member.role} />
              </div>

              {/* Position */}
              <p
                className="text-xs mt-2 truncate"
                style={{ color: "#707070" }}
              >
                {member.position || (
                  <span className="italic" style={{ color: "#bbb" }}>
                    Not set
                  </span>
                )}
              </p>

              {/* Status */}
              <div className="mt-2">
                <StatusIndicator status={member.status} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="px-6 pb-12 flex flex-col items-center justify-center text-center">
            <Users className="h-12 w-12 mb-3" style={{ color: "#bbb" }} />
            <p className="text-sm" style={{ color: "#737373" }}>
              {search ? "No team members match your search" : "No team members yet. Add your first member above."}
            </p>
          </div>
        )}
      </motion.div>

      {/* Member Detail Sheet */}
      <MemberDetailSheet
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        onEdit={handleEditFromSheet}
        onDelete={handleDeleteFromSheet}
      />

      {/* Add / Edit Member Dialog */}
      <AddEditMemberDialog
        open={dialogOpen || !!editingMember}
        onClose={() => { setDialogOpen(false); setEditingMember(null); setCreateError(""); }}
        member={editingMember}
        onSave={editingMember ? handleEditMember : handleAddMember}
        isCreating={isCreating}
        createError={createError}
      />

      {/* Credentials Dialog — shown after creating a new user */}
      <CredentialsDialog
        credentials={credentials}
        onClose={() => setCredentials(null)}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        member={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteMember}
      />
    </div>
  );
}

// Format date utility
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

// Info row in detail sheet
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: "rgba(0,0,0,0.04)" }}
      >
        <Icon className="h-4 w-4" style={{ color: "#707070" }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider font-medium" style={{ color: "#737373" }}>
          {label}
        </p>
        <p className="text-sm font-medium mt-0.5 break-all" style={{ color: "#1a1a1a" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

// Member Detail Sheet
function MemberDetailSheet({
  member,
  onClose,
  onEdit,
  onDelete,
}: {
  member: TeamMember | null;
  onClose: () => void;
  onEdit: (member: TeamMember) => void;
  onDelete: (member: TeamMember) => void;
}) {
  if (!member) return null;

  const statusConf = statusConfig[member.status] || statusConfig.active;

  return (
    <Sheet open={!!member} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[440px] p-0 border-l border-[#dddddd] overflow-y-auto"
        style={{ backgroundColor: "#f8f7f3" }}
        showCloseButton={false}
      >
        <SheetTitle className="sr-only">{member.name} Profile</SheetTitle>

        {/* Hero header */}
        <div className="relative px-6 pt-6 pb-5">
          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-1">
            <button
              onClick={() => onEdit(member)}
              className="h-8 w-8 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-black/5"
              style={{ color: "#707070" }}
              title="Edit member"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(member)}
              className="h-8 w-8 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-red-50"
              style={{ color: "#ef4444" }}
              title="Remove member"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-black/5"
              style={{ color: "#737373" }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            {member.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.image}
                alt={member.name}
                className="w-16 h-16 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
                style={{ backgroundColor: "#f1efed", color: "#707070" }}
              >
                {member.avatar}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-semibold truncate" style={{ color: "#1a1a1a" }}>
                {member.name}
              </h2>
              <p className="text-sm mt-0.5 truncate" style={{ color: "#707070" }}>
                {member.position}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <RoleBadge role={member.role} />
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{
                    backgroundColor: statusConf.color + "18",
                    color: statusConf.color,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: statusConf.color }}
                  />
                  {statusConf.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mx-6" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />

        {/* Task stats */}
        <div className="px-6 py-4 grid grid-cols-2 gap-3">
          <div
            className="rounded-2xl p-4 text-center"
            style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CheckSquare className="h-3.5 w-3.5" style={{ color: "#22c55e" }} />
              <span className="text-[11px] uppercase tracking-wider font-medium" style={{ color: "#737373" }}>
                Completed
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>
              {member.tasksCompleted}
            </p>
          </div>
          <div
            className="rounded-2xl p-4 text-center"
            style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Clock className="h-3.5 w-3.5" style={{ color: "#f59e0b" }} />
              <span className="text-[11px] uppercase tracking-wider font-medium" style={{ color: "#737373" }}>
                In Progress
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>
              {member.tasksInProgress}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mx-6" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />

        {/* Contact & Info */}
        <div className="px-6 py-2">
          <InfoRow icon={Mail} label="Email" value={member.email} />
          <InfoRow icon={Phone} label="Phone" value={member.phone} />
          <InfoRow icon={Briefcase} label="Department" value={member.department} />
          <InfoRow icon={MapPin} label="Location" value={member.location} />
          <InfoRow icon={Headphones} label="Discord ID" value={member.discordId || ""} />
          <InfoRow icon={Calendar} label="Joined" value={formatDate(member.joinedDate)} />
        </div>

        {/* Divider */}
        <div className="h-px mx-6" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />

        {/* Recent Activity */}
        <div className="px-6 py-4 pb-8">
          <h3 className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: "#737373" }}>
            Recent Activity
          </h3>
          <div className="space-y-0">
            {member.recentActivity.map((activity, i) => (
              <div
                key={i}
                className="flex gap-3 py-2.5"
                style={{
                  borderBottom:
                    i < member.recentActivity.length - 1
                      ? "1px solid rgba(0,0,0,0.04)"
                      : "none",
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ backgroundColor: "#22c55e" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm" style={{ color: "#1a1a1a" }}>
                    {activity.action}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#737373" }}>
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Styled form input
function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: "#737373" }}>
        {label} {required && <span style={{ color: "#f3350c" }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 rounded-2xl text-sm border border-[#dddddd] backdrop-blur-lg outline-none transition-all focus:border-[#aaa]"
        style={{ backgroundColor: "rgba(241,239,237,0.45)", color: "#1a1a1a" }}
      />
    </div>
  );
}

// Styled form select
function FormSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: "#737373" }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-2xl text-sm border border-[#dddddd] backdrop-blur-lg outline-none transition-all focus:border-[#aaa] cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23999%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-10"
        style={{ backgroundColor: "rgba(241,239,237,0.45)", color: "#1a1a1a" }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Add / Edit Member Dialog
function AddEditMemberDialog({
  open,
  onClose,
  member,
  onSave,
  isCreating = false,
  createError = "",
}: {
  open: boolean;
  onClose: () => void;
  member: TeamMember | null;
  onSave: (member: TeamMember) => void;
  isCreating?: boolean;
  createError?: string;
}) {
  const isEdit = !!member;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [discordId, setDiscordId] = useState("");
  const [role, setRole] = useState("employee");
  const [status, setStatus] = useState("active");

  // Populate form when editing
  useEffect(() => {
    if (member) {
      setName(member.name);
      setEmail(member.email);
      setPhone(member.phone);
      setPosition(member.position);
      setDepartment(member.department);
      setLocation(member.location);
      setDiscordId(member.discordId || "");
      setRole(member.role);
      setStatus(member.status);
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setPosition("");
      setDepartment("");
      setLocation("");
      setDiscordId("");
      setRole("employee");
      setStatus("active");
    }
  }, [member, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const initials = name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    onSave({
      id: member?.id || `m${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      position: position.trim(),
      department: department.trim(),
      location: location.trim(),
      discordId: discordId.trim(),
      role,
      status,
      avatar: member?.avatar || initials,
      joinedDate: member?.joinedDate || new Date().toISOString().split("T")[0],
      tasksCompleted: member?.tasksCompleted || 0,
      tasksInProgress: member?.tasksInProgress || 0,
      recentActivity: member?.recentActivity || [
        { action: "Added to team", time: "Just now" },
      ],
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="sm:max-w-[480px] p-0 rounded-3xl border border-[#dddddd] overflow-hidden"
        style={{ backgroundColor: "#f8f7f3" }}
      >
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-lg font-semibold" style={{ color: "#1a1a1a" }}>
            {isEdit ? "Edit Member" : "Add New Member"}
          </DialogTitle>
          <p className="text-xs mt-1" style={{ color: "#737373" }}>
            {isEdit ? "Update team member details" : "Fill in details to add a new team member. Login credentials will be generated automatically."}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Name + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Full Name" value={name} onChange={setName} placeholder="John Doe" required />
            <FormField label="Email" value={email} onChange={setEmail} placeholder="john@evolve.agency" type="email" required />
          </div>

          {/* Phone + Position */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Phone" value={phone} onChange={setPhone} placeholder="+91 98765 43210" />
            <FormField label="Position" value={position} onChange={setPosition} placeholder="Software Developer" />
          </div>

          {/* Department + Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Department"
              value={department}
              onChange={setDepartment}
              options={[
                { value: "", label: "Select Department" },
                { value: "Engineering", label: "Engineering" },
                { value: "Design", label: "Design" },
                { value: "Marketing", label: "Marketing" },
                { value: "Management", label: "Management" },
                { value: "HR", label: "HR" },
                { value: "Finance", label: "Finance" },
                { value: "Operations", label: "Operations" },
              ]}
            />
            <FormField label="Location" value={location} onChange={setLocation} placeholder="Ahmedabad, India" />
          </div>

          {/* Discord ID */}
          <FormField label="Discord ID" value={discordId} onChange={setDiscordId} placeholder="e.g. 123456789012345678" />

          {/* Role + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Role"
              value={role}
              onChange={setRole}
              options={[
                { value: "employee", label: "Employee" },
                { value: "manager", label: "Manager" },
                { value: "admin", label: "Admin" },
                { value: "superadmin", label: "Super Admin" },
              ]}
            />
            <FormSelect
              label="Status"
              value={status}
              onChange={setStatus}
              options={[
                { value: "active", label: "Active" },
                { value: "leave", label: "On Leave" },
                { value: "absent", label: "Absent" },
              ]}
            />
          </div>

          {/* Error message */}
          {createError && (
            <div
              className="px-4 py-2.5 rounded-2xl text-xs font-medium"
              style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444" }}
            >
              {createError}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-5 py-2.5 rounded-2xl text-xs font-semibold transition-colors cursor-pointer hover:bg-black/5 disabled:opacity-50"
              style={{ color: "#707070" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-5 py-2.5 rounded-2xl text-xs font-semibold text-white transition-all duration-200 cursor-pointer hover:opacity-90 active:scale-95 disabled:opacity-60 flex items-center gap-2"
              style={{ backgroundColor: "#0a0a0a" }}
            >
              {isCreating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isCreating ? "Creating..." : isEdit ? "Save Changes" : "Add Member"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Credentials Dialog — shown once after creating a new user
function CredentialsDialog({
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

  const allCredentialsText = `Login Credentials for ${credentials.name}\nEmail: ${credentials.email}\nTemporary Password: ${credentials.password}\n\nPlease change your password after first login.`;

  return (
    <Dialog open={!!credentials} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="sm:max-w-[440px] p-0 rounded-3xl border border-[#dddddd] overflow-hidden"
        style={{ backgroundColor: "#f8f7f3" }}
      >
        <div className="px-6 py-6">
          {/* Success icon */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "rgba(34,197,94,0.08)" }}
          >
            <KeyRound className="h-5 w-5" style={{ color: "#22c55e" }} />
          </div>

          <DialogTitle className="text-base font-semibold text-center" style={{ color: "#1a1a1a" }}>
            Member Created Successfully
          </DialogTitle>
          <p className="text-xs text-center mt-1.5 leading-relaxed" style={{ color: "#737373" }}>
            Share these login credentials with <strong style={{ color: "#1a1a1a" }}>{credentials.name}</strong>. The temporary password is shown only once.
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

            {/* Password */}
            <div
              className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
              style={{ backgroundColor: "rgba(243,53,12,0.04)" }}
            >
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#737373" }}>
                  Temporary Password
                </p>
                <p
                  className="text-sm font-mono font-semibold mt-0.5 tracking-wider truncate"
                  style={{ color: "#f3350c" }}
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

          {/* Warning note */}
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
              onClick={() => copyToClipboard(allCredentialsText, "all")}
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
  member,
  onClose,
  onConfirm,
}: {
  member: TeamMember | null;
  onClose: () => void;
  onConfirm: (member: TeamMember) => void;
}) {
  if (!member) return null;

  return (
    <Dialog open={!!member} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="sm:max-w-[400px] p-0 rounded-3xl border border-[#dddddd] overflow-hidden"
        style={{ backgroundColor: "#f8f7f3" }}
      >
        <div className="px-6 py-6 text-center">
          {/* Warning icon */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "rgba(239,68,68,0.08)" }}
          >
            <Trash2 className="h-5 w-5" style={{ color: "#ef4444" }} />
          </div>

          <DialogTitle className="text-base font-semibold" style={{ color: "#1a1a1a" }}>
            Remove Team Member
          </DialogTitle>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: "#737373" }}>
            Are you sure you want to remove <strong style={{ color: "#1a1a1a" }}>{member.name}</strong> from the team? This action cannot be undone.
          </p>

          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl text-xs font-semibold transition-colors cursor-pointer hover:bg-black/5"
              style={{ color: "#707070" }}
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(member)}
              className="px-5 py-2.5 rounded-2xl text-xs font-semibold text-white transition-all duration-200 cursor-pointer hover:opacity-90 active:scale-95"
              style={{ backgroundColor: "#ef4444" }}
            >
              Remove Member
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
