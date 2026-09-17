import 'server-only'
import { servico } from '@/lib/supabase/service'
import { hojeISO } from '@/lib/datas'
import type {
  BandaOrigem,
  Evento,
  NivelPresenca,
  NivelTecnico,
  OrdemEscala,
  RespostaDisponibilidade,
  StatusMusico,
  TipoEscalacao,
} from '@/lib/tipos'

export type DataDaFicha = {
  evento: Evento
  resposta: RespostaDisponibilidade | null
  passagemSom: boolean
  observacao: string | null
  /** E-mail do gestor que alterou a resposta. Nulo = veio do próprio músico. */
  ajustadoPor: string | null
  motivoAjuste: string | null
  escalado: { funcao: string; tipo: TipoEscalacao }[]
}

export type InstrumentoDaFicha = {
  id: string
  nome: string
  nivel: NivelTecnico | null
  ordem: OrdemEscala
  principal: boolean
  /** false = o próprio músico informou no formulário que não toca isso. */
  ativo: boolean
}

export type FichaMusico = {
  id: string
  nome: string
  slug: string
  whatsapp: string | null
  status: StatusMusico
  presenca: NivelPresenca | null
  ehLider: boolean
  nota: string | null
  banda: BandaOrigem
  instrumentos: InstrumentoDaFicha[]
  /** De hoje em diante, do mais próximo ao mais distante. */
  proximas: DataDaFicha[]
  /** Já aconteceu, do mais recente ao mais antigo. */
  passadas: DataDaFicha[]
  resumo: {
    tocou: number
    proximasEscalas: number
    sim: number
    sePrecisar: number
    nao: number
    faltamAbertas: number
  }
}

/**
 * Tudo sobre uma pessoa numa tela só.
 *
 * O pedido que originou isto foi de cuidado, não de controle: os dois
 * gestores queriam abrir um nome e ver em que datas a pessoa esteve na
 * escala e em que datas ela disse que podia. Alguém que marca "sim" todo mês
 * e nunca é escalado é um problema tão real quanto alguém que sumiu.
 */
export async function carregarFicha(slug: string): Promise<FichaMusico | null> {
  const db = servico()

  const { data: musico } = await db
    .from('musicos')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (!musico) return null

  const [
    { data: eventos },
    { data: disponibilidades },
    { data: escalacoes },
    { data: relacoes },
    { data: instrumentos },
    { data: funcoes },
  ] = await Promise.all([
    db.from('eventos').select('*').order('data'),
    db.from('disponibilidades').select('*').eq('musico_id', musico.id),
    db
      .from('escalacoes')
      .select('evento_id, funcao_id, tipo')
      .eq('musico_id', musico.id),
    db.from('musico_instrumento').select('*').eq('musico_id', musico.id),
    db.from('instrumentos').select('id, nome').order('ordem_criticidade'),
    db.from('funcoes').select('id, nome'),
  ])

  const nomeDaFuncao = new Map(
    (funcoes ?? []).map((f) => [f.id as string, f.nome as string]),
  )
  const nomeDoInstrumento = new Map(
    (instrumentos ?? []).map((i) => [i.id as string, i.nome as string]),
  )

  const datas: DataDaFicha[] = ((eventos ?? []) as Evento[]).map((evento) => {
    const disp = (disponibilidades ?? []).find((d) => d.evento_id === evento.id)

    return {
      evento,
      resposta: (disp?.resposta as RespostaDisponibilidade) ?? null,
      passagemSom: Boolean(disp?.passagem_som),
      observacao: (disp?.observacao as string | null) ?? null,
      ajustadoPor: (disp?.ajustado_por as string | null) ?? null,
      motivoAjuste: (disp?.motivo_ajuste as string | null) ?? null,
      escalado: (escalacoes ?? [])
        .filter((e) => e.evento_id === evento.id)
        .map((e) => ({
          funcao: nomeDaFuncao.get(e.funcao_id as string) ?? (e.funcao_id as string),
          tipo: e.tipo as TipoEscalacao,
        })),
    }
  })

  const hoje = hojeISO()
  const proximas = datas.filter((d) => d.evento.data >= hoje)
  const passadas = datas.filter((d) => d.evento.data < hoje).reverse()

  const abertas = proximas.filter((d) => d.evento.aberto_para_resposta)
  const contar = (r: RespostaDisponibilidade) =>
    datas.filter((d) => d.resposta === r).length

  return {
    id: musico.id as string,
    nome: musico.nome as string,
    slug: musico.slug as string,
    whatsapp: musico.whatsapp as string | null,
    status: musico.status as StatusMusico,
    presenca: musico.presenca as NivelPresenca | null,
    ehLider: musico.eh_lider as boolean,
    nota: musico.nota as string | null,
    banda: musico.banda as BandaOrigem,
    instrumentos: (relacoes ?? [])
      .map((r) => ({
        id: r.instrumento_id as string,
        nome:
          nomeDoInstrumento.get(r.instrumento_id as string) ??
          (r.instrumento_id as string),
        nivel: r.nivel as NivelTecnico | null,
        ordem: r.ordem as OrdemEscala,
        principal: r.principal as boolean,
        ativo: r.ativo as boolean,
      }))
      .sort((a, b) => Number(b.principal) - Number(a.principal)),
    proximas,
    passadas,
    resumo: {
      // Só titular conta como ter tocado: plano B é quem ficou de sobreaviso.
      tocou: passadas.filter((d) =>
        d.escalado.some((e) => e.tipo === 'titular'),
      ).length,
      proximasEscalas: proximas.filter((d) => d.escalado.length > 0).length,
      sim: contar('sim'),
      sePrecisar: contar('se_precisar'),
      nao: contar('nao'),
      faltamAbertas: abertas.filter((d) => d.resposta === null).length,
    },
  }
}

export type LinhaDoElenco = {
  id: string
  nome: string
  slug: string
  status: StatusMusico
  banda: BandaOrigem
  noFormulario: boolean
  instrumentoPrincipal: string | null
  tocou: number
  faltamAbertas: number
  disseSim: number
}

/** O elenco inteiro, com o suficiente para decidir em quem tocar primeiro. */
export async function listarElenco(): Promise<LinhaDoElenco[]> {
  const db = servico()
  const hoje = hojeISO()

  const [
    { data: musicos },
    { data: eventos },
    { data: disponibilidades },
    { data: escalacoes },
    { data: relacoes },
    { data: instrumentos },
  ] = await Promise.all([
    db.from('musicos').select('*').order('nome'),
    db.from('eventos').select('id, data, aberto_para_resposta'),
    db.from('disponibilidades').select('musico_id, evento_id, resposta'),
    db.from('escalacoes').select('musico_id, evento_id, tipo'),
    db.from('musico_instrumento').select('*').eq('principal', true),
    db.from('instrumentos').select('id, nome'),
  ])

  const nomeDoInstrumento = new Map(
    (instrumentos ?? []).map((i) => [i.id as string, i.nome as string]),
  )
  const passados = new Set(
    (eventos ?? []).filter((e) => (e.data as string) < hoje).map((e) => e.id as string),
  )
  const abertos = (eventos ?? []).filter(
    (e) => e.aberto_para_resposta && (e.data as string) >= hoje,
  )

  return (musicos ?? []).map((m) => {
    const minhas = (disponibilidades ?? []).filter((d) => d.musico_id === m.id)
    const respondidasAbertas = abertos.filter((e) =>
      minhas.some((d) => d.evento_id === e.id),
    ).length

    return {
      id: m.id as string,
      nome: m.nome as string,
      slug: m.slug as string,
      status: m.status as StatusMusico,
      banda: m.banda as BandaOrigem,
      noFormulario: m.no_formulario as boolean,
      instrumentoPrincipal:
        nomeDoInstrumento.get(
          (relacoes ?? []).find((r) => r.musico_id === m.id)
            ?.instrumento_id as string,
        ) ?? null,
      tocou: (escalacoes ?? []).filter(
        (e) =>
          e.musico_id === m.id &&
          e.tipo === 'titular' &&
          passados.has(e.evento_id as string),
      ).length,
      faltamAbertas: abertos.length - respondidasAbertas,
      disseSim: minhas.filter((d) => d.resposta === 'sim').length,
    }
  })
}
