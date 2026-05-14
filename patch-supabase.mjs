/**
 * patch-supabase.mjs
 * Aplica o storage Supabase no App.jsx antes do deploy para Vercel.
 * Uso: node patch-supabase.mjs [caminho-do-arquivo]
 * Exemplo: node patch-supabase.mjs "C:\Users\useja\Downloads\all-operacional.jsx"
 */
import { readFileSync, writeFileSync, copyFileSync } from 'fs';

const source = process.argv[2];
if (!source) { console.error('Informe o caminho do arquivo. Ex: node patch-supabase.mjs ~/Downloads/all-operacional.jsx'); process.exit(1); }

let content = readFileSync(source, 'utf8');

// Remove o bloco de storage do artifact e substitui pelo Supabase
const OLD_STORAGE = `// ─── STORAGE ───────────────────────────────────────────────────
const SK = { C:'all_cli_v2', E:'all_em_v2', CONF:'all_conf_v2', AN:'all_an_v2', COM:'all_com_v2', USERS:'all_users_v1', FECH:'all_fech_v1' };

const sGet = async k => {
  try {
    if (typeof window.storage !== 'undefined' && window.storage?.get) {
      const r = await window.storage.get(k);
      return r ? JSON.parse(r.value) : null;
    }
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
};
const sSet = async (k, v) => {
  try {
    if (typeof window.storage !== 'undefined' && window.storage?.set) {
      await window.storage.set(k, JSON.stringify(v));
    } else {
      localStorage.setItem(k, JSON.stringify(v));
    }
  } catch {}
};`;

const NEW_STORAGE = `// ─── STORAGE — Supabase (Vercel) + localStorage (fallback) ────
import { createClient } from '@supabase/supabase-js';
const SK = { C:'all_cli_v2', E:'all_em_v2', CONF:'all_conf_v2', AN:'all_an_v2', COM:'all_com_v2', USERS:'all_users_v1', FECH:'all_fech_v1' };
const _url = import.meta.env?.VITE_SUPABASE_URL || '';
const _key = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';
const supa = _url && _key ? createClient(_url, _key) : null;

const sGet = async k => {
  try {
    if (supa) {
      const { data } = await supa.from('app_data').select('value').eq('key', k).maybeSingle();
      if (data?.value !== undefined) { localStorage.setItem(k, JSON.stringify(data.value)); return data.value; }
    }
    const v = localStorage.getItem(k); return v ? JSON.parse(v) : null;
  } catch { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } }
};
const sSet = async (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
    if (supa) await supa.from('app_data').upsert({ key: k, value: v });
  } catch {}
};`;

if (!content.includes('window.storage')) {
  console.error('⚠️  Bloco de storage não encontrado — arquivo pode já estar patcheado ou formato mudou.');
  process.exit(1);
}

content = content.replace(OLD_STORAGE, NEW_STORAGE);

if (content.includes('window.storage')) {
  console.error('❌  Patch falhou — tente atualizar o patch-supabase.mjs');
  process.exit(1);
}

writeFileSync('./src/App.jsx', content, 'utf8');
console.log('✅  App.jsx patcheado com Supabase e salvo em src/App.jsx');
