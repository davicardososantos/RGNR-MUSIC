import Link from 'next/link'
import { Icone } from '@/components/icone'
import { carregarPainelDoMes } from '@/lib/dados-admin'
import { dataPorExtenso, diaEMes, hora } from '@/lib/datas'

export const metadata = { title: 'Escala de setembro — Gestão' }

export default async function AdminPage() {
  const { eventos, totalMusicos, responderamAlgo } = await carregarPainelDoMes()

  const percentual = totalMusicos
    ? Math.round((responderamAlgo / totalMusicos) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Setembro</h1>
        <p className="text-muted-foreground text-sm">
          {responderamAlgo} de {totalMusicos} músicos já responderam ({percentual}%).
        </p>
      </div>

      {responderamAlgo < totalMusicos && (
        <Link
          href="/admin/respostas"
          className="border-border hover:bg-accent flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors"
        >
          <span className="flex items-center gap-2.5">
            <Icone nome="atencao" className="text-roxo-claro h-4 w-4" />
            Faltam {totalMusicos - responderamAlgo} pessoas
          </span>
          <span className="text-muted-foreground">cobrar →</span>
        </Link>
      )}

      <div className="space-y-3">
        {eventos.map(({ evento, sim, sePrecisar, nao, responderam }) => {
          const fire = evento.tipo === 'fire'
          return (
            <div key={evento.id} className="border-border rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-base font-medium">
                    <Icone
                      nome={fire ? 'fire' : 'culto'}
                      className={`h-3.5 w-3.5 shrink-0 ${fire ? 'text-lima' : 'text-roxo-claro'}`}
                    />
                    {dataPorExtenso(evento.data)}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {evento.titulo ?? (fire ? 'Fire' : 'Culto')} ·{' '}
                    {hora(evento.hora_evento)}
                    {evento.hora_passagem &&
                      ` · passagem ${hora(evento.hora_passagem)}`}
                  </p>
                </div>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {responderam} respostas
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                <div className="bg-lima/10 rounded-lg px-2 py-2">
                  <p className="text-lima text-lg font-semibold">{sim}</p>
                  <p className="text-muted-foreground text-xs">podem</p>
                </div>
                <div className="bg-roxo/15 rounded-lg px-2 py-2">
                  <p className="text-roxo-claro text-lg font-semibold">{sePrecisar}</p>
                  <p className="text-muted-foreground text-xs">se precisar</p>
                </div>
                <div className="bg-muted/50 rounded-lg px-2 py-2">
                  <p className="text-muted-foreground text-lg font-semibold">{nao}</p>
                  <p className="text-muted-foreground text-xs">não podem</p>
                </div>
              </div>

              {evento.prazo_resposta && (
                <p className="text-muted-foreground mt-3 text-xs">
                  Prazo anunciado: {diaEMes(evento.prazo_resposta)}. O formulário
                  segue aberto até você encerrar.
                </p>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-muted-foreground border-border border-t pt-4 text-xs">
        Montar a escala de cada data entra na próxima etapa.
      </p>
    </div>
  )
}
