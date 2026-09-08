import type { NomeIcone } from '@/components/icone'

// Vocabulário do domínio — espelha supabase/migrations/0001_schema.sql
// Os rótulos vêm de lideranca/equipe/criterios-de-nivel.md

export type NivelTecnico =
  | 'top'
  | 'avancado'
  | 'bom'
  | 'intermediario'
  | 'iniciante'

export type StatusMusico =
  | 'ativo'
  | 'presenca_baixa'
  | 'destreinado'
  | 'em_avaliacao'
  | 'em_formacao'
  | 'restricao'
  | 'fora'
  | 'lideranca'

export type NivelPresenca =
  | 'alta'
  | 'media'
  | 'baixa'
  | 'so_na_escala'
  | 'ausente'
  | 'sob_demanda'

export type OrdemEscala =
  | 'primeira_linha'
  | 'segunda_linha'
  | 'terceira_linha'
  | 'carta_na_manga'
  | 'reserva'
  | 'formacao'
  | 'indisponivel'

export type TipoEvento = 'culto' | 'fire' | 'kids' | 'especial'
export type StatusEvento = 'rascunho' | 'publicada' | 'fechada'
export type RespostaDisponibilidade = 'sim' | 'se_precisar' | 'nao'
export type TipoEscalacao = 'titular' | 'plano_b'

// ------------------------------------------------------------
// Rótulos para a interface
// ------------------------------------------------------------

export const NIVEL_LABEL: Record<NivelTecnico, string> = {
  top: 'Top',
  avancado: 'Avançado',
  bom: 'Bom',
  intermediario: 'Intermediário',
  iniciante: 'Iniciante',
}

export const STATUS_LABEL: Record<
  StatusMusico,
  { icone: NomeIcone; texto: string }
> = {
  ativo: { icone: 'statusAtivo', texto: 'Ativo' },
  presenca_baixa: { icone: 'statusPresencaBaixa', texto: 'Presença baixa' },
  destreinado: { icone: 'statusDestreinado', texto: 'Destreinado' },
  em_avaliacao: { icone: 'statusEmAvaliacao', texto: 'Em avaliação' },
  em_formacao: { icone: 'statusEmFormacao', texto: 'Em formação' },
  restricao: { icone: 'statusRestricao', texto: 'Restrição vigente' },
  fora: { icone: 'statusFora', texto: 'Fora da banda' },
  lideranca: { icone: 'statusLideranca', texto: 'Liderança' },
}

export const PRESENCA_LABEL: Record<NivelPresenca, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
  so_na_escala: 'Só na escala',
  ausente: 'Ausente',
  sob_demanda: 'Sob demanda',
}

export const ORDEM_LABEL: Record<OrdemEscala, string> = {
  primeira_linha: '1ª linha',
  segunda_linha: '2ª linha',
  terceira_linha: '3ª linha',
  carta_na_manga: 'Carta na manga',
  reserva: 'Reserva',
  formacao: 'Em formação',
  indisponivel: 'Indisponível',
}

// Ordem de exibição dos candidatos na tela de escala (lib/candidatos.ts)
export const PESO_ORDEM: Record<OrdemEscala, number> = {
  primeira_linha: 1,
  segunda_linha: 2,
  terceira_linha: 3,
  carta_na_manga: 4,
  reserva: 5,
  formacao: 6,
  indisponivel: 7,
}

export const PESO_NIVEL: Record<NivelTecnico, number> = {
  top: 1,
  avancado: 2,
  bom: 3,
  intermediario: 4,
  iniciante: 5,
}

export const RESPOSTA_LABEL: Record<
  RespostaDisponibilidade,
  { curto: string; longo: string }
> = {
  sim: { curto: 'Sim', longo: 'Posso tocar' },
  se_precisar: { curto: 'Se precisar', longo: 'Topo cobrir se precisarem' },
  nao: { curto: 'Não', longo: 'Não consigo nesse dia' },
}

// ------------------------------------------------------------
// Linhas do banco
// ------------------------------------------------------------

export type Musico = {
  id: string
  nome: string
  slug: string
  whatsapp: string | null
  status: StatusMusico
  presenca: NivelPresenca | null
  frentes: string[]
  eh_lider: boolean
  nota: string | null
  no_formulario: boolean
}

export type MusicoInstrumento = {
  musico_id: string
  instrumento_id: string
  nivel: NivelTecnico | null
  principal: boolean
  ordem: OrdemEscala
  observacao: string | null
  /** false = o músico informou que não toca isso. O nível fica guardado. */
  ativo: boolean
}

export type Instrumento = {
  id: string
  nome: string
  emoji: string | null
  ordem_criticidade: number
}

export type Funcao = {
  id: string
  nome: string
  emoji: string | null
}

export type ItemFormacao = {
  tipo: TipoEvento
  funcao_id: string
  obrigatoria: boolean
  plano_b_obrigatorio: boolean
  ordem: number
}

export type Evento = {
  id: string
  data: string
  tipo: TipoEvento
  titulo: string | null
  hora_evento: string
  hora_passagem: string | null
  exigencia_alta: boolean
  prazo_resposta: string | null
  aberto_para_resposta: boolean
  status: StatusEvento
}

export type Disponibilidade = {
  id: string
  musico_id: string
  evento_id: string
  resposta: RespostaDisponibilidade
  passagem_som: boolean
  observacao: string | null
  criado_em: string
  atualizado_em: string
}

export type Escalacao = {
  id: string
  evento_id: string
  funcao_id: string
  musico_id: string
  tipo: TipoEscalacao
  confirmado: boolean
  justificativa: string | null
  substituiu: string | null
  motivo_troca: string | null
  criado_por: string | null
  criado_em: string
}
