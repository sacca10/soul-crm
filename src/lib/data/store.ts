// In-memory store wrapping mock data. Mutations update the underlying arrays
// so the dev preview feels live (create/edit/move work end-to-end).
//
// When DEV_BYPASS_AUTH is false, the data functions in /lib/data/* should
// route to Supabase instead of this store. Phase 1 ships only the mock side.

import {
  mockAgendas,
  mockCobros,
  mockComisiones,
  mockContenido,
  mockGastos,
  mockKpisManual,
  mockLeads,
  mockSeguimientos,
  mockTriages,
  mockUsers,
} from "@/lib/mock/seed";

// Catalogs that the user can modify in Ajustes. Seeded with the same defaults
// that the SQL schema lists as enum values.
const defaultBilleteras = [
  "Stripe",
  "Whop",
  "Transferencia",
  "Mercadopago",
  "PayPal",
];

const defaultProgramas = [
  "Programa Élite",
  "Programa Master",
  "Programa Starter",
];

export const store = {
  users: [...mockUsers],
  leads: [...mockLeads],
  contenido: [...mockContenido],
  agendas: [...mockAgendas],
  seguimientos: [...mockSeguimientos],
  cobros: [...mockCobros],
  gastos: [...mockGastos],
  comisiones: [...mockComisiones],
  triages: [...mockTriages],
  kpisManual: [...mockKpisManual],
  billeteras: [...defaultBilleteras],
  programas: [...defaultProgramas],
  appConfig: {
    google_calendar_url: null as string | null,
    fx_strategy: "blue" as string,
  },
};

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export const isMockMode = () => process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";
