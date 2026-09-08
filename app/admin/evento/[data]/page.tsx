import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Icone } from '@/components/icone'
import { Montador } from '@/components/escala/montador'
import { carregarEscala } from '@/lib/dados-escala'
import { dataPorExtenso, hora } from '@/lib/datas'

export const dynamic = 'force-dynamic'

export default async function EventoPage({
  params,
}: PageProps<'/admin/evento/[data]'>) {
  const { data } = await params
  const escala = await carregarEscala(data)

  if (!escala) notFound()

  const { evento, funcoes, musicos, escalacoes } = escala
  const fire = evento.tipo === 'fire'

  const podem = musicos.filter((m) => m.resposta === 'sim').length
  const sePrecisar = musicos.filter((m) => m.resposta === 'se_precisar').length
  const semResposta = musicos.filter((m) => m.resposta === null).length

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/admin"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← todas as datas
        </Link>

        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          <Icone
            nome={fire ? 'fire' : 'culto'}
            className={`h-5 w-5 shrink-0 ${fire ? 'text-lima' : 'text-roxo-claro'}`}
          />
          {dataPorExtenso(evento.data)}
        </h1>

        <p className="text-muted-foreground text-sm">
          {evento.titulo ?? (fire ? 'Fire' : 'Culto')} · {hora(evento.hora_evento)}
          {evento.hora_passagem && ` · passagem ${hora(evento.hora_passagem)}`}
          {' · '}
          {funcoes.length} posições
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="bg-lima/10 rounded-lg px-2 py-2">
          <p className="text-lima text-lg font-semibold">{podem}</p>
          <p className="text-muted-foreground text-xs">podem</p>
        </div>
        <div className="bg-roxo/15 rounded-lg px-2 py-2">
          <p className="text-roxo-claro text-lg font-semibold">{sePrecisar}</p>
          <p className="text-muted-foreground text-xs">se precisar</p>
        </div>
        <div className="bg-muted/50 rounded-lg px-2 py-2">
          <p className="text-muted-foreground text-lg font-semibold">{semResposta}</p>
          <p className="text-muted-foreground text-xs">sem resposta</p>
        </div>
      </div>

      {fire && (
        <p className="border-lima/30 bg-lima/5 rounded-lg border px-3 py-2.5 text-sm">
          O Fire é o laboratório de estreia: quem está em formação aparece
          destacado aqui, não com aviso. Só baixo, bateria e teclado contam
          como obrigatórios, mas dá para montar banda completa.
        </p>
      )}

      <Montador
        evento={evento}
        funcoes={funcoes}
        musicos={musicos}
        escalacoesIniciais={escalacoes}
      />

      <Link
        href={`/admin/evento/${data}/cobertura`}
        className="border-border hover:bg-accent flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors"
      >
        <span className="flex items-center gap-2.5">
          <Icone nome="trocar" className="text-roxo-claro h-4 w-4" />
          Alguém caiu? Ver quem pode cobrir
        </span>
        <span className="text-muted-foreground">abrir →</span>
      </Link>
    </div>
  )
}
