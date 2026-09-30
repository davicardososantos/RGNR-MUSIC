'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { servico } from '@/lib/supabase/service'
import { abrirSessao, fecharSessao, musicoLogado } from '@/lib/area/sessao'

/**
 * Ações da área do músico (30/09/2026). Toda escrita confere a sessão
 * antes: o músico só mexe nas próprias respostas e nas próprias escalas.
 */

async function exigirMusico() {
  const musico = await musicoLogado()
  if (!musico) throw new Error('Sua sessão expirou. Entre de novo.')
  return musico
}

const soDigitos = (s: string) => s.replace(/\D/g, '')
/** DDD + número. Tolera +55, espaços, traços e parênteses. */
const telefoneNormal = (s: string) => soDigitos(s).slice(-11)

// ------------------------------------------------------------
// Entrar
// ------------------------------------------------------------

const MAX_ERROS = 5
const JANELA_MINUTOS = 15

const entrarSchema = z.object({
  telefone: z.string().max(30),
  nascimento: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),
})

export type ResultadoEntrada = { ok: true } | { ok: false; erro: string }

/**
 * WhatsApp + data de nascimento (decisão do Davi, 30/09/2026).
 *
 * O número confere com o WhatsApp que o músico informou no app ou com o
 * telefone do cadastro da igreja (`telefone_voluts`, escondido). A data vem
 * do mesmo cadastro. Cinco erros seguidos no mesmo número travam aquele
 * número por 15 minutos: sem isso, dava para adivinhar a data de nascimento
 * de alguém tentando todas.
 */
export async function entrar(entrada: z.input<typeof entrarSchema>): Promise<ResultadoEntrada> {
  const parsed = entrarSchema.safeParse(entrada)
  if (!parsed.success) return { ok: false, erro: 'Confira o número e a data.' }

  const telefone = telefoneNormal(parsed.data.telefone)
  if (telefone.length !== 11) return { ok: false, erro: 'Digite o WhatsApp com DDD.' }

  const [dia, mes, ano] = parsed.data.nascimento.split('/')
  const nascimento = `${ano}-${mes}-${dia}`

  const db = servico()
  const desde = new Date(Date.now() - JANELA_MINUTOS * 60_000).toISOString()
  const { data: tentativas } = await db
    .from('tentativas_entrada')
    .select('ok')
    .eq('telefone', telefone)
    .gte('criado_em', desde)
    .order('criado_em', { ascending: false })
    .limit(MAX_ERROS)
  if ((tentativas ?? []).length >= MAX_ERROS && tentativas!.every((t) => !t.ok)) {
    return { ok: false, erro: `Muitas tentativas com esse número. Tente de novo em ${JANELA_MINUTOS} minutos.` }
  }

  const registrar = (ok: boolean) => db.from('tentativas_entrada').insert({ telefone, ok })

  const { data: candidatos } = await db
    .from('musicos')
    .select('id, whatsapp, telefone_voluts, aniversario')
    .eq('no_formulario', true)

  const doNumero = (candidatos ?? []).filter(
    (m) =>
      (m.whatsapp && telefoneNormal(m.whatsapp as string) === telefone) ||
      (m.telefone_voluts && telefoneNormal(m.telefone_voluts as string) === telefone),
  )

  if (doNumero.length === 0) {
    await registrar(false)
    return { ok: false, erro: 'Não achamos esse número na banda. Confira ou fale com a liderança.' }
  }

  const certo = doNumero.find((m) => m.aniversario === nascimento)
  if (!certo) {
    await registrar(false)
    const semData = doNumero.every((m) => !m.aniversario)
    return {
      ok: false,
      erro: semData
        ? 'Sua data de nascimento ainda não está no cadastro. Fale com a liderança.'
        : 'A data de nascimento não confere com esse número.',
    }
  }

  await registrar(true)
  await abrirSessao(certo.id as string)
  return { ok: true }
}

export async function sair() {
  await fecharSessao()
  revalidatePath('/')
}

// ------------------------------------------------------------
// Responder uma data
// ------------------------------------------------------------

const respostaSchema = z.object({
  eventoId: z.string().uuid(),
  resposta: z.enum(['sim', 'se_precisar', 'nao']),
  passagemSom: z.boolean(),
  observacao: z.string().max(280).nullable(),
})

export async function responder(entrada: z.input<typeof respostaSchema>) {
  const musico = await exigirMusico()
  const { eventoId, resposta, passagemSom, observacao } = respostaSchema.parse(entrada)
  const db = servico()

  const { data: evento } = await db
    .from('eventos')
    .select('aberto_para_resposta')
    .eq('id', eventoId)
    .maybeSingle()
  // D11: quem fecha a data é o gestor, nunca o prazo.
  if (!evento?.aberto_para_resposta) throw new Error('As respostas para esta data já foram encerradas.')

  const obs = resposta === 'nao' ? null : observacao?.trim() || null
  const passagem = resposta === 'nao' ? false : passagemSom

  const { error } = await db.from('disponibilidades').upsert(
    {
      musico_id: musico.id,
      evento_id: eventoId,
      resposta,
      passagem_som: passagem,
      observacao: obs,
      atualizado_em: new Date().toISOString(),
      // A pessoa respondeu por conta própria: um ajuste antigo do gestor
      // deixa de valer como explicação da resposta atual.
      ajustado_por: null,
      motivo_ajuste: null,
      ajustado_em: null,
    },
    { onConflict: 'musico_id,evento_id' },
  )
  if (error) throw new Error(`Não consegui salvar: ${error.message}`)

  // Com login, a resposta é sempre do dono: chave_conhecida = true.
  await db.from('disponibilidade_log').insert({
    musico_id: musico.id,
    evento_id: eventoId,
    resposta,
    passagem_som: passagem,
    observacao: obs,
    chave_conhecida: true,
  })
}

// ------------------------------------------------------------
// Escala: confirmar e avisar imprevisto
// ------------------------------------------------------------

const eventoSchema = z.object({ eventoId: z.string().uuid() })

async function eventoPublicado(eventoId: string) {
  const { data } = await servico().from('eventos').select('status, data').eq('id', eventoId).maybeSingle()
  if (data?.status !== 'publicada') throw new Error('Essa escala ainda não foi publicada.')
  return data
}

export async function confirmarPresenca(entrada: z.input<typeof eventoSchema>) {
  const musico = await exigirMusico()
  const { eventoId } = eventoSchema.parse(entrada)
  const evento = await eventoPublicado(eventoId)

  const { error } = await servico()
    .from('escalacoes')
    .update({ confirmado: true, confirmado_em: new Date().toISOString() })
    .eq('evento_id', eventoId)
    .eq('musico_id', musico.id)
  if (error) throw new Error(`Não consegui confirmar: ${error.message}`)

  revalidatePath(`/admin/evento/${evento.data}`)
  revalidatePath('/admin')
}

const imprevistoSchema = z.object({
  eventoId: z.string().uuid(),
  texto: z.string().trim().max(280),
})

/**
 * O escalado avisa que não vai mais poder. A escala não muda sozinha: o
 * aviso aparece para os gestores no painel e na cobertura, e quem troca é
 * a liderança (PRD §6.2 D).
 */
export async function avisarImprevisto(entrada: z.input<typeof imprevistoSchema>) {
  const musico = await exigirMusico()
  const { eventoId, texto } = imprevistoSchema.parse(entrada)
  const evento = await eventoPublicado(eventoId)

  const { error } = await servico()
    .from('escalacoes')
    .update({ imprevisto_em: new Date().toISOString(), imprevisto_texto: texto || null, confirmado: false })
    .eq('evento_id', eventoId)
    .eq('musico_id', musico.id)
  if (error) throw new Error(`Não consegui avisar: ${error.message}`)

  revalidatePath(`/admin/evento/${evento.data}`)
  revalidatePath(`/admin/evento/${evento.data}/cobertura`)
  revalidatePath('/admin')
}

// ------------------------------------------------------------
// Perfil
// ------------------------------------------------------------

const perfilSchema = z.object({
  whatsapp: z.string().max(30),
  principal: z.string().max(30).nullable(),
  toca: z.array(z.string().max(30)).max(10),
})

/**
 * Mesma regra do passo 2 do formulário (PRD §5.1): o que o músico diz que
 * toca é a verdade. Instrumento novo entra sem nível, como reserva; o que
 * ele desmarca vira `ativo = false` e o nível da liderança fica guardado.
 */
export async function salvarPerfil(entrada: z.input<typeof perfilSchema>) {
  const musico = await exigirMusico()
  const { whatsapp, principal, toca } = perfilSchema.parse(entrada)
  const db = servico()

  const numero = soDigitos(whatsapp)
  if (numero && numero.length < 10) throw new Error('Digite o WhatsApp com DDD.')

  await db
    .from('musicos')
    .update({ whatsapp: numero || null, atualizado_em: new Date().toISOString() })
    .eq('id', musico.id)

  const informados = [...new Set([principal, ...toca].filter(Boolean) as string[])]
  const { data: existentes } = await db
    .from('musico_instrumento')
    .select('instrumento_id')
    .eq('musico_id', musico.id)
  const jaTem = new Set((existentes ?? []).map((r) => r.instrumento_id as string))

  const novos = informados
    .filter((i) => !jaTem.has(i))
    .map((instrumento_id) => ({
      musico_id: musico.id,
      instrumento_id,
      nivel: null,
      principal: instrumento_id === principal,
      ordem: 'reserva' as const,
      ativo: true,
    }))
  if (novos.length) await db.from('musico_instrumento').insert(novos)

  for (const instrumento_id of jaTem) {
    await db
      .from('musico_instrumento')
      .update({ principal: instrumento_id === principal, ativo: informados.includes(instrumento_id) })
      .eq('musico_id', musico.id)
      .eq('instrumento_id', instrumento_id)
  }

  revalidatePath(`/admin/musicos/${musico.slug}`)
}
