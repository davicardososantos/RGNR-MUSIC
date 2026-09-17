'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Icone } from '@/components/icone'
import type { LinhaRelatorio } from '@/lib/relatorios'

type Coluna = 'nome' | 'tocou' | 'sim' | 'resposta'

const COLUNAS: { chave: Coluna; rotulo: string; largura: string }[] = [
  { chave: 'nome', rotulo: 'Nome', largura: 'flex-1 text-left' },
  { chave: 'tocou', rotulo: 'Tocou', largura: 'w-14 text-right' },
  { chave: 'sim', rotulo: 'Pode', largura: 'w-14 text-right' },
  { chave: 'resposta', rotulo: 'Resp.', largura: 'w-16 text-right' },
]

export function TabelaRelatorio({
  linhas,
  respondiveis,
}: {
  linhas: LinhaRelatorio[]
  respondiveis: number
}) {
  const [coluna, setColuna] = useState<Coluna>('tocou')
  const [crescente, setCrescente] = useState(false)

  const ordenadas = useMemo(() => {
    // O divisor da taxa é o mesmo para todo mundo, então ordenar por
    // `respondidas` dá exatamente a mesma ordem que ordenar pela taxa.
    const valor = (l: LinhaRelatorio) =>
      coluna === 'tocou' ? l.tocou : coluna === 'sim' ? l.sim : l.respondidas

    return [...linhas].sort((a, b) => {
      const dif =
        coluna === 'nome'
          ? a.nome.localeCompare(b.nome, 'pt-BR')
          : valor(a) - valor(b) || a.nome.localeCompare(b.nome, 'pt-BR')
      return crescente ? dif : -dif
    })
  }, [linhas, coluna, crescente])

  function alternar(alvo: Coluna) {
    if (alvo === coluna) {
      setCrescente((c) => !c)
      return
    }
    setColuna(alvo)
    // Nome começa de A a Z; número começa do maior, que é o que se procura.
    setCrescente(alvo === 'nome')
  }

  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <div className="bg-muted/40 flex items-center gap-2 px-3.5 py-2">
        {COLUNAS.map((c) => (
          <button
            key={c.chave}
            type="button"
            onClick={() => alternar(c.chave)}
            className={`text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs font-medium tracking-wide uppercase transition-colors ${c.largura} ${
              coluna === c.chave ? 'text-foreground' : ''
            }`}
          >
            {c.chave !== 'nome' && <span className="flex-1" />}
            {c.rotulo}
            {coluna === c.chave && (
              <Icone
                nome="expandir"
                className={`h-2.5 w-2.5 ${crescente ? 'rotate-180' : ''}`}
              />
            )}
          </button>
        ))}
      </div>

      <div className="divide-border divide-y">
        {ordenadas.map((l) => (
          <Link
            key={l.id}
            href={`/admin/musicos/${l.slug}`}
            className="hover:bg-accent/40 flex items-center gap-2 px-3.5 py-2.5 text-sm transition-colors"
          >
            <span className="min-w-0 flex-1 truncate">{l.nome}</span>
            <span className="w-14 text-right tabular-nums">{l.tocou}</span>
            <span className="text-lima w-14 text-right tabular-nums">{l.sim}</span>
            <span className="text-muted-foreground w-16 text-right tabular-nums">
              {respondiveis ? Math.round((l.respondidas / respondiveis) * 100) : 0}%
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
