'use server'

import { z } from 'zod'
import { servico } from '@/lib/supabase/service'
import {
  garantirToken,
  registrarChave,
  temChave,
} from '@/lib/chave-edicao'
import {
  buscarMusicoPorSlug,
  carregarMeusDados,
  carregarMinhasRespostas,
  type MeusDados,
  type MinhaResposta,
} from '@/lib/dados'

const slugSchema = z.string().min(1).max(60).regex(/^[a-z0-9-]+$/)

async function exigirMusico(slug: string) {
  const musico = await buscarMusicoPorSlug(slugSchema.parse(slug))
  if (!musico || !musico.no_formulario) throw new Error('Músico não encontrado')
  return musico
}

// ------------------------------------------------------------
// Abrir o formulário
// ------------------------------------------------------------

export type AberturaFormulario = {
  nome: string
  dados: MeusDados
  respostas: MinhaResposta[]
  jaRespondeuNesteAparelho: boolean
}

/**
 * PRD §5: as respostas só voltam se ESTE navegador tiver a chave do músico.
 * Em qualquer outro aparelho, `respostas` vem vazio — não é erro, é o desenho.
 * Nada é criado aqui: selecionar um nome não reivindica ninguém.
 */
export async function abrirFormulario(slug: string): Promise<AberturaFormulario> {
  const musico = await exigirMusico(slug)
  const meu = await temChave(musico.id)

  return {
    nome: musico.nome,
    dados: await carregarMeusDados(musico.id),
    respostas: meu ? await carregarMinhasRespostas(musico.id) : [],
    jaRespondeuNesteAparelho: meu,
  }
}

// ------------------------------------------------------------
// Passo 2 — dados do músico
// ------------------------------------------------------------

const dadosSchema = z.object({
  slug: slugSchema,
  whatsapp: z.string().max(30).nullable(),
  principal: z.string().max(30).nullable(),
  cobertura: z.array(z.string().max(30)).max(10),
})

export async function salvarDados(entrada: z.input<typeof dadosSchema>) {
  const { slug, whatsapp, principal, cobertura } = dadosSchema.parse(entrada)
  const musico = await exigirMusico(slug)
  const db = servico()

  await db
    .from('musicos')
    .update({ whatsapp: whatsapp?.trim() || null, atualizado_em: new Date().toISOString() })
    .eq('id', musico.id)

  const informados = [...new Set([principal, ...cobertura].filter(Boolean) as string[])]

  const { data: existentes } = await db
    .from('musico_instrumento')
    .select('instrumento_id')
    .eq('musico_id', musico.id)

  const jaTem = new Set((existentes ?? []).map((r) => r.instrumento_id as string))

  // Instrumento novo entra sem nível: quem avalia nível é a liderança, não o
  // próprio músico. Fica como 'reserva' até alguém olhar.
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

  // O que o músico respondeu é a verdade sobre o que ele toca (PRD §5.1).
  // Desmarcar desativa a linha em vez de apagá-la: o nível que a liderança
  // definiu fica guardado para quando ele voltar a marcar.
  for (const instrumento_id of jaTem) {
    await db
      .from('musico_instrumento')
      .update({
        principal: instrumento_id === principal,
        ativo: informados.includes(instrumento_id),
      })
      .eq('musico_id', musico.id)
      .eq('instrumento_id', instrumento_id)
  }

  await registrarChave(musico.id, await garantirToken())
}

// ------------------------------------------------------------
// Passo 3 — a resposta de cada data
// ------------------------------------------------------------

const respostaSchema = z.object({
  slug: slugSchema,
  eventoId: z.string().uuid(),
  resposta: z.enum(['sim', 'se_precisar', 'nao']),
  passagemSom: z.boolean(),
  observacao: z.string().max(280).nullable(),
})

export async function salvarResposta(entrada: z.input<typeof respostaSchema>) {
  const { slug, eventoId, resposta, passagemSom, observacao } =
    respostaSchema.parse(entrada)

  const musico = await exigirMusico(slug)
  const db = servico()

  const { data: evento } = await db
    .from('eventos')
    .select('id, aberto_para_resposta')
    .eq('id', eventoId)
    .maybeSingle()

  // D11: quem fecha é aberto_para_resposta, nunca a data do prazo.
  if (!evento?.aberto_para_resposta) {
    throw new Error('As respostas para esta data foram encerradas')
  }

  // Antes de gravar: este navegador já era o dono? Se não, é resposta de
  // outro aparelho, e o gestor precisa ver isso (PRD §5).
  const eraDono = await temChave(musico.id)

  const agora = new Date().toISOString()

  const { error } = await db.from('disponibilidades').upsert(
    {
      musico_id: musico.id,
      evento_id: eventoId,
      resposta,
      passagem_som: resposta === 'nao' ? false : passagemSom,
      observacao: resposta === 'nao' ? null : observacao?.trim() || null,
      atualizado_em: agora,
    },
    { onConflict: 'musico_id,evento_id' },
  )

  if (error) throw new Error(`Não consegui salvar: ${error.message}`)

  await db.from('disponibilidade_log').insert({
    musico_id: musico.id,
    evento_id: eventoId,
    resposta,
    passagem_som: passagemSom,
    observacao: observacao?.trim() || null,
    chave_conhecida: eraDono,
  })

  await registrarChave(musico.id, await garantirToken())
}
