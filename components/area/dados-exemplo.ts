/**
 * Dados de exemplo do protótipo da área do músico (30/09/2026).
 *
 * Nada aqui vem do banco. A pessoa é fictícia ("Bruno"), para o protótipo
 * não pôr telefone e aniversário inventados no nome de alguém real. Os
 * colegas de formação usam os apelidos da banda só para dar cara de verdade
 * à tela. O "hoje" é fixo, para a história do protótipo fechar sempre igual.
 */

export const HOJE = '2026-09-30'

export type TipoEvento = 'fire' | 'culto'
export type Resposta = 'sim' | 'se_precisar' | 'nao'
export type StatusEscala = 'a_confirmar' | 'confirmado' | 'imprevisto'

export type EventoExemplo = {
  id: string
  data: string
  tipo: TipoEvento
  titulo?: string
  hora: string
  passagem: string
}

export type Colega = { nome: string; funcao: string; voce?: boolean }

export type EscalaExemplo = {
  eventoId: string
  funcao: string
  status: StatusEscala
  formacao: Colega[]
}

export const EU = {
  nome: 'Bruno',
  nomeCompleto: 'Bruno Henrique Almeida',
  whatsapp: '(11) 9 8765-4321',
  aniversario: '14 de março',
  naBandaDesde: 2022,
  instrumentos: [
    { nome: 'Baixo', principal: true },
    { nome: 'Violão', principal: false },
    { nome: 'Teclado', principal: false },
  ],
  funcoesVoluts: ['Baixista', 'Violonista'],
  diasVoluts: ['sexta à noite', 'sábado à tarde e à noite', 'domingo de manhã e à noite'],
  tocouNoAno: 18,
}

const ev = (
  data: string,
  tipo: TipoEvento,
  titulo?: string,
): EventoExemplo => ({
  id: data,
  data,
  tipo,
  titulo,
  hora: tipo === 'fire' ? '20h' : '19h',
  passagem: tipo === 'fire' ? '18h' : '14h30',
})

/** As datas abertas, de hoje em diante. */
export const EVENTOS: EventoExemplo[] = [
  ev('2026-10-02', 'fire'),
  ev('2026-10-03', 'culto'),
  ev('2026-10-09', 'fire'),
  ev('2026-10-10', 'culto', 'Culto de Santa Ceia'),
  ev('2026-10-16', 'fire'),
  ev('2026-10-17', 'culto'),
  ev('2026-10-23', 'fire'),
  ev('2026-10-24', 'culto'),
  ev('2026-10-30', 'fire'),
  ev('2026-10-31', 'culto'),
  ev('2026-11-06', 'fire'),
  ev('2026-11-07', 'culto'),
  ev('2026-11-13', 'fire'),
  ev('2026-11-14', 'culto', 'Culto de Santa Ceia'),
  ev('2026-11-20', 'fire'),
  ev('2026-11-21', 'culto'),
  ev('2026-11-27', 'fire'),
  ev('2026-11-28', 'culto'),
]

/** O que o Bruno já respondeu. Quem não está aqui é pendência. */
export const RESPOSTAS_INICIAIS: Record<string, Resposta> = {
  '2026-10-02': 'se_precisar',
  '2026-10-03': 'sim',
  '2026-10-09': 'nao',
  '2026-10-10': 'sim',
  '2026-10-16': 'sim',
  '2026-10-17': 'sim',
  '2026-10-31': 'sim',
  '2026-11-13': 'se_precisar',
  '2026-11-14': 'sim',
  '2026-11-20': 'nao',
  '2026-11-21': 'sim',
  '2026-11-27': 'se_precisar',
  '2026-11-28': 'sim',
}

/** Só escala publicada chega aqui (decisão de 30/09). */
export const ESCALAS_INICIAIS: EscalaExemplo[] = [
  {
    eventoId: '2026-10-03',
    funcao: 'Baixo',
    status: 'a_confirmar',
    formacao: [
      { nome: 'Ruan Pablo', funcao: 'Teclado base' },
      { nome: 'Daniel', funcao: 'Guitarra e comunicação' },
      { nome: 'André Lima', funcao: 'Violão' },
      { nome: 'Bruno', funcao: 'Baixo', voce: true },
      { nome: 'Matheus', funcao: 'Bateria e click' },
    ],
  },
  {
    eventoId: '2026-10-17',
    funcao: 'Baixo',
    status: 'confirmado',
    formacao: [
      { nome: 'Davi', funcao: 'Teclado base' },
      { nome: 'Samuel', funcao: 'Teclado auxiliar' },
      { nome: 'Léo', funcao: 'Guitarra' },
      { nome: 'Mateus', funcao: 'Violão' },
      { nome: 'Bruno', funcao: 'Baixo', voce: true },
      { nome: 'Raphael', funcao: 'Bateria e click' },
      { nome: 'André Lima', funcao: 'Comunicação' },
    ],
  },
]

/** Escalas que já aconteceram, da mais recente para a mais antiga. */
export const HISTORICO: { data: string; tipo: TipoEvento; titulo?: string; funcao: string }[] = [
  { data: '2026-09-26', tipo: 'culto', funcao: 'Baixo' },
  { data: '2026-09-18', tipo: 'fire', funcao: 'Violão' },
  { data: '2026-09-12', tipo: 'culto', titulo: 'Culto de Santa Ceia', funcao: 'Baixo' },
  { data: '2026-09-05', tipo: 'culto', titulo: 'Conferência de Jovens', funcao: 'Baixo' },
  { data: '2026-08-29', tipo: 'culto', funcao: 'Baixo' },
  { data: '2026-08-21', tipo: 'fire', funcao: 'Teclado' },
]

// ------------------------------------------------------------
// Datas
// ------------------------------------------------------------

const SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

const local = (iso: string) => new Date(`${iso}T12:00:00`)

export const diaDaSemana = (iso: string) => SEMANA[local(iso).getDay()]
export const diaDoMes = (iso: string) => local(iso).getDate()
export const nomeDoMes = (iso: string) => MESES[local(iso).getMonth()]
export const chaveDoMes = (iso: string) => iso.slice(0, 7)

/** "sábado, 3 de outubro" */
export const dataLonga = (iso: string) =>
  `${diaDaSemana(iso)}, ${diaDoMes(iso)} de ${nomeDoMes(iso)}`

export function diasAte(iso: string, hoje = HOJE) {
  return Math.round((local(iso).getTime() - local(hoje).getTime()) / 86_400_000)
}

/** "hoje", "amanhã", "em 3 dias", "há 4 dias" */
export function quando(iso: string, hoje = HOJE) {
  const d = diasAte(iso, hoje)
  if (d === 0) return 'hoje'
  if (d === 1) return 'amanhã'
  if (d === -1) return 'ontem'
  return d > 0 ? `em ${d} dias` : `há ${-d} dias`
}

export const nomeDoEvento = (e: { tipo: TipoEvento; titulo?: string }) =>
  e.titulo ?? (e.tipo === 'fire' ? 'Fire' : 'Culto')

export const iniciais = (nome: string) =>
  nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
