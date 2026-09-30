'use client'

import Link from 'next/link'
import { COR } from '../ui'
import { useDica } from './dica'

export type LinhaRespostas = {
  id: string
  href: string
  rotulo: string
  subrotulo: string
  sim: number
  sePrecisar: number
  nao: number
  semResposta: number
}

const SERIES = [
  { chave: 'sim', nome: 'Sim', cor: COR.sim },
  { chave: 'sePrecisar', nome: 'Se precisar', cor: COR.sePrecisar },
  { chave: 'nao', nome: 'Não', cor: COR.nao },
  { chave: 'semResposta', nome: 'Sem resposta', cor: COR.semResposta },
] as const

/**
 * Parte-do-todo por data: das pessoas da banda, quantas disseram sim, se
 * precisar, não, e quantas ainda não responderam. Barras empilhadas na
 * horizontal (cabem datas e rótulos longos no celular), 2px de respiro
 * entre os pedaços, legenda sempre presente e o "sim" rotulado na ponta,
 * que é o número que decide a escala.
 */
export function RespostasPorData({ linhas, total }: { linhas: LinhaRespostas[]; total: number }) {
  const { caixa, mostrar, mostrarNoElemento, esconder, balao } = useDica()

  return (
    <div ref={caixa} className="relative" onPointerLeave={esconder}>
      <div className="text-muted-foreground mb-5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {SERIES.map((s) => (
          <span key={s.chave} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: s.cor }} />
            {s.nome}
          </span>
        ))}
      </div>

      <div className="space-y-3">
        {linhas.map((l) => (
          <div key={l.id} className="grid grid-cols-[5.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 sm:grid-cols-[8rem_minmax(0,1fr)_5rem]">
            <Link href={l.href} className="min-w-0 hover:underline">
              <p className="truncate text-sm font-medium">{l.rotulo}</p>
              <p className="text-muted-foreground truncate text-xs">{l.subrotulo}</p>
            </Link>

            <div className="flex h-3.5 gap-[2px] overflow-hidden rounded-r-[4px]">
              {SERIES.map((s) => {
                const valor = l[s.chave]
                if (!valor) return null
                const conteudo = {
                  valor: `${valor} ${valor === 1 ? 'pessoa' : 'pessoas'}`,
                  rotulo: `${s.nome} · ${l.rotulo}`,
                  detalhe: `${Math.round((valor / total) * 100)}% da banda`,
                }
                return (
                  <div
                    key={s.chave}
                    tabIndex={0}
                    role="img"
                    aria-label={`${l.rotulo}: ${valor} ${s.nome.toLowerCase()}`}
                    onPointerMove={(e) => mostrar(e, conteudo)}
                    onFocus={(e) => mostrarNoElemento(e.currentTarget, conteudo)}
                    onBlur={esconder}
                    className="h-full outline-none transition-opacity hover:opacity-80 focus-visible:opacity-80"
                    style={{ width: `${(valor / total) * 100}%`, background: s.cor }}
                  />
                )
              })}
            </div>

            <p className="text-right text-sm tabular-nums">
              <span className="font-semibold">{l.sim}</span>
              <span className="text-muted-foreground"> podem</span>
            </p>
          </div>
        ))}
      </div>
      {balao}
    </div>
  )
}
