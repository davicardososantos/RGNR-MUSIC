import Link from 'next/link'
import { Icone } from '@/components/icone'
import { listarElenco, type LinhaDoElenco } from '@/lib/dados-musico'
import { STATUS_LABEL } from '@/lib/tipos'

export const metadata = { title: 'Pessoas — Gestão' }
export const dynamic = 'force-dynamic'

function Linha({ musico }: { musico: LinhaDoElenco }) {
  const status = STATUS_LABEL[musico.status]

  return (
    <Link
      href={`/admin/musicos/${musico.slug}`}
      className="border-border hover:bg-accent/40 flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors"
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-medium">{musico.nome}</span>
          {musico.faltamAbertas > 0 && musico.noFormulario && (
            <span className="bg-roxo/20 text-roxo-claro shrink-0 rounded-full px-2 py-0.5 text-xs">
              faltam {musico.faltamAbertas}
            </span>
          )}
        </span>
        <span className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
          <Icone nome={status.icone} className="h-3 w-3 shrink-0" />
          {status.texto}
          {musico.instrumentoPrincipal && ` · ${musico.instrumentoPrincipal}`}
          {` · tocou ${musico.tocou}`}
        </span>
      </span>
      <Icone nome="avancar" className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
    </Link>
  )
}

export default async function MusicosPage() {
  const elenco = await listarElenco()

  const doMusic = elenco.filter((m) => m.banda === 'music')
  const apoio = elenco.filter((m) => m.banda !== 'music')

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <Link href="/admin" className="text-muted-foreground hover:text-foreground text-sm">
          ← painel
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Pessoas</h1>
        <p className="text-muted-foreground text-sm">
          Toque num nome para ver em que datas a pessoa esteve na escala, o que
          ela respondeu e o histórico dela.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Banda MUSIC · {doMusic.length}
        </h2>
        <div className="space-y-2">
          {doMusic.map((m) => (
            <Linha key={m.id} musico={m} />
          ))}
        </div>
      </section>

      {apoio.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Apoio externo · {apoio.length}
          </h2>
          <p className="text-muted-foreground text-xs">
            Não entram no rodízio nem recebem formulário. Aparecem por causa das
            escalas que já aconteceram.
          </p>
          <div className="space-y-2">
            {apoio.map((m) => (
              <Linha key={m.id} musico={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
