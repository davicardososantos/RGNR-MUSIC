import { diaEMes, hojeISO, listaPorExtenso } from '@/lib/datas'

/**
 * O cadastro que vem do Voluts, mostrado na ficha do músico.
 *
 * O Voluts (web.voluts.com.br) é onde a igreja guarda o cadastro de todo
 * voluntário do RGNR. Quem preenche estas colunas é o script de
 * sincronização da liderança, lendo o Voluts: nada aqui é digitado no app.
 * Telefone fica de fora de propósito, porque o WhatsApp é o que o músico
 * informa no formulário.
 */
export type CadastroVoluts = {
  nomeCompleto: string | null
  apelido: string | null
  email: string | null
  /** AAAA-MM-DD */
  aniversario: string | null
  genero: string | null
  estadoCivil: string | null
  escolaridade: string | null
  formacao: string | null
  profissao: string | null
  redes: { rede: RedeSocial; valor: string }[]
  fotoUrl: string | null
  funcoes: string[]
  dias: string[]
  ultimaEscala: string | null
  sincronizadoEm: string | null
}

export type RedeSocial = 'instagram' | 'facebook' | 'linkedin'

const REDES: RedeSocial[] = ['instagram', 'facebook', 'linkedin']

/**
 * Monta o cadastro a partir da linha de `musicos`. Devolve nulo para quem
 * ainda não foi ligado ao Voluts, e também antes de a migration de 30/09
 * rodar: aí as colunas nem existem e `voluts_id` vem indefinido.
 */
export function cadastroDaLinha(m: Record<string, unknown>): CadastroVoluts | null {
  if (!m.voluts_id) return null

  const texto = (k: string) => (typeof m[k] === 'string' && m[k] ? (m[k] as string) : null)
  const lista = (k: string) => (Array.isArray(m[k]) ? (m[k] as string[]) : [])
  const redes = (m.redes_sociais ?? {}) as Partial<Record<RedeSocial, string>>

  return {
    nomeCompleto: texto('nome_completo'),
    apelido: texto('apelido_voluts'),
    email: texto('email'),
    aniversario: texto('aniversario'),
    genero: texto('genero'),
    estadoCivil: texto('estado_civil'),
    escolaridade: texto('escolaridade'),
    formacao: texto('formacao'),
    profissao: texto('profissao'),
    redes: REDES.filter((r) => redes[r]).map((r) => ({ rede: r, valor: redes[r] as string })),
    fotoUrl: texto('foto_url'),
    funcoes: lista('funcoes_voluts'),
    dias: lista('dias_voluts'),
    ultimaEscala: texto('ultima_escala_voluts'),
    sincronizadoEm: texto('voluts_sincronizado_em'),
  }
}

export const GENERO_LABEL: Record<string, string> = {
  MALE: 'Masculino',
  FEMALE: 'Feminino',
}

export const ESTADO_CIVIL_LABEL: Record<string, string> = {
  SINGLE: 'Solteiro(a)',
  MARRIED: 'Casado(a)',
  OTHERS: 'Outro',
}

export const ESCOLARIDADE_LABEL: Record<string, string> = {
  FUNDAMENTAL: 'Ensino fundamental',
  MEDIUM: 'Ensino médio',
  GRADUATION: 'Ensino superior',
  POST_GRADUATION: 'Pós-graduação',
}

export const REDE_LABEL: Record<RedeSocial, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
}

/** Link da rede, aceitando tanto o usuário quanto o endereço inteiro. */
export function linkDaRede(rede: RedeSocial, valor: string) {
  if (/^https?:\/\//i.test(valor)) return valor
  const usuario = valor.replace(/^@/, '')
  if (rede === 'instagram') return `https://instagram.com/${usuario}`
  if (rede === 'facebook') return `https://facebook.com/${usuario}`
  return `https://www.linkedin.com/in/${usuario}`
}

/** "12 de maio · 24 anos" */
export function aniversarioComIdade(iso: string) {
  const hoje = hojeISO()
  let idade = Number(hoje.slice(0, 4)) - Number(iso.slice(0, 4))
  if (hoje.slice(5) < iso.slice(5, 10)) idade -= 1
  return `${diaEMes(iso.slice(0, 10))} · ${idade} anos`
}

const DIAS: [string, string][] = [
  ['SUN', 'domingo'],
  ['MON', 'segunda'],
  ['TUE', 'terça'],
  ['WED', 'quarta'],
  ['THU', 'quinta'],
  ['FRI', 'sexta'],
  ['SAT', 'sábado'],
]

// O número do código é a hora em que o turno acaba. Leitura nossa do
// formato do Voluts (SUN-12, SUN-18, SUN-24), não documentação dele.
const TURNOS: [string, string][] = [
  ['12', 'manhã'],
  ['18', 'tarde'],
  ['24', 'noite'],
]

/** ["sexta à noite", "sábado de manhã, à tarde e à noite"] */
export function diasPorExtenso(codigos: string[]) {
  const marcados = new Set(codigos.map((c) => c.trim().toUpperCase()))
  return DIAS.flatMap(([cod, dia]) => {
    const turnos = TURNOS.filter(([h]) => marcados.has(`${cod}-${h}`)).map(([, t]) =>
      t === 'manhã' ? 'de manhã' : `à ${t}`,
    )
    return turnos.length ? [`${dia} ${listaPorExtenso(turnos)}`] : []
  })
}
