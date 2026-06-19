import { getLeads } from "@/lib/data/leads";
import { getUsers } from "@/lib/data/users";
import { KanbanBoard } from "@/components/kanban/kanban-board";

export const dynamic = "force-dynamic";

export default async function KanbanPage() {
  const leads = await getLeads();
  const users = await getUsers();
  const setterNameById = Object.fromEntries(users.map((u) => [u.id, u.nombre]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Estado de los leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Arrastrá los leads entre columnas para cambiar su estado en el pipeline
        </p>
      </header>

      <KanbanBoard leads={leads} setterNameById={setterNameById} />
    </div>
  );
}
