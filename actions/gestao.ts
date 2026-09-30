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

const contatoSchema = z.object({
  musicoId: z.string().uuid(),
  slug: z.string().max(60),
  whatsapp: z.string().max(30),
  /** dd/mm/aaaa, ou vazio para apagar */
  nascimento: z.string().max(10),
})

/**
 * O gestor corrige o WhatsApp e a data de nascimento de um músico
 * (30/09/2026). São as duas coisas que a área do músico pede para entrar:
 * quem está sem data no cadastro (ou com número errado) só entra depois
 * disso.
 */
export async function atualizarContato(entrada: z.input<typeof contatoSchema>) {
  await exigirGestor()
  const { musicoId, slug, whatsapp, nascimento } = contatoSchema.parse(entrada)

  const numero = whatsapp.replace(/\D/g, '')
  if (numero && numero.length < 10) throw new Error('WhatsApp precisa de DDD e número.')

  let aniversario: string | null = null
  if (nascimento.trim()) {
    const m = nascimento.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    const data = m ? new Date(`${m[3]}-${m[2]}-${m[1]}T12:00:00`) : null
    if (!m || !data || Number.isNaN(data.getTime()) || data.getDate() !== Number(m[1]))
      throw new Error('Data de nascimento inválida. Use dd/mm/aaaa.')
    aniversario = `${m[3]}-${m[2]}-${m[1]}`
  }

  const { error } = await servico()
    .from('musicos')
    .update({ whatsapp: numero || null, aniversario, atualizado_em: new Date().toISOString() })
    .eq('id', musicoId)
  if (error) throw new Error(`Não consegui salvar: ${error.message}`)

  revalidatePath(`/admin/musicos/${slug}`)
}

const dataISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const avisoSchema = z
  .object({
    musicoId: z.string().uuid(),
    texto: z.string().trim().min(3).max(280),
    indisponivelDe: dataISO.nullable(),
    indisponivelAte: dataISO.nullable(),
    naoCobrar: z.boolean(),
  })
  .refine((a) => (a.indisponivelDe === null) === (a.indisponivelAte === null), {
    message: 'Preencha as duas datas do período, ou nenhuma',
  })
  .refine(
    (a) => !a.indisponivelDe || !a.indisponivelAte || a.indisponivelDe <= a.indisponivelAte,
    { message: 'A data de início vem depois do fim' },
  )

/**
 * Registra o que o músico contou por fora do formulário.
 *
 * O aviso é recado entre os gestores e nunca grava resposta no lugar da
 * pessoa (PRD §5.1): quem avisou que não pode no mês continua sem resposta
 * no banco, só aparece marcado na escala e sai da conta de quem falta.
 *
 * O texto é o que os dois gestores vão ler. Assunto pessoal fica aqui, no
 * banco, e nunca no código.
 */
export async function criarAviso(entrada: z.input<typeof avisoSchema>) {
  const gestor = await exigirGestor()
  const aviso = avisoSchema.parse(entrada)

  const { error } = await servico().from('avisos_musico').insert({
    musico_id: aviso.musicoId,
    texto: aviso.texto,
    indisponivel_de: aviso.indisponivelDe,
    indisponivel_ate: aviso.indisponivelAte,
    nao_cobrar: aviso.naoCobrar,
    criado_por: gestor.email,
  })

  if (error) throw new Error(`Não consegui salvar o aviso: ${error.message}`)

  // O aviso mexe no painel, em Respostas e na montagem de toda data do
  // período: mais simples invalidar o /admin inteiro.
  revalidatePath('/admin', 'layout')
}

/** Tira o aviso do ar. A linha fica no banco, com quem encerrou e quando. */
export async function encerrarAviso(entrada: { id: string }) {
  const gestor = await exigirGestor()
  const { id } = z.object({ id: z.string().uuid() }).parse(entrada)

  const { error } = await servico()
    .from('avisos_musico')
    .update({ encerrado_em: new Date().toISOString(), encerrado_por: gestor.email })
    .eq('id', id)
    .is('encerrado_em', null)

  if (error) throw new Error(`Não consegui encerrar o aviso: ${error.message}`)

  revalidatePath('/admin', 'layout')
}
