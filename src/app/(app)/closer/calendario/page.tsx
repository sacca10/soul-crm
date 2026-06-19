import { CalendarView } from "@/components/closer/calendar-view";
import { getAgendas } from "@/lib/data/agendas";
import { getSeguimientos } from "@/lib/data/misc";
import { getUsers } from "@/lib/data/users";

export const dynamic = "force-dynamic";

const closerPalette = ["#a855f7", "#9b6dff", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4"];
function colorFor(id: string | null | undefined): string {
  if (!id) return "#6b7280";
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return closerPalette[Math.abs(hash) % closerPalette.length];
}

const segColor = {
  caliente: "#ef4444",
  tibio: "#eab308",
  frio: "#3b82f6",
} as const;

export default async function CalendarioPage() {
  const [agendas, seguimientos, users] = await Promise.all([
    getAgendas(),
    getSeguimientos(),
    getUsers(),
  ]);
  const userById = new Map(users.map((u) => [u.id, u]));
  const agendaById = new Map(agendas.map((a) => [a.id, a]));

  // Agendas (vienen de Calendly por el webhook) como eventos
  const agendaEvents = agendas.map((a) => {
    const closerName = userById.get(a.closer_asignado_id ?? "")?.nombre ?? "Sin asignar";
    const end = new Date(a.fecha_hora_llamada);
    end.setHours(end.getHours() + 1);
    return {
      id: `ag-${a.id}`,
      title: `📞 ${a.nombre} · ${closerName}`,
      start: a.fecha_hora_llamada,
      end: end.toISOString(),
      color: colorFor(a.closer_asignado_id),
      href: `/closer/agendas/${a.id}`,
    };
  });

  // Seguimientos como eventos del día según su próxima fecha
  const seguimientoEvents = seguimientos
    .filter((s) => s.fecha_proximo_seguimiento)
    .map((s) => {
      const ag = s.agenda_id ? agendaById.get(s.agenda_id) : null;
      return {
        id: `seg-${s.id}`,
        title: `🔁 Seguimiento: ${ag?.nombre ?? "Lead"} (${s.estado})`,
        start: s.fecha_proximo_seguimiento as string,
        color: segColor[s.estado],
        href: `/cobros`,
      };
    });

  const events = [...agendaEvents, ...seguimientoEvents];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Calendario de Llamadas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Agendas de Calendly (📞 color-coded por closer) + seguimientos pendientes
          (🔁 rojo caliente · amarillo tibio · azul frío)
        </p>
      </header>
      <CalendarView events={events} />
    </div>
  );
}
