import { CartaoEvento } from '@/components/admin/cartao-evento'
import { Cabecalho } from '@/components/painel/ui'
import { carregarPainelDoMes } from '@/lib/dados-admin'

export const metadata = { title: 'Histórico · Gestão da Banda' }

export default async function HistoricoPage() {
  const { historico } = await carregarPainelDoMes()

  return (
    <div className="space-y-6">
      <Cabecalho
        titulo="Histórico"
        voltar={{ href: '/admin/escala', rotulo: 'Escalas' }}
        subtitulo={
          historico.length === 0
            ? 'Nenhuma data registrada ainda.'
            : `${historico.length} datas, da mais recente para a mais antiga.`
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {historico.map((resumo) => (
          <CartaoEvento key={resumo.evento.id} resumo={resumo} passado />
        ))}
      </div>

      {historico.length > 0 && (
        <p className="text-muted-foreground border-border border-t pt-4 text-xs">
          A escala vive só aqui: a decisão D8 tirou o registro em Markdown, e o
          export ficou para depois do MVP. Este histórico é a memória da banda.
        </p>
      )}
    </div>
  )
}
