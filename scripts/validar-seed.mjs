// Confere supabase/seed.sql antes de rodar no banco.
//
// Por que existe: o seed insere as relações com
//   join musicos m on m.slug = v.slug
// e um JOIN não reclama de slug errado — ele simplesmente NÃO INSERE a linha.
// Um typo em 'raquel-malta' faria a Raquel sumir do violão em silêncio,
// e o erro só apareceria na hora de montar uma escala.
//
// Uso: node scripts/validar-seed.mjs

import { readFileSync, readdirSync } from 'node:fs'

const seed = readFileSync('supabase/seed.sql', 'utf8')

// lê todas as migrations em ordem, para não quebrar quando surgir a 2ª
const migration = readdirSync('supabase/migrations')
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => readFileSync(`supabase/migrations/${f}`, 'utf8'))
  .join('\n')

// Delimita cada bloco pelo próximo "insert into" — e não por ";",
// porque há ponto e vírgula dentro de strings (ex.: a nota da Nayanne).
function bloco(txt, nome) {
  const i = txt.indexOf(`insert into ${nome}`)
  if (i < 0) return ''
  const resto = txt.slice(i + 10)
  const j = resto.indexOf('insert into')
  return j < 0 ? resto : resto.slice(0, j)
}

const problemas = []
const ok = (msg) => console.log(`  ✓ ${msg}`)
const erro = (msg) => {
  problemas.push(msg)
  console.log(`  ✗ ${msg}`)
}

console.log('\nValidando supabase/seed.sql\n')

// --- elenco ---
const slugs = new Set(
  [...bloco(seed, 'musicos (').matchAll(/^\s*\('.*?',\s*'([a-z0-9-]+)'/gm)].map((m) => m[1]),
)
slugs.size === 37
  ? ok(`${slugs.size} músicos cadastrados`)
  : erro(`${slugs.size} músicos cadastrados — o elenco tem 37`)

// --- referências que sumiriam no join ---
const refs = []
for (const tabela of ['musico_instrumento', 'musico_funcao_ordem']) {
  for (const m of bloco(seed, tabela).matchAll(/^\s*\('([a-z0-9-]+)',/gm)) {
    refs.push({ tabela, slug: m[1] })
  }
}
const orfaos = refs.filter((r) => !slugs.has(r.slug))
orfaos.length === 0
  ? ok(`${refs.length} referências, todas com músico correspondente`)
  : erro(`slugs sem músico: ${orfaos.map((o) => `${o.slug} (${o.tabela})`).join(', ')}`)

// --- relações músico × instrumento ---
const pares = [
  ...bloco(seed, 'musico_instrumento').matchAll(
    /^\s*\('([a-z0-9-]+)',\s*'([a-z]+)',\s*(null|'[a-z]+'),\s*(true|false)/gm,
  ),
].map((m) => ({ slug: m[1], instrumento: m[2], nivel: m[3], principal: m[4] === 'true' }))

ok(`${pares.length} relações músico × instrumento`)

const chaves = pares.map((p) => `${p.slug}|${p.instrumento}`)
const duplicadas = [...new Set(chaves.filter((c, i) => chaves.indexOf(c) !== i))]
duplicadas.length === 0
  ? ok('nenhuma chave primária duplicada')
  : erro(`chave duplicada: ${duplicadas.join(', ')}`)

// --- exatamente um instrumento principal por músico ---
const comInstrumento = [...new Set(pares.map((p) => p.slug))]
const principais = {}
for (const p of pares) if (p.principal) principais[p.slug] = (principais[p.slug] ?? 0) + 1

const multiplos = Object.entries(principais).filter(([, n]) => n > 1)
multiplos.length === 0
  ? ok('nenhum músico com dois instrumentos principais')
  : erro(`dois principais: ${multiplos.map(([s, n]) => `${s} (${n})`).join(', ')}`)

const semPrincipal = comInstrumento.filter((s) => !principais[s])
semPrincipal.length === 0
  ? ok('todo músico com instrumento tem um principal')
  : erro(`sem principal: ${semPrincipal.join(', ')}`)

// --- FKs contra a migration ---
const instrumentosDefinidos = new Set(
  [...bloco(migration, 'instrumentos').matchAll(/\('([a-z]+)',/g)].map((m) => m[1]),
)
const inexistentes = [...new Set(pares.map((p) => p.instrumento))].filter(
  (i) => !instrumentosDefinidos.has(i),
)
inexistentes.length === 0
  ? ok('todos os instrumentos existem na migration')
  : erro(`instrumento inexistente: ${inexistentes.join(', ')}`)

const funcoesDefinidas = new Set(
  [...bloco(migration, 'funcoes').matchAll(/\('([a-z0-9_]+)',/g)].map((m) => m[1]),
)
const funcoesUsadas = [
  ...bloco(seed, 'musico_funcao_ordem').matchAll(/^\s*\('[a-z0-9-]+',\s*'([a-z0-9_]+)'/gm),
].map((m) => m[1])
const funcoesInexistentes = funcoesUsadas.filter((f) => !funcoesDefinidas.has(f))
funcoesInexistentes.length === 0
  ? ok('todas as funções existem na migration')
  : erro(`função inexistente: ${funcoesInexistentes.join(', ')}`)

// --- avisos (não são erros) ---
const semInstrumento = [...slugs].filter((s) => !comInstrumento.includes(s))
if (semInstrumento.length) {
  console.log(
    `\n  ⚠️  sem instrumento (o formulário vai perguntar): ${semInstrumento.join(', ')}`,
  )
}

console.log(
  problemas.length === 0
    ? '\nSeed íntegro.\n'
    : `\n${problemas.length} problema(s). Corrigir antes de rodar no banco.\n`,
)
process.exit(problemas.length === 0 ? 0 : 1)
