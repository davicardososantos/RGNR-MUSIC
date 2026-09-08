// Imprime o elenco do banco no formato do por-instrumento.md,
// para conferir contra o documento da liderança.
//
// Uso: node --env-file=.env.local scripts/conferir-elenco.mjs

import { createClient } from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const PESO_ORDEM = {
  primeira_linha: 1,
  segunda_linha: 2,
  terceira_linha: 3,
  carta_na_manga: 4,
  reserva: 5,
  formacao: 6,
  indisponivel: 7,
}
const PESO_NIVEL = { top: 1, avancado: 2, bom: 3, intermediario: 4, iniciante: 5 }

const ORDEM_LABEL = {
  primeira_linha: '1ª linha',
  segunda_linha: '2ª linha',
  terceira_linha: '3ª linha',
  carta_na_manga: 'carta na manga',
  reserva: 'reserva',
  formacao: 'formação',
  indisponivel: 'indisponível',
}
const NIVEL_LABEL = {
  top: 'Top',
  avancado: 'Avançado',
  bom: 'Bom',
  intermediario: 'Intermediário',
  iniciante: 'Iniciante',
}
const STATUS_EMOJI = {
  ativo: '✅',
  presenca_baixa: '🕐',
  destreinado: '💤',
  em_avaliacao: '🎓',
  em_formacao: '🧪',
  restricao: '⛔',
  fora: '📤',
  lideranca: '👔',
}
const PRESENCA_LABEL = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
  so_na_escala: 'Só na escala',
  ausente: 'Ausente',
  sob_demanda: 'Sob demanda',
}

const { data: instrumentos } = await db
  .from('instrumentos')
  .select('*')
  .order('ordem_criticidade')

const { data: relacoes } = await db
  .from('musico_instrumento')
  .select('*, musicos(nome, status, presenca, eh_lider)')

const pad = (s, n) => String(s).padEnd(n)

for (const inst of instrumentos) {
  const linhas = relacoes
    .filter((r) => r.instrumento_id === inst.id)
    .sort(
      (a, b) =>
        PESO_ORDEM[a.ordem] - PESO_ORDEM[b.ordem] ||
        (PESO_NIVEL[a.nivel] ?? 9) - (PESO_NIVEL[b.nivel] ?? 9),
    )

  console.log(`\n${inst.emoji} ${inst.nome.toUpperCase()}  (criticidade ${inst.ordem_criticidade})`)
  console.log('  ' + '─'.repeat(66))
  for (const r of linhas) {
    const m = r.musicos
    console.log(
      '  ' +
        pad(ORDEM_LABEL[r.ordem], 16) +
        pad(m.nome + (m.eh_lider ? ' 👑' : ''), 22) +
        pad(NIVEL_LABEL[r.nivel] ?? '—', 15) +
        pad(PRESENCA_LABEL[m.presenca] ?? '—', 13) +
        (STATUS_EMOJI[m.status] ?? ''),
    )
  }
}

const { data: eventos } = await db.from('eventos').select('*').order('data')
console.log('\n\n📅 EVENTOS DE SETEMBRO')
console.log('  ' + '─'.repeat(66))
for (const e of eventos) {
  const d = new Date(e.data + 'T12:00:00')
  const semana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][d.getDay()]
  console.log(
    '  ' +
      pad(`${semana} ${e.data.slice(8)}/${e.data.slice(5, 7)}`, 12) +
      pad(e.tipo === 'fire' ? '🔥 Fire' : '⛪ Culto', 10) +
      pad(e.titulo ?? '', 24) +
      `passagem ${e.hora_passagem.slice(0, 5)} · começa ${e.hora_evento.slice(0, 5)}` +
      (e.exigencia_alta ? '  ⚠️ exigência alta' : ''),
  )
}
console.log()
