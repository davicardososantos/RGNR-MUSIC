import type {
  EscalacaoAtual,
  FuncaoDaEscala,
  MusicoParaEscala,
} from '@/lib/candidatos'
import type { NivelTecnico, TipoEvento } from '@/lib/tipos'

/**
 * O checklist do `_modelo-escala.md`, verificado sozinho enquanto a escala
 * é montada.
 *
 * D12: isto **informa, não bloqueia**. Nada aqui impede publicar, e nenhuma
 * checagem pede justificativa. É a lista que a liderança já conferia na mão,
 * agora conferida pelo app.
 */

export type Checagem = {
  id: string
  titulo: string
  estado: 'ok' | 'atencao' | 'pendente'
  detalhe: string
}

const ANCORA: NivelTecnico[] = ['top', 'avancado']

type Contexto = {
  evento: { tipo: TipoEvento }
  funcoes: FuncaoDaEscala[]
  musicos: MusicoParaEscala[]
  escalacoes: EscalacaoAtual[]
}

function montarIndice({ musicos, escalacoes, funcoes }: Contexto) {
  const porId = new Map(musicos.map((m) => [m.id, m]))
  const titulares = escalacoes.filter((e) => e.tipo === 'titular')

  const escalados = titulares
    .map((e) => {
      const musico = porId.get(e.musico_id)
      const funcao = funcoes.find((f) => f.id === e.funcao_id)
      const doInstrumento = musico?.instrumentos.find((i) =>
        funcao?.instrumentos.includes(i.instrumento_id),
      )
      return musico && funcao
        ? { musico, funcao, nivel: doInstrumento?.nivel ?? null }
        : null
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  return { escalados, titulares }
}

export function checarEscala(ctx: Contexto): Checagem[] {
  const { escalados } = montarIndice(ctx)
  const fire = ctx.evento.tipo === 'fire'
  const checagens: Checagem[] = []

  const emFuncoes = (ids: string[]) =>
    escalados.filter((e) => ids.includes(e.funcao.id))

  // 1. Funções obrigatórias
  const obrigatorias = ctx.funcoes.filter((f) => f.obrigatoria)
  const vazias = obrigatorias.filter(
    (f) => !escalados.some((e) => e.funcao.id === f.id),
  )
  checagens.push({
    id: 'obrigatorias',
    titulo: 'Funções obrigatórias preenchidas',
    estado: vazias.length === 0 ? 'ok' : 'pendente',
    detalhe:
      vazias.length === 0
        ? `Todas as ${obrigatorias.length} preenchidas`
        : `Falta: ${vazias.map((f) => f.nome).join(', ')}`,
  })

  // 2. Âncora na base rítmica (regras §2.1)
  const base = emFuncoes(['baixo', 'bateria'])
  const ancoraBase = base.some((e) => e.nivel && ANCORA.includes(e.nivel))
  checagens.push({
    id: 'ancora-ritmica',
    titulo: 'Âncora na base rítmica',
    estado: base.length === 0 ? 'pendente' : ancoraBase ? 'ok' : 'atencao',
    detalhe: ancoraBase
      ? base
          .filter((e) => e.nivel && ANCORA.includes(e.nivel))
          .map((e) => e.musico.nome)
          .join(', ')
      : 'Ninguém Top ou Avançado em baixo/bateria',
  })

  // 3. Âncora nas harmonias
  const harmonias = emFuncoes([
    'teclado_base',
    'teclado_aux',
    'guitarra_1',
    'guitarra_2',
    'violao',
  ])
  const ancoraHarmonia = harmonias.some((e) => e.nivel && ANCORA.includes(e.nivel))
  checagens.push({
    id: 'ancora-harmonia',
    titulo: 'Âncora nas harmonias',
    estado: harmonias.length === 0 ? 'pendente' : ancoraHarmonia ? 'ok' : 'atencao',
    detalhe: ancoraHarmonia
      ? harmonias
          .filter((e) => e.nivel && ANCORA.includes(e.nivel))
          .map((e) => e.musico.nome)
          .join(', ')
      : 'Ninguém Top ou Avançado em teclado/guitarra/violão',
  })

  // 4. Alguma harmonia de corda
  const cordas = emFuncoes(['guitarra_1', 'guitarra_2', 'violao'])
  checagens.push({
    id: 'harmonia-corda',
    titulo: 'Guitarra ou violão na escala',
    estado: cordas.length > 0 ? 'ok' : 'atencao',
    detalhe:
      cordas.length > 0
        ? cordas.map((e) => `${e.musico.nome} (${e.funcao.nome.toLowerCase()})`).join(', ')
        : 'Nenhuma das duas. O violão deixou de ser obrigatório, mas a escala ficaria só com teclado nas harmonias',
  })

  // 5. Iniciante sem cobertura (regras §2.2)
  const iniciantes = escalados.filter((e) => e.nivel === 'iniciante')
  const temCobertura = escalados.some((e) => e.nivel && ANCORA.includes(e.nivel))
  checagens.push({
    id: 'iniciante',
    titulo: 'Iniciante com cobertura',
    estado:
      iniciantes.length === 0 ? 'ok' : temCobertura ? 'ok' : 'atencao',
    detalhe:
      iniciantes.length === 0
        ? 'Nenhum iniciante escalado'
        : temCobertura
          ? `${iniciantes.map((e) => e.musico.nome).join(', ')} com gente acima do nível junto`
          : `${iniciantes.map((e) => e.musico.nome).join(', ')} sem ninguém acima do nível`,
  })

  // 6. Plano B do baixo (regras §4.2) — só culto
  if (!fire) {
    const planoB = ctx.escalacoes.some(
      (e) => e.funcao_id === 'baixo' && e.tipo === 'plano_b',
    )
    checagens.push({
      id: 'plano-b-baixo',
      titulo: 'Plano B do baixo nomeado',
      estado: planoB ? 'ok' : 'pendente',
      detalhe: planoB
        ? 'Nomeado'
        : 'O baixo é a função que menos perdoa erro. Sempre nomear um plano B',
    })
  }

  // 7. Acúmulo de função (regras §4.3)
  const contagem = new Map<string, string[]>()
  for (const e of escalados) {
    contagem.set(e.musico.id, [...(contagem.get(e.musico.id) ?? []), e.funcao.id])
  }
  const acumulando = [...contagem.entries()]
    .filter(([, fs]) => fs.length > 1)
    .filter(([, fs]) => !(fs.length === 2 && fs.includes('bateria') && fs.includes('click_vs')))
  checagens.push({
    id: 'acumulo',
    titulo: 'Ninguém acumulando função',
    estado: acumulando.length === 0 ? 'ok' : 'atencao',
    detalhe:
      acumulando.length === 0
        ? 'Click e VS com a bateria é o padrão da casa, não conta'
        : acumulando
            .map(([id]) => ctx.musicos.find((m) => m.id === id)?.nome)
            .join(', '),
  })

  // 8. Um líder fora do palco (regras §4.4)
  const lideresEscalados = escalados.filter((e) => e.musico.ehLider)
  const lideres = ctx.musicos.filter((m) => m.ehLider)
  checagens.push({
    id: 'lider-livre',
    titulo: 'Um líder fora do palco',
    estado: lideresEscalados.length < lideres.length ? 'ok' : 'atencao',
    detalhe:
      lideresEscalados.length < lideres.length
        ? 'Tem líder livre para acompanhar de fora'
        : 'Davi e André os dois no palco',
  })

  // 9. Passagem de som (regras §3.5)
  const semSom = escalados.filter(
    (e) => e.musico.resposta !== null && !e.musico.passagemSom,
  )
  checagens.push({
    id: 'passagem-som',
    titulo: 'Todos na passagem de som',
    estado: semSom.length === 0 ? 'ok' : 'atencao',
    detalhe:
      semSom.length === 0
        ? 'Todo mundo confirmou'
        : `${semSom.map((e) => e.musico.nome).join(', ')} não confirmou a passagem`,
  })

  // 10. Restrição vigente (regras §2.6)
  const comRestricao = escalados.filter((e) => e.musico.status === 'restricao')
  if (comRestricao.length > 0) {
    checagens.push({
      id: 'restricao',
      titulo: 'Alguém com restrição vigente',
      estado: 'atencao',
      detalhe: comRestricao.map((e) => e.musico.nome).join(', '),
    })
  }

  return checagens
}
