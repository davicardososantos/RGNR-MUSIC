import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Icone } from '@/components/icone'
import { Montador } from '@/components/escala/montador'
import { Disponiveis } from '@/components/escala/disponiveis'
import { Publicar } from '@/components/escala/publicar'
import { Cabecalho, COR, vidro } from '@/components/painel/ui'
import { carregarEscala } from '@/lib/dados-escala'
import { dataPorExtenso, hora, quandoRelativo } from '@/lib/datas'
import { EVENTO_LABEL, nomeDoEvento } from '@/lib/tipos'

export const dynamic = 'force-dynamic'

export default async function EventoPage({ params, searchParams }: PageProps<'/admin/evento/[data]'>) {
  const { data } = await params
  // ?tipo= desempata os dias com mais de um evento (ver carregarEscala).
  const { tipo } = await searchParams
  const escala = await carregarEscala(data, typeof tipo === 'string' ? tipo : undefined)

  if (!escala) notFound()

  const { evento, funcoes, musicos, escalacoes, instrumentos } = escala
  const fire = evento.tipo === 'fire'
  const rotulo = EVENTO_LABEL[evento.tipo]

  const podem = musicos.filter((m) => m.resposta === 'sim').length
  const sePrecisar = musicos.filter((m) => m.resposta === 'se_precisar').length
  const semResposta = musicos.filter((m) => m.resposta === null).length

  // Quem está na escala conta uma vez, mesmo com duas funções (guitarra e
  // comunicação). Confirmou = todas as linhas dele confirmadas.
  const pessoas = [...new Set(escalacoes.map((e) => e.musico_id))]
  const confirmados = pessoas.filter((id) =>
    escalacoes.filter((e) => e.musico_id === id).every((e) => e.confirmado),
  ).length

  return (
    <div className="space-y-8">
      <Cabecalho
        voltar={{ href: '/admin/escala', rotulo: 'Escalas' }}
        titulo={
          <span className="flex items-center gap-3 first-letter:uppercase">
            <Icone nome={rotulo.icone} className={`h-6 w-6 shrink-0 ${rotulo.cor}`} />
            <span className="first-letter:uppercase">{dataPorExtenso(evento.data)}</span>
          </span>
        }
        subtitulo={
          <>
            {nomeDoEvento(evento)} · {hora(evento.hora_evento)}
            {evento.hora_passagem && ` · passagem ${hora(evento.hora_passagem)}`} · {funcoes.length} posições ·{' '}
            {quandoRelativo(evento.data)}
          </>
        }
      />

      {/* No celular: publicar, números e disponíveis antes da montagem, como sempre foi.
          No computador: a montagem à esquerda e o apoio numa coluna à direita. */}
      <div className="space-y-6 lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-8 lg:space-y-0">
        <div className="space-y-6 lg:order-2">
          <Publicar evento={evento} escalados={pessoas.length} confirmados={confirmados} />

          <div className="grid grid-cols-3 gap-2.5">
            {(
              [
                [podem, 'podem', COR.sim],
                [sePrecisar, 'se precisar', COR.sePrecisar],
                [semResposta, 'sem resposta', COR.nao],
              ] as const
            ).map(([valor, rot, cor]) => (
              <div key={rot} className={`${vidro} px-3 py-3.5`}>
                <span className="mb-2 block h-1 w-6 rounded-full" style={{ background: cor }} />
                <p className="text-2xl font-semibold">{valor}</p>
                <p className="text-muted-foreground text-xs">{rot}</p>
              </div>
            ))}
          </div>

          {fire && (
            <p className="border-lima/30 bg-lima/5 rounded-2xl border px-4 py-3 text-sm">
              O Fire é o laboratório de estreia: quem está em formação aparece destacado aqui, não com aviso. Só
              baixo, bateria e teclado contam como obrigatórios, mas dá para montar banda completa.
            </p>
          )}

          <Disponiveis
            evento={evento}
            musicos={musicos}
            funcoes={funcoes}
            escalacoes={escalacoes}
            instrumentos={instrumentos}
          />

          <Link
            href={`/admin/evento/${data}/cobertura`}
            className="border-roxo/30 bg-roxo/[0.06] hover:bg-roxo/10 flex items-center justify-between rounded-2xl border px-4 py-3.5 text-sm transition-colors"
          >
            <span className="flex items-center gap-2.5 font-medium">
              <Icone nome="trocar" className="text-roxo-claro h-4 w-4" />
              Alguém caiu? Ver quem pode cobrir
            </span>
            <Icone nome="avancar" className="text-muted-foreground h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="lg:order-1">
          <Montador evento={evento} funcoes={funcoes} musicos={musicos} escalacoesIniciais={escalacoes} />
        </div>
      </div>
    </div>
  )
}
