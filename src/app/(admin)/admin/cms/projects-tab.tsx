// Projects tab — stats, toolbar, grid/list views
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FolderKanban,
  Globe,
  FileEdit,
  Star,
  ImageIcon,
  LayoutGrid,
  List,
  Timer,
  ExternalLink,
} from "lucide-react";
import {
  type Project,
  type ProjectStatus,
  projectStatusConfig,
  categoryColors,
  categoryOptions,
  projectStatusOptions,
} from "./cms-data";
import { useToast } from "./toast";
import {
  StatCard,
  StatusBadge,
  FilterDropdown,
  SearchInput,
  MoreMenu,
  EmptyState,
} from "./cms-shared";

interface ProjectsTabProps {
  onNewProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  refreshKey?: number;
}

export function ProjectsTab({ onNewProject, onEditProject, onDeleteProject, refreshKey }: ProjectsTabProps) {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch projects from API
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/projects?page=1&limit=20");
      if (!res.ok) throw new Error("Failed to load projects");
      const data = await res.json();
      setProjects(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects, refreshKey]);

  // Computed stats
  const stats = useMemo(() => {
    const total = projects.length;
    const published = projects.filter((p) => p.status === "published").length;
    const drafts = projects.filter((p) => p.status === "draft").length;
    const featured = projects.filter((p) => p.featured).length;
    return { total, published, drafts, featured };
  }, [projects]);

  // Filtered projects
  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.technologies.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [projects, search, categoryFilter, statusFilter]);

  // Toggle featured — optimistic update + API call
  async function toggleFeatured(id: string) {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const nextFeatured = !project.featured;
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, featured: nextFeatured } : p)));
    try {
      const { id: _id, ...body } = project;
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, featured: nextFeatured }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, featured: project.featured } : p)));
      toast("Failed to update featured", "error");
    }
  }

  // Toggle status — optimistic update + API call
  async function toggleStatus(id: string) {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const next: ProjectStatus =
      project.status === "published" ? "draft" : project.status === "draft" ? "published" : project.status;
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status: next } : p)));
    try {
      const { id: _id, ...body } = project;
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, status: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status: project.status } : p)));
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
        <div className="grid md:grid-cols-2 gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-[24px] border border-[#dddddd] h-64 animate-pulse" style={{ backgroundColor: "rgba(241,239,237,0.45)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[24px] border border-[#dddddd] p-12 text-center" style={{ backgroundColor: "rgba(241,239,237,0.45)" }}>
        <p className="text-sm font-medium mb-3" style={{ color: "#f3350c" }}>{error}</p>
        <button onClick={fetchProjects} className="px-4 py-2 rounded-full text-sm font-medium cursor-pointer" style={{ backgroundColor: "#0a0a0a", color: "#ffffff" }}>
          Retry
        </button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="No projects yet"
        description="Create your first portfolio project to showcase on evolve.agency"
        actionLabel="+ New Project"
        onAction={onNewProject}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} iconColor="#f3350c" iconBg="rgba(243,53,12,0.1)" label="Total Projects" value={stats.total} description="All projects" index={0} />
        <StatCard icon={Globe} iconColor="#22c55e" iconBg="rgba(34,197,94,0.1)" label="Published" value={stats.published} description="Live on site" index={1} />
        <StatCard icon={FileEdit} iconColor="#f59e0b" iconBg="rgba(245,158,11,0.1)" label="Drafts" value={stats.drafts} description="Not published" index={2} />
        <StatCard icon={Star} iconColor="#8b5cf6" iconBg="rgba(139,92,246,0.1)" label="Featured" value={stats.featured} description="Highlighted" index={3} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* View toggle */}
        <div
          className="inline-flex items-center rounded-full p-1 gap-0.5"
          style={{ backgroundColor: "rgba(0,0,0,0.04)" }}
        >
          {(["grid", "list"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: viewMode === mode ? "#0a0a0a" : "transparent",
                color: viewMode === mode ? "#ffffff" : "#707070",
              }}
            >
              {mode === "grid" ? <LayoutGrid className="h-3 w-3" /> : <List className="h-3 w-3" />}
              <span className="hidden sm:inline">{mode === "grid" ? "Grid" : "List"}</span>
            </button>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <SearchInput value={search} onChange={setSearch} placeholder="Search projects..." />
          <div className="hidden sm:block">
            <FilterDropdown label="Category" value={categoryFilter} options={categoryOptions} onChange={setCategoryFilter} />
          </div>
          <div className="hidden sm:block">
            <FilterDropdown label="Status" value={statusFilter} options={projectStatusOptions} onChange={setStatusFilter} />
          </div>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div
          className="rounded-[24px] border border-[#dddddd] backdrop-blur-lg p-12 text-center"
          style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
        >
          <p className="text-sm" style={{ color: "#737373" }}>
            No projects match your filters
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid md:grid-cols-2 gap-5">
          {filtered.map((project, i) => (
            <ProjectGridCard
              key={project.id}
              project={project}
              index={i}
              onEdit={() => onEditProject(project)}
              onDelete={() => onDeleteProject(project)}
              onToggleFeatured={() => toggleFeatured(project.id)}
              onToggleStatus={() => toggleStatus(project.id)}
            />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative overflow-hidden backdrop-blur-lg border border-[#dddddd]"
          style={{ backgroundColor: "rgba(241,239,237,0.45)", borderRadius: "24px" }}
        >
          <div className="p-5 sm:p-6">
          {filtered.map((project, i) => (
            <ProjectListRow
              key={project.id}
              project={project}
              index={i}
              onEdit={() => onEditProject(project)}
              onDelete={() => onDeleteProject(project)}
              onToggleFeatured={() => toggleFeatured(project.id)}
              onToggleStatus={() => toggleStatus(project.id)}
            />
          ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Project grid card
function ProjectGridCard({
  project,
  index,
  onEdit,
  onDelete,
  onToggleFeatured,
  onToggleStatus,
}: {
  project: Project;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFeatured: () => void;
  onToggleStatus: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const statusCfg = projectStatusConfig[project.status];
  const catCfg = categoryColors[project.category] || { bg: "rgba(0,0,0,0.06)", text: "#707070" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-[24px] overflow-hidden backdrop-blur-lg border border-[#dddddd] transition-all duration-200 hover:border-[#bbbbbb] hover:shadow-sm"
      style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
    >
      {/* Thumbnail */}
      <div className="aspect-video w-full flex items-center justify-center" style={{ backgroundColor: "#f1efed" }}>
        {project.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="h-12 w-12" style={{ color: "#dddddd" }} />
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-base font-semibold line-clamp-2" style={{ color: "#1a1a1a" }}>
          {project.title}
        </h3>

        {/* Category */}
        <span
          className="inline-block mt-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full"
          style={{ backgroundColor: catCfg.bg, color: catCfg.text }}
        >
          {project.category}
        </span>

        {/* Tech stack */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {project.technologies.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: "#f1efed", color: "#4d4d4d" }}
            >
              {tech}
            </span>
          ))}
          {project.technologies.length > 4 && (
            <span
              className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: "#f1efed", color: "#737373" }}
            >
              +{project.technologies.length - 4} more
            </span>
          )}
        </div>

        {/* Year */}
        <p className="text-xs mt-1.5" style={{ color: "#b6b6b6" }}>
          {project.year}
        </p>

        {/* Status badges */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <StatusBadge {...statusCfg} />
          {project.featured && (
            <StatusBadge dot="#8b5cf6" bg="rgba(139,92,246,0.1)" text="#8b5cf6" label="Featured" icon={Star} />
          )}
          {project.projectType === "ongoing" && project.progressPercentage != null && (
            <StatusBadge
              dot="#3b82f6"
              bg="rgba(59,130,246,0.1)"
              text="#3b82f6"
              label={`${project.progressPercentage}%`}
              icon={Timer}
            />
          )}
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-2 mt-3 pt-3"
          style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}
        >
          <button
            onClick={onEdit}
            className="px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer"
            style={{ backgroundColor: "rgba(0,0,0,0.04)", color: "#4d4d4d" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)")}
          >
            Edit
          </button>
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-1"
              style={{ backgroundColor: "rgba(0,0,0,0.04)", color: "#4d4d4d" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)")}
            >
              Preview <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <div className="ml-auto">
            <MoreMenu
              open={menuOpen}
              onToggle={() => setMenuOpen(!menuOpen)}
              items={[
                { label: project.featured ? "Remove Featured" : "Set Featured", onClick: onToggleFeatured },
                { label: project.status === "published" ? "Set Draft" : "Set Published", onClick: onToggleStatus },
                { label: "Delete", onClick: onDelete, destructive: true },
              ]}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Project list row
function ProjectListRow({
  project,
  index,
  onEdit,
  onDelete,
  onToggleFeatured,
  onToggleStatus,
}: {
  project: Project;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFeatured: () => void;
  onToggleStatus: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const statusCfg = projectStatusConfig[project.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex items-center gap-4 py-4 transition-colors cursor-default"
      style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.02)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
    >
      {/* Thumbnail */}
      <div
        className="w-20 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
        style={{ backgroundColor: "#f1efed" }}
      >
        {project.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="h-6 w-6" style={{ color: "#dddddd" }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "#1a1a1a" }}>
          {project.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs" style={{ color: "#707070" }}>
            {project.year}
          </span>
          <span className="text-xs" style={{ color: "#b6b6b6" }}>
            ·
          </span>
          <StatusBadge {...statusCfg} />
          {project.featured && (
            <StatusBadge dot="#8b5cf6" bg="rgba(139,92,246,0.1)" text="#8b5cf6" label="Featured" icon={Star} />
          )}
        </div>
      </div>

      {/* Category (hidden mobile) */}
      <span className="hidden md:block text-xs font-medium shrink-0" style={{ color: "#707070" }}>
        {project.category}
      </span>

      {/* Tech tags (hidden mobile) */}
      <div className="hidden lg:flex gap-1 shrink-0">
        {project.technologies.slice(0, 3).map((tech) => (
          <span key={tech} className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "#f1efed", color: "#4d4d4d" }}>
            {tech}
          </span>
        ))}
      </div>

      {/* Actions */}
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
            { label: project.featured ? "Remove Featured" : "Set Featured", onClick: onToggleFeatured },
            { label: project.status === "published" ? "Set Draft" : "Set Published", onClick: onToggleStatus },
            { label: "Delete", onClick: onDelete, destructive: true },
          ]}
        />
      </div>
    </motion.div>
  );
}
