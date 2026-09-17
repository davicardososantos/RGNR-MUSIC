import { LinhaMusico } from '@/components/admin/linha-resposta'
import { carregarRespostas } from '@/lib/dados-admin'
import { chaveDoMes, listaPorExtenso, nomeDaChave } from '@/lib/datas'

export const metadata = { title: 'Respostas — Gestão' }

export default async function RespostasPage() {
  const { eventos, linhas } = await carregarRespostas()

  const faltam = linhas.filter((l) => l.faltam > 0)
  const emDia = linhas.filter((l) => l.faltam === 0)

  const periodo = listaPorExtenso([
    ...new Set(eventos.map((e) => nomeDaChave(chaveDoMes(e.data)))),
  ])
  const urlFormulario = process.env.NEXT_PUBLIC_SITE_URL ?? ''

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Respostas</h1>
        <p className="text-muted-foreground text-sm">
          {eventos.length} datas abertas, de {periodo}. {emDia.length} já
          responderam todas e {faltam.length} têm data em branco. Quem falta mais
          aparece primeiro.
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
                periodo={periodo}
              />
            ))}
          </div>
        </section>
      )}

      {emDia.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Em dia · {emDia.length}
          </h2>
          <div className="space-y-2">
            {emDia.map((l) => (
              <LinhaMusico
                key={l.id}
                linha={l}
                eventos={eventos}
                urlFormulario={urlFormulario}
                periodo={periodo}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
