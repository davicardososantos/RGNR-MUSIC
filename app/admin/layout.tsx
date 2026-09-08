import Link from 'next/link'
import { notFound } from 'next/navigation'
import { gestorAtual } from '@/lib/supabase/sessao'
import { sair } from '@/actions/auth'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const gestor = await gestorAtual()

  // 404, não 403: quem não é gestor não precisa nem saber que existe painel.
  // Quem é gestor e ainda não entrou vê o /login, que é público.
  if (!gestor) notFound()

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-border bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="font-medium">
              Escala
            </Link>
            <Link
              href="/admin/respostas"
              className="text-muted-foreground hover:text-foreground"
            >
              Respostas
            </Link>
          </nav>
          <form action={sair}>
            <button
              type="submit"
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
    </div>
  )
}
