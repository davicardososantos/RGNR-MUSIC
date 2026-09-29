import 'server-only'
import { servico } from '@/lib/supabase/service'
import type { AvisoDoMusico } from '@/lib/tipos'

/**
 * Os avisos que ninguém encerrou, de todo mundo.
 *
 * A tabela é pequena (um punhado de recados por mês), então vem inteira e o
 * filtro de data acontece aqui, em código: a tela de escala precisa saber se
 * um aviso cobria o dia do evento, e o painel precisa saber se ele vale hoje.
 *
 * Se a tabela ainda não existe (o SQL precisa ser colado à mão no Supabase),
 * devolve lista vazia em vez de derrubar o painel inteiro.
 */
export async function carregarAvisosAbertos(): Promise<AvisoDoMusico[]> {
  const { data, error } = await servico()
    .from('avisos_musico')
    .select('*')
    .is('encerrado_em', null)
    .order('criado_em')

  if (error) {
    console.error('avisos_musico:', error.message)
    return []
  }

  return (data ?? []).map((a) => ({
    id: a.id as string,
    musicoId: a.musico_id as string,
    texto: a.texto as string,
    indisponivelDe: (a.indisponivel_de as string | null) ?? null,
    indisponivelAte: (a.indisponivel_ate as string | null) ?? null,
    naoCobrar: a.nao_cobrar as boolean,
    criadoPor: a.criado_por as string,
    criadoEm: a.criado_em as string,
  }))
}

/** Aviso com período vence sozinho no dia seguinte ao fim. Sem período, vale até alguém encerrar. */
export function avisoEmVigor(aviso: AvisoDoMusico, hoje: string) {
  return !aviso.indisponivelAte || aviso.indisponivelAte >= hoje
}

/** A pessoa avisou que não pode nesta data? */
export function avisoCobreData(aviso: AvisoDoMusico, data: string) {
  return Boolean(
    aviso.indisponivelDe &&
      aviso.indisponivelAte &&
      aviso.indisponivelDe <= data &&
      data <= aviso.indisponivelAte,
  )
}

/** Agrupa por músico, só os que valem hoje. */
export function avisosPorMusico(avisos: AvisoDoMusico[], hoje: string) {
  const mapa = new Map<string, AvisoDoMusico[]>()
  for (const aviso of avisos) {
    if (!avisoEmVigor(aviso, hoje)) continue
    mapa.set(aviso.musicoId, [...(mapa.get(aviso.musicoId) ?? []), aviso])
  }
  return mapa
}
