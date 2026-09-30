import { LinhaMusico } from '@/components/admin/linha-resposta'
import { Cabecalho, Numero } from '@/components/painel/ui'
import { carregarRespostas } from '@/lib/dados-admin'
import { chaveDoMes, listaPorExtenso, nomeDaChave } from '@/lib/datas'

export const metadata = { title: 'Respostas · Gestão da Banda' }

export default async function RespostasPage() {
  const { eventos, linhas } = await carregarRespostas()

  // Quem tem aviso de não cobrar sai da lista de cobrança e ganha a sua
  // própria: continua visível, só sem o botão do WhatsApp.
  const faltam = linhas.filter((l) => l.faltam > 0 && !l.naoCobrar)
  const falarDireto = linhas.filter((l) => l.faltam > 0 && l.naoCobrar)
  const emDia = linhas.filter((l) => l.faltam === 0)

  const periodo = listaPorExtenso([
    ...new Set(eventos.map((e) => nomeDaChave(chaveDoMes(e.data)))),
  ])
  const urlFormulario = process.env.NEXT_PUBLIC_SITE_URL ?? ''

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Cabecalho
        titulo="Respostas"
        subtitulo={
          <>
            {eventos.length} datas abertas, de {periodo}. Quem falta mais aparece primeiro, com a mensagem de cobrança
            pronta para o WhatsApp.
            {falarDireto.length > 0 &&
              ` ${falarDireto.length} ${falarDireto.length === 1 ? 'fica' : 'ficam'} fora da cobrança, com contato direto.`}
          </>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <Numero
          rotulo="Em dia"
          icone="concluido"
          valor={emDia.length}
          medidor={{ valor: emDia.length, total: linhas.length }}
        />
        <Numero rotulo="Faltam" icone="respostas" valor={faltam.length} alerta={faltam.length > 0} />
        <Numero rotulo="Falar direto" icone="aviso" valor={falarDireto.length} />
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

      {falarDireto.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Falar direto · {falarDireto.length}
          </h2>
          <div className="space-y-2">
            {falarDireto.map((l) => (
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
