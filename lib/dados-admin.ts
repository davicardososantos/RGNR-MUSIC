import 'server-only'
import { servico } from '@/lib/supabase/service'
import { hojeISO } from '@/lib/datas'
import type {
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
  whatsapp: string | null
  status: StatusMusico
  presenca: NivelPresenca | null
  respostas: Record<string, RespostaDisponibilidade>
  respondeu: boolean
  /** Alguém respondeu por este músico de um aparelho que não era o dele (PRD §5). */
  outroAparelho: boolean
  /** "Só na escala" e presença baixa pedem confirmação dupla (regras §3.3). */
  precisaConfirmacaoDupla: boolean
}

export type PainelDoMes = {
  /** Hoje e daqui pra frente, do mais próximo ao mais distante. */
  proximos: ResumoEvento[]
  /** Já aconteceu, do mais recente ao mais antigo. */
  historico: ResumoEvento[]
  totalMusicos: number
  responderamAlgo: number
}

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
    { count: totalMusicos },
  ] = await Promise.all([
    db.from('eventos').select('*').order('data'),
    db.from('disponibilidades').select('evento_id, musico_id, resposta'),
    db.from('escalacoes').select('evento_id, funcao_id'),
    db.from('formacao').select('tipo, funcao_id'),
    db
      .from('musicos')
      .select('*', { count: 'exact', head: true })
      .eq('no_formulario', true),
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

  return {
    totalMusicos: totalMusicos ?? 0,
    responderamAlgo: new Set(linhas.map((l) => l.musico_id)).size,
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
  responderamAlgo: number
  faltamResponder: number
  qtdProximos: number
  qtdHistorico: number
}

/** O resumo da tela inicial: o que vem agora e o que está pendente. */
export async function carregarInicioAdmin(): Promise<InicioAdmin> {
  const { proximos, historico, totalMusicos, responderamAlgo } =
    await carregarEventos()

  return {
    proximo: proximos[0] ?? null,
    totalMusicos,
    responderamAlgo,
    faltamResponder: Math.max(totalMusicos - responderamAlgo, 0),
    qtdProximos: proximos.length,
    qtdHistorico: historico.length,
  }
}

/**
 * Quem respondeu e quem falta.
 *
 * A ordem é a ordem do trabalho: primeiro quem falta, e dentro disso os
 * ativos antes — são deles que a escala depende. Quem já respondeu desce.
 */
export async function carregarRespostas(): Promise<{
  eventos: Evento[]
  linhas: LinhaResposta[]
}> {
  const db = servico()

  const [{ data: musicos }, { data: eventos }, { data: disponibilidades }, { data: logs }] =
    await Promise.all([
      db
        .from('musicos')
        .select('id, nome, whatsapp, status, presenca')
        .eq('no_formulario', true)
        .order('nome'),
      db.from('eventos').select('*').order('data'),
      db.from('disponibilidades').select('musico_id, evento_id, resposta'),
      db.from('disponibilidade_log').select('musico_id').eq('chave_conhecida', false),
    ])

  const deOutroAparelho = new Set((logs ?? []).map((l) => l.musico_id as string))

  const linhas: LinhaResposta[] = (musicos ?? []).map((m) => {
    const minhas = (disponibilidades ?? []).filter((d) => d.musico_id === m.id)
    const respostas: Record<string, RespostaDisponibilidade> = {}
    for (const d of minhas) {
      respostas[d.evento_id as string] = d.resposta as RespostaDisponibilidade
    }

    const status = m.status as StatusMusico
    const presenca = m.presenca as NivelPresenca | null

    return {
      id: m.id as string,
      nome: m.nome as string,
      whatsapp: m.whatsapp as string | null,
      status,
      presenca,
      respostas,
      respondeu: minhas.length > 0,
      outroAparelho: deOutroAparelho.has(m.id as string),
      precisaConfirmacaoDupla:
        status === 'presenca_baixa' || presenca === 'so_na_escala',
    }
  })

  const peso = (l: LinhaResposta) =>
    (l.respondeu ? 10 : 0) + (l.status === 'ativo' ? 0 : 1)

  linhas.sort((a, b) => peso(a) - peso(b) || a.nome.localeCompare(b.nome, 'pt-BR'))

  return { eventos: (eventos ?? []) as Evento[], linhas }
}
