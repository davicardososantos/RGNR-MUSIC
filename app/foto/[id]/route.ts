import { z } from 'zod'
import { musicoLogado } from '@/lib/area/sessao'
import { gestorAtual } from '@/lib/supabase/sessao'
import { servico } from '@/lib/supabase/service'

/**
 * A foto de um músico, servida pelo próprio app (30/09/2026).
 *
 * A foto mora no armazenamento do Voluts, e o endereço de lá traz "voluts"
 * no caminho. O Davi pediu que a área do músico não deixe explícito de onde
 * vêm os dados, então a tela aponta para /foto/<id> e o servidor busca a
 * imagem. Só responde para quem está logado (músico ou gestor), e o
 * navegador guarda por um dia.
 */
export async function GET(_req: Request, ctx: RouteContext<'/foto/[id]'>) {
  const { id } = await ctx.params
  if (!z.string().uuid().safeParse(id).success) return new Response(null, { status: 404 })

  if (!(await musicoLogado()) && !(await gestorAtual())) return new Response(null, { status: 401 })

  const { data } = await servico().from('musicos').select('foto_url').eq('id', id).maybeSingle()
  if (!data?.foto_url) return new Response(null, { status: 404 })

  const origem = await fetch(data.foto_url as string, { next: { revalidate: 86_400 } })
  if (!origem.ok || !origem.body) return new Response(null, { status: 404 })

  return new Response(origem.body, {
    headers: {
      'Content-Type': origem.headers.get('content-type') ?? 'image/png',
      'Cache-Control': 'private, max-age=86400',
    },
  })
}
