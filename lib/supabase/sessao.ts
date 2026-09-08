import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { servico } from './service'

/**
 * Cliente de autenticação (chave publishable). Serve só para o login por
 * magic link dos gestores — leitura de dados continua passando pelo
 * `servico()`, porque o RLS é deny-all para qualquer chave que não seja a
 * service role.
 */
export async function clienteAuth() {
  const jar = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (paraGravar) => {
          try {
            paraGravar.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            )
          } catch {
            // Server Component não pode gravar cookie. Quem renova a sessão
            // é a Server Action ou o Route Handler; aqui é seguro ignorar.
          }
        },
      },
    },
  )
}

export type Gestor = { email: string; nome: string }

/**
 * Quem está logado, se for gestor.
 *
 * Ter sessão não basta: o e-mail precisa estar na tabela `admins`. Qualquer
 * pessoa consegue pedir um magic link, mas só quem a liderança cadastrou
 * entra no /admin.
 */
export async function gestorAtual(): Promise<Gestor | null> {
  const auth = await clienteAuth()
  const {
    data: { user },
  } = await auth.auth.getUser()

  if (!user?.email) return null

  const { data } = await servico()
    .from('admins')
    .select('email, nome')
    .eq('email', user.email.toLowerCase())
    .maybeSingle()

  return data ?? null
}

/** O e-mail está autorizado a receber magic link? */
export async function ehGestorCadastrado(email: string): Promise<boolean> {
  const { data } = await servico()
    .from('admins')
    .select('email')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()

  return Boolean(data)
}
