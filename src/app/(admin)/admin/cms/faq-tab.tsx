// FAQ tab — stats, sortable list, reorder mode
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { HelpCircle, Globe, GripVertical } from "lucide-react";
import { type FAQ } from "./cms-data";
import { useToast } from "./toast";
import { cn } from "@/lib/utils";
import { StatCard, MoreMenu, EmptyState } from "./cms-shared";

interface FAQTabProps {
  onNewFAQ: () => void;
  onEditFAQ: (faq: FAQ) => void;
  onDeleteFAQ: (faq: FAQ) => void;
  refreshKey?: number;
}

export function FAQTab({ onNewFAQ, onEditFAQ, onDeleteFAQ, refreshKey }: FAQTabProps) {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [reorderList, setReorderList] = useState<FAQ[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Fetch FAQs from API
  const fetchFAQs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/faq?page=1&limit=50");
      if (!res.ok) throw new Error("Failed to load FAQs");
      const data = await res.json();
      setFaqs(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs, refreshKey]);

  // Stats
  const stats = useMemo(() => {
    const total = faqs.length;
    const published = faqs.filter((f) => f.status === "published").length;
    return { total, published };
  }, [faqs]);

  // Sorted by order
  const sorted = useMemo(() => [...faqs].sort((a, b) => a.order - b.order), [faqs]);

  // Reorder handlers
  function startReorder() {
    setReorderList([...sorted]);
    setReorderMode(true);
  }

  function cancelReorder() {
    setReorderMode(false);
    setReorderList([]);
    setDragIdx(null);
  }

  // Save reorder via individual PUT calls
  async function saveReorder() {
    const ordered = reorderList.map((f, i) => ({ ...f, order: i + 1 }));
    try {
      await Promise.all(
        ordered.map((f) => {
          const { id, ...body } = f;
          return fetch(`/api/admin/faq/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        }),
      );
      setFaqs(ordered);
      setReorderMode(false);
      setReorderList([]);
      setDragIdx(null);
      toast("Order saved");
    } catch {
      toast("Failed to save order", "error");
    }
  }

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

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-[20px] border border-[#dddddd] h-24 animate-pulse" style={{ backgroundColor: "rgba(241,239,237,0.45)" }} />
          ))}
        </div>
        <div className="rounded-[24px] border border-[#dddddd] h-64 animate-pulse" style={{ backgroundColor: "rgba(241,239,237,0.45)" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[24px] border border-border p-12 text-center bg-card/50">
        <p className="text-sm font-medium mb-3 text-red-500">{error}</p>
        <button onClick={fetchFAQs} className="px-4 py-2 rounded-full text-sm font-medium cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90">
          Retry
        </button>
      </div>
    );
  }

  if (faqs.length === 0) {
    return (
      <EmptyState
        icon={HelpCircle}
        title="No FAQ items yet"
        description="Add frequently asked questions for the website"
        actionLabel="+ New FAQ"
        onAction={onNewFAQ}
      />
    );
  }

  const displayList = reorderMode ? reorderList : sorted;

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={HelpCircle} iconColor="#f3350c" iconBg="rgba(243,53,12,0.1)" label="Total FAQ" value={stats.total} description="All questions" index={0} />
        <StatCard icon={Globe} iconColor="#22c55e" iconBg="rgba(34,197,94,0.1)" label="Published" value={stats.published} description="Visible on site" index={1} />
      </div>

      {/* FAQ list card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.16, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative overflow-hidden backdrop-blur-lg border border-border bg-card/50 rounded-[24px]"
      >
        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">
              FAQ Items on evolve.agency
            </h3>
            {!reorderMode ? (
              <button
                onClick={startReorder}
                className="text-[13px] font-medium cursor-pointer transition-colors hover:underline text-primary"
              >
                Reorder
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelReorder}
                  className="px-4 py-1.5 rounded-full text-[13px] font-medium border border-border cursor-pointer transition-colors text-muted-foreground hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  onClick={saveReorder}
                  className="px-4 py-1.5 rounded-full text-[13px] font-semibold cursor-pointer transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          {/* FAQ rows */}
          {displayList.map((faq, i) => (
            <FAQRow
              key={faq.id}
              faq={faq}
              index={i}
              reorderMode={reorderMode}
              isDragging={dragIdx === i}
              isLast={i === displayList.length - 1}
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              onEdit={() => onEditFAQ(faq)}
              onDelete={() => onDeleteFAQ(faq)}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// FAQ row
function FAQRow({
  faq,
  index,
  reorderMode,
  isDragging,
  isLast,
  onDragStart,
  onDragOver,
  onDragEnd,
  onEdit,
  onDelete,
}: {
  faq: FAQ;
  index: number;
  reorderMode: boolean;
  isDragging: boolean;
  isLast: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      draggable={reorderMode}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className="flex items-start gap-3 py-4 transition-colors"
      style={{
        borderBottom: !isLast ? "1px solid rgba(0,0,0,0.05)" : "none",
        backgroundColor: isDragging && reorderMode ? "rgba(0,0,0,0.03)" : "transparent",
        cursor: reorderMode ? "grab" : "default",
      }}
      onMouseEnter={(e) => {
        if (!reorderMode) e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.02)";
      }}
      onMouseLeave={(e) => {
        if (!reorderMode && !isDragging) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {/* Drag handle */}
      {reorderMode && (
        <GripVertical className="h-3.5 w-3.5 shrink-0 mt-1" style={{ color: "#b6b6b6" }} />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: "#1a1a1a" }}>
          <span className="font-bold" style={{ color: "#f3350c" }}>
            {index + 1}.{" "}
          </span>
          <span className="font-semibold">{faq.question}</span>
        </p>
        <p className="text-[13px] line-clamp-1 mt-1" style={{ color: "#737373" }}>
          {faq.answer}
        </p>
      </div>

      {/* Actions (hidden in reorder mode) */}
      {!reorderMode && (
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
            items={[{ label: "Delete", onClick: onDelete, destructive: true }]}
          />
        </div>
      )}
    </div>
  );
}
