// Services tab — stats, sortable service list, reorder mode
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  Globe,
  FileX,
  Star,
  GripVertical,
  Smartphone,
  Brain,
  Code,
  Blocks,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  type Service,
  type ServiceStatus,
  serviceStatusConfig,
} from "./cms-data";
import { useToast } from "./toast";
import { StatCard, StatusBadge, MoreMenu, EmptyState } from "./cms-shared";

// Icon map for services
const serviceIconMap: Record<string, LucideIcon> = {
  Globe,
  Smartphone,
  Brain,
  Code,
  Blocks,
};

interface ServicesTabProps {
  onNewService: () => void;
  onEditService: (service: Service) => void;
  onDeleteService: (service: Service) => void;
  refreshKey?: number;
}

export function ServicesTab({ onNewService, onEditService, onDeleteService, refreshKey }: ServicesTabProps) {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [reorderList, setReorderList] = useState<Service[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Fetch services from API
  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/services?page=1&limit=50");
      if (!res.ok) throw new Error("Failed to load services");
      const data = await res.json();
      setServices(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load services");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices, refreshKey]);

  // Stats
  const stats = useMemo(() => {
    const total = services.length;
    const published = services.filter((s) => s.status === "published").length;
    const draft = services.filter((s) => s.status === "draft").length;
    const featured = services.filter((s) => s.featured).length;
    return { total, published, draft, featured };
  }, [services]);

  // Sorted by order
  const sorted = useMemo(() => [...services].sort((a, b) => a.order - b.order), [services]);

  // Enter reorder mode
  function startReorder() {
    setReorderList([...sorted]);
    setReorderMode(true);
  }

  // Cancel reorder
  function cancelReorder() {
    setReorderMode(false);
    setReorderList([]);
    setDragIdx(null);
  }

  // Save new order via API
  async function saveReorder() {
    const ordered = reorderList.map((s, i) => ({ ...s, order: i + 1 }));
    try {
      const res = await fetch("/api/admin/services/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: ordered.map((s) => ({ id: s.id, order: s.order })) }),
      });
      if (!res.ok) throw new Error();
      setServices(ordered);
      setReorderMode(false);
      setReorderList([]);
      setDragIdx(null);
      toast("Order saved");
    } catch {
      toast("Failed to save order", "error");
    }
  }

  // Drag handlers
  function handleDragStart(idx: number) {
    setDragIdx(idx);
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const newList = [...reorderList];
    const [moved] = newList.splice(dragIdx, 1);
    newList.splice(idx, 0, moved);
    setReorderList(newList);
    setDragIdx(idx);
  }

  function handleDragEnd() {
    setDragIdx(null);
  }

  // Toggle featured — optimistic + API
  async function toggleFeatured(id: string) {
    const svc = services.find((s) => s.id === id);
    if (!svc) return;
    const nextFeatured = !svc.featured;
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, featured: nextFeatured } : s)));
    try {
      const { id: _id, ...body } = svc;
      const res = await fetch(`/api/admin/services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, featured: nextFeatured }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, featured: svc.featured } : s)));
      toast("Failed to update featured", "error");
    }
  }

  // Toggle status — optimistic + API
  async function toggleStatus(id: string) {
    const svc = services.find((s) => s.id === id);
    if (!svc) return;
    const next: ServiceStatus = svc.status === "published" ? "draft" : "published";
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, status: next } : s)));
    try {
      const { id: _id, ...body } = svc;
      const res = await fetch(`/api/admin/services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, status: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, status: svc.status } : s)));
      toast("Failed to update status", "error");
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-[20px] border border-[#dddddd] h-24 animate-pulse" style={{ backgroundColor: "rgba(241,239,237,0.45)" }} />
          ))}
        </div>
        <div className="rounded-[24px] border border-[#dddddd] h-64 animate-pulse" style={{ backgroundColor: "rgba(241,239,237,0.45)" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[24px] border border-[#dddddd] p-12 text-center" style={{ backgroundColor: "rgba(241,239,237,0.45)" }}>
        <p className="text-sm font-medium mb-3" style={{ color: "#f3350c" }}>{error}</p>
        <button onClick={fetchServices} className="px-4 py-2 rounded-full text-sm font-medium cursor-pointer" style={{ backgroundColor: "#0a0a0a", color: "#ffffff" }}>
          Retry
        </button>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No services yet"
        description="Add your first service offering to display on the website"
        actionLabel="+ New Service"
        onAction={onNewService}
      />
    );
  }

  const displayList = reorderMode ? reorderList : sorted;

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} iconColor="#f3350c" iconBg="rgba(243,53,12,0.1)" label="Total Services" value={stats.total} description="All services" index={0} />
        <StatCard icon={Globe} iconColor="#22c55e" iconBg="rgba(34,197,94,0.1)" label="Published" value={stats.published} description="Visible on site" index={1} />
        <StatCard icon={FileX} iconColor="#f59e0b" iconBg="rgba(245,158,11,0.1)" label="Draft" value={stats.draft} description="Hidden" index={2} />
        <StatCard icon={Star} iconColor="#8b5cf6" iconBg="rgba(139,92,246,0.1)" label="Featured" value={stats.featured} description="Highlighted" index={3} />
      </div>

      {/* Service list card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative overflow-hidden backdrop-blur-lg border border-[#dddddd]"
        style={{ backgroundColor: "rgba(241,239,237,0.45)", borderRadius: "24px" }}
      >
        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: "#1a1a1a" }}>
              Services on evolve.agency
            </h3>
            {!reorderMode ? (
              <button
                onClick={startReorder}
                className="text-[13px] font-medium cursor-pointer transition-colors hover:underline"
                style={{ color: "#f3350c" }}
              >
                Reorder
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelReorder}
                  className="px-4 py-1.5 rounded-full text-[13px] font-medium border border-[#dddddd] cursor-pointer transition-colors"
                  style={{ color: "#707070" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1efed")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Cancel
                </button>
                <button
                  onClick={saveReorder}
                  className="px-4 py-1.5 rounded-full text-[13px] font-semibold cursor-pointer transition-colors"
                  style={{ backgroundColor: "#f3350c", color: "#ffffff" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#c82c09")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f3350c")}
                >
                  Save
                </button>
              </div>
            )}
          </div>

          {/* Service rows */}
          {displayList.map((service, i) => {
            const IconComp = serviceIconMap[service.icon] || Globe;
            const statusCfg = serviceStatusConfig[service.status];

            return (
              <div
                key={service.id}
                draggable={reorderMode}
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                className="flex items-start sm:items-center gap-3 sm:gap-4 py-4 transition-colors"
                style={{
                  borderBottom: i < displayList.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                  backgroundColor: dragIdx === i && reorderMode ? "rgba(0,0,0,0.03)" : "transparent",
                  cursor: reorderMode ? "grab" : "default",
                }}
                onMouseEnter={(e) => {
                  if (!reorderMode) e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.02)";
                }}
                onMouseLeave={(e) => {
                  if (!reorderMode && dragIdx !== i) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {/* Drag handle */}
                {reorderMode && (
                  <GripVertical className="h-3.5 w-3.5 shrink-0 mt-1" style={{ color: "#b6b6b6" }} />
                )}

                {/* Number */}
                <span
                  className="text-xl font-bold shrink-0 w-8 text-right"
                  style={{ color: "#f3350c" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                {/* Icon */}
                <IconComp className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#707070" }} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold" style={{ color: "#1a1a1a" }}>
                    {service.title}
                  </p>
                  {/* Features */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(service.features || service.tags || []).slice(0, 4).map((f) => (
                      <span
                        key={f}
                        className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                        style={{ backgroundColor: "#f1efed", color: "#4d4d4d" }}
                      >
                        {f}
                      </span>
                    ))}
                    {(service.features || service.tags || []).length > 4 && (
                      <span
                        className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                        style={{ backgroundColor: "#f1efed", color: "#737373" }}
                      >
                        +{(service.features || service.tags || []).length - 4} more
                      </span>
                    )}
                  </div>
                  {/* Status badges */}
                  <div className="flex gap-1.5 mt-2">
                    <StatusBadge {...statusCfg} />
                    {service.featured && (
                      <StatusBadge dot="#8b5cf6" bg="rgba(139,92,246,0.1)" text="#8b5cf6" label="Featured" icon={Star} />
                    )}
                  </div>
                </div>

                {/* Actions (hidden in reorder mode) */}
                {!reorderMode && (
                  <ServiceActions
                    service={service}
                    onEdit={() => onEditService(service)}
                    onDelete={() => onDeleteService(service)}
                    onToggleFeatured={() => toggleFeatured(service.id)}
                    onToggleStatus={() => toggleStatus(service.id)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// Service row actions
function ServiceActions({
  service,
  onEdit,
  onDelete,
  onToggleFeatured,
  onToggleStatus,
}: {
  service: Service;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFeatured: () => void;
  onToggleStatus: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        onClick={onEdit}
        className="px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer"
        style={{ backgroundColor: "rgba(0,0,0,0.04)", color: "#4d4d4d" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.08)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)")}
      >
        Edit
      </button>
      <MoreMenu
        open={menuOpen}
        onToggle={() => setMenuOpen(!menuOpen)}
        items={[
          { label: service.featured ? "Remove Featured" : "Set Featured", onClick: onToggleFeatured },
          { label: service.status === "published" ? "Set Draft" : "Set Published", onClick: onToggleStatus },
          { label: "Delete", onClick: onDelete, destructive: true },
        ]}
      />
    </div>
  );
}
