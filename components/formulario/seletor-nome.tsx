'use client'

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import type { MusicoDaLista } from '@/lib/dados'

/** Ignora acento e caixa: quem digita "leo" no celular tem que achar "Léo". */
function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export function SeletorNome({
  musicos,
  jaRespondidos,
  onEscolher,
  carregando,
}: {
  musicos: MusicoDaLista[]
  jaRespondidos: string[]
  onEscolher: (slug: string) => void
  carregando: string | null
}) {
  const [busca, setBusca] = useState('')

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim())
    if (!termo) return musicos
    return musicos.filter((m) => normalizar(m.nome).includes(termo))
  }, [busca, musicos])

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight">Quem é você?</h2>
        <p className="text-muted-foreground text-sm">
          Toque no seu nome para começar.
        </p>
      </div>

      <Input
        type="search"
        inputMode="search"
        placeholder="Buscar seu nome…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="h-12 text-base"
        autoComplete="off"
      />

      <div className="grid gap-2">
        {filtrados.map((m) => {
          const respondido = jaRespondidos.includes(m.id)
          return (
            <button
              key={m.id}
              type="button"
              disabled={Boolean(carregando)}
              onClick={() => onEscolher(m.slug)}
              className="border-border hover:bg-accent flex min-h-12 items-center justify-between rounded-lg border px-4 py-3 text-left text-base transition-colors disabled:opacity-50"
            >
              <span>{m.nome}</span>
              {carregando === m.slug ? (
                <span className="text-muted-foreground text-xs">abrindo…</span>
              ) : respondido ? (
                <span className="text-muted-foreground text-xs">já respondeu ✓</span>
              ) : null}
            </button>
          )
        })}

        {filtrados.length === 0 && (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Nenhum nome com “{busca}”.
            <br />
            Se você faz parte da banda e não está na lista, fala com o Davi ou o André.
          </p>
        )}
      </div>
    </div>
  )
}
