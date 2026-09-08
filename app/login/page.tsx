import { redirect } from 'next/navigation'
import { FormLogin } from '@/components/admin/form-login'
import { gestorAtual } from '@/lib/supabase/sessao'

export const metadata = { title: 'Entrar — Escala MUSIC' }
export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: PageProps<'/login'>) {
  if (await gestorAtual()) redirect('/admin')

  const { erro } = await searchParams

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <div className="mb-8 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Gestão da escala</h1>
        <p className="text-muted-foreground text-sm">
          Área da liderança da Banda. Entre com seu e-mail e a gente manda um link
          de acesso.
        </p>
      </div>

      {erro === 'link' && (
        <p className="border-destructive/40 bg-destructive/10 mb-4 rounded-lg border px-3 py-2 text-sm">
          Esse link expirou ou já foi usado. Peça outro abaixo.
        </p>
      )}

      <FormLogin />

      <p className="text-muted-foreground mt-8 text-center text-xs">
        Procurando o formulário de disponibilidade?{' '}
        <a href="/setembro" className="underline underline-offset-4">
          É por aqui
        </a>
        .
      </p>
    </main>
  )
}
