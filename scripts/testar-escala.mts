/**
 * Exercita a lógica da tela de escala com o elenco real, mas com respostas
 * SINTÉTICAS em memória. Não escreve nada no banco.
 *
 * Uso: npm run testar-escala
 */

import { createClient } from '@supabase/supabase-js'
import {
  candidatosParaFuncao,
  type EscalacaoAtual,
  type FuncaoDaEscala,
  type MusicoParaEscala,
} from '../lib/candidatos'
import { checarEscala } from '../lib/regras'
import type { OrdemEscala } from '../lib/tipos'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

let falhas = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const nok = (m: string) => {
  falhas++
  console.log(`  ✗ ${m}`)
}

// ------------------------------------------------------------
// Carrega a estrutura real (só leitura)
// ------------------------------------------------------------

const [{ data: musicosBrutos }, { data: relacoes }, { data: overrides }, { data: formacao }, { data: funcoesBrutas }, { data: funcaoInstr }] =
  await Promise.all([
    db.from('musicos').select('id, nome, status, presenca, eh_lider').eq('no_formulario', true),
    db.from('musico_instrumento').select('*'),
    db.from('musico_funcao_ordem').select('*'),
    db.from('formacao').select('*').order('ordem'),
    db.from('funcoes').select('*'),
    db.from('funcao_instrumentos').select('*'),
  ])

function montarMusicos(): MusicoParaEscala[] {
  return (musicosBrutos ?? []).map((m) => {
    const ordemPorFuncao: Record<string, OrdemEscala> = {}
    for (const o of (overrides ?? []).filter((o) => o.musico_id === m.id)) {
      ordemPorFuncao[o.funcao_id as string] = o.ordem as OrdemEscala
    }
    return {
      id: m.id as string,
      nome: m.nome as string,
      status: m.status,
      presenca: m.presenca,
      ehLider: m.eh_lider as boolean,
      instrumentos: (relacoes ?? [])
        .filter((r) => r.musico_id === m.id)
        .map((r) => ({
          instrumento_id: r.instrumento_id as string,
          nivel: r.nivel,
          ordem: r.ordem as OrdemEscala,
          principal: r.principal as boolean,
        })),
      ordemPorFuncao,
      resposta: null,
      passagemSom: false,
      observacao: null,
    }
  })
}

function funcoesDe(tipo: 'culto' | 'fire'): FuncaoDaEscala[] {
  return (formacao ?? [])
    .filter((f) => f.tipo === tipo)
    .map((f) => ({
      id: f.funcao_id as string,
      nome: (funcoesBrutas ?? []).find((x) => x.id === f.funcao_id)?.nome as string,
      obrigatoria: f.obrigatoria as boolean,
      planoBObrigatorio: f.plano_b_obrigatorio as boolean,
      ordem: f.ordem as number,
      instrumentos: (funcaoInstr ?? [])
        .filter((fi) => fi.funcao_id === f.funcao_id)
        .map((fi) => fi.instrumento_id as string),
    }))
}

const musicos = montarMusicos()
const acha = (nome: string) => musicos.find((m) => m.nome === nome)!
const responde = (nome: string, r: 'sim' | 'se_precisar' | 'nao', som = true) => {
  const m = acha(nome)
  m.resposta = r
  m.passagemSom = som
}

// ------------------------------------------------------------
console.log('\n1. Candidatos ao BAIXO num culto, com respostas simuladas')
// ------------------------------------------------------------
// Elias (Top, 1ª linha) diz não. Ruan Souza (Bom) e Raphael Francisco
// (Intermediário) podem. André Lima (Bom, 2ª linha) topa cobrir.
responde('Elias', 'nao')
responde('Ruan Souza', 'sim')
responde('Raphael Francisco', 'sim')
responde('André Lima', 'se_precisar')
responde('Israel', 'sim')

const culto = funcoesDe('culto')
const fBaixo = culto.find((f) => f.id === 'baixo')!
const g = candidatosParaFuncao(fBaixo, { tipo: 'culto' }, musicos, [])

console.log('   podem:', g.podem.slice(0, 4).map((c) => `${c.musico.nome} (${c.nivel ?? '—'})`).join(', '))
console.log('   se precisar:', g.sePrecisar.map((c) => c.musico.nome).join(', '))
console.log('   não podem:', g.naoPodem.map((c) => c.musico.nome).join(', '))

g.podem[0]?.musico.nome === 'Ruan Souza'
  ? ok('Ruan Souza (Bom, 2ª linha) vem antes de Raphael Francisco (Intermediário, 3ª)')
  : nok(`esperava Ruan Souza primeiro, veio ${g.podem[0]?.musico.nome}`)

g.naoPodem.some((c) => c.musico.nome === 'Elias')
  ? ok('Elias caiu para "não podem" mesmo sendo Top — a resposta manda (PRD §5.1)')
  : nok('Elias deveria estar em "não podem"')

const israel = g.podem.find((c) => c.musico.nome === 'Israel')
israel && g.podem.indexOf(israel) > 0
  ? ok('Israel (reserva, iniciante no baixo) aparece, mas por último')
  : nok('Israel deveria aparecer depois dos outros')

const todosAparecem = g.podem.length + g.sePrecisar.length + g.semResposta.length + g.naoPodem.length
todosAparecem === musicos.length
  ? ok(`ninguém escondido: os ${musicos.length} aparecem em algum grupo (D12)`)
  : nok(`${todosAparecem} de ${musicos.length} apareceram`)

// ------------------------------------------------------------
console.log('\n2. A trava do André Lima (violão x baixo) como regra genérica')
// ------------------------------------------------------------
const fViolao = culto.find((f) => f.id === 'violao')!
const escalado: EscalacaoAtual[] = [
  { id: 'x', funcao_id: 'violao', musico_id: acha('André Lima').id, tipo: 'titular' },
]
const gComViolao = candidatosParaFuncao(fBaixo, { tipo: 'culto' }, musicos, escalado)
const andreNoBaixo = gComViolao.sePrecisar.find((c) => c.musico.nome === 'André Lima')

andreNoBaixo?.avisos.some((a) => a.texto === 'já escalado em outra função')
  ? ok('escalado no violão, o André Lima aparece no baixo com aviso')
  : nok('faltou o aviso de já escalado')

andreNoBaixo
  ? ok('e continua na lista — o app avisa, não bloqueia (D12)')
  : nok('o André Lima sumiu da lista do baixo')

// ------------------------------------------------------------
console.log('\n3. O Fire inverte a regra de quem está em formação')
// ------------------------------------------------------------
const fire = funcoesDe('fire')
const fRitmo = fire.find((f) => f.id === 'ritmo_fire')!
responde('João S', 'sim')

const noFire = candidatosParaFuncao(fRitmo, { tipo: 'fire' }, musicos, [])
const noCulto = candidatosParaFuncao(
  culto.find((f) => f.id === 'bateria')!,
  { tipo: 'culto' },
  musicos,
  [],
)
const joaoFire = noFire.podem.find((c) => c.musico.nome === 'João S')
const joaoCulto = noCulto.podem.find((c) => c.musico.nome === 'João S')

joaoFire?.avisos.some((a) => a.tom === 'positivo' && a.texto === 'candidato a estreia')
  ? ok('no Fire, João S aparece como "candidato a estreia" (positivo)')
  : nok('faltou o destaque positivo no Fire')

joaoCulto?.avisos.some((a) => a.tom === 'atencao' && a.texto === 'em formação')
  ? ok('no culto, o mesmo João S aparece como "em formação" (atenção)')
  : nok('faltou o aviso no culto')

// ------------------------------------------------------------
console.log('\n4. Checklist reagindo à escala')
// ------------------------------------------------------------
const vazia = checarEscala({ evento: { tipo: 'culto' }, funcoes: culto, musicos, escalacoes: [] })
const obrigatorias = vazia.find((c) => c.id === 'obrigatorias')
obrigatorias?.estado === 'pendente'
  ? ok('escala vazia: funções obrigatórias pendentes')
  : nok('deveria acusar funções vazias')

vazia.find((c) => c.id === 'plano-b-baixo')?.estado === 'pendente'
  ? ok('culto sem plano B de baixo é acusado')
  : nok('deveria cobrar o plano B do baixo')

// Monta uma base rítmica com âncora: Caliel (Top) na bateria
const comAncora: EscalacaoAtual[] = [
  { id: '1', funcao_id: 'bateria', musico_id: acha('Caliel').id, tipo: 'titular' },
  { id: '2', funcao_id: 'baixo', musico_id: acha('Ruan Souza').id, tipo: 'titular' },
]
const checada = checarEscala({ evento: { tipo: 'culto' }, funcoes: culto, musicos, escalacoes: comAncora })
checada.find((c) => c.id === 'ancora-ritmica')?.estado === 'ok'
  ? ok('Caliel (Top) na bateria satisfaz a âncora rítmica')
  : nok('a âncora rítmica deveria passar com o Caliel')

// Os dois líderes no palco tem que acusar
const doisLideres: EscalacaoAtual[] = [
  { id: '1', funcao_id: 'teclado_base', musico_id: acha('Davi').id, tipo: 'titular' },
  { id: '2', funcao_id: 'teclado_aux', musico_id: acha('André Santos').id, tipo: 'titular' },
]
checarEscala({ evento: { tipo: 'culto' }, funcoes: culto, musicos, escalacoes: doisLideres })
  .find((c) => c.id === 'lider-livre')?.estado === 'atencao'
  ? ok('Davi e André os dois no palco: acusa (regras §4.4)')
  : nok('deveria acusar os dois líderes escalados')

// Bateria + click/VS na mesma pessoa é o padrão da casa, não acúmulo
const bateriaEClick: EscalacaoAtual[] = [
  { id: '1', funcao_id: 'bateria', musico_id: acha('Caliel').id, tipo: 'titular' },
  { id: '2', funcao_id: 'click_vs', musico_id: acha('Caliel').id, tipo: 'titular' },
]
checarEscala({ evento: { tipo: 'culto' }, funcoes: culto, musicos, escalacoes: bateriaEClick })
  .find((c) => c.id === 'acumulo')?.estado === 'ok'
  ? ok('bateria + click/VS na mesma pessoa não conta como acúmulo')
  : nok('bateria + click/VS não deveria ser acusado')

// ------------------------------------------------------------
console.log('\n5. Formações diferentes por tipo de evento')
// ------------------------------------------------------------
culto.length === 9 ? ok('culto tem 9 funções') : nok(`culto tem ${culto.length}`)
fire.length === 4 ? ok('fire tem 4 funções') : nok(`fire tem ${fire.length}`)
fire.find((f) => f.id === 'harmonia_fire')?.instrumentos.sort().join(',') === 'guitarra,violao'
  ? ok('a harmonia do Fire aceita violão OU guitarra')
  : nok('harmonia_fire com instrumentos errados')

console.log(falhas === 0 ? '\n✅ Lógica da escala conferida.\n' : `\n❌ ${falhas} falha(s).\n`)
process.exit(falhas === 0 ? 0 : 1)
