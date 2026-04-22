// Testimonials tab — featured card + grid
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MessageSquareQuote, Globe, Star } from "lucide-react";
import {
  type Testimonial,
  testimonialStatusConfig,
} from "./cms-data";
import { useToast } from "./toast";
import { StatCard, StatusBadge, AvatarCircle, MoreMenu, EmptyState } from "./cms-shared";

interface TestimonialsTabProps {
  onNewTestimonial: () => void;
  onEditTestimonial: (testimonial: Testimonial) => void;
  onDeleteTestimonial: (testimonial: Testimonial) => void;
  refreshKey?: number;
}

export function TestimonialsTab({
  onNewTestimonial,
  onEditTestimonial,
  onDeleteTestimonial,
  refreshKey,
}: TestimonialsTabProps) {
  const { toast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch testimonials from API
  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/testimonials?page=1&limit=50");
      if (!res.ok) throw new Error("Failed to load testimonials");
      const data = await res.json();
      setTestimonials(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials, refreshKey]);

  // Stats
  const stats = useMemo(() => {
    const total = testimonials.length;
    const published = testimonials.filter((t) => t.status === "published").length;
    const featured = testimonials.filter((t) => t.featured).length;
    return { total, published, featured };
  }, [testimonials]);

  // Featured + rest
  const featuredTestimonial = testimonials.find((t) => t.featured);
  const regularTestimonials = testimonials.filter((t) => !t.featured);

  // Toggle featured — only one can be featured at a time
  async function toggleFeatured(id: string) {
    const t = testimonials.find((x) => x.id === id);
    if (!t) return;
    const nextFeatured = !t.featured;
    setTestimonials((prev) =>
      prev.map((x) => ({ ...x, featured: x.id === id ? nextFeatured : false })),
    );
    try {
      const { id: _id, ...body } = t;
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, featured: nextFeatured }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setTestimonials((prev) =>
        prev.map((x) => ({ ...x, featured: x.id === id ? t.featured : x.featured })),
      );
      toast("Failed to update featured", "error");
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-[20px] border border-[#dddddd] h-24 animate-pulse" style={{ backgroundColor: "rgba(241,239,237,0.45)" }} />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-[24px] border border-[#dddddd] h-48 animate-pulse" style={{ backgroundColor: "rgba(241,239,237,0.45)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[24px] border border-[#dddddd] p-12 text-center" style={{ backgroundColor: "rgba(241,239,237,0.45)" }}>
        <p className="text-sm font-medium mb-3" style={{ color: "#f3350c" }}>{error}</p>
        <button onClick={fetchTestimonials} className="px-4 py-2 rounded-full text-sm font-medium cursor-pointer" style={{ backgroundColor: "#0a0a0a", color: "#ffffff" }}>
          Retry
        </button>
      </div>
    );
  }

  if (testimonials.length === 0) {
    return (
      <EmptyState
        icon={MessageSquareQuote}
        title="No testimonials yet"
        description="Add client testimonials to showcase on the homepage"
        actionLabel="+ New Testimonial"
        onAction={onNewTestimonial}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={MessageSquareQuote} iconColor="#f3350c" iconBg="rgba(243,53,12,0.1)" label="Total Testimonials" value={stats.total} description="All reviews" index={0} />
        <StatCard icon={Globe} iconColor="#22c55e" iconBg="rgba(34,197,94,0.1)" label="Published" value={stats.published} description="Visible on site" index={1} />
        <StatCard icon={Star} iconColor="#8b5cf6" iconBg="rgba(139,92,246,0.1)" label="Featured" value={stats.featured} description="Prominent display" index={2} />
      </div>

      {/* Featured testimonial */}
      {featuredTestimonial && (
        <FeaturedTestimonialCard
          testimonial={featuredTestimonial}
          onEdit={() => onEditTestimonial(featuredTestimonial)}
          onDelete={() => onDeleteTestimonial(featuredTestimonial)}
          onToggleFeatured={() => toggleFeatured(featuredTestimonial.id)}
        />
      )}

      {/* Regular testimonials grid */}
      {regularTestimonials.length > 0 && (
        <div className="grid md:grid-cols-2 gap-5">
          {regularTestimonials.map((testimonial, i) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              index={i}
              onEdit={() => onEditTestimonial(testimonial)}
              onDelete={() => onDeleteTestimonial(testimonial)}
              onToggleFeatured={() => toggleFeatured(testimonial.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Featured testimonial card
function FeaturedTestimonialCard({
  testimonial,
  onEdit,
  onDelete,
  onToggleFeatured,
}: {
  testimonial: Testimonial;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFeatured: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const statusCfg = testimonialStatusConfig[testimonial.status];
  const initials = testimonial.author
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.24, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-[24px] backdrop-blur-lg border border-[#dddddd] p-6 transition-all duration-200"
      style={{
        backgroundColor: "rgba(241,239,237,0.45)",
        borderLeft: "3px solid #f3350c",
      }}
    >
      {/* Featured label */}
      <div className="flex items-center gap-1.5 mb-3">
        <Star className="h-3 w-3" style={{ color: "#8b5cf6" }} />
        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#8b5cf6" }}>
          Featured
        </span>
      </div>

      {/* Quote */}
      <p className="text-base italic line-clamp-4" style={{ color: "#1a1a1a" }}>
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 mt-4">
        <AvatarCircle initials={initials} size={40} image={testimonial.image} />
        <div>
          <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>
            {testimonial.author}
          </p>
          <p className="text-xs" style={{ color: "#707070" }}>
            {testimonial.title}
          </p>
        </div>
      </div>

      {/* Status + actions */}
      <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
        <div className="flex items-center gap-1.5">
          <StatusBadge {...statusCfg} />
          <StatusBadge dot="#8b5cf6" bg="rgba(139,92,246,0.1)" text="#8b5cf6" label="Featured" icon={Star} />
        </div>
        <div className="flex items-center gap-1">
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
              { label: "Remove Featured", onClick: onToggleFeatured },
              { label: "Delete", onClick: onDelete, destructive: true },
            ]}
          />
        </div>
      </div>
    </motion.div>
  );
}

// Regular testimonial card
function TestimonialCard({
  testimonial,
  index,
  onEdit,
  onDelete,
  onToggleFeatured,
}: {
  testimonial: Testimonial;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFeatured: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const statusCfg = testimonialStatusConfig[testimonial.status];
  const initials = testimonial.author
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 + index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-[24px] backdrop-blur-lg border border-[#dddddd] p-5 transition-all duration-200 hover:border-[#bbbbbb] hover:shadow-sm"
      style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
    >
      {/* Quote */}
      <p className="text-sm italic line-clamp-3" style={{ color: "#4d4d4d" }}>
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-2.5 mt-3">
        <AvatarCircle initials={initials} size={32} image={testimonial.image} />
        <div>
          <p className="text-[13px] font-semibold" style={{ color: "#1a1a1a" }}>
            {testimonial.author}
          </p>
          <p className="text-xs" style={{ color: "#707070" }}>
            {testimonial.title}
          </p>
        </div>
      </div>

      {/* Status + actions */}
      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
        <StatusBadge {...statusCfg} />
        <div className="flex items-center gap-1">
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
              { label: "Set Featured", onClick: onToggleFeatured },
              { label: "Delete", onClick: onDelete, destructive: true },
            ]}
          />
        </div>
      </div>
    </motion.div>
  );
}
