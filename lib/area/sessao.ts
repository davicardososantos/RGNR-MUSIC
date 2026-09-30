import 'server-only'
import { cookies } from 'next/headers'
import { createHash, randomBytes } from 'node:crypto'
import { servico } from '@/lib/supabase/service'

/**
 * Sessão do músico na área dele (30/09/2026).
 *
 * O músico entra uma vez, com WhatsApp e data de nascimento, e o aparelho
 * fica lembrado por um ano, como num app. O cookie guarda um token opaco; o
 * banco guarda só o SHA-256 dele (`sessoes_musico`), igual ao que já se faz
 * com a chave de edição do formulário.
 *
 * É outro cookie e outra tabela, de propósito: a chave do formulário é do
 * aparelho e pode valer para mais de uma pessoa ("responder por outra
 * pessoa"); a sessão é de uma pessoa só.
 */

const COOKIE = 'rgnr_sessao'
const UM_ANO = 60 * 60 * 24 * 365

const hash = (token: string) => createHash('sha256').update(token).digest('hex')

export type MusicoLogado = { id: string; nome: string; slug: string }

/** Quem está logado neste aparelho, ou nulo. Só lê: serve em Server Component. */
export async function musicoLogado(): Promise<MusicoLogado | null> {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null

  const db = servico()
  const { data } = await db
    .from('sessoes_musico')
    .select('id, ultimo_uso, musicos ( id, nome, slug, no_formulario )')
    .eq('token_hash', hash(token))
    .maybeSingle()

  const musico = data?.musicos as unknown as
    | { id: string; nome: string; slug: string; no_formulario: boolean }
    | null
    | undefined
  if (!data || !musico || !musico.no_formulario) return null

  // Marca o uso no máximo uma vez por hora: é para o painel saber quem anda
  // entrando, não um rastreador de clique.
  if (Date.now() - new Date(data.ultimo_uso as string).getTime() > 60 * 60 * 1000) {
    const agora = new Date().toISOString()
    await Promise.all([
      db.from('sessoes_musico').update({ ultimo_uso: agora }).eq('id', data.id),
      db.from('musicos').update({ ultimo_acesso: agora }).eq('id', musico.id),
    ])
  }

  return { id: musico.id, nome: musico.nome, slug: musico.slug }
}

/** Abre a sessão deste aparelho. Só em Server Action (grava cookie). */
export async function abrirSessao(musicoId: string) {
  const token = randomBytes(32).toString('base64url')
  const agora = new Date().toISOString()

  const { error } = await servico()
    .from('sessoes_musico')
    .insert({ musico_id: musicoId, token_hash: hash(token) })
  if (error) throw new Error(`Não consegui abrir a sessão: ${error.message}`)

  await servico().from('musicos').update({ ultimo_acesso: agora }).eq('id', musicoId)

  ;(await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: UM_ANO,
    path: '/',
  })
}

/** Sai neste aparelho: apaga a linha e o cookie. */
export async function fecharSessao() {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (token) await servico().from('sessoes_musico').delete().eq('token_hash', hash(token))
  jar.delete(COOKIE)
}
