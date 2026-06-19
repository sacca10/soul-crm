import "server-only";
import { isMockMode, store, generateId } from "./store";
import { sb, throwIfError } from "./_supabase";
import type { User, UserRol } from "@/lib/domain";

export async function getUsers(): Promise<User[]> {
  if (isMockMode()) {
    return [...store.users].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }
  const res = throwIfError(
    await sb().from("users").select("*").order("nombre"),
    "users.getUsers",
  );
  return (res.data ?? []) as User[];
}

export async function getUsersByRol(rol: UserRol): Promise<User[]> {
  if (isMockMode()) {
    return store.users.filter((u) => u.rol === rol && u.activo);
  }
  const res = throwIfError(
    await sb().from("users").select("*").eq("rol", rol).eq("activo", true).order("nombre"),
    "users.getUsersByRol",
  );
  return (res.data ?? []) as User[];
}

export async function getUser(id: string): Promise<User | null> {
  if (isMockMode()) {
    return store.users.find((u) => u.id === id) ?? null;
  }
  const res = await sb().from("users").select("*").eq("id", id).maybeSingle();
  return (res.data as User | null) ?? null;
}

export async function getUserName(id: string | null | undefined): Promise<string> {
  if (!id) return "—";
  const u = await getUser(id);
  return u?.nombre ?? "—";
}

export interface CreateUserInput {
  nombre: string;
  email: string;
  rol: UserRol;
  activo?: boolean;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  if (isMockMode()) {
    const user: User = {
      id: generateId("u"),
      nombre: input.nombre,
      email: input.email,
      rol: input.rol,
      activo: input.activo ?? true,
      aprobado: true, // los creados manualmente desde Ajustes vienen aprobados
      avatar_url: null,
    };
    store.users.push(user);
    return user;
  }
  // NOTA: en producción los usuarios se crean vía Supabase Auth (sign up).
  // El trigger handle_new_auth_user crea el registro en public.users automáticamente.
  // Este endpoint manual sólo agrega a la tabla pública (sin auth) — útil para
  // pre-registrar miembros del equipo antes de que se logueen.
  const res = throwIfError(
    await sb()
      .from("users")
      .insert({
        nombre: input.nombre,
        email: input.email,
        rol: input.rol,
        activo: input.activo ?? true,
        aprobado: true,
      })
      .select()
      .single(),
    "users.createUser",
  );
  return res.data as User;
}

// =====================================================================
// Aprobaciones — el admin aprueba/rechaza nuevos signups
// =====================================================================
export async function getPendingUsers(): Promise<User[]> {
  if (isMockMode()) {
    return store.users.filter((u) => !u.aprobado);
  }
  const res = throwIfError(
    await sb()
      .from("users")
      .select("*")
      .eq("aprobado", false)
      .order("created_at", { ascending: false }),
    "users.getPendingUsers",
  );
  return (res.data ?? []) as User[];
}

export async function getUserByAuthId(authId: string): Promise<User | null> {
  if (isMockMode()) {
    return store.users.find((u) => u.id === authId) ?? store.users[0] ?? null;
  }
  const res = await sb()
    .from("users")
    .select("*")
    .eq("auth_id", authId)
    .maybeSingle();
  return (res.data as User | null) ?? null;
}

export async function approveUser(id: string): Promise<void> {
  if (isMockMode()) {
    const u = store.users.find((x) => x.id === id);
    if (u) u.aprobado = true;
    return;
  }
  throwIfError(
    await sb().from("users").update({ aprobado: true, activo: true }).eq("id", id),
    "users.approveUser",
  );
}

export async function rejectUser(id: string): Promise<void> {
  // Rechazar = borrar de public.users. El auth.users sigue, así que si vuelve
  // a loguearse el trigger lo crea de nuevo como pendiente.
  await deleteUser(id);
}

export async function updateUser(id: string, patch: Partial<User>): Promise<User | null> {
  if (isMockMode()) {
    const u = store.users.find((x) => x.id === id);
    if (!u) return null;
    Object.assign(u, patch);
    return u;
  }
  const res = throwIfError(
    await sb().from("users").update(patch).eq("id", id).select().maybeSingle(),
    "users.updateUser",
  );
  return (res.data as User | null) ?? null;
}

export async function deleteUser(id: string): Promise<boolean> {
  if (isMockMode()) {
    const i = store.users.findIndex((u) => u.id === id);
    if (i === -1) return false;
    store.users.splice(i, 1);
    return true;
  }
  throwIfError(await sb().from("users").delete().eq("id", id), "users.deleteUser");
  return true;
}
