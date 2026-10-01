'use client'

import { useEffect, useRef } from 'react'
import { COR } from '../ui'
import { useDica } from './dica'

const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
export const rotuloMes = (chave: string) => `${MES[Number(chave.slice(5, 7)) - 1]}/${chave.slice(2, 4)}`
/** No eixo: só o mês, com o ano no primeiro e em janeiro, para caber no celular. */
const rotuloEixo = (chave: string, i: number) => (i === 0 || chave.endsWith('-01') ? rotuloMes(chave) : MES[Number(chave.slice(5, 7)) - 1])

/**
 * Pessoas diferentes que tocaram em cada mês (30/09/2026). Uma série só,
 * em colunas finas que nascem da mesma base; o valor vai escrito no topo só
 * do maior mês e do último (o resto fica no eixo e no balão). É o
 * termômetro do rodízio: coluna baixa num mês cheio de datas quer dizer que
 * as mesmas pessoas seguraram tudo.
 */
export function ColunasMes({ meses }: { meses: { mes: string; eventos: number; pessoas: number }[] }) {
  const { caixa, mostrar, mostrarNoElemento, esconder, balao } = useDica()
  const max = Math.max(1, ...meses.map((m) => m.pessoas))
  const teto = Math.ceil(max / 5) * 5
  const marcas = [0, teto / 2, teto]
  const indiceMax = meses.findIndex((m) => m.pessoas === max)
  const ALTURA = 180
  // No celular os meses não cabem e a caixa rola: começa no fim, com o mês atual à vista.
  const rolagem = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (rolagem.current) rolagem.current.scrollLeft = rolagem.current.scrollWidth
  }, [])

  return (
    <div ref={caixa} className="relative" onPointerLeave={esconder}>
      <div className="flex gap-3">
        <div className="text-muted-foreground relative w-6 shrink-0 text-right text-[11px] tabular-nums" style={{ height: ALTURA }}>
          {marcas.map((v) => (
            <span key={v} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - v / teto) * 100}%` }}>
              {v}
            </span>
          ))}
        </div>
        <div ref={rolagem} className="-mr-2 min-w-0 flex-1 overflow-x-auto pr-2 pb-1">
          <div className="relative" style={{ height: ALTURA, minWidth: meses.length * 30 }}>
            {marcas.map((v) => (
              <div
                key={v}
                className="absolute inset-x-0 border-t border-white/[0.06]"
                style={{ top: `${(1 - v / teto) * 100}%` }}
              />
            ))}
            <div className="absolute inset-0 flex items-end justify-between gap-1.5">
              {meses.map((m, i) => {
                const conteudo = {
                  valor: `${m.pessoas} ${m.pessoas === 1 ? 'pessoa' : 'pessoas'}`,
                  rotulo: rotuloMes(m.mes),
                  detalhe: `${m.eventos} ${m.eventos === 1 ? 'data' : 'datas'} no mês`,
                }
                const rotulado = i === indiceMax || i === meses.length - 1
                return (
                  <div key={m.mes} className="relative flex h-full flex-1 flex-col items-center justify-end">
                    {rotulado && m.pessoas > 0 && (
                      <span className="mb-1 text-[11px] font-semibold tabular-nums">{m.pessoas}</span>
                    )}
                    <div
                      tabIndex={0}
                      role="img"
                      aria-label={`${rotuloMes(m.mes)}: ${m.pessoas} pessoas em ${m.eventos} datas`}
                      onPointerMove={(e) => mostrar(e, conteudo)}
                      onFocus={(e) => mostrarNoElemento(e.currentTarget, conteudo)}
                      onBlur={esconder}
                      className="w-full max-w-6 rounded-t-[4px] outline-none transition-opacity hover:opacity-80 focus-visible:opacity-80"
                      style={{ height: `${(m.pessoas / teto) * 100}%`, minHeight: m.pessoas ? 2 : 0, background: COR.sim }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
          <div className="mt-2 flex justify-between gap-1.5" style={{ minWidth: meses.length * 30 }}>
            {meses.map((m, i) => (
              <span key={m.mes} className="text-muted-foreground flex-1 text-center text-[10px] whitespace-nowrap tabular-nums">
                {rotuloEixo(m.mes, i)}
              </span>
            ))}
          </div>
        </div>
      </div>
      {balao}
    </div>
  )
}
