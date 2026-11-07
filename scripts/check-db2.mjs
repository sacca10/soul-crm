import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i), l.slice(i+1)]; })
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: users } = await sb.from('users').select('id,nombre,email,rol,auth_id');
console.log('USERS', JSON.stringify(users, null, 2));

const { data: contenido } = await sb.from('contenido').select('id,cta_id,nombre,plataforma');
console.log('CONTENIDO', JSON.stringify(contenido, null, 2));

const { data: leads } = await sb.from('leads').select('id,nombre,manychat_id,estado_pipeline,assigned_setter_id');
console.log('LEADS', JSON.stringify(leads, null, 2));

const { data: agendas } = await sb.from('agendas').select('id,lead_id,estado_llamada,resultado,fecha_hora_llamada,closer_asignado_id');
console.log('AGENDAS', JSON.stringify(agendas, null, 2));

const { data: billeteras } = await sb.from('billeteras_catalogo').select('nombre');
console.log('BILLETERAS', JSON.stringify(billeteras));
const { data: programas } = await sb.from('programas_catalogo').select('nombre');
console.log('PROGRAMAS', JSON.stringify(programas));
