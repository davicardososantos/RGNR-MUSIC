'use client'

import { Icone } from '@/components/icone'
import type { Checagem } from '@/lib/regras'

const APARENCIA = {
  ok: { icone: 'sim', cor: 'text-lima' },
  atencao: { icone: 'atencao', cor: 'text-roxo-claro' },
  pendente: { icone: 'nao', cor: 'text-muted-foreground' },
} as const

export function PainelChecagem({ checagens }: { checagens: Checagem[] }) {
  const pendentes = checagens.filter((c) => c.estado !== 'ok').length

  return (
    <div className="border-border rounded-xl border p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="font-medium">Checagem</h2>
        <span className="text-muted-foreground text-xs">
          {pendentes === 0
            ? 'tudo conferido'
            : `${pendentes} ponto${pendentes > 1 ? 's' : ''} de atenção`}
        </span>
      </div>

      <ul className="space-y-2.5">
        {checagens.map((c) => {
          const { icone, cor } = APARENCIA[c.estado]
          return (
            <li key={c.id} className="flex gap-2.5 text-sm">
              <Icone nome={icone} className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${cor}`} />
              <div className="min-w-0">
                <p className={c.estado === 'ok' ? 'text-muted-foreground' : ''}>
                  {c.titulo}
                </p>
                <p className="text-muted-foreground text-xs">{c.detalhe}</p>
              </div>
            </li>
          )
        })}
      </ul>

      <p className="text-muted-foreground border-border mt-3 border-t pt-3 text-xs">
        Isto é um checklist, não um portão. Nada aqui impede fechar a escala — a
        decisão continua sendo de vocês.
      </p>
    </div>
  )
}
