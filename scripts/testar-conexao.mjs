// Confirma que o desenho de segurança do PRD §9 está de pé:
//   - a service role (servidor) lê tudo
//   - a chave publishable (navegador) não lê NADA, por causa do RLS deny-all
//
// Uso: node --env-file=.env.local scripts/testar-conexao.mjs

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const publishable = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY

const mascara = (k) => (k ? `${k.slice(0, 16)}… (${k.length} chars)` : '❌ VAZIA')

console.log('\nAmbiente')
console.log('  URL........:', url ?? '❌ VAZIA')
console.log('  publishable:', mascara(publishable))
console.log('  secret.....:', mascara(secret))

if (!url || !publishable || !secret) {
  console.log('\n❌ Faltam variáveis no .env.local\n')
  process.exit(1)
}

let falhas = 0
const ok = (m) => console.log(`  ✓ ${m}`)
const nok = (m) => {
  falhas++
  console.log(`  ✗ ${m}`)
}

// ------------------------------------------------------------
// 1. Service role — tem que ler tudo
// ------------------------------------------------------------
console.log('\nService role (servidor) — deve LER')

const servidor = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const esperado = {
  musicos: 37,
  musico_instrumento: 46,
  eventos: 6,
  funcoes: 12,
  instrumentos: 6,
  formacao: 13,
  admins: 1,
}

for (const [tabela, n] of Object.entries(esperado)) {
  const { count, error } = await servidor
    .from(tabela)
    .select('*', { count: 'exact', head: true })

  if (error) nok(`${tabela}: ${error.message}`)
  else if (count !== n) nok(`${tabela}: ${count} linhas — esperado ${n}`)
  else ok(`${tabela}: ${count}`)
}

// ------------------------------------------------------------
// 2. Chave publishable — NÃO pode ler nada
// ------------------------------------------------------------
console.log('\nPublishable (navegador) — NÃO deve ler')

const navegador = createClient(url, publishable, {
  auth: { persistSession: false, autoRefreshToken: false },
})

for (const tabela of ['musicos', 'disponibilidades', 'escalacoes', 'admins']) {
  const { data, error } = await navegador.from(tabela).select('*').limit(1)

  if (error) ok(`${tabela}: bloqueado (${error.code ?? 'erro'})`)
  else if (!data || data.length === 0) ok(`${tabela}: 0 linhas — RLS negou`)
  else nok(`${tabela}: VAZOU ${data.length} linha(s) — RLS não está protegendo!`)
}

// ------------------------------------------------------------
// 3. Escrita anônima também tem que falhar
// ------------------------------------------------------------
console.log('\nPublishable — NÃO deve escrever')

const { error: erroEscrita } = await navegador
  .from('disponibilidades')
  .insert({ musico_id: crypto.randomUUID(), evento_id: crypto.randomUUID(), resposta: 'sim' })

erroEscrita
  ? ok(`insert bloqueado (${erroEscrita.code ?? 'erro'})`)
  : nok('insert ANÔNIMO PASSOU — RLS não está protegendo!')

console.log(
  falhas === 0
    ? '\n✅ Banco conectado e o modelo de privacidade está de pé.\n'
    : `\n❌ ${falhas} problema(s).\n`,
)
process.exit(falhas === 0 ? 0 : 1)
