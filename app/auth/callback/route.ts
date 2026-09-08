import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { clienteAuth } from '@/lib/supabase/sessao'

/**
 * Fecha o login do magic link.
 *
 * O Supabase manda o usuário de volta com `code` (fluxo PKCE) ou com
 * `token_hash` + `type`, dependendo do template de e-mail do projeto.
 * Tratamos os dois para o login não depender de configuração do painel.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const tipo = searchParams.get('type') as EmailOtpType | null

  const auth = await clienteAuth()

  if (code) {
    const { error } = await auth.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}/admin`)
  }

  if (tokenHash && tipo) {
    const { error } = await auth.auth.verifyOtp({ token_hash: tokenHash, type: tipo })
    if (!error) return NextResponse.redirect(`${origin}/admin`)
  }

  return NextResponse.redirect(`${origin}/login?erro=link`)
}
