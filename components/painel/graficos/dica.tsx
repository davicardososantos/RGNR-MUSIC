'use client'

import { useCallback, useRef, useState, type ReactNode } from 'react'

export type ConteudoDica = { valor: ReactNode; rotulo: ReactNode; detalhe?: ReactNode }

/**
 * O balão dos gráficos. Segue o ponteiro, aparece também no foco do
 * teclado, e nunca é o único lugar de um valor (a regra do método de
 * dataviz: o balão enfeita, não esconde).
 */
export function useDica() {
  const caixa = useRef<HTMLDivElement>(null)
  const [dica, setDica] = useState<{ x: number; y: number; conteudo: ConteudoDica } | null>(null)

  const mostrar = useCallback((alvo: { clientX: number; clientY: number }, conteudo: ConteudoDica) => {
    const r = caixa.current?.getBoundingClientRect()
    if (!r) return
    setDica({ x: alvo.clientX - r.left, y: alvo.clientY - r.top, conteudo })
  }, [])

  /** Para o foco do teclado: ancora no centro do elemento. */
  const mostrarNoElemento = useCallback((el: HTMLElement, conteudo: ConteudoDica) => {
    const e = el.getBoundingClientRect()
    mostrar({ clientX: e.left + e.width / 2, clientY: e.top }, conteudo)
  }, [mostrar])

  const esconder = useCallback(() => setDica(null), [])

  const balao = dica && (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-20 max-w-64 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-xl border border-white/10 bg-[#16161d]/95 px-3 py-2 text-sm shadow-xl backdrop-blur"
      style={{ left: dica.x, top: dica.y }}
    >
      <p className="font-semibold tabular-nums">{dica.conteudo.valor}</p>
      <p className="text-muted-foreground text-xs">{dica.conteudo.rotulo}</p>
      {dica.conteudo.detalhe && <p className="text-muted-foreground mt-1 text-xs">{dica.conteudo.detalhe}</p>}
    </div>
  )

  return { caixa, mostrar, mostrarNoElemento, esconder, balao }
}
