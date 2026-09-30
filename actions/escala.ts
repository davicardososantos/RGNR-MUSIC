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
 * Libera a vaga (função + tipo) antes de gravar quem entra.
 *
 * Desde 14/09/2026 a unique de `escalacoes` é (evento, função, músico), para
 * caber revezamento. O upsert por (evento, função, tipo) que existia aqui
 * passou a ser recusado pelo Postgres (42P10) e os botões de escalar e de
 * substituir davam erro. Sai quem ocupava a vaga e também a própria pessoa,
 * se ela estava na outra vaga da mesma função (plano B virando titular).
 */
async function liberarVaga(
  eventoId: string,
  funcaoId: string,
  tipo: 'titular' | 'plano_b',
  musicoId: string,
) {
  const { error } = await servico()
    .from('escalacoes')
    .delete()
    .eq('evento_id', eventoId)
    .eq('funcao_id', funcaoId)
    // tipo é enum e musicoId é uuid validado pelo zod: seguro no filtro.
    .or(`tipo.eq.${tipo},musico_id.eq.${musicoId}`)

  if (error) throw new Error(error.message)
}

/**
 * Coloca alguém numa função. Substitui quem estava ali.
 *
 * D12: nada é bloqueado aqui. Escalar alguém que o checklist não
 * recomendaria é decisão da liderança, e o app não pede justificativa.
 */
export async function escalar(entrada: z.input<typeof escalarSchema>) {
  const gestor = await exigirGestor()
  const { eventoId, data, funcaoId, musicoId, tipo } = escalarSchema.parse(entrada)

  try {
    await liberarVaga(eventoId, funcaoId, tipo, musicoId)
  } catch (e) {
    throw new Error(`Não consegui escalar: ${e instanceof Error ? e.message : e}`)
  }

  const { error } = await servico().from('escalacoes').insert({
    evento_id: eventoId,
    funcao_id: funcaoId,
    musico_id: musicoId,
    tipo,
    criado_por: gestor.email,
    criado_em: new Date().toISOString(),
  })

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

const substituirSchema = z.object({
  eventoId: z.string().uuid(),
  data: z.string(),
  funcaoId: z.string().max(40),
  entraId: z.string().uuid(),
  motivo: z.string().max(200).nullable(),
})

/**
 * Troca o titular de uma função e registra quem saiu.
 *
 * Sem diálogo de confirmação e sem exigir motivo: isto é usado no domingo
 * de manhã, com alguém já tendo avisado que não vem. Pedir justificativa
 * ali seria atrito no pior momento possível (D12). O histórico fica em
 * `substituiu`, que é o que interessa depois.
 */
export async function substituir(entrada: z.input<typeof substituirSchema>) {
  const gestor = await exigirGestor()
  const { eventoId, data, funcaoId, entraId, motivo } = substituirSchema.parse(entrada)

  const db = servico()

  // Com revezamento pode haver mais de um titular: `maybeSingle()` dava erro
  // nesse caso. Quem saiu é o titular mais antigo da função.
  const { data: atuais } = await db
    .from('escalacoes')
    .select('musico_id')
    .eq('evento_id', eventoId)
    .eq('funcao_id', funcaoId)
    .eq('tipo', 'titular')
    .order('criado_em')
    .limit(1)

  try {
    await liberarVaga(eventoId, funcaoId, 'titular', entraId)
  } catch (e) {
    throw new Error(`Não consegui substituir: ${e instanceof Error ? e.message : e}`)
  }

  const { error } = await db.from('escalacoes').insert({
    evento_id: eventoId,
    funcao_id: funcaoId,
    musico_id: entraId,
    tipo: 'titular',
    substituiu: atuais?.[0]?.musico_id ?? null,
    motivo_troca: motivo?.trim() || null,
    confirmado: false,
    criado_por: gestor.email,
    criado_em: new Date().toISOString(),
  })

  if (error) throw new Error(`Não consegui substituir: ${error.message}`)

  revalidatePath(`/admin/evento/${data}`)
  revalidatePath(`/admin/evento/${data}/cobertura`)
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
  // O formulário é uma página só, na raiz: fechar uma data tira o cartão dela.
  revalidatePath('/')
}
