// New/Edit Project Dialog — complex form with tag inputs, image upload, collapsible advanced section
"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { X, Upload, ChevronDown, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Project, ProjectStatus, ProjectType, ProjectCategory, GalleryImage } from "./cms-data";
import { inputStyle, textareaStyle, selectStyle, labelStyle, handleFocus, handleBlur } from "./dialog-styles";

// Slug generator
function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Tag input
function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      const val = input.trim().replace(/,/g, "");
      if (val && !tags.includes(val)) {
        onChange([...tags, val]);
      }
      setInput("");
    }
    if (e.key === "Backspace" && !input && tags.length) {
      onChange(tags.slice(0, -1));
    }
  }

  function removeTag(idx: number) {
    onChange(tags.filter((_, i) => i !== idx));
  }

  return (
    <div
      className="flex flex-wrap gap-1.5 min-h-[44px] items-center cursor-text bg-card/60 border border-border rounded-2xl px-3 py-1.5 backdrop-blur-sm"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium bg-muted text-muted-foreground"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(i)}
            className="ml-0.5 cursor-pointer hover:opacity-70 text-muted-foreground"
          >
            &times;
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? (placeholder || "Type and press Enter") : ""}
        className="flex-1 min-w-[100px] bg-transparent outline-none text-[13px] text-foreground placeholder:text-muted-foreground"
      />
    </div>
  );
}

// Image upload zone
function ImageUploadZone({
  imageUrl,
  onImageChange,
  height,
}: {
  imageUrl?: string;
  onImageChange: (url: string | undefined) => void;
  height?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onImageChange(url);
    }
  }

  return (
    <div
      className="relative overflow-hidden cursor-pointer transition-colors group w-full rounded-2xl border-2 border-dashed border-border hover:border-foreground/30"
      style={{ height: height || 120 }}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white text-[12px] font-medium">Change</span>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <Upload className="h-5 w-5 text-muted-foreground/50" />
          <span className="text-[12px] text-muted-foreground">Drop image or click to upload</span>
        </div>
      )}
    </div>
  );
}

// Gallery add button — small upload trigger for gallery grid
function GalleryAddButton({ onAdd }: { onAdd: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onAdd(url);
      e.target.value = "";
    }
  }

  return (
    <div
      className="flex flex-col items-center justify-center gap-1 rounded-xl cursor-pointer transition-colors border-2 border-dashed border-border hover:border-foreground/30 h-20"
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <Plus className="h-4 w-4 text-muted-foreground/50" />
      <span className="text-[10px] text-muted-foreground">Add</span>
    </div>
  );
}

// Category options
const categoryOptions: ProjectCategory[] = [
  "Web Development",
  "Website Development",
  "Mobile Development",
  "AI & ML Solutions",
  "Custom Software",
  "Custom Software Development",
  "Web3 & Blockchain",
];

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Project, "id">) => void;
  editData?: Project | null;
}

export function ProjectDialog({ open, onClose, onSubmit, editData }: ProjectDialogProps) {
  // Basic fields
  const [title, setTitle] = useState(editData?.title || "");
  const [slug, setSlug] = useState(editData?.slug || "");
  const [slugEdited, setSlugEdited] = useState(!!editData);
  const [description, setDescription] = useState(editData?.description || "");
  const [longDescription, setLongDescription] = useState(editData?.longDescription || "");
  const [category, setCategory] = useState<ProjectCategory>(editData?.category || "Web Development");
  const [technologies, setTechnologies] = useState<string[]>(editData?.technologies ? [...editData.technologies] : []);
  const [year, setYear] = useState(editData?.year?.toString() || new Date().getFullYear().toString());
  const [thumbnail, setThumbnail] = useState<string | undefined>(editData?.image);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(editData?.galleryImages || []);
  const [client, setClient] = useState(editData?.client || "");
  const [liveUrl, setLiveUrl] = useState(editData?.link || "");
  const [githubUrl, setGithubUrl] = useState(editData?.githubLink || "");
  const [status, setStatus] = useState<ProjectStatus>(editData?.status || "draft");
  const [featured, setFeatured] = useState(editData?.featured || false);

  // Case study fields
  // TODO: Build these sections on main website project detail page during backend phase
  const [challenge, setChallenge] = useState(editData?.challenge || "");
  const [solution, setSolution] = useState(editData?.solution || "");
  const [result, setResult] = useState(editData?.result || "");
  const [highlights, setHighlights] = useState<string[]>(editData?.highlights || []);
  const [testimonialQuote, setTestimonialQuote] = useState(editData?.testimonial?.quote || "");
  const [testimonialAuthor, setTestimonialAuthor] = useState(editData?.testimonial?.author || "");
  const [testimonialRole, setTestimonialRole] = useState(editData?.testimonial?.role || "");

  // Advanced fields
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCaseStudy, setShowCaseStudy] = useState(false);
  const [projectType, setProjectType] = useState<ProjectType>(editData?.projectType || "completed");
  const [progressPercentage, setProgressPercentage] = useState(editData?.progressPercentage || 0);
  const [expectedCompletion, setExpectedCompletion] = useState(editData?.expectedCompletionDate || "");
  const [completedDate, setCompletedDate] = useState(editData?.completedDate || "");
  const [order, setOrder] = useState(editData?.order || 1);

  // Auto-generate slug from title
  function handleTitleChange(val: string) {
    setTitle(val);
    if (!slugEdited) {
      setSlug(toSlug(val));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !slug.trim() || technologies.length === 0) return;

    onSubmit({
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim(),
      longDescription: longDescription.trim() || undefined,
      category,
      technologies,
      year: parseInt(year) || new Date().getFullYear(),
      image: thumbnail,
      images: galleryImages.length > 0 ? galleryImages.map((g) => g.url) : undefined,
      galleryImages: galleryImages.length > 0 ? galleryImages : undefined,
      status,
      featured,
      projectType,
      progressPercentage: projectType === "ongoing" ? progressPercentage : undefined,
      client: client.trim() || undefined,
      link: liveUrl.trim() || undefined,
      githubLink: githubUrl.trim() || undefined,
      completedDate: projectType === "completed" && completedDate ? completedDate : undefined,
      expectedCompletionDate: projectType === "ongoing" && expectedCompletion ? expectedCompletion : undefined,
      order,
      // Case study fields
      challenge: challenge.trim() || undefined,
      solution: solution.trim() || undefined,
      result: result.trim() || undefined,
      highlights: highlights.length > 0 ? highlights : undefined,
      testimonial: testimonialQuote.trim()
        ? { quote: testimonialQuote.trim(), author: testimonialAuthor.trim(), role: testimonialRole.trim() }
        : undefined,
    });
    onClose();
  }

  const valid = title.trim() && slug.trim() && description.trim() && technologies.length > 0;
  const dialogTitle = editData ? "Edit Project" : "New Project";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={dialogTitle}
            className="w-[90vw] max-w-[560px]"
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "24px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              padding: "32px",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold" style={{ color: "#1a1a1a" }}>{dialogTitle}</h2>
              <button
                onClick={onClose}
                className="flex items-center justify-center h-8 w-8 rounded-full transition-all cursor-pointer"
                style={{ backgroundColor: "rgba(0,0,0,0.04)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)")}
              >
                <X className="h-4 w-4" style={{ color: "#737373" }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Title */}
              <div>
                <label style={labelStyle}>Title <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Project title..."
                  maxLength={100}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  autoFocus
                />
              </div>

              {/* Slug */}
              <div>
                <label style={labelStyle}>Slug <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => { setSlug(toSlug(e.target.value)); setSlugEdited(true); }}
                  placeholder="auto-generated-from-title"
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description <span style={{ color: "#ef4444" }}>*</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description for cards..."
                  rows={3}
                  maxLength={500}
                  style={textareaStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              {/* Long Description */}
              <div>
                <label style={labelStyle}>Long Description</label>
                <textarea
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
                  placeholder="Full case study / details..."
                  rows={4}
                  maxLength={5000}
                  style={textareaStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              {/* Category + Year */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Category <span style={{ color: "#ef4444" }}>*</span></label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as ProjectCategory)} style={selectStyle} onFocus={handleFocus} onBlur={handleBlur}>
                    {categoryOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Year <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="text" value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="2026" maxLength={4} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                </div>
              </div>

              {/* Technologies */}
              <div>
                <label style={labelStyle}>Technologies <span style={{ color: "#ef4444" }}>*</span></label>
                <TagInput tags={technologies} onChange={setTechnologies} placeholder="Next.js, React, Node.js..." />
              </div>

              {/* Thumbnail */}
              <div>
                <label style={labelStyle}>Thumbnail <span style={{ color: "#ef4444" }}>*</span></label>
                <ImageUploadZone imageUrl={thumbnail} onImageChange={setThumbnail} />
              </div>

              {/* Gallery Images — Rich editor with caption & alt per image */}
              {/* TODO: Build gallery with captions on main website project detail page during backend phase */}
              {/* Currently: main website ProjectImageGallery only shows images[] with no captions */}
              {/* Improvement: Each image should display its caption below it on the detail page */}
              <div>
                <label style={labelStyle}>Gallery Images</label>
                <p className="text-[11px] mb-2" style={{ color: "#737373", marginTop: "-2px" }}>
                  Add images with captions to showcase project details
                </p>
                <div className="flex flex-col gap-2.5">
                  {galleryImages.map((item, idx) => (
                    <div
                      key={`gallery-${idx}`}
                      className="flex gap-3 p-2.5 rounded-xl"
                      style={{ border: "1px solid #dddddd", backgroundColor: "rgba(245,244,242,0.5)" }}
                    >
                      {/* Image preview */}
                      <div
                        className="relative flex-shrink-0 rounded-lg overflow-hidden group cursor-pointer"
                        style={{ width: 72, height: 72, border: "1px solid #eee" }}
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              const url = URL.createObjectURL(file);
                              const updated = [...galleryImages];
                              updated[idx] = { ...updated[idx], url };
                              setGalleryImages(updated);
                            }
                          };
                          input.click();
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.url} alt={item.alt || `Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-[10px] font-medium">Change</span>
                        </div>
                      </div>

                      {/* Caption & Alt inputs */}
                      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                        <input
                          type="text"
                          value={item.caption || ""}
                          onChange={(e) => {
                            const updated = [...galleryImages];
                            updated[idx] = { ...updated[idx], caption: e.target.value };
                            setGalleryImages(updated);
                          }}
                          placeholder="Caption (e.g. Dashboard overview)"
                          className="w-full text-[12px] outline-none px-3 py-1.5 rounded-lg"
                          style={{ backgroundColor: "rgba(255,255,255,0.8)", border: "1px solid #e5e5e5", color: "#1a1a1a" }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = "#f3350c")}
                          onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e5e5")}
                        />
                        <input
                          type="text"
                          value={item.alt || ""}
                          onChange={(e) => {
                            const updated = [...galleryImages];
                            updated[idx] = { ...updated[idx], alt: e.target.value };
                            setGalleryImages(updated);
                          }}
                          placeholder="Alt text for accessibility & SEO"
                          className="w-full text-[11px] outline-none px-3 py-1.5 rounded-lg"
                          style={{ backgroundColor: "rgba(255,255,255,0.6)", border: "1px solid #eeeeee", color: "#666" }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = "#f3350c")}
                          onBlur={(e) => (e.currentTarget.style.borderColor = "#eeeeee")}
                        />
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => setGalleryImages(galleryImages.filter((_, i) => i !== idx))}
                        className="flex-shrink-0 self-center h-7 w-7 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                        style={{ backgroundColor: "rgba(0,0,0,0.04)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)")}
                      >
                        <Trash2 className="h-3.5 w-3.5" style={{ color: "#737373" }} />
                      </button>
                    </div>
                  ))}
                  {/* Add image */}
                  <GalleryAddButton
                    onAdd={(url) => setGalleryImages([...galleryImages, { url }])}
                  />
                </div>
              </div>

              {/* Client */}
              <div>
                <label style={labelStyle}>Client</label>
                <input type="text" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Company name" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
              </div>

              {/* Live URL + GitHub URL */}
              {/* TODO (Backend phase — main website): */}
              {/* - Portfolio LISTING page: NO external links. Only "View Case Study" → /portfolio/[slug] */}
              {/* - Portfolio DETAIL page: Show screenshots & case study first. Optional small */}
              {/*   "Visit Live Site" link at BOTTOM with target="_blank" rel="noopener noreferrer nofollow" */}
              {/* - Only show live link if site still represents our work (hasn't been redesigned) */}
              {/* - GitHub link: same treatment — only on detail page, never on listing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Live Site URL</label>
                  <input type="url" value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} placeholder="https://project.example.com" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                  <p className="text-[10px] mt-1" style={{ color: "#737373" }}>Shown only on detail page, not listing</p>
                </div>
                <div>
                  <label style={labelStyle}>GitHub URL</label>
                  <input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/org/repo" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                  <p className="text-[10px] mt-1" style={{ color: "#737373" }}>Shown only on detail page, not listing</p>
                </div>
              </div>

              {/* Case Study Section (collapsible) */}
              {/* TODO: Build these on main website project detail page during backend phase */}
              {/* Sections to build: Challenge → Solution → Result narrative, Client Testimonial, Key Highlights */}
              {/* Use ProjectContent component layout (2-col: sticky label + content) for each section */}
              {/* Wire up ProjectDetails.tsx and ProjectNavigation.tsx components (already built but unused) */}
              <div>
                <button
                  type="button"
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setShowCaseStudy(!showCaseStudy)}
                >
                  <ChevronDown
                    className="h-4 w-4 transition-transform"
                    style={{
                      color: "#707070",
                      transform: showCaseStudy ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                  <span className="text-[13px] font-semibold" style={{ color: "#707070" }}>
                    Case Study Details
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#f3350c", color: "#fff" }}>NEW</span>
                </button>

                <AnimatePresence>
                  {showCaseStudy && (
                    <motion.div
                      className="mt-4 flex flex-col gap-4"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Challenge */}
                      <div>
                        <label style={labelStyle}>Challenge / Problem</label>
                        <textarea
                          value={challenge}
                          onChange={(e) => setChallenge(e.target.value)}
                          placeholder="What problem did the client face?"
                          rows={3}
                          maxLength={2000}
                          style={textareaStyle}
                          onFocus={handleFocus}
                          onBlur={handleBlur}
                        />
                      </div>

                      {/* Solution */}
                      <div>
                        <label style={labelStyle}>Solution / Approach</label>
                        <textarea
                          value={solution}
                          onChange={(e) => setSolution(e.target.value)}
                          placeholder="How did we solve it?"
                          rows={3}
                          maxLength={2000}
                          style={textareaStyle}
                          onFocus={handleFocus}
                          onBlur={handleBlur}
                        />
                      </div>

                      {/* Result */}
                      <div>
                        <label style={labelStyle}>Result / Impact</label>
                        <textarea
                          value={result}
                          onChange={(e) => setResult(e.target.value)}
                          placeholder="What was the outcome? E.g. 40% faster load times, 3x user growth..."
                          rows={3}
                          maxLength={2000}
                          style={textareaStyle}
                          onFocus={handleFocus}
                          onBlur={handleBlur}
                        />
                      </div>

                      {/* Key Highlights */}
                      <div>
                        <label style={labelStyle}>Key Highlights</label>
                        <TagInput tags={highlights} onChange={setHighlights} placeholder="Custom dashboard, Real-time analytics..." />
                      </div>

                      {/* Client Testimonial */}
                      <div
                        className="p-3 rounded-xl flex flex-col gap-2"
                        style={{ backgroundColor: "rgba(243,53,12,0.03)", border: "1px solid rgba(243,53,12,0.1)" }}
                      >
                        <label style={{ ...labelStyle, color: "#f3350c", marginBottom: 0 }}>Client Testimonial</label>
                        <textarea
                          value={testimonialQuote}
                          onChange={(e) => setTestimonialQuote(e.target.value)}
                          placeholder={`"Working with EVOLVE was a game-changer for our business..."`}
                          rows={2}
                          maxLength={1000}
                          style={{ ...textareaStyle, fontSize: "12px", fontStyle: "italic" }}
                          onFocus={handleFocus}
                          onBlur={handleBlur}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={testimonialAuthor}
                            onChange={(e) => setTestimonialAuthor(e.target.value)}
                            placeholder="Author name"
                            className="text-[12px] outline-none px-3 py-2 rounded-xl"
                            style={{ backgroundColor: "rgba(255,255,255,0.8)", border: "1px solid #e5e5e5", color: "#1a1a1a" }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = "#f3350c")}
                            onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e5e5")}
                          />
                          <input
                            type="text"
                            value={testimonialRole}
                            onChange={(e) => setTestimonialRole(e.target.value)}
                            placeholder="Role (e.g. CEO, Founder)"
                            className="text-[12px] outline-none px-3 py-2 rounded-xl"
                            style={{ backgroundColor: "rgba(255,255,255,0.8)", border: "1px solid #e5e5e5", color: "#1a1a1a" }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = "#f3350c")}
                            onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e5e5")}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Advanced Options (collapsible) */}
              <div>
                <button
                  type="button"
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <ChevronDown
                    className="h-4 w-4 transition-transform"
                    style={{
                      color: "#707070",
                      transform: showAdvanced ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                  <span className="text-[13px] font-semibold" style={{ color: "#707070" }}>
                    Advanced Options
                  </span>
                </button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      className="mt-4 flex flex-col gap-4"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label style={labelStyle}>Project Type</label>
                          <select value={projectType} onChange={(e) => setProjectType(e.target.value as ProjectType)} style={selectStyle} onFocus={handleFocus} onBlur={handleBlur}>
                            <option value="completed">Completed</option>
                            <option value="ongoing">Ongoing</option>
                          </select>
                        </div>
                        {projectType === "ongoing" && (
                          <div>
                            <label style={labelStyle}>Progress %</label>
                            <input type="number" min={0} max={100} value={progressPercentage} onChange={(e) => setProgressPercentage(Number(e.target.value))} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {projectType === "ongoing" && (
                          <div>
                            <label style={labelStyle}>Expected Completion</label>
                            <input type="text" value={expectedCompletion} onChange={(e) => setExpectedCompletion(e.target.value)} placeholder="Mar 2026" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                          </div>
                        )}
                        {projectType === "completed" && (
                          <div>
                            <label style={labelStyle}>Completed Date</label>
                            <input type="text" value={completedDate} onChange={(e) => setCompletedDate(e.target.value)} placeholder="Jan 2025" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                          </div>
                        )}
                        <div>
                          <label style={labelStyle}>Order</label>
                          <input type="number" min={1} value={order} onChange={(e) => setOrder(Number(e.target.value))} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Status + Featured */}
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)} style={selectStyle} onFocus={handleFocus} onBlur={handleBlur}>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 h-[44px]">
                  <input type="checkbox" id="proj-featured" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 accent-[#f3350c] cursor-pointer" />
                  <label htmlFor="proj-featured" className="text-[13px] font-medium cursor-pointer" style={{ color: "#4d4d4d" }}>Featured</label>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full text-[13px] font-medium transition-all border border-[#dddddd] cursor-pointer"
                  style={{ color: "#707070" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1efed")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!valid}
                  className="px-6 py-2.5 rounded-full text-[13px] font-semibold transition-all cursor-pointer"
                  style={{
                    backgroundColor: valid ? "#f3350c" : "#e0c9c6",
                    color: "#ffffff",
                    cursor: valid ? "pointer" : "not-allowed",
                  }}
                  onMouseEnter={(e) => { if (valid) e.currentTarget.style.backgroundColor = "#c82c09"; }}
                  onMouseLeave={(e) => { if (valid) e.currentTarget.style.backgroundColor = "#f3350c"; }}
                >
                  Save Project
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
