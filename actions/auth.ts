'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { clienteAuth, ehGestorCadastrado } from '@/lib/supabase/sessao'

const emailSchema = z.string().email().max(120)

export type ResultadoLogin = { ok: boolean; mensagem: string }

/**
 * Envia o magic link, mas só para e-mail que está na tabela `admins`.
 *
 * A resposta é a mesma nos dois casos: sem isso, a tela viraria um jeito de
 * descobrir quem tem acesso ao painel, testando e-mails um a um.
 */
export async function enviarMagicLink(email: string): Promise<ResultadoLogin> {
  const analise = emailSchema.safeParse(email)
  const resposta = {
    ok: true,
    mensagem: 'Se esse e-mail tiver acesso, o link de entrada acabou de sair.',
  }

  if (!analise.success) return { ok: false, mensagem: 'E-mail inválido.' }

  const limpo = analise.data.trim().toLowerCase()
  if (!(await ehGestorCadastrado(limpo))) return resposta

  const auth = await clienteAuth()
  const { error } = await auth.auth.signInWithOtp({
    email: limpo,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) return { ok: false, mensagem: `Não consegui enviar: ${error.message}` }
  return resposta
}

export async function sair() {
  const auth = await clienteAuth()
  await auth.auth.signOut()
  redirect('/login')
}
