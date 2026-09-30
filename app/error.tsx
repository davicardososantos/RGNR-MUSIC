'use client'

import { useEffect } from 'react'
import { Icone } from '@/components/icone'

/**
 * Quando algo falha no servidor, o músico vê isto em vez do "500" cru.
 *
 * O caso mais comum (30/09/2026) é passageiro: uma falha na primeira ida ao
 * banco logo depois de um deploy, que some no acesso seguinte. Por isso o
 * botão tenta de novo na hora, sem recarregar o app inteiro.
 */
export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center px-6">
      <div className="max-w-sm space-y-5 text-center">
        <span className="bg-roxo/15 text-roxo-claro mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
          <Icone nome="atencao" className="h-6 w-6" />
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Não consegui carregar agora</h1>
          <p className="text-muted-foreground">
            Costuma ser uma falha rápida de conexão. Tente de novo em alguns segundos.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="bg-lima text-primary-foreground hover:bg-lima-clara h-12 w-full rounded-2xl font-semibold transition-all active:scale-[0.98]"
        >
          Tentar de novo
        </button>
        {error.digest && <p className="text-muted-foreground/60 text-xs">código {error.digest}</p>}
      </div>
    </main>
  )
}
