"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Filter } from "lucide-react";
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
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Lead, LeadStatus, statusConfig, formatCurrency } from "@/app/(crm)/crm/lead-data";
import { LeadCard } from "./lead-card";

interface LeadBoardProps {
  leads: Lead[];
  onUpdateStatus: (id: string, newStatus: LeadStatus) => void;
  onEditLead: (lead: Lead) => void;
  onNewLead: (status?: LeadStatus) => void;
}

const columnOrder: LeadStatus[] = ["new", "contacted", "qualified", "proposal", "negotiation", "won"];

function Column({
  status,
  leads,
  isOver,
  onEditLead,
  onNewLead,
}: {
  status: LeadStatus;
  leads: Lead[];
  isOver: boolean;
  onEditLead: (lead: Lead) => void;
  onNewLead: (status?: LeadStatus) => void;
}) {
  const { setNodeRef } = useDroppable({ id: status });
  const config = statusConfig[status];
  const totalValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col min-w-[320px] h-full rounded-[2.5rem] transition-all duration-500
        ${isOver ? "bg-white/[0.08] ring-1 ring-white/10" : "bg-black/40"}
      `}
      style={{
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="h-2 w-2 rounded-full shadow-[0_0_10px_currentColor]" 
            style={{ backgroundColor: config.dot, color: config.dot }} 
          />
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
            {config.label}
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30 font-mono border border-white/5">
            {leads.length}
          </span>
        </div>
        {totalValue > 0 && (
          <span className="text-[11px] font-mono text-emerald-400/60 font-bold">
            {formatCurrency(totalValue)}
          </span>
        )}
      </div>

      <div className="flex-1 px-4 pb-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
        <SortableContext id={status} items={leads.map(l => l._id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LeadCard key={lead._id} lead={lead} onEdit={onEditLead} />
          ))}
        </SortableContext>
        
        <button
          onClick={() => onNewLead(status)}
          className="group w-full py-4 rounded-3xl border border-dashed border-white/5 hover:border-white/10 hover:bg-white/5 transition-all duration-300 flex items-center justify-center gap-2 text-white/10 hover:text-white/30"
        >
          <Plus className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Add Lead</span>
        </button>
      </div>
    </div>
  );
}

export function LeadBoard({ leads, onUpdateStatus, onEditLead, onNewLead }: LeadBoardProps) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [overColumn, setOverColumn] = useState<LeadStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const groupedLeads = useMemo(() => {
    const map: Record<LeadStatus, Lead[]> = {
      new: [], contacted: [], qualified: [], proposal: [], negotiation: [], won: [], lost: []
    };
    leads.forEach(l => {
      if (map[l.status]) map[l.status].push(l);
    });
    return map;
  }, [leads]);

  function handleDragStart(event: DragStartEvent) {
    const lead = event.active.data.current?.lead as Lead;
    if (lead) setActiveLead(lead);
  }

  function handleDragOver(event: DragOverEvent) {
    const overId = event.over?.id as string;
    if (!overId) {
      setOverColumn(null);
      return;
    }

    if (columnOrder.includes(overId as LeadStatus)) {
      setOverColumn(overId as LeadStatus);
    } else {
      const overLead = leads.find(l => l._id === overId);
      if (overLead) setOverColumn(overLead.status);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveLead(null);
    setOverColumn(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const currentStatus = active.data.current?.status as LeadStatus;
    let targetStatus: LeadStatus;

    if (columnOrder.includes(overId as LeadStatus)) {
      targetStatus = overId as LeadStatus;
    } else {
      const overLead = leads.find(l => l._id === overId);
      targetStatus = overLead ? overLead.status : currentStatus;
    }

    if (currentStatus !== targetStatus) {
      onUpdateStatus(activeId, targetStatus);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-8 h-[calc(100vh-280px)] overflow-x-auto pb-8 px-2 custom-scrollbar snap-x">
        {columnOrder.map((status) => (
          <div key={status} className="snap-center">
            <Column
              status={status}
              leads={groupedLeads[status]}
              isOver={overColumn === status}
              onEditLead={onEditLead}
              onNewLead={onNewLead}
            />
          </div>
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 300, easing: "cubic-bezier(0.18, 0.89, 0.32, 1.28)" }}>
        {activeLead ? (
          <div className="w-[320px] -rotate-2 scale-105 transition-transform">
            <LeadCard lead={activeLead} onEdit={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
