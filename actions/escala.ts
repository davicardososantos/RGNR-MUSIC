'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { servico } from '@/lib/supabase/service'
import { gestorAtual } from '@/lib/supabase/sessao'

async function exigirGestor() {
  const gestor = await gestorAtual()
  if (!gestor) throw new Error('Sem permissão')
  return gestor
}

const escalarSchema = z.object({
  eventoId: z.string().uuid(),
  data: z.string(),
  funcaoId: z.string().max(40),
  musicoId: z.string().uuid(),
  tipo: z.enum(['titular', 'plano_b']),
})

/**
 * Coloca alguém numa função. Substitui quem estava ali.
 *
 * D12: nada é bloqueado aqui. Escalar alguém que o checklist não
 * recomendaria é decisão da liderança, e o app não pede justificativa.
 */
export async function escalar(entrada: z.input<typeof escalarSchema>) {
  const gestor = await exigirGestor()
  const { eventoId, data, funcaoId, musicoId, tipo } = escalarSchema.parse(entrada)

  const { error } = await servico()
    .from('escalacoes')
    .upsert(
      {
        evento_id: eventoId,
        funcao_id: funcaoId,
        musico_id: musicoId,
        tipo,
        criado_por: gestor.email,
        criado_em: new Date().toISOString(),
      },
      { onConflict: 'evento_id,funcao_id,tipo' },
    )

  if (error) throw new Error(`Não consegui escalar: ${error.message}`)
  revalidatePath(`/admin/evento/${data}`)
  revalidatePath('/admin')
}

const removerSchema = z.object({
  eventoId: z.string().uuid(),
  data: z.string(),
  funcaoId: z.string().max(40),
  tipo: z.enum(['titular', 'plano_b']),
})

export async function desescalar(entrada: z.input<typeof removerSchema>) {
  await exigirGestor()
  const { eventoId, data, funcaoId, tipo } = removerSchema.parse(entrada)

  const { error } = await servico()
    .from('escalacoes')
    .delete()
    .eq('evento_id', eventoId)
    .eq('funcao_id', funcaoId)
    .eq('tipo', tipo)

  if (error) throw new Error(`Não consegui remover: ${error.message}`)
  revalidatePath(`/admin/evento/${data}`)
  revalidatePath('/admin')
}

const encerrarSchema = z.object({
  eventoId: z.string().uuid(),
  data: z.string(),
  aberto: z.boolean(),
})

/**
 * Abre ou fecha as respostas de uma data.
 *
 * D11: é ESTE botão que fecha o formulário, nunca a data do prazo.
 */
export async function alternarRespostas(entrada: z.input<typeof encerrarSchema>) {
  await exigirGestor()
  const { eventoId, data, aberto } = encerrarSchema.parse(entrada)

  const { error } = await servico()
    .from('eventos')
    .update({ aberto_para_resposta: aberto })
    .eq('id', eventoId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/evento/${data}`)
  revalidatePath('/admin')
  revalidatePath('/setembro')
}
