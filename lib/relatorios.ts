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
  planoB: number
  sim: number
  sePrecisar: number
  nao: number
  respondidas: number
  faltamAbertas: number
}

export type Relatorios = {
  linhas: LinhaRelatorio[]
  eventosPassados: number
  /** Datas que a pessoa teve chance de responder. É o divisor da taxa. */
  respondiveis: number
  datasAbertas: number
}

/**
 * Os números que os dois gestores usam para olhar o elenco de longe.
 *
 * Duas escolhas que mudam a leitura da tabela:
 *
 * 1. **Só quem recebe o formulário entra.** O apoio externo (J Rapha) aparece
 *    em escalas antigas mas nunca foi convidado a responder, e aparecer com
 *    0% de resposta seria mentira sobre gente que só veio ajudar.
 *
 * 2. **O divisor da taxa de resposta é o que a pessoa podia ter respondido**,
 *    não o total de eventos: datas abertas hoje mais as que já receberam
 *    resposta de alguém. Sem isso, os cultos importados de setembro, que
 *    nunca passaram pelo formulário, derrubariam a taxa de todo mundo.
 */
export async function carregarRelatorios(): Promise<Relatorios> {
  const db = servico()
  const hoje = hojeISO()

  const [{ data: musicos }, { data: eventos }, { data: disponibilidades }, { data: escalacoes }] =
    await Promise.all([
      db
        .from('musicos')
        .select('id, nome, slug, status')
        .eq('no_formulario', true)
        .order('nome'),
      db.from('eventos').select('id, data, aberto_para_resposta'),
      db.from('disponibilidades').select('musico_id, evento_id, resposta'),
      db.from('escalacoes').select('musico_id, evento_id, tipo'),
    ])

  const linhasDisp = disponibilidades ?? []
  const comResposta = new Set(linhasDisp.map((d) => d.evento_id as string))

  const passados = new Set(
    (eventos ?? []).filter((e) => (e.data as string) < hoje).map((e) => e.id as string),
  )
  const abertos = (eventos ?? []).filter(
    (e) => e.aberto_para_resposta && (e.data as string) >= hoje,
  )
  const idsAbertos = new Set(abertos.map((e) => e.id as string))

  const respondiveis = new Set([...comResposta, ...idsAbertos])

  const linhas: LinhaRelatorio[] = (musicos ?? []).map((m) => {
    const minhas = linhasDisp.filter((d) => d.musico_id === m.id)
    const minhasEscalas = (escalacoes ?? []).filter((e) => e.musico_id === m.id)
    const contar = (r: string) => minhas.filter((d) => d.resposta === r).length

    return {
      id: m.id as string,
      nome: m.nome as string,
      slug: m.slug as string,
      status: m.status as StatusMusico,
      tocou: minhasEscalas.filter(
        (e) => e.tipo === 'titular' && passados.has(e.evento_id as string),
      ).length,
      planoB: minhasEscalas.filter((e) => e.tipo === 'plano_b').length,
      sim: contar('sim'),
      sePrecisar: contar('se_precisar'),
      nao: contar('nao'),
      respondidas: minhas.filter((d) => respondiveis.has(d.evento_id as string)).length,
      faltamAbertas:
        abertos.length -
        minhas.filter((d) => idsAbertos.has(d.evento_id as string)).length,
    }
  })

  return {
    linhas,
    eventosPassados: passados.size,
    respondiveis: respondiveis.size,
    datasAbertas: abertos.length,
  }
}
