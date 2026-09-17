import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Icone } from '@/components/icone'
import { DatasDaFicha } from '@/components/admin/datas-da-ficha'
import { carregarFicha } from '@/lib/dados-musico'
import { linkWhatsApp } from '@/lib/whatsapp'
import {
  NIVEL_LABEL,
  ORDEM_LABEL,
  PRESENCA_LABEL,
  STATUS_LABEL,
} from '@/lib/tipos'

export const dynamic = 'force-dynamic'

function Numero({ valor, rotulo, cor }: { valor: number; rotulo: string; cor: string }) {
  return (
    <div className="bg-muted/50 rounded-lg px-2 py-2 text-center">
      <p className={`text-lg font-semibold ${cor}`}>{valor}</p>
      <p className="text-muted-foreground text-xs">{rotulo}</p>
    </div>
  )
}

export default async function MusicoPage({
  params,
}: PageProps<'/admin/musicos/[slug]'>) {
  const { slug } = await params
  const ficha = await carregarFicha(slug)

  if (!ficha) notFound()

  const status = STATUS_LABEL[ficha.status]
  const zap = linkWhatsApp(ficha.whatsapp, '')
  const { resumo } = ficha

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <Link
          href="/admin/musicos"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← pessoas
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight">{ficha.nome}</h1>

        <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="flex items-center gap-1.5">
            <Icone nome={status.icone} className="h-3.5 w-3.5" />
            {status.texto}
          </span>
          {ficha.presenca && <span>· presença {PRESENCA_LABEL[ficha.presenca].toLowerCase()}</span>}
          {ficha.ehLider && <span>· liderança</span>}
          {ficha.banda !== 'music' && <span>· apoio externo</span>}
        </p>

        {ficha.nota && (
          <p className="text-muted-foreground border-border rounded-lg border border-dashed px-3 py-2 text-sm">
            {ficha.nota}
          </p>
        )}

        {zap && (
          <a
            href={zap}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lima inline-block text-sm underline-offset-4 hover:underline"
          >
            Abrir conversa no WhatsApp
          </a>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 text-sm">
        <Numero valor={resumo.tocou} rotulo="tocou" cor="text-lima" />
        <Numero valor={resumo.proximasEscalas} rotulo="escalado" cor="text-roxo-claro" />
        <Numero valor={resumo.sim} rotulo="disse sim" cor="text-foreground" />
        <Numero
          valor={resumo.faltamAbertas}
          rotulo="sem resposta"
          cor="text-muted-foreground"
        />
      </div>

      <section className="space-y-2.5">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Instrumentos
        </h2>
        {ficha.instrumentos.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhum instrumento cadastrado ainda.
          </p>
        ) : (
          <div className="space-y-2">
            {ficha.instrumentos.map((i) => (
              <div
                key={i.id}
                className={`border-border flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm ${
                  i.ativo ? '' : 'opacity-60'
                }`}
              >
                <span>
                  {i.nome}
                  {i.principal && (
                    <span className="text-muted-foreground ml-1.5 text-xs">
                      principal
                    </span>
                  )}
                  {!i.ativo && (
                    <span className="text-muted-foreground ml-1.5 text-xs">
                      informou que não toca
                    </span>
                  )}
                </span>
                <span className="text-muted-foreground text-xs">
                  {i.nivel ? NIVEL_LABEL[i.nivel] : 'sem nível'} ·{' '}
                  {ORDEM_LABEL[i.ordem]}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2.5">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Próximas datas · {ficha.proximas.length}
        </h2>
        {ficha.proximas.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma data pela frente.</p>
        ) : (
          <DatasDaFicha
            datas={ficha.proximas}
            musicoId={ficha.id}
            slug={ficha.slug}
            nome={ficha.nome}
            ajustavel
          />
        )}
      </section>

      {ficha.passadas.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Histórico · {ficha.passadas.length}
          </h2>
          <DatasDaFicha
            datas={ficha.passadas}
            musicoId={ficha.id}
            slug={ficha.slug}
            nome={ficha.nome}
            ajustavel={false}
          />
        </section>
      )}
    </div>
  )
}
