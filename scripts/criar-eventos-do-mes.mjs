// Cria os eventos de um mês: toda sexta é Fire, todo sábado é Culto, e o
// segundo sábado é o Culto de Santa Ceia. É o padrão do calendário do RGNR,
// confirmado pela liderança. Quando um mês fugir do padrão (conferência,
// Atmosfera, Kids), a data extra entra à mão depois.
//
// Idempotente: a tabela tem `data` unique, então rodar de novo não duplica.
// Uma data que já existe é deixada exatamente como está, porque pode já ter
// resposta de músico em cima dela.
//
//   node scripts/criar-eventos-do-mes.mjs 2026-10            (simulação)
//   node scripts/criar-eventos-do-mes.mjs 2026-10 --aplicar  (grava)

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const APLICAR = process.argv.includes("--aplicar");
const MES_ARG = process.argv.find((a) => /^\d{4}-\d{2}$/.test(a));

if (!MES_ARG) {
  console.error("\nFalta o mês. Ex.: node scripts/criar-eventos-do-mes.mjs 2026-10\n");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(join(RAIZ, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const CHAVE = env.SUPABASE_SERVICE_ROLE_KEY;

async function api(caminho, opcoes = {}) {
  const r = await fetch(`${URL_BASE}/rest/v1/${caminho}`, {
    ...opcoes,
    headers: {
      apikey: CHAVE,
      Authorization: `Bearer ${CHAVE}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...opcoes.headers,
    },
  });
  const texto = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${caminho} :: ${texto.slice(0, 250)}`);
  return texto ? JSON.parse(texto) : null;
}

// ------------------------------------------------------------
// O padrão do mês
// ------------------------------------------------------------

const SEXTA = 5;
const SABADO = 6;

// Horários de seed.sql. Fire toca mais tarde e passa o som às 18h; o culto
// de sábado passa o som às 15h, quatro horas antes.
const FIRE = { tipo: "fire", hora_evento: "20:00", hora_passagem: "18:00" };
const CULTO = { tipo: "culto", hora_evento: "19:00", hora_passagem: "15:00" };

function eventosDoMes(ano, mes) {
  const dias = new Date(ano, mes, 0).getDate();
  const eventos = [];
  let sabados = 0;

  for (let dia = 1; dia <= dias; dia++) {
    // Meio-dia para o fuso não empurrar a data para o dia anterior.
    const d = new Date(ano, mes - 1, dia, 12);
    const iso = `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

    if (d.getDay() === SEXTA) {
      eventos.push({ data: iso, titulo: null, ...FIRE });
    } else if (d.getDay() === SABADO) {
      sabados++;
      eventos.push({
        data: iso,
        titulo: sabados === 2 ? "Culto de Santa Ceia" : null,
        ...CULTO,
      });
    }
  }

  return eventos;
}

// ------------------------------------------------------------

const [ano, mes] = MES_ARG.split("-").map(Number);
const previstos = eventosDoMes(ano, mes);
const ultimo = String(new Date(ano, mes, 0).getDate());

const existentes = await api(
  `eventos?select=data,tipo,titulo&data=gte.${MES_ARG}-01&data=lte.${MES_ARG}-${ultimo}`
);
const jaTem = new Set(existentes.map((e) => e.data));

console.log(`\n${MES_ARG} — ${previstos.length} sextas e sábados\n`);

const novos = [];
for (const e of previstos) {
  const rotulo = `${e.data}  ${e.tipo.padEnd(5)} ${e.titulo ?? ""}`.trimEnd();
  if (jaTem.has(e.data)) {
    console.log(`  = ${rotulo}   (já existe, não toquei)`);
  } else {
    console.log(`  + ${rotulo}`);
    novos.push(e);
  }
}

if (novos.length === 0) {
  console.log("\nNada a criar.\n");
  process.exit(0);
}

if (!APLICAR) {
  console.log(`\nSimulação. Rode com --aplicar para criar ${novos.length} evento(s).\n`);
  process.exit(0);
}

// D11: prazo_resposta fica nulo porque a liderança não definiu data limite.
// Quem fecha o formulário é o botão do painel, em aberto_para_resposta.
const criados = await api("eventos", {
  method: "POST",
  body: JSON.stringify(
    novos.map((e) => ({
      ...e,
      exigencia_alta: false,
      prazo_resposta: null,
      aberto_para_resposta: true,
      status: "rascunho",
    }))
  ),
});

console.log(`\n${criados.length} evento(s) criado(s). Formulário de ${MES_ARG} no ar.\n`);
