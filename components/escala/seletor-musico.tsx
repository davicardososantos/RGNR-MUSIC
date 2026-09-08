'use client'

import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Icone } from '@/components/icone'
import {
  candidatosParaFuncao,
  type Candidato,
  type EscalacaoAtual,
  type FuncaoDaEscala,
  type MusicoParaEscala,
} from '@/lib/candidatos'
import {
  NIVEL_LABEL,
  ORDEM_LABEL,
  PRESENCA_LABEL,
  type Evento,
} from '@/lib/tipos'

const GRUPOS = [
  { chave: 'podem', titulo: 'Podem', cor: 'text-lima' },
  { chave: 'sePrecisar', titulo: 'Se precisar', cor: 'text-roxo-claro' },
  { chave: 'semResposta', titulo: 'Ainda não responderam', cor: 'text-muted-foreground' },
  { chave: 'naoPodem', titulo: 'Não podem', cor: 'text-muted-foreground' },
] as const

function LinhaCandidato({
  candidato,
  onEscolher,
}: {
  candidato: Candidato
  onEscolher: () => void
}) {
  const { musico, nivel, ordem, tocaInstrumento, avisos } = candidato

  return (
    <button
      type="button"
      onClick={onEscolher}
      className="border-border hover:bg-accent w-full rounded-lg border px-3 py-2.5 text-left transition-colors"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className={`font-medium ${tocaInstrumento ? '' : 'text-muted-foreground'}`}>
          {musico.nome}
          {musico.ehLider && (
            <span className="text-muted-foreground ml-1.5 text-xs">líder</span>
          )}
        </span>
        <span className="text-muted-foreground shrink-0 text-xs">
          {nivel ? NIVEL_LABEL[nivel] : 'sem nível'}
        </span>
      </div>

      <p className="text-muted-foreground mt-0.5 text-xs">
        {ORDEM_LABEL[ordem]}
        {musico.presenca && ` · presença ${PRESENCA_LABEL[musico.presenca].toLowerCase()}`}
      </p>

      {musico.observacao && (
        <p className="text-foreground/80 mt-1.5 text-xs italic">“{musico.observacao}”</p>
      )}

      {avisos.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {avisos.map((a) => (
            <span
              key={a.texto}
              className={`rounded px-1.5 py-0.5 text-[11px] ${
                a.tom === 'positivo'
                  ? 'bg-lima/15 text-lima'
                  : a.tom === 'atencao'
                    ? 'bg-roxo/20 text-roxo-claro'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {a.texto}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}

export function SeletorMusico({
  aberto,
  onFechar,
  funcao,
  evento,
  musicos,
  escalacoes,
  tipo,
  onEscolher,
}: {
  aberto: boolean
  onFechar: () => void
  funcao: FuncaoDaEscala
  evento: Evento
  musicos: MusicoParaEscala[]
  escalacoes: EscalacaoAtual[]
  tipo: 'titular' | 'plano_b'
  onEscolher: (musicoId: string) => void
}) {
  const [verTodos, setVerTodos] = useState(false)

  const grupos = useMemo(
    () => candidatosParaFuncao(funcao, evento, musicos, escalacoes),
    [funcao, evento, musicos, escalacoes],
  )

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {funcao.nome}
            {tipo === 'plano_b' && ' · plano B'}
          </DialogTitle>
          <DialogDescription>
            Ordenado por quem respondeu que pode, depois pela ordem de escala da
            liderança.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {GRUPOS.map(({ chave, titulo, cor }) => {
            const todos = grupos[chave]
            if (todos.length === 0) return null

            // Quem toca o instrumento vem sempre. O resto fica atrás de um
            // clique — visível, nunca escondido (D12).
            const doInstrumento = todos.filter((c) => c.tocaInstrumento)
            const outros = todos.filter((c) => !c.tocaInstrumento)
            const mostrar = verTodos ? todos : doInstrumento

            if (mostrar.length === 0 && outros.length === 0) return null

            return (
              <section key={chave} className="space-y-2">
                <h3 className={`text-xs font-medium tracking-wide uppercase ${cor}`}>
                  {titulo} · {todos.length}
                </h3>

                {mostrar.length === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    Ninguém que toca {funcao.nome.toLowerCase()}.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {mostrar.map((c) => (
                      <LinhaCandidato
                        key={c.musico.id}
                        candidato={c}
                        onEscolher={() => {
                          onEscolher(c.musico.id)
                          onFechar()
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>
            )
          })}

          <button
            type="button"
            onClick={() => setVerTodos((v) => !v)}
            className="text-muted-foreground hover:text-foreground w-full py-2 text-center text-sm underline-offset-4 hover:underline"
          >
            {verTodos
              ? 'Mostrar só quem toca esse instrumento'
              : 'Ver todo mundo, inclusive de outros instrumentos'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
