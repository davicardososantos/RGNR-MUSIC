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
  jaRespondidas,
  totalAberto,
  onEscolher,
  carregando,
}: {
  musicos: MusicoDaLista[]
  /** Quantas datas abertas cada músico deste aparelho já respondeu. */
  jaRespondidas: Record<string, number>
  totalAberto: number
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
          // Com três meses abertos, "já respondeu" escondia quem tinha
          // respondido setembro e nem aberto novembro. O que falta é o
          // que importa aqui.
          const feitas = jaRespondidas[m.id] ?? 0
          const faltam = totalAberto - feitas
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
              ) : feitas === 0 ? null : faltam === 0 ? (
                <span className="text-lima text-xs">tudo respondido</span>
              ) : (
                <span className="text-muted-foreground text-xs">
                  faltam {faltam}
                </span>
              )}
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
