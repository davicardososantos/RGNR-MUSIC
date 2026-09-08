import 'server-only'
import { servico } from '@/lib/supabase/service'
import type {
  EscalacaoAtual,
  FuncaoDaEscala,
  MusicoParaEscala,
} from '@/lib/candidatos'
import type { Evento, OrdemEscala } from '@/lib/tipos'

export type DadosDaEscala = {
  evento: Evento
  funcoes: FuncaoDaEscala[]
  musicos: MusicoParaEscala[]
  escalacoes: EscalacaoAtual[]
}

export async function carregarEscala(data: string): Promise<DadosDaEscala | null> {
  const db = servico()

  const { data: evento } = await db
    .from('eventos')
    .select('*')
    .eq('data', data)
    .maybeSingle()

  if (!evento) return null

  const [
    { data: formacao },
    { data: funcoesBrutas },
    { data: funcaoInstrumentos },
    { data: musicosBrutos },
    { data: relacoes },
    { data: overrides },
    { data: disponibilidades },
    { data: escalacoes },
  ] = await Promise.all([
    db.from('formacao').select('*').eq('tipo', evento.tipo).order('ordem'),
    db.from('funcoes').select('*'),
    db.from('funcao_instrumentos').select('*'),
    db
      .from('musicos')
      .select('id, nome, status, presenca, eh_lider')
      .eq('no_formulario', true)
      .order('nome'),
    db.from('musico_instrumento').select('*').eq('ativo', true),
    db.from('musico_funcao_ordem').select('*'),
    db.from('disponibilidades').select('*').eq('evento_id', evento.id),
    db.from('escalacoes').select('id, funcao_id, musico_id, tipo').eq('evento_id', evento.id),
  ])

  const funcoes: FuncaoDaEscala[] = (formacao ?? []).map((f) => {
    const info = (funcoesBrutas ?? []).find((x) => x.id === f.funcao_id)
    return {
      id: f.funcao_id as string,
      nome: (info?.nome as string) ?? (f.funcao_id as string),
      obrigatoria: f.obrigatoria as boolean,
      planoBObrigatorio: f.plano_b_obrigatorio as boolean,
      ordem: f.ordem as number,
      instrumentos: (funcaoInstrumentos ?? [])
        .filter((fi) => fi.funcao_id === f.funcao_id)
        .map((fi) => fi.instrumento_id as string),
    }
  })

  const musicos: MusicoParaEscala[] = (musicosBrutos ?? []).map((m) => {
    const disp = (disponibilidades ?? []).find((d) => d.musico_id === m.id)
    const ordemPorFuncao: Record<string, OrdemEscala> = {}
    for (const o of (overrides ?? []).filter((o) => o.musico_id === m.id)) {
      ordemPorFuncao[o.funcao_id as string] = o.ordem as OrdemEscala
    }

    return {
      id: m.id as string,
      nome: m.nome as string,
      status: m.status,
      presenca: m.presenca,
      ehLider: m.eh_lider as boolean,
      instrumentos: (relacoes ?? [])
        .filter((r) => r.musico_id === m.id)
        .map((r) => ({
          instrumento_id: r.instrumento_id as string,
          nivel: r.nivel,
          ordem: r.ordem as OrdemEscala,
          principal: r.principal as boolean,
        })),
      ordemPorFuncao,
      resposta: disp?.resposta ?? null,
      passagemSom: disp?.passagem_som ?? false,
      observacao: disp?.observacao ?? null,
    }
  })

  return {
    evento: evento as Evento,
    funcoes,
    musicos,
    escalacoes: (escalacoes ?? []) as EscalacaoAtual[],
  }
}

export async function listarDatasDeEventos(): Promise<string[]> {
  const { data } = await servico().from('eventos').select('data').order('data')
  return (data ?? []).map((e) => e.data as string)
}
