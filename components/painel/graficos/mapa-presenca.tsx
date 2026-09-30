'use client'

import Link from 'next/link'
import { useState } from 'react'
import { RAMPA } from '../ui'
import { rotuloMes } from './colunas-mes'
import { useDica } from './dica'

type Pessoa = { id: string; nome: string; slug: string; atual: boolean; total: number; porMes: Record<string, number> }

/**
 * Presença mês a mês (30/09/2026): cada linha é uma pessoa, cada coluna um
 * mês, e a célula clareia quanto mais vezes ela tocou. Mesma rampa de um tom
 * do mapa de cobertura. Mostra de relance quem sumiu, quem chegou e quem
 * está segurando tudo. Quem já saiu da banda aparece apagado, e dá para
 * esconder.
 */
export function MapaPresenca({ meses, pessoas }: { meses: string[]; pessoas: Pessoa[] }) {
  const { caixa, mostrar, mostrarNoElemento, esconder, balao } = useDica()
  const [comAntigos, setComAntigos] = useState(false)
  const visiveis = pessoas.filter((p) => comAntigos || p.atual)
  const antigos = pessoas.filter((p) => !p.atual).length

  return (
    <div ref={caixa} className="relative" onPointerLeave={esconder}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
          <span className="flex items-center gap-1.5">
            Vezes no mês
            {RAMPA.map((cor, i) => (
              <span key={cor} className="flex items-center gap-1">
                <span className="h-3 w-4 rounded-[3px]" style={{ background: cor }} />
                <span className="tabular-nums">{i === 4 ? '5+' : i + 1}</span>
              </span>
            ))}
          </span>
        </div>
        {antigos > 0 && (
          <button
            type="button"
            onClick={() => setComAntigos((v) => !v)}
            className="text-muted-foreground hover:text-foreground rounded-full border border-white/10 px-3 py-1 text-xs font-medium transition-colors"
          >
            {comAntigos ? 'Só a banda de hoje' : `Mostrar quem já saiu (${antigos})`}
          </button>
        )}
      </div>

      <div className="-mx-5 overflow-x-auto px-5 pb-2 lg:mx-0 lg:px-0">
        <table className="w-full border-separate border-spacing-[2px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-[#0c0c11]" />
              {meses.map((m) => (
                <th key={m} scope="col" className="min-w-9 pb-1.5 text-[10px] font-normal text-muted-foreground tabular-nums">
                  {rotuloMes(m)}
                </th>
              ))}
              <th className="text-muted-foreground pb-1.5 pl-2 text-right text-[10px] font-normal">total</th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((p) => (
              <tr key={p.id}>
                <th scope="row" className="sticky left-0 z-10 bg-[#0c0c11] pr-3 text-left">
                  <Link
                    href={`/admin/musicos/${p.slug}`}
                    className={`block max-w-32 truncate text-sm font-medium hover:underline ${p.atual ? '' : 'text-muted-foreground'}`}
                  >
                    {p.nome}
                  </Link>
                </th>
                {meses.map((m) => {
                  const n = p.porMes[m] ?? 0
                  const conteudo = {
                    valor: n ? `Tocou ${n} ${n === 1 ? 'vez' : 'vezes'}` : 'Não tocou',
                    rotulo: `${p.nome} · ${rotuloMes(m)}`,
                  }
                  return (
                    <td key={m} className="p-0">
                      <div
                        tabIndex={0}
                        role="img"
                        aria-label={`${p.nome} em ${rotuloMes(m)}: ${n} vezes`}
                        onPointerMove={(e) => mostrar(e, conteudo)}
                        onFocus={(e) => mostrarNoElemento(e.currentTarget, conteudo)}
                        onBlur={esconder}
                        className={`h-7 rounded-md outline-none transition-transform hover:scale-110 focus-visible:scale-110 ${
                          n ? '' : 'bg-white/[0.03]'
                        } ${p.atual ? '' : 'opacity-60'}`}
                        style={n ? { background: RAMPA[Math.min(n, 5) - 1] } : undefined}
                      />
                    </td>
                  )
                })}
                <td className="pl-2 text-right text-sm font-semibold tabular-nums">{p.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {balao}
    </div>
  )
}
