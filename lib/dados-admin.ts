import 'server-only'
import { servico } from '@/lib/supabase/service'
import { hojeISO } from '@/lib/datas'
import { avisoCobreData, avisosPorMusico, carregarAvisosAbertos } from '@/lib/avisos'
import type {
  AvisoDoMusico,
  Evento,
  NivelPresenca,
  RespostaDisponibilidade,
  StatusMusico,
} from '@/lib/tipos'

export type ResumoEvento = {
  evento: Evento
  sim: number
  sePrecisar: number
  nao: number
  responderam: number
  /** Posições da formação já preenchidas — o "3 de 9" do painel. */
  preenchidas: number
  posicoes: number
}

export type LinhaResposta = {
  id: string
  nome: string
  slug: string
  whatsapp: string | null
  status: StatusMusico
  presenca: NivelPresenca | null
  respostas: Record<string, RespostaDisponibilidade>
  /** Datas abertas ainda em branco. Zero = está em dia. */
  faltam: number
  /** Alguém respondeu por este músico de um aparelho que não era o dele (PRD §5). */
  outroAparelho: boolean
  /** Recados dos gestores que valem hoje (avisos_musico). */
  avisos: AvisoDoMusico[]
  /** Datas abertas sem resposta que um aviso cobre: a pessoa avisou por fora que não pode. */
  cobertasPorAviso: string[]
  /** Algum aviso pede para não cobrar: o contato é direto, pelos gestores. */
  naoCobrar: boolean
  /** "Só na escala" e presença baixa pedem confirmação dupla (regras §3.3). */
  precisaConfirmacaoDupla: boolean
}

export type PainelDoMes = {
  /** Hoje e daqui pra frente, do mais próximo ao mais distante. */
  proximos: ResumoEvento[]
  /** Já aconteceu, do mais recente ao mais antigo. */
  historico: ResumoEvento[]
  /** Abertas para resposta, de hoje em diante. É o que o formulário mostra. */
  abertos: Evento[]
  totalMusicos: number
  /** Respondeu todas as datas abertas, ou avisou por fora que não pode nelas. */
  emDia: number
  /** Não está em dia, mas tem aviso de não cobrar: fica fora da cobrança. */
  semCobranca: number
  /** Os avisos que valem hoje, com o nome de quem avisou. */
  avisos: AvisoNoPainel[]
}

export type AvisoNoPainel = AvisoDoMusico & { nome: string; slug: string }

/**
 * Tudo que o painel precisa, numa ida só ao banco.
 *
 * A separação entre próximos e histórico passou a existir quando as escalas
 * de setembro que já aconteceram foram importadas: sem isso, a Conferência
 * de 04/09 aparecia no topo da lista de trabalho como se ainda desse para
 * montar.
 */
async function carregarEventos() {
  const db = servico()

  const [
    { data: eventos },
    { data: disponibilidades },
    { data: escalacoes },
    { data: formacao },
    { data: musicos },
    avisosAbertos,
  ] = await Promise.all([
    db.from('eventos').select('*').order('data'),
    db.from('disponibilidades').select('evento_id, musico_id, resposta'),
    db.from('escalacoes').select('evento_id, funcao_id'),
    db.from('formacao').select('tipo, funcao_id'),
    db.from('musicos').select('id, nome, slug').eq('no_formulario', true).order('nome'),
    carregarAvisosAbertos(),
  ])

  const linhas = disponibilidades ?? []
  const escaladas = escalacoes ?? []

  const posicoesPorTipo = new Map<string, number>()
  for (const f of formacao ?? []) {
    posicoesPorTipo.set(
      f.tipo as string,
      (posicoesPorTipo.get(f.tipo as string) ?? 0) + 1,
    )
  }

  const resumos: ResumoEvento[] = ((eventos ?? []) as Evento[]).map((evento) => {
    const doEvento = linhas.filter((l) => l.evento_id === evento.id)
    // Revezamento coloca duas pessoas na mesma função: contar funções
    // distintas, senão "10 de 9 posições".
    const funcoesCobertas = new Set(
      escaladas
        .filter((e) => e.evento_id === evento.id)
        .map((e) => e.funcao_id as string),
    )

    return {
      evento,
      sim: doEvento.filter((l) => l.resposta === 'sim').length,
      sePrecisar: doEvento.filter((l) => l.resposta === 'se_precisar').length,
      nao: doEvento.filter((l) => l.resposta === 'nao').length,
      responderam: doEvento.length,
      preenchidas: funcoesCobertas.size,
      posicoes: posicoesPorTipo.get(evento.tipo) ?? 0,
    }
  })

  const hoje = hojeISO()

  // "Em dia" é quem respondeu TODAS as datas abertas, não quem respondeu
  // alguma. Com três meses no ar ao mesmo tempo, contar "respondeu alguma
  // coisa" dava 90% de resposta enquanto novembro inteiro estava em branco.
  const abertos = ((eventos ?? []) as Evento[]).filter(
    (e) => e.aberto_para_resposta && e.data >= hoje,
  )
  const idsAbertos = new Set(abertos.map((e) => e.id))

  const respondidas = new Set(
    linhas
      .filter((l) => idsAbertos.has(l.evento_id as string))
      .map((l) => `${l.musico_id}|${l.evento_id}`),
  )

  // Uma data sem resposta conta como resolvida quando a pessoa avisou por
  // fora que não pode nela: cobrar o formulário de quem já avisou é ruído.
  const avisos = avisosPorMusico(avisosAbertos, hoje)
  const elenco = musicos ?? []
  let emDia = 0
  let semCobranca = 0

  for (const m of elenco) {
    const dele = avisos.get(m.id as string) ?? []
    const resolvidas = abertos.filter(
      (e) =>
        respondidas.has(`${m.id}|${e.id}`) ||
        dele.some((a) => avisoCobreData(a, e.data)),
    ).length

    if (resolvidas >= abertos.length) emDia++
    else if (dele.some((a) => a.naoCobrar)) semCobranca++
  }

  const nomes = new Map(elenco.map((m) => [m.id as string, m]))

  return {
    totalMusicos: elenco.length,
    abertos,
    emDia,
    semCobranca,
    avisos: [...avisos.values()].flat().flatMap((a) => {
      const m = nomes.get(a.musicoId)
      return m ? [{ ...a, nome: m.nome as string, slug: m.slug as string }] : []
    }),
    proximos: resumos.filter((r) => r.evento.data >= hoje),
    historico: resumos.filter((r) => r.evento.data < hoje).reverse(),
  }
}

export async function carregarPainelDoMes(): Promise<PainelDoMes> {
  return carregarEventos()
}

export type InicioAdmin = {
  proximo: ResumoEvento | null
  totalMusicos: number
  emDia: number
  /** Quem dá para cobrar. Não conta quem tem aviso de não cobrar. */
  faltamResponder: number
  avisos: AvisoNoPainel[]
  datasAbertas: number
  qtdProximos: number
  qtdHistorico: number
}

/** O resumo da tela inicial: o que vem agora e o que está pendente. */
export async function carregarInicioAdmin(): Promise<InicioAdmin> {
  const { proximos, historico, totalMusicos, emDia, semCobranca, abertos, avisos } =
    await carregarEventos()

  return {
    proximo: proximos[0] ?? null,
    totalMusicos,
    emDia,
    faltamResponder: Math.max(totalMusicos - emDia - semCobranca, 0),
    avisos,
    datasAbertas: abertos.length,
    qtdProximos: proximos.length,
    qtdHistorico: historico.length,
  }
}

/**
 * Quem respondeu e quem falta, nas datas que estão abertas agora.
 *
 * Só as datas abertas entram: cobrar alguém por uma data de setembro que já
 * foi fechada não leva a lugar nenhum, e a lista de selos por músico ficaria
 * com 27 quadradinhos no celular.
 *
 * A ordem é a ordem do trabalho: primeiro quem falta mais, e dentro disso os
 * ativos antes — são deles que a escala depende. Quem está em dia desce.
 */
export async function carregarRespostas(): Promise<{
  eventos: Evento[]
  linhas: LinhaResposta[]
}> {
  const db = servico()

  const [
    { data: musicos },
    { data: eventos },
    { data: disponibilidades },
    { data: logs },
    avisosAbertos,
  ] = await Promise.all([
      db
        .from('musicos')
        .select('id, nome, slug, whatsapp, status, presenca')
        .eq('no_formulario', true)
        .order('nome'),
      db.from('eventos').select('*').order('data'),
      db.from('disponibilidades').select('musico_id, evento_id, resposta'),
      db.from('disponibilidade_log').select('musico_id').eq('chave_conhecida', false),
      carregarAvisosAbertos(),
    ])

  const deOutroAparelho = new Set((logs ?? []).map((l) => l.musico_id as string))

  const hoje = hojeISO()
  const abertos = ((eventos ?? []) as Evento[]).filter(
    (e) => e.aberto_para_resposta && e.data >= hoje,
  )
  const idsAbertos = new Set(abertos.map((e) => e.id))
  const avisos = avisosPorMusico(avisosAbertos, hoje)

  const linhas: LinhaResposta[] = (musicos ?? []).map((m) => {
    const minhas = (disponibilidades ?? []).filter(
      (d) => d.musico_id === m.id && idsAbertos.has(d.evento_id as string),
    )
    const respostas: Record<string, RespostaDisponibilidade> = {}
    for (const d of minhas) {
      respostas[d.evento_id as string] = d.resposta as RespostaDisponibilidade
    }

    const status = m.status as StatusMusico
    const presenca = m.presenca as NivelPresenca | null
    const dele = avisos.get(m.id as string) ?? []
    const cobertasPorAviso = abertos
      .filter((e) => !respostas[e.id] && dele.some((a) => avisoCobreData(a, e.data)))
      .map((e) => e.id)

    return {
      id: m.id as string,
      nome: m.nome as string,
      slug: m.slug as string,
      whatsapp: m.whatsapp as string | null,
      status,
      presenca,
      respostas,
      faltam: abertos.length - minhas.length - cobertasPorAviso.length,
      outroAparelho: deOutroAparelho.has(m.id as string),
      avisos: dele,
      cobertasPorAviso,
      naoCobrar: dele.some((a) => a.naoCobrar),
      precisaConfirmacaoDupla:
        status === 'presenca_baixa' || presenca === 'so_na_escala',
    }
  })

  linhas.sort(
    (a, b) =>
      b.faltam - a.faltam ||
      Number(a.status !== 'ativo') - Number(b.status !== 'ativo') ||
      a.nome.localeCompare(b.nome, 'pt-BR'),
  )

  return { eventos: abertos, linhas }
}
