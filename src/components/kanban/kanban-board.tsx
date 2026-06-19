"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  ESTADOS_PIPELINE,
  ESTADO_PIPELINE_COLOR,
  ESTADO_PIPELINE_LABEL,
  FUENTE_LABEL,
  type Lead,
  type LeadEstadoPipeline,
} from "@/lib/domain";
import { cn } from "@/lib/utils";
import { moveLeadAction } from "@/app/(app)/setter/kanban/actions";

interface KanbanBoardProps {
  leads: Lead[];
  setterNameById: Record<string, string>;
}

export function KanbanBoard({ leads: initialLeads, setterNameById }: KanbanBoardProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const leadId = String(event.active.id);
    const newEstado = event.over?.id as LeadEstadoPipeline | undefined;
    if (!newEstado) return;
    if (!ESTADOS_PIPELINE.includes(newEstado)) return;

    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, estado_pipeline: newEstado } : l)),
    );
    startTransition(() => {
      moveLeadAction(leadId, newEstado);
    });
  }

  const byEstado = ESTADOS_PIPELINE.reduce(
    (acc, estado) => {
      acc[estado] = leads.filter((l) => l.estado_pipeline === estado);
      return acc;
    },
    {} as Record<LeadEstadoPipeline, Lead[]>,
  );

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="scrollbar-thin-gold flex gap-3 overflow-x-auto pb-4">
        {ESTADOS_PIPELINE.map((estado) => (
          <KanbanColumn
            key={estado}
            estado={estado}
            leads={byEstado[estado]}
            setterNameById={setterNameById}
          />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? (
          <LeadCard lead={activeLead} setterName={setterNameById[activeLead.assigned_setter_id ?? ""] ?? "—"} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  estado,
  leads,
  setterNameById,
}: {
  estado: LeadEstadoPipeline;
  leads: Lead[];
  setterNameById: Record<string, string>;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: estado });
  const color = ESTADO_PIPELINE_COLOR[estado];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-[calc(100vh-220px)] w-72 shrink-0 flex-col rounded-lg border border-border bg-card/50 transition-colors",
        isOver && "ring-2 ring-primary/50",
      )}
    >
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h3 className="text-sm font-semibold">{ESTADO_PIPELINE_LABEL[estado]}</h3>
        </div>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
          {leads.length}
        </span>
      </div>
      <div className="scrollbar-hide flex-1 space-y-2 overflow-y-auto p-2">
        {leads.length === 0 && (
          <div className="py-8 text-center text-xs text-muted-foreground">— vacío —</div>
        )}
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            setterName={setterNameById[lead.assigned_setter_id ?? ""] ?? "—"}
          />
        ))}
      </div>
    </div>
  );
}

function LeadCard({
  lead,
  setterName,
  isOverlay,
}: {
  lead: Lead;
  setterName: string;
  isOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });

  const style: React.CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : {};

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
      className={cn(
        "cursor-grab rounded-md border border-border bg-card p-2.5 shadow-sm transition-opacity",
        isDragging && !isOverlay && "opacity-30",
        isOverlay && "rotate-2 shadow-xl",
      )}
    >
      <div className="text-sm font-medium leading-tight">{lead.nombre}</div>
      {lead.instagram_username && (
        <div className="mt-0.5 text-xs text-muted-foreground">{lead.instagram_username}</div>
      )}
      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <span className="rounded bg-secondary px-1.5 py-0.5">{FUENTE_LABEL[lead.fuente]}</span>
        <span>{setterName}</span>
      </div>
    </div>
  );
}
