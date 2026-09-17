import 'server-only'
import { servico } from '@/lib/supabase/service'
import { hojeISO } from '@/lib/datas'
import type { Evento, Instrumento, Musico } from '@/lib/tipos'

export type MusicoDaLista = Pick<Musico, 'id' | 'nome' | 'slug'>

export type MeusDados = {
  whatsapp: string | null
  instrumentoPrincipal: string | null
  instrumentosCobertura: string[]
}

export type MinhaResposta = {
  evento_id: string
  resposta: 'sim' | 'se_precisar' | 'nao'
  passagem_som: boolean
  observacao: string | null
}

/** Os 36 que recebem o formulário. Ordem alfabética — é uma lista de escolha. */
export async function listarMusicosDoFormulario(): Promise<MusicoDaLista[]> {
  const { data, error } = await servico()
    .from('musicos')
    .select('id, nome, slug')
    .eq('no_formulario', true)
    .order('nome')

  if (error) throw new Error(`Falha ao listar músicos: ${error.message}`)
  return data ?? []
}

/**
 * Todas as datas abertas para resposta, de hoje em diante.
 *
 * O formulário deixou de ser por mês em 17/09/2026. Os meses se sobrepõem
 * o tempo todo (quando outubro abriu, as últimas sextas de setembro ainda
 * recebiam resposta) e uma página por mês obrigava o músico a escolher o
 * nome e conferir os instrumentos de novo a cada mês. Agora é uma lista só,
 * separada por mês na tela.
 *
 * O corte em hoje é o que impede uma data vencida e esquecida aberta de
 * voltar à lista meses depois.
 */
export async function listarEventosAbertos(): Promise<Evento[]> {
  const { data, error } = await servico()
    .from('eventos')
    .select('*')
    .eq('aberto_para_resposta', true)
    .gte('data', hojeISO())
    .order('data')

  if (error) throw new Error(`Falha ao listar eventos: ${error.message}`)
  return (data ?? []) as Evento[]
}

/**
 * Quantas datas abertas cada músico deste navegador já respondeu.
 *
 * A chave de edição é do aparelho e não tem mês: quem respondeu setembro
 * neste celular continua com a chave quando outubro abre. Contar em vez de
 * só marcar "já respondeu" existe porque a lista passou a ter três meses ao
 * mesmo tempo: quem respondeu setembro inteiro e não tocou em novembro
 * apareceria como pronto e nunca mais voltaria.
 *
 * Continua restrito aos músicos deste navegador. Perguntar pela lista toda
 * diria quem já respondeu e quem não, e isso não é da conta de quem abre o
 * formulário (D7).
 */
export async function respostasDesteNavegador(
  musicoIds: string[],
  eventoIds: string[],
): Promise<Record<string, number>> {
  if (musicoIds.length === 0 || eventoIds.length === 0) return {}

  const { data, error } = await servico()
    .from('disponibilidades')
    .select('musico_id')
    .in('musico_id', musicoIds)
    .in('evento_id', eventoIds)

  if (error) throw new Error(`Falha ao conferir respostas: ${error.message}`)

  const contagem: Record<string, number> = {}
  for (const l of data ?? []) {
    const id = l.musico_id as string
    contagem[id] = (contagem[id] ?? 0) + 1
  }
  return contagem
}

export async function listarInstrumentos(): Promise<Instrumento[]> {
  const { data, error } = await servico()
    .from('instrumentos')
    .select('*')
    .order('ordem_criticidade')

  if (error) throw new Error(`Falha ao listar instrumentos: ${error.message}`)
  return (data ?? []) as Instrumento[]
}

export async function buscarMusicoPorSlug(slug: string) {
  const { data } = await servico()
    .from('musicos')
    .select('id, nome, slug, whatsapp, no_formulario')
    .eq('slug', slug)
    .maybeSingle()

  return data
}

/** O que já sabemos sobre o músico — o formulário chega pré-preenchido. */
export async function carregarMeusDados(musicoId: string): Promise<MeusDados> {
  const db = servico()

  const [{ data: musico }, { data: relacoes }] = await Promise.all([
    db.from('musicos').select('whatsapp').eq('id', musicoId).maybeSingle(),
    db
      .from('musico_instrumento')
      .select('instrumento_id, principal')
      .eq('musico_id', musicoId)
      .eq('ativo', true),
  ])

  const principal = relacoes?.find((r) => r.principal)?.instrumento_id ?? null

  return {
    whatsapp: musico?.whatsapp ?? null,
    instrumentoPrincipal: principal,
    instrumentosCobertura: (relacoes ?? [])
      .filter((r) => !r.principal)
      .map((r) => r.instrumento_id as string),
  }
}

/** As respostas do músico. Só chame depois de confirmar a chave do dispositivo. */
export async function carregarMinhasRespostas(
  musicoId: string,
): Promise<MinhaResposta[]> {
  const { data } = await servico()
    .from('disponibilidades')
    .select('evento_id, resposta, passagem_som, observacao')
    .eq('musico_id', musicoId)

  return (data ?? []) as MinhaResposta[]
}
