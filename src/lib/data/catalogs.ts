import "server-only";
import { isMockMode, store } from "./store";
import { sb, throwIfError } from "./_supabase";

// =====================================================================
// Billeteras (catálogo simple de medios de cobro)
// =====================================================================
export async function getBilleteras(): Promise<string[]> {
  if (isMockMode()) return [...store.billeteras];
  const res = throwIfError(
    await sb()
      .from("billeteras_catalogo")
      .select("nombre")
      .eq("activo", true)
      .order("nombre"),
    "catalogs.getBilleteras",
  );
  return (res.data ?? []).map((r) => (r as { nombre: string }).nombre);
}

export async function addBilletera(nombre: string): Promise<void> {
  const clean = nombre.trim();
  if (!clean) return;
  if (isMockMode()) {
    if (store.billeteras.some((b) => b.toLowerCase() === clean.toLowerCase())) return;
    store.billeteras.push(clean);
    return;
  }
  throwIfError(
    await sb()
      .from("billeteras_catalogo")
      .upsert({ nombre: clean, activo: true }, { onConflict: "nombre" }),
    "catalogs.addBilletera",
  );
}

export async function renameBilletera(viejo: string, nuevo: string): Promise<void> {
  const clean = nuevo.trim();
  if (!clean) return;
  if (isMockMode()) {
    const i = store.billeteras.findIndex((b) => b === viejo);
    if (i === -1) return;
    store.billeteras[i] = clean;
    return;
  }
  throwIfError(
    await sb()
      .from("billeteras_catalogo")
      .update({ nombre: clean })
      .eq("nombre", viejo),
    "catalogs.renameBilletera",
  );
}

export async function deleteBilletera(nombre: string): Promise<void> {
  if (isMockMode()) {
    const i = store.billeteras.findIndex((b) => b === nombre);
    if (i !== -1) store.billeteras.splice(i, 1);
    return;
  }
  throwIfError(
    await sb().from("billeteras_catalogo").delete().eq("nombre", nombre),
    "catalogs.deleteBilletera",
  );
}

// =====================================================================
// Programas (catálogo de productos que vendés)
// =====================================================================
export async function getProgramas(): Promise<string[]> {
  if (isMockMode()) return [...store.programas];
  const res = throwIfError(
    await sb()
      .from("programas_catalogo")
      .select("nombre")
      .eq("activo", true)
      .order("nombre"),
    "catalogs.getProgramas",
  );
  return (res.data ?? []).map((r) => (r as { nombre: string }).nombre);
}

export async function addPrograma(nombre: string): Promise<void> {
  const clean = nombre.trim();
  if (!clean) return;
  if (isMockMode()) {
    if (store.programas.some((p) => p.toLowerCase() === clean.toLowerCase())) return;
    store.programas.push(clean);
    return;
  }
  throwIfError(
    await sb()
      .from("programas_catalogo")
      .upsert({ nombre: clean, activo: true }, { onConflict: "nombre" }),
    "catalogs.addPrograma",
  );
}

export async function renamePrograma(viejo: string, nuevo: string): Promise<void> {
  const clean = nuevo.trim();
  if (!clean) return;
  if (isMockMode()) {
    const i = store.programas.findIndex((p) => p === viejo);
    if (i === -1) return;
    store.programas[i] = clean;
    return;
  }
  throwIfError(
    await sb()
      .from("programas_catalogo")
      .update({ nombre: clean })
      .eq("nombre", viejo),
    "catalogs.renamePrograma",
  );
}

export async function deletePrograma(nombre: string): Promise<void> {
  if (isMockMode()) {
    const i = store.programas.findIndex((p) => p === nombre);
    if (i !== -1) store.programas.splice(i, 1);
    return;
  }
  throwIfError(
    await sb().from("programas_catalogo").delete().eq("nombre", nombre),
    "catalogs.deletePrograma",
  );
}
