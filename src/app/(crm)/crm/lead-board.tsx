// Lead Board View — Kanban columns for sales pipeline
"use client";

import { useState, useMemo } from "react";
import { Plus, GripVertical, Mail, Phone, Building2, MoreHorizontal } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  useDroppable,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  type Lead,
  type LeadStatus,
  leadStatusColors,
  leadPriorityColors,
  formatCurrency,
} from "./lead-data";

interface LeadBoardProps {
  leads: Lead[];
  onStatusChange: (id: string, newStatus: LeadStatus) => void;
  onEditLead: (lead: Lead) => void;
  onNewLead: (status?: LeadStatus) => void;
}

const pipelineOrder: LeadStatus[] = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];

function LeadCard({
  lead,
  isDragging,
  onEdit,
}: {
  lead: Lead;
  isDragging?: boolean;
  onEdit?: (lead: Lead) => void;
}) {
  const status = leadStatusColors[lead.status];

  return (
    <div
      className={`
        group backdrop-blur-md border transition-all duration-200 cursor-grab active:cursor-grabbing
        ${isDragging
          ? "border-[#f3350c] shadow-2xl scale-[1.05] rotate-2"
          : "border-white/10 hover:border-white/20 hover:shadow-md"
        }
      `}
      style={{
        backgroundColor: isDragging ? "rgba(26,26,26,0.9)" : "rgba(26,26,26,0.7)",
        borderRadius: "20px",
        padding: "16px",
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: leadPriorityColors[lead.priority] }}
          />
          <h3 className="text-sm font-bold text-white line-clamp-1">{lead.name}</h3>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit?.(lead); }}
          className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
        >
          <MoreHorizontal className="h-4 w-4 text-white/60" />
        </button>
      </div>

      <div className="space-y-1.5 mb-4">
        {lead.company && (
          <div className="flex items-center gap-1.5 text-[11px] text-white/60">
            <Building2 className="h-3 w-3" />
            <span>{lead.company}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-[11px] text-white/60">
          <Mail className="h-3 w-3" />
          <span>{lead.email}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/10">
        <span className="text-xs font-bold text-white">
          {formatCurrency(lead.value)}
        </span>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
          style={{ backgroundColor: `${status.dot}20`, color: status.dot }}
        >
          {lead.status}
        </span>
      </div>
    </div>
  );
}

function SortableLeadCard({ lead, onEdit }: { lead: Lead, onEdit: (lead: Lead) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead._id,
    data: { lead },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard lead={lead} onEdit={onEdit} />
    </div>
  );
}

function PipelineColumn({ 
  status, 
  leads, 
  isOver,
  onEditLead,
  onNewLead
}: { 
  status: LeadStatus; 
  leads: Lead[]; 
  isOver: boolean;
  onEditLead: (lead: Lead) => void;
  onNewLead: (status?: LeadStatus) => void;
}) {
  const { setNodeRef } = useDroppable({ id: status });
  const config = leadStatusColors[status];
  const totalValue = leads.reduce((sum, l) => sum + l.value, 0);

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col h-full min-w-[280px] rounded-[28px] border transition-all duration-300
        ${isOver ? "border-[#f3350c]" : ""}
      `}
      style={{
        borderColor: isOver ? "#f3350c" : "rgba(255,255,255,0.1)",
        backgroundColor: isOver ? "rgba(243,53,12,0.1)" : "rgba(26,26,26,0.6)",
        padding: "16px"
      }}
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: config.dot }} />
          <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: "#ffffff" }}>
            {config.label}
          </h3>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border" style={{ color: "#a0a0a0", backgroundColor: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.1)" }}>
            {leads.length}
          </span>
        </div>
        <span className="text-[10px] font-bold" style={{ color: "#a0a0a0" }}>
          {formatCurrency(totalValue)}
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-3 min-h-[150px]">
        <SortableContext id={status} items={leads.map(l => l._id)} strategy={verticalListSortingStrategy}>
          {leads.map(lead => (
            <SortableLeadCard key={lead._id} lead={lead} onEdit={onEditLead} />
          ))}
        </SortableContext>
        
        {isOver && leads.length === 0 && (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-[#f3350c]/20 rounded-2xl mb-3">
             <span className="text-[10px] text-[#f3350c]/50 font-bold uppercase tracking-tighter">Drop Lead Here</span>
          </div>
        )}
      </div>

      <button 
        onClick={() => onNewLead(status)}
        className="mt-3 flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-dashed transition-all"
        style={{ borderColor: "rgba(255,255,255,0.1)", color: "#a0a0a0" }}
      >
        <Plus className="h-4 w-4" />
        <span className="text-xs font-medium">Add Lead</span>
      </button>
    </div>
  );
}

export function LeadBoard({ leads, onStatusChange, onEditLead, onNewLead }: LeadBoardProps) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [overStatus, setOverStatus] = useState<LeadStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const groupedLeads = useMemo(() => {
    const groups: Record<LeadStatus, Lead[]> = {
      new: [], contacted: [], qualified: [], proposal: [], negotiation: [], won: [], lost: []
    };
    leads.forEach(l => groups[l.status]?.push(l));
    return groups;
  }, [leads]);

  const handleDragStart = (event: DragStartEvent) => {
    const lead = event.active.data.current?.lead as Lead;
    if (lead) setActiveLead(lead);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id as string;
    if (pipelineOrder.includes(overId as LeadStatus)) {
      setOverStatus(overId as LeadStatus);
    } else {
      const overLead = leads.find(l => l._id === overId);
      if (overLead) setOverStatus(overLead.status);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLead(null);
    setOverStatus(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const lead = leads.find(l => l._id === activeId);
    if (!lead) return;

    let newStatus: LeadStatus = lead.status;
    if (pipelineOrder.includes(overId as LeadStatus)) {
      newStatus = overId as LeadStatus;
    } else {
      const overLead = leads.find(l => l._id === overId);
      if (overLead) newStatus = overLead.status;
    }

    if (newStatus !== lead.status) {
      onStatusChange(activeId, newStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-5 overflow-x-auto pb-6 -mx-1 px-1 scrollbar-hide">
        {pipelineOrder.map(status => (
          <PipelineColumn
            key={status}
            status={status}
            leads={groupedLeads[status]}
            isOver={overStatus === status}
            onEditLead={onEditLead}
            onNewLead={onNewLead}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? (
          <div className="w-[280px]">
            <LeadCard lead={activeLead} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
