// Shared CMS UI components
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// useCountUp hook
export function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) ref.current = requestAnimationFrame(step);
    };
    ref.current = requestAnimationFrame(step);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [target, duration]);

  return value;
}

// Card animation variant
export function cardVariant(i: number) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    },
  };
}

// StatusBadge component
export function StatusBadge({
  dot,
  bg,
  text,
  label,
  pulse,
  icon: Icon,
}: {
  dot: string;
  bg: string;
  text: string;
  label: string;
  pulse?: boolean;
  icon?: LucideIcon;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ backgroundColor: bg, color: text }}
    >
      {Icon ? (
        <Icon className="w-3 h-3" />
      ) : (
        <span
          className={`w-1.5 h-1.5 rounded-full${pulse ? " animate-pulse" : ""}`}
          style={{ backgroundColor: dot }}
        />
      )}
      {label}
    </span>
  );
}

// StatCard component — matches Dashboard/HR/Tasks layout
export function StatCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  description,
  index,
}: {
  icon: LucideIcon;
  iconColor: string;
  iconBg?: string;
  label: string;
  value: number;
  description?: string;
  index: number;
}) {
  const count = useCountUp(value);
  const resolvedIconBg = iconBg || `${iconColor}15`;

  return (
    <motion.div
      {...cardVariant(index)}
      className="relative overflow-hidden backdrop-blur-lg border border-border bg-card/50 rounded-[24px] p-5 sm:p-6"
    >
      <div
        className="absolute top-5 right-5 w-10 h-10 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: resolvedIconBg }}
      >
        <Icon size={20} style={{ color: iconColor }} />
      </div>
      <p className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-[2rem] sm:text-[2.5rem] font-bold mt-1 leading-tight text-foreground">
        {count}
      </p>
      {description && (
        <p className="text-xs mt-0.5 text-muted-foreground/60">
          {description}
        </p>
      )}
    </motion.div>
  );
}

// FilterDropdown component
export function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const displayLabel =
    value === "all" ? label : options.find((o) => o.value === value)?.label || label;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-medium transition-all duration-200 backdrop-blur-lg border cursor-pointer",
          open
            ? "border-foreground/30 bg-accent text-foreground"
            : "border-border bg-card/50 text-muted-foreground hover:border-foreground/30 hover:text-foreground hover:bg-accent"
        )}
      >
        {displayLabel}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            open ? "text-foreground" : "text-muted-foreground",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 min-w-[160px] z-50 rounded-2xl border border-border backdrop-blur-lg shadow-lg p-1 bg-card">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-full text-[13px] transition-colors cursor-pointer",
                value === opt.value
                  ? "text-foreground font-semibold bg-accent"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// AvatarCircle component
export function AvatarCircle({
  initials,
  size = 36,
  image,
}: {
  initials: string;
  size?: number;
  image?: string;
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={initials}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-xs font-semibold shrink-0 bg-muted text-muted-foreground"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}

// Empty state component
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-[24px] border border-border backdrop-blur-lg bg-card/50 p-12 flex flex-col items-center justify-center text-center">
      <div className="h-16 w-16 rounded-3xl flex items-center justify-center mb-4 bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground/30" />
      </div>
      <h2 className="text-base font-semibold mb-1 text-muted-foreground">
        {title}
      </h2>
      <p className="text-sm max-w-md text-muted-foreground/60">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-200 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// MoreMenu dropdown (portal-based to escape stacking contexts)
export function MoreMenu({
  items,
  open,
  onToggle,
}: {
  items: { label: string; onClick: () => void; destructive?: boolean }[];
  open: boolean;
  onToggle: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  // Calculate dropdown position from button
  const updatePos = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
  }, []);

  // Position on open + close on scroll/resize
  useEffect(() => {
    if (!open) return;
    updatePos();

    const close = () => { if (open) onToggle(); };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open, onToggle, updatePos]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        onToggle();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onToggle]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={onToggle}
        className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] transition-colors cursor-pointer bg-muted text-muted-foreground hover:bg-muted/80"
      >
        <span className="tracking-wider">...</span>
      </button>
      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed min-w-[160px] rounded-2xl border border-border backdrop-blur-lg shadow-lg p-1 bg-card z-[9999]"
            style={{
              top: pos.top,
              right: pos.right,
            }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  item.onClick();
                  onToggle();
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-xl text-[13px] transition-colors cursor-pointer",
                  item.destructive ? "text-red-500 font-medium hover:bg-red-500/10" : "text-foreground hover:bg-accent"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

// Search input component
export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative flex-1 min-w-[200px] max-w-[280px]">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
        style={{ color: "#b6b6b6" }}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 pl-9 pr-4 rounded-full text-[13px] font-medium outline-none transition-all duration-200 backdrop-blur-lg border border-[#dddddd] hover:border-[#aaaaaa] focus:border-[#0a0a0a] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
        style={{ backgroundColor: "rgba(241,239,237,0.45)", color: "#1a1a1a" }}
      />
    </div>
  );
}
