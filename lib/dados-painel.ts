import 'server-only'
import { servico } from '@/lib/supabase/service'
import { hojeISO, hora } from '@/lib/datas'
import type { Evento, RespostaDisponibilidade, StatusEvento, TipoEvento } from '@/lib/tipos'

/**
 * Os números do painel dos gestores (30/09/2026): o dashboard, as escalas
 * em cartões e o mapa de cobertura. Uma ida ao banco para tudo.
 */

export type DataPainel = {
  id: string
  data: string
  tipo: TipoEvento
  titulo: string | null
  hora: string
  passagem: string | null
  aberto: boolean
  status: StatusEvento
  sim: number
  sePrecisar: number
  nao: number
  semResposta: number
  preenchidas: number
  posicoes: number
  /** Pessoas distintas na escala (quem tem duas funções conta uma vez). */
  escalados: number
  confirmados: number
  imprevistos: number
}

export type CelulaCobertura = { sim: string[]; sePrecisar: string[] }

export type Cobertura = {
  linhas: { id: string; nome: string }[]
  datas: { id: string; data: string; tipo: TipoEvento; titulo: string | null }[]
  /** chave `${linha}|${eventoId}` */
  celulas: Record<string, CelulaCobertura>
}

export type Acesso = { nome: string; slug: string; foto: string | null; quando: string }

export type Aniversario = { nome: string; slug: string; foto: string | null; data: string; idade: number; emDias: number }

export type Painel = {
  hoje: string
  total: number
  datas: DataPainel[]
  cobertura: Cobertura
  adesao: { entraram: number; total: number; recentes: Acesso[] }
  /** Próximos 30 dias, do mais perto ao mais longe. */
  aniversarios: Aniversario[]
}

// As linhas do mapa: o que a escala precisa cobrir. Bateria aceita cajon,
// como a posição de bateria da formação (PRD §6.2).
const LINHAS = [
  { id: 'baixo', nome: 'Baixo', instrumentos: ['baixo'] },
  { id: 'bateria', nome: 'Bateria', instrumentos: ['bateria', 'cajon'] },
  { id: 'teclado', nome: 'Teclado', instrumentos: ['teclado'] },
  { id: 'guitarra', nome: 'Guitarra', instrumentos: ['guitarra'] },
  { id: 'violao', nome: 'Violão', instrumentos: ['violao'] },
]

export async function carregarPainel(): Promise<Painel> {
  const db = servico()
  const hoje = hojeISO()

  const [
    { data: eventos },
    { data: musicos },
    { data: relacoes },
    { data: formacao },
  ] = await Promise.all([
    db.from('eventos').select('*').gte('data', hoje).order('data').order('hora_evento'),
    db
      .from('musicos')
      .select('id, nome, slug, status, ultimo_acesso, aniversario, foto_url')
      .eq('no_formulario', true)
      .eq('banda', 'music'),
    db.from('musico_instrumento').select('musico_id, instrumento_id').eq('ativo', true),
    db.from('formacao').select('tipo, funcao_id'),
  ])

  const futuros = (eventos ?? []) as Evento[]
  const ids = futuros.map((e) => e.id)
  const [{ data: disps }, { data: escs }] = ids.length
    ? await Promise.all([
        db.from('disponibilidades').select('evento_id, musico_id, resposta').in('evento_id', ids),
        db
          .from('escalacoes')
          .select('evento_id, funcao_id, musico_id, confirmado, imprevisto_em')
          .in('evento_id', ids),
      ])
    : [{ data: [] }, { data: [] }]

  const elenco = (musicos ?? []).filter((m) => m.status !== 'fora')
  const noElenco = new Set(elenco.map((m) => m.id as string))
  const nome = new Map(elenco.map((m) => [m.id as string, m.nome as string]))
  const respostas = (disps ?? []).filter((d) => noElenco.has(d.musico_id as string))
  const escalacoes = escs ?? []

  const posicoesPorTipo = new Map<string, number>()
  for (const f of formacao ?? []) posicoesPorTipo.set(f.tipo as string, (posicoesPorTipo.get(f.tipo as string) ?? 0) + 1)

  const datas: DataPainel[] = futuros.map((e) => {
    const doEvento = respostas.filter((d) => d.evento_id === e.id)
    const conta = (r: RespostaDisponibilidade) => doEvento.filter((d) => d.resposta === r).length
    const naEscala = escalacoes.filter((x) => x.evento_id === e.id)
    const pessoas = [...new Set(naEscala.map((x) => x.musico_id as string))]
    return {
      id: e.id,
      data: e.data,
      tipo: e.tipo,
      titulo: e.titulo,
      hora: hora(e.hora_evento) ?? '',
      passagem: hora(e.hora_passagem),
      aberto: e.aberto_para_resposta,
      status: e.status,
      sim: conta('sim'),
      sePrecisar: conta('se_precisar'),
      nao: conta('nao'),
      semResposta: Math.max(elenco.length - doEvento.length, 0),
      preenchidas: new Set(naEscala.map((x) => x.funcao_id as string)).size,
      posicoes: posicoesPorTipo.get(e.tipo) ?? 0,
      escalados: pessoas.length,
      confirmados: pessoas.filter((id) =>
        naEscala.filter((x) => x.musico_id === id).every((x) => x.confirmado),
      ).length,
      imprevistos: pessoas.filter((id) => naEscala.some((x) => x.musico_id === id && x.imprevisto_em)).length,
    }
  })

  // ---------- mapa de cobertura ----------
  const tocaPorLinha = new Map(
    LINHAS.map((l) => [
      l.id,
      new Set(
        (relacoes ?? [])
          .filter((r) => l.instrumentos.includes(r.instrumento_id as string) && noElenco.has(r.musico_id as string))
          .map((r) => r.musico_id as string),
      ),
    ]),
  )
  const celulas: Record<string, CelulaCobertura> = {}
  for (const e of futuros) {
    for (const l of LINHAS) {
      const tocam = tocaPorLinha.get(l.id)!
      const doEvento = respostas.filter((d) => d.evento_id === e.id && tocam.has(d.musico_id as string))
      const nomes = (r: string) =>
        doEvento
          .filter((d) => d.resposta === r)
          .map((d) => nome.get(d.musico_id as string) ?? '')
          .sort((a, b) => a.localeCompare(b))
      celulas[`${l.id}|${e.id}`] = { sim: nomes('sim'), sePrecisar: nomes('se_precisar') }
    }
  }

  // ---------- adesão à área do músico ----------
  const entraram = elenco
    .filter((m) => m.ultimo_acesso)
    .sort((a, b) => (b.ultimo_acesso as string).localeCompare(a.ultimo_acesso as string))

  // ---------- aniversários dos próximos 30 dias ----------
  const base = new Date(`${hoje}T12:00:00`)
  const aniversarios: Aniversario[] = elenco
    .filter((m) => m.aniversario)
    .map((m) => {
      const nasc = m.aniversario as string
      // 29/02 vira 28/02 nos anos que não são bissextos.
      const mmdd = nasc.slice(5, 10) === '02-29' ? '02-28' : nasc.slice(5, 10)
      let proximo = new Date(`${hoje.slice(0, 4)}-${mmdd}T12:00:00`)
      if (proximo < base) proximo = new Date(`${Number(hoje.slice(0, 4)) + 1}-${mmdd}T12:00:00`)
      const emDias = Math.round((proximo.getTime() - base.getTime()) / 86_400_000)
      return {
        nome: m.nome as string,
        slug: m.slug as string,
        foto: m.foto_url ? `/foto/${m.id}` : null,
        data: proximo.toISOString().slice(0, 10),
        idade: proximo.getFullYear() - Number(nasc.slice(0, 4)),
        emDias,
      }
    })
    .filter((a) => a.emDias <= 30)
    .sort((a, b) => a.emDias - b.emDias)

  return {
    hoje,
    total: elenco.length,
    aniversarios,
    datas,
    cobertura: {
      linhas: LINHAS.map(({ id, nome }) => ({ id, nome })),
      datas: futuros.map((e) => ({ id: e.id, data: e.data, tipo: e.tipo, titulo: e.titulo })),
      celulas,
    },
    adesao: {
      entraram: entraram.length,
      total: elenco.length,
      recentes: entraram.slice(0, 6).map((m) => ({
        nome: m.nome as string,
        slug: m.slug as string,
        foto: m.foto_url ? `/foto/${m.id}` : null,
        quando: m.ultimo_acesso as string,
      })),
    },
  }
}
