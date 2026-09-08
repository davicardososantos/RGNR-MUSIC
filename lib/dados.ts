import 'server-only'
import { servico } from '@/lib/supabase/service'
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

/** Eventos abertos para resposta, na ordem do calendário. */
export async function listarEventosAbertos(): Promise<Evento[]> {
  const { data, error } = await servico()
    .from('eventos')
    .select('*')
    .eq('aberto_para_resposta', true)
    .order('data')

  if (error) throw new Error(`Falha ao listar eventos: ${error.message}`)
  return (data ?? []) as Evento[]
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
      .eq('musico_id', musicoId),
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
