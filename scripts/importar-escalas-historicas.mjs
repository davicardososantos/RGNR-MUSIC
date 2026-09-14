// Importa as escalas que já aconteceram, informadas pela liderança.
//
// Idempotente: pode rodar quantas vezes quiser. Detecta sozinho se as
// migrations de 14/09 já foram aplicadas e, se não foram, importa só o
// que o schema atual aguenta, listando o que ficou pendente.
//
//   node scripts/importar-escalas-historicas.mjs            (simulação)
//   node scripts/importar-escalas-historicas.mjs --aplicar  (grava)

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const APLICAR = process.argv.includes("--aplicar");

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
// Os dados, como vieram da liderança.
// ------------------------------------------------------------

// Banda da Débora Miranda (vice-presidente). Apoia os cultos de ceia.
const J_RAPHA = [
  { nome: "Marquinhos", slug: "marquinhos-j-rapha" },
  { nome: "Joãozinho", slug: "joaozinho-j-rapha" },
  { nome: "Claudinho", slug: "claudinho-j-rapha" },
  { nome: "Jhonas", slug: "jhonas-j-rapha" },
];

const ESCALAS = [
  {
    data: "2026-09-04",
    tipo: "conferencia",
    titulo: "Conferência — sexta",
    hora_evento: "20:00:00",
    hora_passagem: "18:00:00",
    criar_evento: true,
    escala: [
      ["teclado_base", "davi"],
      ["teclado_aux", "andre-santos"],
      ["violao", "mateus"],
      ["baixo", "andre-lima"],
      ["guitarra_1", "alef"],
      ["guitarra_2", "leo"],
      ["bateria", "raphael"],
    ],
  },
  {
    data: "2026-09-05",
    tipo: "conferencia",
    titulo: "Conferência — sábado",
    hora_evento: "19:00:00",
    hora_passagem: "15:00:00",
    criar_evento: true,
    escala: [
      ["teclado_base", "davi"],
      ["teclado_aux", "andre-santos"],
      ["violao", "andre-lima"],
      ["baixo", "elias"],
      ["guitarra_1", "lucas-de-jesus"],
      ["guitarra_2", "alef"],
      ["bateria", "matheus"],
    ],
  },
  {
    data: "2026-09-05",
    tipo: "atmosfera",
    titulo: "Atmosfera — sábado à tarde",
    hora_evento: "15:00:00",
    hora_passagem: null,
    criar_evento: true,
    escala: [
      ["teclado_base", "samuel"],
      ["teclado_aux", "vinicius"],
      ["guitarra_1", "leo"],
      ["guitarra_2", "daniel"],
      ["baixo", "raphael-francisco"],
      ["bateria", "raphael", "revezou com o Gabriel"],
      ["bateria", "gabriel", "revezou com o Raphael"],
    ],
  },
  {
    data: "2026-09-11",
    tipo: "fire",
    criar_evento: false, // já existe, com disponibilidades coletadas
    escala: [
      ["bateria", "matheus"],
      ["baixo", "leo"],
      ["teclado_base", "davi"],
      ["violao", "andre-lima"],
      ["comunicacao", "andre-lima"],
    ],
  },
  {
    data: "2026-09-12",
    tipo: "culto",
    criar_evento: false, // já existe: "Culto de Santa Ceia"
    escala: [
      ["teclado_base", "marquinhos-j-rapha"],
      ["guitarra_1", "alef"],
      ["guitarra_2", "joaozinho-j-rapha"],
      ["violao", "claudinho-j-rapha"],
      ["baixo", "elias"],
      ["bateria", "jhonas-j-rapha"],
      ["comunicacao", "marquinhos-j-rapha"],
      ["click_vs", "marquinhos-j-rapha"],
    ],
  },
];

// O Léo tocou baixo no Fire de 11/09, mas só tinha guitarra no cadastro.
const INSTRUMENTOS_NOVOS = [
  { slug: "leo", instrumento_id: "baixo", nivel: null, principal: false, ordem: "reserva",
    observacao: "Tocou baixo no Fire de 11/09/2026. Nível a avaliar pela liderança." },
];

// ------------------------------------------------------------

async function main() {
  console.log(APLICAR ? "MODO: GRAVANDO\n" : "MODO: SIMULAÇÃO (use --aplicar para gravar)\n");

  const musicos = await api("musicos?select=id,nome,slug");
  const porSlug = new Map(musicos.map((m) => [m.slug, m]));

  // As migrations de 14/09 já rodaram?
  // Perguntar pela coluna direto: derivar de um select que não a pede
  // dá falso negativo.
  let temBanda = false;
  try {
    await api("musicos?select=banda&limit=1");
    temBanda = true;
  } catch { /* coluna ainda não existe */ }

  let temTiposNovos = false;
  try {
    await api("formacao?select=tipo&tipo=eq.conferencia&limit=1");
    temTiposNovos = true;
  } catch { /* enum ainda não tem o valor */ }

  console.log(`migration 1 (banda/revezamento): ${temBanda ? "✅ aplicada" : "⏳ pendente"}`);
  console.log(`migration 2 (conferência/atmosfera): ${temTiposNovos ? "✅ aplicada" : "⏳ pendente"}\n`);

  // 1. Músicos da J Rapha
  if (temBanda) {
    for (const p of J_RAPHA) {
      if (porSlug.has(p.slug)) { console.log(`  = ${p.nome} já cadastrado`); continue; }
      console.log(`  + músico ${p.nome} (J Rapha)`);
      if (APLICAR) {
        const [novo] = await api("musicos", {
          method: "POST",
          body: JSON.stringify({
            nome: p.nome, slug: p.slug, banda: "j_rapha", status: "fora",
            no_formulario: false, frentes: ["culto"],
            nota: "Banda J Rapha (Débora Miranda) — apoio nos cultos de Santa Ceia",
          }),
        });
        porSlug.set(p.slug, novo);
      }
    }
  } else {
    console.log("  ⏳ J Rapha aguarda a coluna `banda`");
  }

  // 2. Instrumentos novos
  for (const i of INSTRUMENTOS_NOVOS) {
    const m = porSlug.get(i.slug);
    if (!m) continue;
    const ja = await api(`musico_instrumento?select=musico_id&musico_id=eq.${m.id}&instrumento_id=eq.${i.instrumento_id}`);
    if (ja.length) { console.log(`  = ${m.nome} já tem ${i.instrumento_id}`); continue; }
    console.log(`  + ${m.nome} → ${i.instrumento_id}`);
    if (APLICAR) {
      await api("musico_instrumento", {
        method: "POST",
        body: JSON.stringify({ musico_id: m.id, instrumento_id: i.instrumento_id,
          nivel: i.nivel, principal: i.principal, ordem: i.ordem, observacao: i.observacao }),
      });
    }
  }

  // 3. Eventos e escalações
  for (const ev of ESCALAS) {
    const precisaTipoNovo = ev.tipo === "conferencia" || ev.tipo === "atmosfera";
    if (precisaTipoNovo && !temTiposNovos) {
      console.log(`\n⏳ ${ev.data} ${ev.tipo} — aguarda as migrations`);
      continue;
    }

    let [evento] = await api(`eventos?select=id,data,tipo,titulo&data=eq.${ev.data}&tipo=eq.${ev.tipo}`);
    if (!evento) {
      if (!ev.criar_evento) { console.log(`\n⚠️ ${ev.data} ${ev.tipo} — esperava evento existente, não achei`); continue; }
      console.log(`\n+ evento ${ev.data} · ${ev.titulo}`);
      if (APLICAR) {
        [evento] = await api("eventos", {
          method: "POST",
          body: JSON.stringify({ data: ev.data, tipo: ev.tipo, titulo: ev.titulo,
            hora_evento: ev.hora_evento, hora_passagem: ev.hora_passagem,
            status: "fechada", aberto_para_resposta: false }),
        });
      } else { console.log("  (simulação: sem id, escalações não são listadas)"); continue; }
    } else {
      console.log(`\n= evento ${ev.data} ${ev.tipo}${evento.titulo ? " · " + evento.titulo : ""}`);
    }

    const existentes = await api(`escalacoes?select=funcao_id,musico_id&evento_id=eq.${evento.id}`);
    const jaTem = new Set(existentes.map((e) => `${e.funcao_id}|${e.musico_id}`));

    for (const [funcao, slug, obs] of ev.escala) {
      const m = porSlug.get(slug);
      if (!m) { console.log(`  ⚠️ músico "${slug}" não encontrado — pulando`); continue; }
      if (jaTem.has(`${funcao}|${m.id}`)) { console.log(`  = ${funcao.padEnd(13)} ${m.nome}`); continue; }
      console.log(`  + ${funcao.padEnd(13)} ${m.nome}${obs ? " — " + obs : ""}`);
      if (APLICAR) {
        const corpo = { evento_id: evento.id, funcao_id: funcao, musico_id: m.id,
          tipo: "titular", confirmado: true, criado_por: "importacao-historica" };
        if (obs) corpo.observacao = obs;
        await api("escalacoes", { method: "POST", body: JSON.stringify(corpo) });
      }
    }
  }

  console.log("\nFim.");
}

main().catch((e) => { console.error("\nERRO:", e.message); process.exit(1); });
