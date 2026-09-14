import Link from 'next/link'
import { CartaoEvento } from '@/components/admin/cartao-evento'
import { carregarPainelDoMes } from '@/lib/dados-admin'

export const metadata = { title: 'Escalas — Gestão' }

export default async function EscalasPage() {
  const { proximos } = await carregarPainelDoMes()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href="/admin" className="text-muted-foreground hover:text-foreground text-sm">
          ← painel
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Escalas</h1>
        <p className="text-muted-foreground text-sm">
          {proximos.length === 0
            ? 'Nenhuma data futura cadastrada.'
            : `${proximos.length} ${proximos.length === 1 ? 'data pela frente' : 'datas pela frente'}. Toque para montar.`}
        </p>
      </div>

      <div className="space-y-3">
        {proximos.map((resumo) => (
          <CartaoEvento key={resumo.evento.id} resumo={resumo} />
        ))}
      </div>
    </div>
  )
}
