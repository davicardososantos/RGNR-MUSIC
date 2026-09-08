import 'server-only'
import { cookies } from 'next/headers'
import { createHash, randomBytes } from 'node:crypto'
import { servico } from '@/lib/supabase/service'

/**
 * PRD §5 — a chave de edição.
 *
 * O formulário é um link público e o nome não é senha. Sem isto, qualquer
 * pessoa clicaria em "Elias" e leria o que ele respondeu — exatamente o que
 * a D7 proíbe.
 *
 * Como funciona: o navegador guarda um token opaco num cookie httpOnly.
 * Ao responder pela primeira vez, o par (hash do token, músico) é gravado.
 * Selecionar um nome só devolve respostas se ESTE navegador tiver a chave
 * daquele músico. Em qualquer outro aparelho, o formulário vem em branco.
 *
 * O token nunca vai para o banco em claro: guardamos só o SHA-256.
 */

const COOKIE = 'rgnr_chave'
const UM_ANO = 60 * 60 * 24 * 365

const hash = (token: string) => createHash('sha256').update(token).digest('hex')

/** Lê o token do navegador. Não cria nada. */
export async function lerToken(): Promise<string | null> {
  const jar = await cookies()
  return jar.get(COOKIE)?.value ?? null
}

/**
 * Devolve o token do navegador, criando um se ainda não existir.
 * Só pode ser chamada de Server Action ou Route Handler — em Server
 * Component o Next não deixa gravar cookie.
 */
export async function garantirToken(): Promise<string> {
  const jar = await cookies()
  const atual = jar.get(COOKIE)?.value
  if (atual) return atual

  const token = randomBytes(32).toString('base64url')
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: UM_ANO,
    path: '/',
  })
  return token
}

/** Este navegador tem a chave deste músico? */
export async function temChave(musicoId: string): Promise<boolean> {
  const token = await lerToken()
  if (!token) return false

  const { data } = await servico()
    .from('chaves_edicao')
    .select('id')
    .eq('token_hash', hash(token))
    .eq('musico_id', musicoId)
    .maybeSingle()

  return Boolean(data)
}

/** Registra este navegador como dono das respostas do músico. */
export async function registrarChave(musicoId: string, token: string) {
  const db = servico()
  const token_hash = hash(token)

  await db
    .from('chaves_edicao')
    .upsert(
      { musico_id: musicoId, token_hash, ultimo_uso: new Date().toISOString() },
      { onConflict: 'token_hash,musico_id' },
    )
}

/** Quais músicos este navegador já respondeu (para voltar direto na resposta). */
export async function musicosDesteNavegador(): Promise<string[]> {
  const token = await lerToken()
  if (!token) return []

  const { data } = await servico()
    .from('chaves_edicao')
    .select('musico_id')
    .eq('token_hash', hash(token))

  return (data ?? []).map((l) => l.musico_id as string)
}
