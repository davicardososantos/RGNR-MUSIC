import 'server-only'
import { servico } from '@/lib/supabase/service'
import { hojeISO } from '@/lib/datas'
import type { StatusMusico } from '@/lib/tipos'

export type LinhaRelatorio = {
  id: string
  nome: string
  slug: string
  status: StatusMusico
  /** Titular em evento que já aconteceu. Plano B não conta como ter tocado. */
  tocou: number
  /**
   * Titular só nas datas que tiveram formulário (desde set/2026). É o que se
   * compara com os "sim": antes disso não existe resposta para comparar.
   */
  tocouNoPeriodo: number
  planoB: number
  sim: number
  sePrecisar: number
  nao: number
  respondidas: number
  faltamAbertas: number
}

export type MesHistorico = { mes: string; eventos: number; pessoas: number }

export type PresencaPessoa = {
  id: string
  nome: string
  slug: string
  atual: boolean
  total: number
  porMes: Record<string, number>
}

export type SemTocar = { id: string; nome: string; slug: string; ultima: string | null; total: number }

export type RankingFuncao = { funcao: string; pessoas: { nome: string; slug: string; vezes: number }[]; total: number }

export type Historico = {
  desde: string | null
  meses: MesHistorico[]
  presenca: PresencaPessoa[]
  semTocar: SemTocar[]
  porFuncao: RankingFuncao[]
}

export type Relatorios = {
  linhas: LinhaRelatorio[]
  eventosPassados: number
  /** Datas que a pessoa teve chance de responder. É o divisor da taxa. */
  respondiveis: number
  datasAbertas: number
  historico: Historico
}

// Família de cada função, para o rodízio: guitarra 1 e 2 contam como guitarra.
const FAMILIA: Record<string, string> = {
  teclado_base: 'Teclado',
  teclado_aux: 'Teclado',
  guitarra_1: 'Guitarra',
  guitarra_2: 'Guitarra',
  violao: 'Violão',
  baixo: 'Baixo',
  bateria: 'Bateria',
  comunicacao: 'Comunicação',
}
const ORDEM_FAMILIAS = ['Baixo', 'Bateria', 'Teclado', 'Guitarra', 'Violão', 'Comunicação']

/**
 * Os números que os dois gestores usam para olhar o elenco de longe.
 *
 * Três escolhas que mudam a leitura:
 *
 * 1. **Só quem recebe o formulário entra na tabela.** O apoio externo (J
 *    Rapha) e os ex-membros aparecem nas escalas antigas mas nunca foram
 *    convidados a responder.
 *
 * 2. **O divisor da taxa de resposta é o que a pessoa podia ter respondido**,
 *    não o total de eventos: datas abertas hoje mais as que já receberam
 *    resposta de alguém.
 *
 * 3. **O histórico vem desde jul/2025** (escalas importadas do grupo
 *    Multimídia em 30/09/2026). "Disse sim × tocou" compara só o período com
 *    formulário, senão todo mundo pareceria ter tocado mais do que se ofereceu.
 */
export async function carregarRelatorios(): Promise<Relatorios> {
  const db = servico()
  const hoje = hojeISO()

  const [{ data: musicos }, { data: eventos }, { data: disponibilidades }, { data: escalacoes }] =
    await Promise.all([
      db.from('musicos').select('id, nome, slug, status, no_formulario, banda').order('nome'),
      db.from('eventos').select('id, data, tipo, aberto_para_resposta'),
      db.from('disponibilidades').select('musico_id, evento_id, resposta'),
      db.from('escalacoes').select('musico_id, evento_id, funcao_id, tipo'),
    ])

  const todos = musicos ?? []
  const noFormulario = todos.filter((m) => m.no_formulario)
  const linhasDisp = disponibilidades ?? []
  const comResposta = new Set(linhasDisp.map((d) => d.evento_id as string))
  const dataDe = new Map((eventos ?? []).map((e) => [e.id as string, e.data as string]))

  const passados = new Set(
    (eventos ?? []).filter((e) => (e.data as string) < hoje).map((e) => e.id as string),
  )
  const abertos = (eventos ?? []).filter((e) => e.aberto_para_resposta && (e.data as string) >= hoje)
  const idsAbertos = new Set(abertos.map((e) => e.id as string))
  const respondiveis = new Set([...comResposta, ...idsAbertos])

  const titulares = (escalacoes ?? []).filter((e) => e.tipo === 'titular' && passados.has(e.evento_id as string))

  const linhas: LinhaRelatorio[] = noFormulario.map((m) => {
    const minhas = linhasDisp.filter((d) => d.musico_id === m.id)
    const meusEventosTocados = new Set(titulares.filter((e) => e.musico_id === m.id).map((e) => e.evento_id as string))
    const contar = (r: string) => minhas.filter((d) => d.resposta === r).length

    return {
      id: m.id as string,
      nome: m.nome as string,
      slug: m.slug as string,
      status: m.status as StatusMusico,
      tocou: meusEventosTocados.size,
      tocouNoPeriodo: [...meusEventosTocados].filter((id) => comResposta.has(id)).length,
      planoB: (escalacoes ?? []).filter((e) => e.musico_id === m.id && e.tipo === 'plano_b').length,
      sim: contar('sim'),
      sePrecisar: contar('se_precisar'),
      nao: contar('nao'),
      respondidas: minhas.filter((d) => respondiveis.has(d.evento_id as string)).length,
      faltamAbertas: abertos.length - minhas.filter((d) => idsAbertos.has(d.evento_id as string)).length,
    }
  })

  // ---------- histórico ----------
  const doMusic = new Map(todos.filter((m) => m.banda === 'music').map((m) => [m.id as string, m]))
  const tocadas = titulares.filter((e) => doMusic.has(e.musico_id as string))
  const datasPassadas = [...passados].map((id) => dataDe.get(id)!).sort()
  const desde = datasPassadas[0] ?? null

  const meses: string[] = []
  if (desde) {
    const [a0, m0] = desde.split('-').map(Number)
    const [a1, m1] = hoje.split('-').map(Number)
    for (let a = a0, m = m0; a < a1 || (a === a1 && m <= m1); m === 12 ? ((a += 1), (m = 1)) : (m += 1))
      meses.push(`${a}-${String(m).padStart(2, '0')}`)
  }

  const porMes: MesHistorico[] = meses.map((mes) => {
    const doMes = tocadas.filter((e) => dataDe.get(e.evento_id as string)!.startsWith(mes))
    return {
      mes,
      eventos: new Set([...passados].filter((id) => dataDe.get(id)!.startsWith(mes))).size,
      pessoas: new Set(doMes.map((e) => e.musico_id as string)).size,
    }
  })

  // Presença: pessoa × mês, contando datas (quem fez duas funções no mesmo dia conta uma).
  const presencaMapa = new Map<string, Map<string, Set<string>>>()
  for (const e of tocadas) {
    const mes = dataDe.get(e.evento_id as string)!.slice(0, 7)
    const pessoa = presencaMapa.get(e.musico_id as string) ?? new Map<string, Set<string>>()
    pessoa.set(mes, (pessoa.get(mes) ?? new Set()).add(e.evento_id as string))
    presencaMapa.set(e.musico_id as string, pessoa)
  }
  const presenca: PresencaPessoa[] = [...presencaMapa.entries()]
    .map(([id, porMesSet]) => {
      const m = doMusic.get(id)!
      const porMesN = Object.fromEntries([...porMesSet.entries()].map(([k, v]) => [k, v.size]))
      return {
        id,
        nome: m.nome as string,
        slug: m.slug as string,
        atual: Boolean(m.no_formulario),
        total: Object.values(porMesN).reduce((s, n) => s + n, 0),
        porMes: porMesN,
      }
    })
    .sort((a, b) => Number(b.atual) - Number(a.atual) || b.total - a.total || a.nome.localeCompare(b.nome))

  // Há quanto tempo não toca: só quem está na banda hoje.
  const semTocar: SemTocar[] = noFormulario
    .filter((m) => m.banda === 'music' && m.status !== 'fora')
    .map((m) => {
      const datas = tocadas.filter((e) => e.musico_id === m.id).map((e) => dataDe.get(e.evento_id as string)!)
      return {
        id: m.id as string,
        nome: m.nome as string,
        slug: m.slug as string,
        ultima: datas.length ? datas.sort().at(-1)! : null,
        total: new Set(tocadas.filter((e) => e.musico_id === m.id).map((e) => e.evento_id)).size,
      }
    })
    .sort((a, b) => (a.ultima ?? '0000').localeCompare(b.ultima ?? '0000') || a.nome.localeCompare(b.nome))

  // Rodízio: quem segurou cada função, em datas.
  const porFuncao: RankingFuncao[] = ORDEM_FAMILIAS.map((familia) => {
    const contagem = new Map<string, Set<string>>()
    for (const e of tocadas) {
      if (FAMILIA[e.funcao_id as string] !== familia) continue
      contagem.set(e.musico_id as string, (contagem.get(e.musico_id as string) ?? new Set()).add(e.evento_id as string))
    }
    const pessoas = [...contagem.entries()]
      .map(([id, s]) => ({ nome: doMusic.get(id)!.nome as string, slug: doMusic.get(id)!.slug as string, vezes: s.size }))
      .sort((a, b) => b.vezes - a.vezes || a.nome.localeCompare(b.nome))
    return { funcao: familia, pessoas, total: pessoas.reduce((s, p) => s + p.vezes, 0) }
  })

  return {
    linhas,
    eventosPassados: passados.size,
    respondiveis: respondiveis.size,
    datasAbertas: abertos.length,
    historico: { desde, meses: porMes, presenca, semTocar, porFuncao },
  }
}
