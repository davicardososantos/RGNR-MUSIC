import 'server-only'
import { servico } from '@/lib/supabase/service'
import { hojeISO, hora } from '@/lib/datas'
import type {
  Colega,
  DadosArea,
  EscalaArea,
  EventoArea,
  HistoricoArea,
  MinhaRespostaArea,
  StatusEscala,
} from '@/components/area/tipos'
import type { Evento, RespostaDisponibilidade, TipoEscalacao } from '@/lib/tipos'

/** Como a função aparece para o músico: "Guitarra", não "Guitarra 1". */
const FUNCAO_PARA_MUSICO: Record<string, string> = {
  teclado_base: 'Teclado base',
  teclado_aux: 'Teclado auxiliar',
  guitarra_1: 'Guitarra',
  guitarra_2: 'Guitarra 2',
  violao: 'Violão',
  baixo: 'Baixo',
  bateria: 'Bateria',
  click_vs: 'Click e VS',
  comunicacao: 'Comunicação',
}

// Ordem de palco, para a formação sair sempre na mesma sequência.
const ORDEM_FUNCAO = ['teclado_base', 'teclado_aux', 'guitarra_1', 'guitarra_2', 'violao', 'baixo', 'bateria', 'click_vs', 'comunicacao']

/** A foto passa pelo app (app/foto/[id]): o endereço de origem não chega ao músico. */
const fotoDo = (musicoId: string, fotoUrl: string | null | undefined) => (fotoUrl ? `/foto/${musicoId}` : null)

const rotuloDasFuncoes = (ids: string[]) =>
  [...ids]
    .sort((a, b) => ORDEM_FUNCAO.indexOf(a) - ORDEM_FUNCAO.indexOf(b))
    .map((id) => FUNCAO_PARA_MUSICO[id] ?? id)
    .join(' + ')

function saudacaoAgora() {
  const h = Number(
    new Intl.DateTimeFormat('pt-BR', { hour: 'numeric', hourCycle: 'h23', timeZone: 'America/Sao_Paulo' }).format(
      new Date(),
    ),
  )
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

const paraEventoArea = (e: Evento): EventoArea => ({
  id: e.id,
  data: e.data,
  tipo: e.tipo,
  titulo: e.titulo,
  hora: hora(e.hora_evento) ?? '',
  passagem: hora(e.hora_passagem),
  aberto: e.aberto_para_resposta,
})

type LinhaEscala = {
  evento_id: string
  funcao_id: string
  musico_id: string
  tipo: TipoEscalacao
  confirmado: boolean
  imprevisto_em: string | null
}

/**
 * Tudo o que a área mostra para uma pessoa, numa ida ao banco.
 *
 * Privacidade (D7): daqui só sai a resposta DESTE músico. Dos colegas sai
 * apenas o que está numa escala publicada (nome, foto, função), nunca a
 * disponibilidade de ninguém.
 */
export async function carregarArea(musicoId: string): Promise<DadosArea> {
  const db = servico()
  const hoje = hojeISO()

  const [
    { data: musico },
    { data: relacoes },
    { data: instrumentos },
    { data: futuros },
    { data: minhasEscalas },
    { data: respostas },
  ] = await Promise.all([
    db
      .from('musicos')
      .select('id, nome, nome_completo, foto_url, whatsapp, email, aniversario')
      .eq('id', musicoId)
      .single(),
    db.from('musico_instrumento').select('instrumento_id, principal').eq('musico_id', musicoId).eq('ativo', true),
    db.from('instrumentos').select('id, nome').order('ordem_criticidade'),
    db.from('eventos').select('*').gte('data', hoje).order('data').order('hora_evento'),
    db
      .from('escalacoes')
      .select('evento_id, funcao_id, musico_id, tipo, confirmado, imprevisto_em')
      .eq('musico_id', musicoId),
    db
      .from('disponibilidades')
      .select('evento_id, resposta, passagem_som, observacao')
      .eq('musico_id', musicoId),
  ])

  if (!musico) throw new Error('Músico não encontrado')

  const eventosFuturos = (futuros ?? []) as Evento[]
  const porId = new Map(eventosFuturos.map((e) => [e.id, e]))
  const minhas = (minhasEscalas ?? []) as LinhaEscala[]

  // ---------- respostas ----------
  const mapaRespostas: Record<string, MinhaRespostaArea> = {}
  for (const r of respostas ?? []) {
    if (!porId.has(r.evento_id as string)) continue
    mapaRespostas[r.evento_id as string] = {
      resposta: r.resposta as RespostaDisponibilidade,
      passagemSom: Boolean(r.passagem_som),
      observacao: (r.observacao as string | null) ?? null,
    }
  }

  // ---------- escalas publicadas, de hoje em diante ----------
  const publicadas = [...new Set(minhas.map((l) => l.evento_id))].filter(
    (id) => porId.get(id)?.status === 'publicada',
  )

  let escalas: EscalaArea[] = []
  if (publicadas.length) {
    const { data: doDia } = await db
      .from('escalacoes')
      .select('evento_id, funcao_id, musico_id, tipo, confirmado, imprevisto_em, musicos!escalacoes_musico_id_fkey ( nome, foto_url )')
      .in('evento_id', publicadas)

    const linhas = (doDia ?? []) as unknown as (LinhaEscala & { musicos: { nome: string; foto_url: string | null } })[]

    escalas = publicadas.map((eventoId) => {
      const doEvento = linhas.filter((l) => l.evento_id === eventoId)
      const minhasNoEvento = doEvento.filter((l) => l.musico_id === musicoId)
      const titular = minhasNoEvento.some((l) => l.tipo === 'titular')
      const valendo = minhasNoEvento.filter((l) => (titular ? l.tipo === 'titular' : true))

      const status: StatusEscala = valendo.some((l) => l.imprevisto_em)
        ? 'imprevisto'
        : valendo.every((l) => l.confirmado)
          ? 'confirmado'
          : 'a_confirmar'

      // Formação: titulares agrupados por pessoa, na ordem de palco.
      const pessoas = new Map<string, { nome: string; foto: string | null; funcoes: string[]; planoB: boolean }>()
      for (const l of [...doEvento].sort(
        (a, b) => ORDEM_FUNCAO.indexOf(a.funcao_id) - ORDEM_FUNCAO.indexOf(b.funcao_id),
      )) {
        const chave = `${l.musico_id}:${l.tipo}`
        const atual = pessoas.get(chave) ?? {
          nome: l.musicos?.nome ?? '',
          foto: fotoDo(l.musico_id, l.musicos?.foto_url),
          funcoes: [],
          planoB: l.tipo === 'plano_b',
        }
        atual.funcoes.push(l.funcao_id)
        pessoas.set(chave, atual)
      }
      const formacao: Colega[] = [...pessoas.entries()]
        .sort(([, a], [, b]) => Number(a.planoB) - Number(b.planoB))
        .map(([chave, p]) => ({
          nome: p.nome,
          foto: p.foto,
          funcao: `${rotuloDasFuncoes(p.funcoes)}${p.planoB ? ' (plano B)' : ''}`,
          voce: chave.startsWith(`${musicoId}:`),
        }))

      return {
        eventoId,
        funcao: rotuloDasFuncoes(valendo.map((l) => l.funcao_id)),
        planoB: !titular,
        status,
        formacao,
      }
    })
    escalas.sort((a, b) => porId.get(a.eventoId)!.data.localeCompare(porId.get(b.eventoId)!.data))
  }

  // ---------- histórico: o que já passou ----------
  const idsPassados = [...new Set(minhas.filter((l) => l.tipo === 'titular').map((l) => l.evento_id))].filter(
    (id) => !porId.has(id),
  )
  let historico: HistoricoArea[] = []
  if (idsPassados.length) {
    const { data: passados } = await db
      .from('eventos')
      .select('id, data, tipo, titulo')
      .in('id', idsPassados)
      .lt('data', hoje)
      .order('data', { ascending: false })
    historico = (passados ?? []).map((e) => ({
      data: e.data as string,
      tipo: e.tipo,
      titulo: (e.titulo as string | null) ?? null,
      funcao: rotuloDasFuncoes(
        minhas.filter((l) => l.evento_id === e.id && l.tipo === 'titular').map((l) => l.funcao_id),
      ),
    }))
  }

  const principal = relacoes?.find((r) => r.principal)?.instrumento_id ?? null

  return {
    hoje,
    saudacao: saudacaoAgora(),
    eu: {
      nome: musico.nome as string,
      nomeCompleto: (musico.nome_completo as string | null) ?? null,
      foto: fotoDo(musicoId, musico.foto_url as string | null),
      whatsapp: (musico.whatsapp as string | null) ?? null,
      email: (musico.email as string | null) ?? null,
      aniversario: (musico.aniversario as string | null) ?? null,
      principal: principal as string | null,
      toca: (relacoes ?? []).map((r) => r.instrumento_id as string),
    },
    eventos: eventosFuturos.map(paraEventoArea),
    respostas: mapaRespostas,
    escalas,
    historico,
    tocouNoAno: historico.filter((h) => h.data.slice(0, 4) === hoje.slice(0, 4)).length,
    instrumentos: (instrumentos ?? []).map((i) => ({ id: i.id as string, nome: i.nome as string })),
  }
}
