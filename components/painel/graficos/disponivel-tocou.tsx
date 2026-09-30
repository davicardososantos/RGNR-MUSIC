'use client'

import Link from 'next/link'
import { useState } from 'react'
import { COR } from '../ui'
import { useDica } from './dica'

export type LinhaDisponivel = { id: string; nome: string; slug: string; sim: number; tocou: number }

type Ordem = 'distancia' | 'sim' | 'tocou'

/**
 * Disse que podia × tocou, pessoa a pessoa (30/09/2026).
 *
 * Duas medidas na mesma unidade (datas) e no mesmo eixo: a faixa clara é
 * quantas vezes a pessoa disse sim, a barra cheia por cima é quantas vezes
 * tocou. Mesmo tom em dois degraus, como um dumbbell. Faixa comprida com
 * barra curta = alguém disponível que quase não é chamado, o caso que some
 * sozinho: ninguém reclama, a pessoa só para de responder.
 */
export function DisponivelTocou({ linhas }: { linhas: LinhaDisponivel[] }) {
  const { caixa, mostrar, mostrarNoElemento, esconder, balao } = useDica()
  const [ordem, setOrdem] = useState<Ordem>('distancia')
  const [todos, setTodos] = useState(false)

  const max = Math.max(1, ...linhas.map((l) => Math.max(l.sim, l.tocou)))
  const ordenadas = [...linhas]
    .filter((l) => l.sim > 0 || l.tocou > 0)
    .sort((a, b) =>
      ordem === 'sim'
        ? b.sim - a.sim || a.nome.localeCompare(b.nome)
        : ordem === 'tocou'
          ? b.tocou - a.tocou || a.nome.localeCompare(b.nome)
          : b.sim - b.tocou - (a.sim - a.tocou) || b.sim - a.sim,
    )
  const visiveis = todos ? ordenadas : ordenadas.slice(0, 12)

  return (
    <div ref={caixa} className="relative" onPointerLeave={esconder}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: COR.sim, opacity: 0.3 }} />
            Disse que podia
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: COR.sim }} />
            Tocou
          </span>
        </div>
        <div className="flex gap-1 rounded-full border border-white/[0.07] bg-white/[0.03] p-1 text-xs">
          {(
            [
              ['distancia', 'Pouco chamados'],
              ['sim', 'Mais disponíveis'],
              ['tocou', 'Mais tocaram'],
            ] as const
          ).map(([id, rotulo]) => (
            <button
              key={id}
              type="button"
              onClick={() => setOrdem(id)}
              className={`h-7 rounded-full px-3 font-medium transition-colors ${
                ordem === id ? 'text-foreground bg-white/10' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {visiveis.map((l) => {
          const conteudo = {
            valor: `Tocou ${l.tocou} · disse sim ${l.sim}`,
            rotulo: l.nome,
            detalhe:
              l.sim - l.tocou >= 2 ? `${l.sim - l.tocou} vezes disponível sem ser chamado` : undefined,
          }
          return (
            <div key={l.id} className="grid grid-cols-[6.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 sm:grid-cols-[9rem_minmax(0,1fr)_6rem]">
              <Link href={`/admin/musicos/${l.slug}`} className="truncate text-sm font-medium hover:underline">
                {l.nome}
              </Link>
              <div
                tabIndex={0}
                role="img"
                aria-label={`${l.nome}: disse sim ${l.sim} vezes, tocou ${l.tocou}`}
                onPointerMove={(e) => mostrar(e, conteudo)}
                onFocus={(e) => mostrarNoElemento(e.currentTarget, conteudo)}
                onBlur={esconder}
                className="relative h-3.5 outline-none"
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-r-[4px]"
                  style={{ width: `${(l.sim / max) * 100}%`, background: COR.sim, opacity: 0.3 }}
                />
                {l.tocou > 0 && (
                  <div
                    className="absolute inset-y-[3px] left-0 rounded-r-[4px]"
                    style={{ width: `${(l.tocou / max) * 100}%`, background: COR.sim }}
                  />
                )}
              </div>
              <p className="text-right text-sm tabular-nums">
                <span className="font-semibold">{l.tocou}</span>
                <span className="text-muted-foreground"> / {l.sim}</span>
              </p>
            </div>
          )
        })}
      </div>

      {ordenadas.length > 12 && (
        <button
          type="button"
          onClick={() => setTodos((t) => !t)}
          className="text-lima mt-4 text-sm font-medium underline-offset-4 hover:underline"
        >
          {todos ? 'Mostrar só os 12 primeiros' : `Ver todos (${ordenadas.length})`}
        </button>
      )}
      {balao}
    </div>
  )
}
