import {
  PESO_NIVEL,
  PESO_ORDEM,
  type NivelPresenca,
  type NivelTecnico,
  type OrdemEscala,
  type RespostaDisponibilidade,
  type StatusMusico,
  type TipoEvento,
} from '@/lib/tipos'

export type InstrumentoDoMusico = {
  instrumento_id: string
  nivel: NivelTecnico | null
  ordem: OrdemEscala
  principal: boolean
}

export type MusicoParaEscala = {
  id: string
  nome: string
  whatsapp: string | null
  status: StatusMusico
  presenca: NivelPresenca | null
  ehLider: boolean
  instrumentos: InstrumentoDoMusico[]
  /** Override de ordem por função (o Samuel é 1ª linha no teclado auxiliar). */
  ordemPorFuncao: Record<string, OrdemEscala>
  resposta: RespostaDisponibilidade | null
  passagemSom: boolean
  observacao: string | null
}

export type FuncaoDaEscala = {
  id: string
  nome: string
  obrigatoria: boolean
  planoBObrigatorio: boolean
  ordem: number
  instrumentos: string[]
}

export type EscalacaoAtual = {
  id: string
  funcao_id: string
  musico_id: string
  tipo: 'titular' | 'plano_b'
}

export type Aviso = {
  texto: string
  tom: 'positivo' | 'atencao' | 'neutro'
}

export type Candidato = {
  musico: MusicoParaEscala
  nivel: NivelTecnico | null
  ordem: OrdemEscala
  tocaInstrumento: boolean
  avisos: Aviso[]
}

export type GruposDeCandidatos = {
  podem: Candidato[]
  sePrecisar: Candidato[]
  semResposta: Candidato[]
  naoPodem: Candidato[]
}

/** Click e VS sai junto com a bateria — é o padrão da casa, não acúmulo. */
const PAR_NATURAL = new Set(['bateria|click_vs', 'click_vs|bateria'])

function acumuloEsperado(a: string, b: string) {
  return PAR_NATURAL.has(`${a}|${b}`)
}

function avisosDoCandidato(
  musico: MusicoParaEscala,
  funcao: FuncaoDaEscala,
  evento: { tipo: TipoEvento },
  escalacoes: EscalacaoAtual[],
  tocaInstrumento: boolean,
): Aviso[] {
  const avisos: Aviso[] = []
  const fire = evento.tipo === 'fire'

  const outraFuncao = escalacoes.find(
    (e) =>
      e.musico_id === musico.id &&
      e.tipo === 'titular' &&
      e.funcao_id !== funcao.id &&
      !acumuloEsperado(e.funcao_id, funcao.id),
  )
  if (outraFuncao) {
    avisos.push({ texto: 'já escalado em outra função', tom: 'atencao' })
  }

  if (!tocaInstrumento) {
    avisos.push({ texto: 'não é o instrumento dele', tom: 'neutro' })
  }

  if (musico.resposta !== 'nao' && musico.resposta !== null && !musico.passagemSom) {
    avisos.push({ texto: 'não passa som', tom: 'atencao' })
  }

  // No Fire a regra se inverte: é o laboratório de estreia (frentes.md).
  if (musico.status === 'em_formacao') {
    avisos.push(
      fire
        ? { texto: 'candidato a estreia', tom: 'positivo' }
        : { texto: 'em formação', tom: 'atencao' },
    )
  }

  if (musico.status === 'destreinado') {
    avisos.push({
      texto: fire ? 'bom para retomada' : 'destreinado',
      tom: fire ? 'positivo' : 'atencao',
    })
  }

  if (musico.status === 'em_avaliacao') {
    avisos.push({ texto: 'audição pendente', tom: 'neutro' })
  }
  if (musico.status === 'lideranca') {
    avisos.push({ texto: 'liderança de outra frente', tom: 'neutro' })
  }
  if (musico.status === 'restricao') {
    avisos.push({ texto: 'restrição vigente', tom: 'atencao' })
  }
  if (musico.status === 'presenca_baixa' || musico.presenca === 'so_na_escala') {
    avisos.push({ texto: 'confirmar antes', tom: 'atencao' })
  }
  if (musico.presenca === 'sob_demanda') {
    avisos.push({ texto: 'alinhar com a outra frente', tom: 'neutro' })
  }

  return avisos
}

/**
 * Quem pode ocupar uma função.
 *
 * D12: ninguém é escondido. Quem não toca o instrumento aparece igual, só
 * mais abaixo e marcado — a liderança decide, o app organiza.
 *
 * A resposta do músico é o sinal primário (PRD §5.1); nível e ordem de
 * escala só desempatam dentro de cada grupo.
 */
export function candidatosParaFuncao(
  funcao: FuncaoDaEscala,
  evento: { tipo: TipoEvento },
  musicos: MusicoParaEscala[],
  escalacoes: EscalacaoAtual[],
): GruposDeCandidatos {
  const candidatos: Candidato[] = musicos.map((musico) => {
    const doInstrumento = musico.instrumentos
      .filter((i) => funcao.instrumentos.includes(i.instrumento_id))
      .sort((a, b) => (PESO_NIVEL[a.nivel!] ?? 9) - (PESO_NIVEL[b.nivel!] ?? 9))[0]

    const tocaInstrumento = Boolean(doInstrumento) || funcao.instrumentos.length === 0

    return {
      musico,
      nivel: doInstrumento?.nivel ?? null,
      ordem:
        musico.ordemPorFuncao[funcao.id] ??
        doInstrumento?.ordem ??
        ('indisponivel' as OrdemEscala),
      tocaInstrumento,
      avisos: avisosDoCandidato(musico, funcao, evento, escalacoes, tocaInstrumento),
    }
  })

  const ordenar = (a: Candidato, b: Candidato) =>
    Number(b.tocaInstrumento) - Number(a.tocaInstrumento) ||
    PESO_ORDEM[a.ordem] - PESO_ORDEM[b.ordem] ||
    (PESO_NIVEL[a.nivel!] ?? 9) - (PESO_NIVEL[b.nivel!] ?? 9) ||
    a.musico.nome.localeCompare(b.musico.nome, 'pt-BR')

  const por = (r: RespostaDisponibilidade | null) =>
    candidatos.filter((c) => c.musico.resposta === r).sort(ordenar)

  return {
    podem: por('sim'),
    sePrecisar: por('se_precisar'),
    semResposta: por(null),
    naoPodem: por('nao'),
  }
}
