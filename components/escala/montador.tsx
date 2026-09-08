'use client'

import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Icone } from '@/components/icone'
import { SeletorMusico } from './seletor-musico'
import { PainelChecagem } from './painel-checagem'
import { desescalar, escalar } from '@/actions/escala'
import { checarEscala } from '@/lib/regras'
import {
  type EscalacaoAtual,
  type FuncaoDaEscala,
  type MusicoParaEscala,
} from '@/lib/candidatos'
import { NIVEL_LABEL, STATUS_LABEL, type Evento } from '@/lib/tipos'

type Alvo = { funcao: FuncaoDaEscala; tipo: 'titular' | 'plano_b' }

export function Montador({
  evento,
  funcoes,
  musicos,
  escalacoesIniciais,
}: {
  evento: Evento
  funcoes: FuncaoDaEscala[]
  musicos: MusicoParaEscala[]
  escalacoesIniciais: EscalacaoAtual[]
}) {
  const [escalacoes, setEscalacoes] = useState(escalacoesIniciais)
  const [alvo, setAlvo] = useState<Alvo | null>(null)
  const [, iniciar] = useTransition()

  const porId = useMemo(() => new Map(musicos.map((m) => [m.id, m])), [musicos])

  const checagens = useMemo(
    () => checarEscala({ evento, funcoes, musicos, escalacoes }),
    [evento, funcoes, musicos, escalacoes],
  )

  function ocupante(funcaoId: string, tipo: 'titular' | 'plano_b') {
    const e = escalacoes.find((x) => x.funcao_id === funcaoId && x.tipo === tipo)
    return e ? { escalacao: e, musico: porId.get(e.musico_id) } : null
  }

  function colocar(funcao: FuncaoDaEscala, tipo: 'titular' | 'plano_b', musicoId: string) {
    // Atualiza a tela na hora: a checagem tem que reagir enquanto se monta.
    setEscalacoes((atual) => [
      ...atual.filter((e) => !(e.funcao_id === funcao.id && e.tipo === tipo)),
      { id: `tmp-${funcao.id}-${tipo}`, funcao_id: funcao.id, musico_id: musicoId, tipo },
    ])

    iniciar(async () => {
      try {
        await escalar({
          eventoId: evento.id,
          data: evento.data,
          funcaoId: funcao.id,
          musicoId,
          tipo,
        })
      } catch (e) {
        setEscalacoes(escalacoes)
        toast.error(e instanceof Error ? e.message : 'Não consegui escalar')
      }
    })
  }

  function tirar(funcaoId: string, tipo: 'titular' | 'plano_b') {
    const antes = escalacoes
    setEscalacoes((atual) =>
      atual.filter((e) => !(e.funcao_id === funcaoId && e.tipo === tipo)),
    )

    iniciar(async () => {
      try {
        await desescalar({ eventoId: evento.id, data: evento.data, funcaoId, tipo })
      } catch (e) {
        setEscalacoes(antes)
        toast.error(e instanceof Error ? e.message : 'Não consegui remover')
      }
    })
  }

  function Vaga({
    funcao,
    tipo,
  }: {
    funcao: FuncaoDaEscala
    tipo: 'titular' | 'plano_b'
  }) {
    const atual = ocupante(funcao.id, tipo)
    const musico = atual?.musico

    if (!musico) {
      return (
        <button
          type="button"
          onClick={() => setAlvo({ funcao, tipo })}
          className="border-border text-muted-foreground hover:bg-accent hover:text-foreground flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm transition-colors"
        >
          <Icone nome="adicionar" className="h-3 w-3" />
          {tipo === 'plano_b' ? 'nomear plano B' : 'escalar'}
        </button>
      )
    }

    const nivel = musico.instrumentos.find((i) =>
      funcao.instrumentos.includes(i.instrumento_id),
    )?.nivel
    const status = STATUS_LABEL[musico.status]

    return (
      <div
        className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 ${
          tipo === 'plano_b' ? 'border-border bg-muted/30' : 'border-lima/40 bg-lima/5'
        }`}
      >
        <button
          type="button"
          onClick={() => setAlvo({ funcao, tipo })}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-sm font-medium">{musico.nome}</p>
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Icone nome={status.icone} className="h-2.5 w-2.5" />
            {nivel ? NIVEL_LABEL[nivel] : 'sem nível'}
            {musico.resposta === 'se_precisar' && ' · topou cobrir'}
            {musico.resposta === 'nao' && ' · disse que não pode'}
            {musico.resposta === null && ' · não respondeu'}
          </p>
        </button>
        <button
          type="button"
          onClick={() => tirar(funcao.id, tipo)}
          aria-label={`Tirar ${musico.nome}`}
          className="text-muted-foreground hover:text-foreground shrink-0 p-1"
        >
          <Icone nome="nao" className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {funcoes.map((funcao) => (
          <div key={funcao.id} className="border-border rounded-xl border p-3.5">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-medium">{funcao.nome}</h3>
              {funcao.obrigatoria && (
                <span className="text-muted-foreground text-xs">obrigatória</span>
              )}
            </div>

            <Vaga funcao={funcao} tipo="titular" />

            {funcao.planoBObrigatorio && (
              <div className="mt-2">
                <Vaga funcao={funcao} tipo="plano_b" />
              </div>
            )}
          </div>
        ))}
      </div>

      <PainelChecagem checagens={checagens} />

      {alvo && (
        <SeletorMusico
          aberto
          onFechar={() => setAlvo(null)}
          funcao={alvo.funcao}
          tipo={alvo.tipo}
          evento={evento}
          musicos={musicos}
          escalacoes={escalacoes}
          onEscolher={(musicoId) => colocar(alvo.funcao, alvo.tipo, musicoId)}
        />
      )}
    </div>
  )
}
