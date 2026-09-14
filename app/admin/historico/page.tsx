import Link from 'next/link'
import { CartaoEvento } from '@/components/admin/cartao-evento'
import { carregarPainelDoMes } from '@/lib/dados-admin'

export const metadata = { title: 'Histórico — Gestão' }

export default async function HistoricoPage() {
  const { historico } = await carregarPainelDoMes()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href="/admin" className="text-muted-foreground hover:text-foreground text-sm">
          ← painel
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Histórico</h1>
        <p className="text-muted-foreground text-sm">
          {historico.length === 0
            ? 'Nenhuma data registrada ainda.'
            : 'Quem tocou em cada data, do mais recente para o mais antigo.'}
        </p>
      </div>

      <div className="space-y-3">
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
