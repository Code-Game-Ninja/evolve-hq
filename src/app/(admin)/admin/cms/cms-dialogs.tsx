// CMS Delete Confirm + FAQ + Testimonial + Service dialogs
"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { X, Trash2, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { FAQ, FAQStatus, Testimonial, TestimonialStatus, Service, ServiceStatus } from "./cms-data";
import {
  inputStyle,
  textareaStyle,
  selectStyle,
  labelStyle,
  handleFocus,
  handleBlur,
} from "./dialog-styles";

// Shared overlay + dialog wrapper
function DialogShell({
  open,
  onClose,
  maxWidth,
  ariaLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  maxWidth: string;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm"
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
            aria-label={ariaLabel}
            className="w-full mx-4 bg-background rounded-[24px] shadow-xl p-8 max-h-[85vh] overflow-y-auto"
            style={{ maxWidth }}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Dialog header
function DialogHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <button
        onClick={onClose}
        className="flex items-center justify-center h-8 w-8 rounded-full transition-all cursor-pointer bg-muted text-muted-foreground hover:bg-muted/80"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Footer buttons
function DialogFooter({
  onClose,
  submitLabel,
  disabled,
  destructive,
}: {
  onClose: () => void;
  submitLabel: string;
  disabled?: boolean;
  destructive?: boolean;
}) {
  const bg = destructive ? "#ef4444" : "#f3350c";
  const hoverBg = destructive ? "#dc2626" : "#c82c09";

  return (
    <div className="flex justify-end gap-3 mt-6">
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
        disabled={disabled}
        className="px-6 py-2.5 rounded-full text-[13px] font-semibold transition-all cursor-pointer"
        style={{
          backgroundColor: disabled ? "#e0c9c6" : bg,
          color: "#ffffff",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
        onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = hoverBg; }}
        onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = bg; }}
      >
        {submitLabel}
      </button>
    </div>
  );
}

// Tag input component
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
      className="flex flex-wrap gap-1.5 min-h-[44px] items-center cursor-text"
      style={{
        backgroundColor: "rgba(255,255,255,0.6)",
        border: "1px solid #dddddd",
        borderRadius: "16px",
        padding: "6px 12px",
        backdropFilter: "blur(8px)",
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium"
          style={{ backgroundColor: "#f1efed", color: "#4d4d4d" }}
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(i)}
            className="ml-0.5 cursor-pointer hover:opacity-70"
            style={{ color: "#737373" }}
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
        className="flex-1 min-w-[100px] bg-transparent outline-none text-[13px]"
        style={{ color: "#1a1a1a" }}
      />
    </div>
  );
}

// Image upload zone
function ImageUploadZone({
  imageUrl,
  onImageChange,
  circular,
}: {
  imageUrl?: string;
  onImageChange: (url: string | undefined) => void;
  circular?: boolean;
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
      className={`relative overflow-hidden cursor-pointer transition-colors group ${circular ? "w-20 h-20 rounded-full mx-auto" : "w-full rounded-2xl"}`}
      style={{
        border: "2px dashed #dddddd",
        height: circular ? 80 : 120,
      }}
      onClick={() => inputRef.current?.click()}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#aaaaaa")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#dddddd")}
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
          <Upload className="h-5 w-5" style={{ color: "#b6b6b6" }} />
          <span className="text-[12px]" style={{ color: "#737373" }}>
            {circular ? "Upload" : "Drop image or click to upload"}
          </span>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────
// DELETE CONFIRM DIALOG
// ───────────────────────────────────────────────

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemType: string;
  itemName?: string;
}

export function DeleteConfirmDialog({ open, onClose, onConfirm, itemType, itemName }: DeleteConfirmDialogProps) {
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
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label={`Confirm delete ${itemType}`}
            className="w-full max-w-[420px] mx-4 text-center"
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "24px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              padding: "32px",
            }}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div
              className="mx-auto mb-4 flex items-center justify-center h-12 w-12 rounded-full"
              style={{ backgroundColor: "rgba(239,68,68,0.1)" }}
            >
              <Trash2 className="h-5 w-5" style={{ color: "#ef4444" }} />
            </div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: "#1a1a1a" }}>
              Delete {itemType}
            </h3>
            <p className="text-sm mb-6" style={{ color: "#707070" }}>
              Are you sure you want to delete
              {itemName ? <> &ldquo;<span className="font-medium" style={{ color: "#1a1a1a" }}>{itemName}</span>&rdquo;</> : ` this ${itemType.toLowerCase()}`}?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-full text-[13px] font-medium transition-all border border-[#dddddd] cursor-pointer"
                style={{ color: "#707070" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1efed")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                Cancel
              </button>
              <button
                onClick={() => { onConfirm(); onClose(); }}
                className="px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all cursor-pointer"
                style={{ backgroundColor: "#ef4444", color: "#ffffff" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#dc2626")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ef4444")}
              >
                Delete {itemType}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ───────────────────────────────────────────────
// FAQ DIALOG (New / Edit)
// ───────────────────────────────────────────────

interface FAQDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<FAQ, "id">) => void;
  editData?: FAQ | null;
}

export function FAQDialog({ open, onClose, onSubmit, editData }: FAQDialogProps) {
  const [question, setQuestion] = useState(editData?.question || "");
  const [answer, setAnswer] = useState(editData?.answer || "");
  const [status, setStatus] = useState<FAQStatus>(editData?.status || "draft");
  const [order, setOrder] = useState(editData?.order || 1);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    onSubmit({ question: question.trim(), answer: answer.trim(), status, order });
    onClose();
  }

  const title = editData ? "Edit FAQ" : "New FAQ";
  const valid = question.trim() && answer.trim();

  return (
    <DialogShell open={open} onClose={onClose} maxWidth="480px" ariaLabel={title}>
      <DialogHeader title={title} onClose={onClose} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label style={labelStyle}>Question <span style={{ color: "#ef4444" }}>*</span></label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter the question..."
            rows={2}
            maxLength={200}
            style={textareaStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoFocus
          />
        </div>
        <div>
          <label style={labelStyle}>Answer <span style={{ color: "#ef4444" }}>*</span></label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Enter the answer..."
            rows={4}
            maxLength={1000}
            style={textareaStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as FAQStatus)} style={selectStyle} onFocus={handleFocus} onBlur={handleBlur}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Order</label>
            <input type="number" min={1} value={order} onChange={(e) => setOrder(Number(e.target.value))} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
          </div>
        </div>
        <DialogFooter onClose={onClose} submitLabel="Save FAQ" disabled={!valid} />
      </form>
    </DialogShell>
  );
}

// ───────────────────────────────────────────────
// TESTIMONIAL DIALOG (New / Edit)
// ───────────────────────────────────────────────

interface TestimonialDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Testimonial, "id">) => void;
  editData?: Testimonial | null;
}

export function TestimonialDialog({ open, onClose, onSubmit, editData }: TestimonialDialogProps) {
  const [quote, setQuote] = useState(editData?.quote || "");
  const [author, setAuthor] = useState(editData?.author || "");
  const [authorTitle, setAuthorTitle] = useState(editData?.title || "");
  const [image, setImage] = useState<string | undefined>(editData?.image);
  const [status, setStatus] = useState<TestimonialStatus>(editData?.status || "draft");
  const [featured, setFeatured] = useState(editData?.featured || false);
  const [order, setOrder] = useState(editData?.order || 1);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quote.trim() || !author.trim() || !authorTitle.trim()) return;
    onSubmit({
      quote: quote.trim(), author: author.trim(), title: authorTitle.trim(),
      image, status, featured, order,
    });
    onClose();
  }

  const valid = quote.trim() && author.trim() && authorTitle.trim();

  return (
    <DialogShell open={open} onClose={onClose} maxWidth="520px" ariaLabel={editData ? "Edit Testimonial" : "New Testimonial"}>
      <DialogHeader title={editData ? "Edit Testimonial" : "New Testimonial"} onClose={onClose} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label style={labelStyle}>Quote <span style={{ color: "#ef4444" }}>*</span></label>
          <textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="Enter the client testimonial..."
            rows={4}
            maxLength={500}
            style={textareaStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Author Name <span style={{ color: "#ef4444" }}>*</span></label>
            <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Sarah Chen" maxLength={80} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
          </div>
          <div>
            <label style={labelStyle}>Author Title <span style={{ color: "#ef4444" }}>*</span></label>
            <input type="text" value={authorTitle} onChange={(e) => setAuthorTitle(e.target.value)} placeholder="CTO, TechVentures Inc." maxLength={100} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Author Photo</label>
          <ImageUploadZone imageUrl={image} onImageChange={setImage} circular />
        </div>
        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <label style={labelStyle}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as TestimonialStatus)} style={selectStyle} onFocus={handleFocus} onBlur={handleBlur}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Order</label>
            <input type="number" min={1} value={order} onChange={(e) => setOrder(Number(e.target.value))} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
          </div>
          <div className="flex items-center gap-2 h-[44px]">
            <input type="checkbox" id="test-featured" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 accent-[#f3350c] cursor-pointer" />
            <label htmlFor="test-featured" className="text-[13px] font-medium cursor-pointer" style={{ color: "#4d4d4d" }}>Featured</label>
          </div>
        </div>
        <DialogFooter onClose={onClose} submitLabel="Save Testimonial" disabled={!valid} />
      </form>
    </DialogShell>
  );
}

// ───────────────────────────────────────────────
// SERVICE DIALOG (New / Edit)
// ───────────────────────────────────────────────

const iconOptions = [
  { value: "Globe", label: "Globe (Web)" },
  { value: "Smartphone", label: "Smartphone (Mobile)" },
  { value: "Brain", label: "Brain (AI/ML)" },
  { value: "Code", label: "Code (Software)" },
  { value: "Blocks", label: "Blocks (Web3)" },
];

interface ServiceDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Service, "id">) => void;
  editData?: Service | null;
}

export function ServiceDialog({ open, onClose, onSubmit, editData }: ServiceDialogProps) {
  const [title, setTitle] = useState(editData?.title || "");
  const [description, setDescription] = useState(editData?.description || "");
  const [icon, setIcon] = useState(editData?.icon || "Globe");
  const [features, setFeatures] = useState<string[]>(editData?.features ? [...editData.features] : []);
  const [tags, setTags] = useState<string[]>(editData?.tags ? [...editData.tags] : []);
  const [examples, setExamples] = useState<string[]>(editData?.examples ? [...editData.examples] : []);
  const [image, setImage] = useState<string | undefined>(editData?.image);
  const [status, setStatus] = useState<ServiceStatus>(editData?.status || "published");
  const [featured, setFeatured] = useState(editData?.featured || false);
  const [order, setOrder] = useState(editData?.order || 1);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    onSubmit({
      title: title.trim(), description: description.trim(), icon,
      tags, features, examples, image, status, featured, order,
    });
    onClose();
  }

  const valid = title.trim() && description.trim();

  return (
    <DialogShell open={open} onClose={onClose} maxWidth="560px" ariaLabel={editData ? "Edit Service" : "New Service"}>
      <DialogHeader title={editData ? "Edit Service" : "New Service"} onClose={onClose} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label style={labelStyle}>Title <span style={{ color: "#ef4444" }}>*</span></label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Web Development" maxLength={80} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} autoFocus />
        </div>
        <div>
          <label style={labelStyle}>Description <span style={{ color: "#ef4444" }}>*</span></label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the service..." rows={3} maxLength={300} style={textareaStyle} onFocus={handleFocus} onBlur={handleBlur} />
        </div>
        <div>
          <label style={labelStyle}>Icon <span style={{ color: "#ef4444" }}>*</span></label>
          <select value={icon} onChange={(e) => setIcon(e.target.value)} style={selectStyle} onFocus={handleFocus} onBlur={handleBlur}>
            {iconOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Tags</label>
          <TagInput tags={tags} onChange={setTags} placeholder="web, react, api..." />
        </div>
        <div>
          <label style={labelStyle}>Features</label>
          <TagInput tags={features} onChange={setFeatures} placeholder="Custom Web Apps, API Dev..." />
        </div>
        <div>
          <label style={labelStyle}>Examples</label>
          <TagInput tags={examples} onChange={setExamples} placeholder="SaaS Platforms, Landing Pages..." />
        </div>
        <div>
          <label style={labelStyle}>Service Image</label>
          <ImageUploadZone imageUrl={image} onImageChange={setImage} />
        </div>
        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <label style={labelStyle}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as ServiceStatus)} style={selectStyle} onFocus={handleFocus} onBlur={handleBlur}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Order</label>
            <input type="number" min={1} value={order} onChange={(e) => setOrder(Number(e.target.value))} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
          </div>
          <div className="flex items-center gap-2 h-[44px]">
            <input type="checkbox" id="svc-featured" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 accent-[#f3350c] cursor-pointer" />
            <label htmlFor="svc-featured" className="text-[13px] font-medium cursor-pointer" style={{ color: "#4d4d4d" }}>Featured</label>
          </div>
        </div>
        <DialogFooter onClose={onClose} submitLabel="Save Service" disabled={!valid} />
      </form>
    </DialogShell>
  );
}
