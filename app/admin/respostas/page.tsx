import { LinhaMusico } from '@/components/admin/linha-resposta'
import { carregarRespostas } from '@/lib/dados-admin'

export const metadata = { title: 'Respostas — Gestão' }

export default async function RespostasPage() {
  const { eventos, linhas } = await carregarRespostas()

  const faltam = linhas.filter((l) => !l.respondeu)
  const responderam = linhas.filter((l) => l.respondeu)

  const urlFormulario = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/setembro`

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Respostas</h1>
        <p className="text-muted-foreground text-sm">
          {responderam.length} responderam, {faltam.length} faltam. Quem falta
          aparece primeiro, e os ativos na frente.
        </p>
      </div>

      {faltam.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Faltam responder · {faltam.length}
          </h2>
          <div className="space-y-2">
            {faltam.map((l) => (
              <LinhaMusico
                key={l.id}
                linha={l}
                eventos={eventos}
                urlFormulario={urlFormulario}
              />
            ))}
          </div>
        </section>
      )}

      {responderam.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Já responderam · {responderam.length}
          </h2>
          <div className="space-y-2">
            {responderam.map((l) => (
              <LinhaMusico
                key={l.id}
                linha={l}
                eventos={eventos}
                urlFormulario={urlFormulario}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
