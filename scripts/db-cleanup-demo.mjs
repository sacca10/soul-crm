// Borra exactamente los registros insertados por db-seed-demo.mjs,
// usando el manifiesto de IDs generado en esa corrida. Respeta el orden
// de FKs (hijos antes que padres).
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const manifest = JSON.parse(readFileSync("demo-data-manifest.json", "utf8"));

const ORDER = ["cobros", "comisiones", "triages", "agendas", "leads", "contenido", "gastos_fijos", "users"];

for (const table of ORDER) {
  const ids = manifest[table];
  if (!ids?.length) continue;
  const { error, count } = await sb.from(table).delete({ count: "exact" }).in("id", ids);
  if (error) {
    console.error(`${table}: ERROR ${error.message}`);
    continue;
  }
  console.log(`${table}: borrados ${count}/${ids.length}`);
}
console.log("Limpieza completa.");
