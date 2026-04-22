"use client";

import { GripVertical, Building2, User2, Mail, Phone, DollarSign } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Lead, statusConfig, priorityConfig, formatCurrency } from "@/app/(crm)/crm/lead-data";

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
}

export function LeadCard({ lead, onEdit }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead._id,
    data: { lead, status: lead.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const priority = priorityConfig[lead.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing group"
      onClick={() => onEdit(lead)}
    >
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all duration-300">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-white/20 group-hover:text-white/40 transition-colors" />
            <h3 className="text-sm font-semibold text-white/90 line-clamp-1">
              {lead.name}
            </h3>
          </div>
          <div
            className="h-2 w-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]"
            style={{ backgroundColor: priority.color }}
            title={`Priority: ${priority.label}`}
          />
        </div>

        {lead.company && (
          <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
            <Building2 className="h-3 w-3" />
            <span className="line-clamp-1">{lead.company}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center border border-white/5">
              <span className="text-[10px] font-bold text-white/80">
                {lead.name.charAt(0).toUpperCase()}
              </span>
            </div>
            {lead.value > 0 && (
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                {formatCurrency(lead.value)}
              </span>
            )}
          </div>
          
          <div className="flex gap-1">
            {lead.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/5"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
