// Admin CMS page — orchestrator with 5 tabs, dialogs, and dynamic CTA
"use client";

import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GlassPillTabs } from "@/components/ui/glass-pill-tabs";
import { Plus } from "lucide-react";

import type { Project, Service, Testimonial, FAQ } from "./cms-data";
import { ProjectsTab } from "./projects-tab";
import { ServicesTab } from "./services-tab";
import { InquiriesTab } from "./inquiries-tab";
import { TestimonialsTab } from "./testimonials-tab";
import { FAQTab } from "./faq-tab";
import { SettingsTab } from "./settings-tab";
import { ToastProvider, useToast } from "./toast";
import { DeleteConfirmDialog, FAQDialog, TestimonialDialog, ServiceDialog } from "./cms-dialogs";
import { ProjectDialog } from "./project-dialog";

const tabs = [
  { label: "Projects", value: "projects" },
  { label: "Services", value: "services" },
  { label: "Inquiries", value: "inquiries" },
  { label: "Testimonials", value: "testimonials" },
  { label: "FAQ", value: "faq" },
  { label: "Settings", value: "settings" },
];

// CTA config per tab
const ctaConfig: Record<string, { label: string; mobileLabel: string } | null> = {
  projects: { label: "+ New Project", mobileLabel: "+" },
  services: { label: "+ New Service", mobileLabel: "+" },
  inquiries: null,
  testimonials: { label: "+ New Testimonial", mobileLabel: "+" },
  faq: { label: "+ New FAQ", mobileLabel: "+" },
  settings: null,
};

// DeleteTarget carries API path + success callback
interface DeleteTarget {
  type: string;
  name?: string;
  apiPath: string;
  onSuccess: () => void;
}

// Outer wrapper provides toast context to all child tabs + dialogs
export function CMSPageClient() {
  return (
    <ToastProvider>
      <CMSInner />
    </ToastProvider>
  );
}

function CMSInner() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "projects";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Refresh keys — increment to trigger refetch in corresponding tab
  const [projectsKey, setProjectsKey] = useState(0);
  const [servicesKey, setServicesKey] = useState(0);
  const [testimonialsKey, setTestimonialsKey] = useState(0);
  const [faqKey, setFaqKey] = useState(0);

  // Dialog states
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [testimonialDialogOpen, setTestimonialDialogOpen] = useState(false);
  const [editTestimonial, setEditTestimonial] = useState<Testimonial | null>(null);
  const [faqDialogOpen, setFaqDialogOpen] = useState(false);
  const [editFaq, setEditFaq] = useState<FAQ | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", val);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // CTA button label config
  const cta = useMemo(() => ctaConfig[activeTab], [activeTab]);

  function handleCTA() {
    switch (activeTab) {
      case "projects":
        setEditProject(null);
        setProjectDialogOpen(true);
        break;
      case "services":
        setEditService(null);
        setServiceDialogOpen(true);
        break;
      case "testimonials":
        setEditTestimonial(null);
        setTestimonialDialogOpen(true);
        break;
      case "faq":
        setEditFaq(null);
        setFaqDialogOpen(true);
        break;
    }
  }

  // Store apiPath + onSuccess, then open confirm dialog
  function openDelete(type: string, name: string | undefined, apiPath: string, onSuccess: () => void) {
    setDeleteTarget({ type, name, apiPath, onSuccess });
    setDeleteDialogOpen(true);
  }

  // Called when user confirms delete
  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteDialogOpen(false);
    try {
      const res = await fetch(deleteTarget.apiPath, { method: "DELETE" });
      if (!res.ok) throw new Error();
      deleteTarget.onSuccess();
      toast("Deleted successfully");
    } catch {
      toast("Delete failed", "error");
    }
    setDeleteTarget(null);
  }

  // Submit handler factory — POST for new items, PUT for edits
  function makeSubmitHandler<T extends object>(
    editItem: { id: string } | null,
    basePath: string,
    onSuccess: () => void,
    closeDialog: () => void,
    label: string
  ) {
    return async (data: T) => {
      try {
        const url = editItem ? `${basePath}/${editItem.id}` : basePath;
        const method = editItem ? "PUT" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        closeDialog();
        onSuccess();
        toast(editItem ? `${label} updated` : `${label} created`);
      } catch {
        toast("Save failed", "error");
      }
    };
  }

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="text-2xl sm:text-[2rem] font-semibold leading-tight" style={{ color: "#1a1a1a" }}>
            CMS
          </h1>
          <p className="text-sm mt-1" style={{ color: "#737373" }}>
            Manage website content, inquiries and portfolio
          </p>
        </div>

        {/* Dynamic CTA button */}
        {cta && (
          <button
            onClick={handleCTA}
            className="flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium transition-all cursor-pointer sm:px-5 sm:py-2"
            style={{ backgroundColor: "#f3350c", color: "#ffffff" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#c82c09")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f3350c")}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{cta.label.replace("+ ", "")}</span>
          </button>
        )}
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <GlassPillTabs
          tabs={tabs}
          activeValue={activeTab}
          onChange={handleTabChange}
          layoutId="admin-cms-tabs"
          variant="subtle"
          size="md"
        />
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {activeTab === "projects" && (
            <ProjectsTab
              refreshKey={projectsKey}
              onNewProject={() => { setEditProject(null); setProjectDialogOpen(true); }}
              onEditProject={(p) => { setEditProject(p); setProjectDialogOpen(true); }}
              onDeleteProject={(p) => openDelete("Project", p.title, `/api/admin/projects/${p.id}`, () => setProjectsKey((k) => k + 1))}
            />
          )}
          {activeTab === "services" && (
            <ServicesTab
              refreshKey={servicesKey}
              onNewService={() => { setEditService(null); setServiceDialogOpen(true); }}
              onEditService={(s) => { setEditService(s); setServiceDialogOpen(true); }}
              onDeleteService={(s) => openDelete("Service", s.title, `/api/admin/services/${s.id}`, () => setServicesKey((k) => k + 1))}
            />
          )}
          {activeTab === "inquiries" && <InquiriesTab />}
          {activeTab === "testimonials" && (
            <TestimonialsTab
              refreshKey={testimonialsKey}
              onNewTestimonial={() => { setEditTestimonial(null); setTestimonialDialogOpen(true); }}
              onEditTestimonial={(t) => { setEditTestimonial(t); setTestimonialDialogOpen(true); }}
              onDeleteTestimonial={(t) => openDelete("Testimonial", t.author, `/api/admin/testimonials/${t.id}`, () => setTestimonialsKey((k) => k + 1))}
            />
          )}
          {activeTab === "faq" && (
            <FAQTab
              refreshKey={faqKey}
              onNewFAQ={() => { setEditFaq(null); setFaqDialogOpen(true); }}
              onEditFAQ={(f) => { setEditFaq(f); setFaqDialogOpen(true); }}
              onDeleteFAQ={(f) => openDelete("FAQ", f.question, `/api/admin/faq/${f.id}`, () => setFaqKey((k) => k + 1))}
            />
          )}
          {activeTab === "settings" && <SettingsTab />}
        </motion.div>
      </AnimatePresence>

      {/* Dialogs — key forces remount with fresh state when editing different items */}
      <ProjectDialog
        key={editProject?.id || "new-project"}
        open={projectDialogOpen}
        onClose={() => setProjectDialogOpen(false)}
        onSubmit={makeSubmitHandler(editProject, "/api/admin/projects", () => setProjectsKey((k) => k + 1), () => setProjectDialogOpen(false), "Project")}
        editData={editProject}
      />
      <ServiceDialog
        key={editService?.id || "new-service"}
        open={serviceDialogOpen}
        onClose={() => setServiceDialogOpen(false)}
        onSubmit={makeSubmitHandler(editService, "/api/admin/services", () => setServicesKey((k) => k + 1), () => setServiceDialogOpen(false), "Service")}
        editData={editService}
      />
      <TestimonialDialog
        key={editTestimonial?.id || "new-testimonial"}
        open={testimonialDialogOpen}
        onClose={() => setTestimonialDialogOpen(false)}
        onSubmit={makeSubmitHandler(editTestimonial, "/api/admin/testimonials", () => setTestimonialsKey((k) => k + 1), () => setTestimonialDialogOpen(false), "Testimonial")}
        editData={editTestimonial}
      />
      <FAQDialog
        key={editFaq?.id || "new-faq"}
        open={faqDialogOpen}
        onClose={() => setFaqDialogOpen(false)}
        onSubmit={makeSubmitHandler(editFaq, "/api/admin/faq", () => setFaqKey((k) => k + 1), () => setFaqDialogOpen(false), "FAQ")}
        editData={editFaq}
      />
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setDeleteTarget(null); }}
        onConfirm={handleDeleteConfirm}
        itemType={deleteTarget?.type || "Item"}
        itemName={deleteTarget?.name}
      />
    </div>
  );
}
