"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { useRouter } from "next/navigation";

interface CalEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  color?: string;
  href: string;
}

export function CalendarView({ events }: { events: CalEvent[] }) {
  const router = useRouter();

  return (
    <div className="rounded-lg border border-border bg-card p-4 fc-dark">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={esLocale}
        height="auto"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        eventClick={(info) => {
          info.jsEvent.preventDefault();
          const event = events.find((e) => e.id === info.event.id);
          if (event) router.push(event.href);
        }}
      />
      <style jsx global>{`
        .fc {
          --fc-border-color: hsl(var(--border));
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: hsl(var(--secondary));
          --fc-today-bg-color: rgba(168, 85, 247, 0.08);
          --fc-button-bg-color: hsl(var(--secondary));
          --fc-button-border-color: hsl(var(--border));
          --fc-button-hover-bg-color: hsl(var(--accent));
          --fc-button-hover-border-color: hsl(var(--border));
          --fc-button-active-bg-color: hsl(var(--primary));
          --fc-button-active-border-color: hsl(var(--primary));
          color: hsl(var(--foreground));
        }
        .fc .fc-toolbar-title {
          font-size: 1rem;
          font-weight: 600;
        }
        .fc .fc-button {
          font-size: 0.75rem;
          padding: 0.4rem 0.75rem;
          text-transform: capitalize;
        }
        .fc-event {
          cursor: pointer;
          border: none;
          padding: 2px 4px;
          font-size: 0.7rem;
        }
      `}</style>
    </div>
  );
}
