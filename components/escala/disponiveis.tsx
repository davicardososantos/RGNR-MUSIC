'use client'

import { useMemo, useState } from 'react'
import { Icone } from '@/components/icone'
import { AjusteDisponibilidade } from '@/components/admin/ajuste-disponibilidade'
import type { EscalacaoAtual, FuncaoDaEscala, MusicoParaEscala } from '@/lib/candidatos'
import {
  NIVEL_LABEL,
  PESO_NIVEL,
  type Evento,
  type Instrumento,
} from '@/lib/tipos'

/**
 * Quem dá para chamar nesta data, por instrumento.
 *
 * O montador mostra a disponibilidade uma função de cada vez, dentro do
 * diálogo de escolha. Isso responde "quem ponho no baixo", mas não responde
 * "quem eu tenho hoje", que é a pergunta de quem abre a data pela primeira
 * vez e precisa saber se a escala fecha.
 */
export function Disponiveis({
  evento,
  musicos,
  funcoes,
  escalacoes,
  instrumentos,
}: {
  evento: Evento
  musicos: MusicoParaEscala[]
  funcoes: FuncaoDaEscala[]
  escalacoes: EscalacaoAtual[]
  instrumentos: Instrumento[]
}) {
  const [aberto, setAberto] = useState(false)
  const [alvo, setAlvo] = useState<MusicoParaEscala | null>(null)

  const escaladoEm = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const e of escalacoes) {
      const funcao = funcoes.find((f) => f.id === e.funcao_id)
      if (!funcao) continue
      const atual = mapa.get(e.musico_id)
      const rotulo = e.tipo === 'plano_b' ? `${funcao.nome} (plano B)` : funcao.nome
      mapa.set(e.musico_id, atual ? `${atual}, ${rotulo}` : rotulo)
    }
    return mapa
  }, [escalacoes, funcoes])

  const porInstrumento = useMemo(
    () =>
      instrumentos
        .map((instrumento) => ({
          instrumento,
          gente: musicos
            .filter(
              (m) =>
                (m.resposta === 'sim' || m.resposta === 'se_precisar') &&
                m.instrumentos.some((i) => i.instrumento_id === instrumento.id),
            )
            .sort((a, b) => {
              const nivel = (m: MusicoParaEscala) =>
                PESO_NIVEL[
                  m.instrumentos.find((i) => i.instrumento_id === instrumento.id)
                    ?.nivel ?? 'iniciante'
                ] ?? 9
              return (
                Number(a.resposta === 'se_precisar') -
                  Number(b.resposta === 'se_precisar') ||
                nivel(a) - nivel(b) ||
                a.nome.localeCompare(b.nome, 'pt-BR')
              )
            }),
        }))
        .filter((g) => g.gente.length > 0),
    [instrumentos, musicos],
  )

  const naoPodem = musicos.filter((m) => m.resposta === 'nao')
  const semResposta = musicos.filter((m) => m.resposta === null)
  const disponiveis = musicos.filter(
    (m) => m.resposta === 'sim' || m.resposta === 'se_precisar',
  )

  // Quem está disponível mas ainda não tem instrumento no cadastro cairia
  // fora de todos os grupos e sumiria da tela justamente sendo alguém que
  // respondeu que pode. A função Comunicação, por exemplo, não tem
  // instrumento nenhum.
  const semInstrumento = disponiveis.filter((m) => m.instrumentos.length === 0)

  return (
    <div className="border-border rounded-xl border">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="hover:bg-accent/40 flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors"
      >
        <span className="flex items-center gap-2.5 text-sm font-medium">
          <Icone nome="pessoas" className="text-lima h-4 w-4" />
          Quem dá para chamar
        </span>
        <span className="text-muted-foreground flex items-center gap-2 text-xs">
          {disponiveis.length} disponíveis
          <Icone
            nome="expandir"
            className={`h-3 w-3 transition-transform ${aberto ? '' : '-rotate-90'}`}
          />
        </span>
      </button>

      {aberto && (
        <div className="space-y-5 border-t px-4 py-4">
          {porInstrumento.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Ninguém marcou que pode nessa data ainda.
            </p>
          ) : (
            porInstrumento.map(({ instrumento, gente }) => (
              <section key={instrumento.id} className="space-y-2">
                <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {instrumento.nome} · {gente.length}
                </h3>
                <div className="space-y-1.5">
                  {gente.map((m) => {
                    const nivel = m.instrumentos.find(
                      (i) => i.instrumento_id === instrumento.id,
                    )?.nivel
                    const ocupado = escaladoEm.get(m.id)

                    return (
                      <div
                        key={m.id}
                        className="border-border flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
                      >
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 text-sm">
                            <Icone
                              nome={m.resposta === 'sim' ? 'sim' : 'sePrecisar'}
                              className={`h-3 w-3 shrink-0 ${
                                m.resposta === 'sim' ? 'text-lima' : 'text-roxo-claro'
                              }`}
                            />
                            <span className="truncate">{m.nome}</span>
                          </span>
                          <span className="text-muted-foreground block text-xs">
                            {nivel ? NIVEL_LABEL[nivel] : 'sem nível'}
                            {!m.passagemSom && ' · não passa som'}
                            {ocupado && ` · já em ${ocupado.toLowerCase()}`}
                          </span>
                        </span>

                        <button
                          type="button"
                          onClick={() => setAlvo(m)}
                          aria-label={`Ajustar resposta de ${m.nome}`}
                          className="text-muted-foreground hover:text-foreground shrink-0 p-1.5"
                        >
                          <Icone nome="editar" className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </section>
            ))
          )}

          {semInstrumento.length > 0 && (
            <section className="space-y-1">
              <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Podem, sem instrumento no cadastro · {semInstrumento.length}
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {semInstrumento.map((m) => m.nome).join(', ')}
              </p>
            </section>
          )}

          {naoPodem.length > 0 && (
            <section className="space-y-1">
              <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Não podem · {naoPodem.length}
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {naoPodem.map((m) => m.nome).join(', ')}
              </p>
            </section>
          )}

          {semResposta.length > 0 && (
            <section className="space-y-1">
              <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Sem resposta · {semResposta.length}
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {semResposta.map((m) => m.nome).join(', ')}
              </p>
            </section>
          )}
        </div>
      )}

      {alvo && (
        <AjusteDisponibilidade
          aberto
          onFechar={() => setAlvo(null)}
          musicoId={alvo.id}
          slug={alvo.slug}
          nome={alvo.nome}
          eventoId={evento.id}
          data={evento.data}
          horaPassagem={evento.hora_passagem}
          respostaAtual={alvo.resposta}
          passagemAtual={alvo.passagemSom}
        />
      )}
    </div>
  )
}
