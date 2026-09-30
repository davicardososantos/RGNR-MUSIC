import { notFound } from 'next/navigation'
import { CascaPainel } from '@/components/painel/casca'
import { carregarImprevistos } from '@/lib/dados-admin'
import { gestorAtual } from '@/lib/supabase/sessao'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const gestor = await gestorAtual()

  // 404, não 403: quem não é gestor não precisa nem saber que existe painel.
  // Quem é gestor e ainda não entrou vê o /login, que é público.
  if (!gestor) notFound()

  const imprevistos = await carregarImprevistos()

  return (
    <CascaPainel gestor={gestor.nome} imprevistos={imprevistos.length}>
      {children}
    </CascaPainel>
  )
}
