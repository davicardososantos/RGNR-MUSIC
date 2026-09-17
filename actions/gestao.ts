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

const ajusteSchema = z.object({
  musicoId: z.string().uuid(),
  eventoId: z.string().uuid(),
  data: z.string(),
  slug: z.string().max(60),
  resposta: z.enum(['sim', 'se_precisar', 'nao']),
  passagemSom: z.boolean(),
  motivo: z.string().trim().min(3).max(280),
})

/**
 * O gestor corrige a resposta de um músico.
 *
 * Existe para o caso mais comum da operação: a pessoa marcou "sim" no
 * formulário e depois mandou mensagem no WhatsApp avisando que não vai dar.
 * Antes, a escala era montada em cima de uma resposta que os dois lados já
 * sabiam estar velha.
 *
 * O motivo é obrigatório, e é a única coisa obrigatória em todo o painel.
 * Não contradiz a D12 ("o app informa, não restringe"), que trata de escalar
 * gente contra o checklist: aqui o gestor está falando no lugar de outra
 * pessoa, e daqui a três semanas ninguém lembra por quê.
 */
export async function ajustarDisponibilidade(
  entrada: z.input<typeof ajusteSchema>,
) {
  const gestor = await exigirGestor()
  const { musicoId, eventoId, data, slug, resposta, passagemSom, motivo } =
    ajusteSchema.parse(entrada)

  const db = servico()
  const agora = new Date().toISOString()

  const { error } = await db.from('disponibilidades').upsert(
    {
      musico_id: musicoId,
      evento_id: eventoId,
      resposta,
      passagem_som: resposta === 'nao' ? false : passagemSom,
      ajustado_por: gestor.email,
      motivo_ajuste: motivo,
      ajustado_em: agora,
      atualizado_em: agora,
    },
    { onConflict: 'musico_id,evento_id' },
  )

  if (error) throw new Error(`Não consegui ajustar: ${error.message}`)

  // `chave_conhecida` marca resposta vinda de um aparelho que não era o do
  // músico, e é o que acende o aviso na tela de respostas. Um ajuste do
  // gestor não é isso: quem o fez está gravado em `ajustado_por`.
  await db.from('disponibilidade_log').insert({
    musico_id: musicoId,
    evento_id: eventoId,
    resposta,
    passagem_som: passagemSom,
    chave_conhecida: true,
    ajustado_por: gestor.email,
    motivo,
  })

  revalidatePath('/admin')
  revalidatePath('/admin/respostas')
  revalidatePath('/admin/relatorios')
  revalidatePath(`/admin/musicos/${slug}`)
  revalidatePath(`/admin/evento/${data}`)
}
