import { CartaoEvento } from '@/components/admin/cartao-evento'
import { Cabecalho, Secao } from '@/components/painel/ui'
import { carregarPainelDoMes } from '@/lib/dados-admin'
import { chaveDoMes, nomeDaChave } from '@/lib/datas'

export const metadata = { title: 'Histórico · Gestão da Banda' }

export default async function HistoricoPage() {
  const { historico } = await carregarPainelDoMes()
  const meses = [...new Set(historico.map((r) => chaveDoMes(r.evento.data)))]

  return (
    <div className="space-y-10">
      <Cabecalho
        titulo="Histórico"
        voltar={{ href: '/admin/escala', rotulo: 'Escalas' }}
        subtitulo={
          historico.length === 0
            ? 'Nenhuma data registrada ainda.'
            : `${historico.length} datas, da mais recente para a mais antiga. De julho de 2025 a agosto de 2026, vindas dos posts de formação do grupo Multimídia.`
        }
      />

      {meses.map((mes) => {
        const doMes = historico.filter((r) => chaveDoMes(r.evento.data) === mes)
        return (
          <Secao
            key={mes}
            titulo={
              <span>
                <span className="capitalize">{nomeDaChave(mes)}</span> {mes.slice(0, 4)} · {doMes.length}
              </span>
            }
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {doMes.map((resumo) => (
                <CartaoEvento key={resumo.evento.id} resumo={resumo} passado />
              ))}
            </div>
          </Secao>
        )
      })}

      {historico.length > 0 && (
        <p className="text-muted-foreground border-t border-white/[0.06] pt-4 text-xs">
          A escala vive só aqui: a decisão D8 tirou o registro em Markdown. Este histórico é a memória da banda.
        </p>
      )}
    </div>
  )
}
