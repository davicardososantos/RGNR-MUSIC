import type { RespostaDisponibilidade, TipoEvento } from '@/lib/tipos'

/**
 * O que a área do músico recebe do servidor, já mastigado para a tela.
 * Nada aqui diz de onde veio o dado: foto, nome completo e aniversário vêm
 * do cadastro da igreja e aparecem como dados da pessoa, sem citar a origem
 * (pedido do Davi, 30/09/2026).
 */

export type Resposta = RespostaDisponibilidade

export type EventoArea = {
  id: string
  data: string
  tipo: TipoEvento
  titulo: string | null
  /** "19h", "20h" */
  hora: string
  /** "14h30", ou nulo quando não tem passagem */
  passagem: string | null
  /** Ainda recebe resposta (D11: quem fecha é o gestor). */
  aberto: boolean
}

export type MinhaRespostaArea = {
  resposta: Resposta
  passagemSom: boolean
  observacao: string | null
}

export type StatusEscala = 'a_confirmar' | 'confirmado' | 'imprevisto'

export type Colega = {
  nome: string
  foto: string | null
  /** "Baixo", "Guitarra + Comunicação" */
  funcao: string
  voce: boolean
}

export type EscalaArea = {
  eventoId: string
  funcao: string
  planoB: boolean
  status: StatusEscala
  formacao: Colega[]
}

export type HistoricoArea = {
  data: string
  tipo: TipoEvento
  titulo: string | null
  funcao: string
}

export type InstrumentoArea = { id: string; nome: string }

export type PerfilArea = {
  nome: string
  nomeCompleto: string | null
  foto: string | null
  whatsapp: string | null
  email: string | null
  /** AAAA-MM-DD */
  aniversario: string | null
  principal: string | null
  toca: string[]
}

export type DadosArea = {
  hoje: string
  saudacao: string
  eu: PerfilArea
  /** De hoje em diante: as abertas e as que já fecharam mas ainda vão acontecer. */
  eventos: EventoArea[]
  respostas: Record<string, MinhaRespostaArea>
  /** Só escala publicada, de hoje em diante (decisão de 30/09/2026). */
  escalas: EscalaArea[]
  historico: HistoricoArea[]
  tocouNoAno: number
  instrumentos: InstrumentoArea[]
}
