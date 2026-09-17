'use client'

import { useState } from 'react'
import { Icone, type NomeIcone } from '@/components/icone'
import { AjusteDisponibilidade } from './ajuste-disponibilidade'
import { dataCurta } from '@/lib/datas'
import { RESPOSTA_LABEL, nomeDoEvento, type RespostaDisponibilidade } from '@/lib/tipos'
import type { DataDaFicha } from '@/lib/dados-musico'

const ICONE_DA_RESPOSTA: Record<RespostaDisponibilidade, NomeIcone> = {
  sim: 'sim',
  se_precisar: 'sePrecisar',
  nao: 'nao',
}

const COR_DA_RESPOSTA: Record<RespostaDisponibilidade, string> = {
  sim: 'text-lima',
  se_precisar: 'text-roxo-claro',
  nao: 'text-muted-foreground',
}

/**
 * As datas de um músico, com o ajuste de resposta em cada uma.
 *
 * `ajustavel` é falso no histórico: mudar a resposta de um culto que já
 * aconteceu não muda nada e só sujaria o registro.
 */
export function DatasDaFicha({
  datas,
  musicoId,
  slug,
  nome,
  ajustavel,
}: {
  datas: DataDaFicha[]
  musicoId: string
  slug: string
  nome: string
  ajustavel: boolean
}) {
  const [alvo, setAlvo] = useState<DataDaFicha | null>(null)

  return (
    <div className="space-y-2">
      {datas.map((d) => {
        const { evento, resposta, escalado } = d
        const titular = escalado.find((e) => e.tipo === 'titular')
        const planoB = escalado.find((e) => e.tipo === 'plano_b')

        return (
          <div key={evento.id} className="border-border rounded-xl border p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium capitalize">
                  {dataCurta(evento.data)}
                  <span className="text-muted-foreground ml-2 font-normal capitalize">
                    {nomeDoEvento(evento)}
                  </span>
                </p>

                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  {resposta ? (
                    <span
                      className={`flex items-center gap-1.5 ${COR_DA_RESPOSTA[resposta]}`}
                    >
                      <Icone
                        nome={ICONE_DA_RESPOSTA[resposta]}
                        className="h-3 w-3"
                      />
                      {RESPOSTA_LABEL[resposta].curto}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">sem resposta</span>
                  )}

                  {resposta && resposta !== 'nao' && evento.hora_passagem && (
                    <span className="text-muted-foreground">
                      · {d.passagemSom ? 'passa som' : 'não passa som'}
                    </span>
                  )}

                  {titular && (
                    <span className="bg-lima/15 text-lima rounded px-1.5 py-0.5">
                      escalado · {titular.funcao.toLowerCase()}
                    </span>
                  )}
                  {planoB && (
                    <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                      plano B · {planoB.funcao.toLowerCase()}
                    </span>
                  )}
                </p>

                {d.observacao && (
                  <p className="text-foreground/80 mt-1.5 text-xs italic">
                    “{d.observacao}”
                  </p>
                )}

                {d.ajustadoPor && (
                  <p className="text-muted-foreground mt-1.5 text-xs">
                    Alterado pela gestão: {d.motivoAjuste}
                  </p>
                )}
              </div>

              {ajustavel && (
                <button
                  type="button"
                  onClick={() => setAlvo(d)}
                  className="border-border hover:bg-accent text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors"
                >
                  <Icone nome="editar" className="h-3 w-3" />
                  ajustar
                </button>
              )}
            </div>
          </div>
        )
      })}

      {alvo && (
        <AjusteDisponibilidade
          aberto
          onFechar={() => setAlvo(null)}
          musicoId={musicoId}
          slug={slug}
          nome={nome}
          eventoId={alvo.evento.id}
          data={alvo.evento.data}
          horaPassagem={alvo.evento.hora_passagem}
          respostaAtual={alvo.resposta}
          passagemAtual={alvo.passagemSom}
        />
      )}
    </div>
  )
}
