'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { Instrumento } from '@/lib/tipos'

export type DadosDoMusico = {
  whatsapp: string
  principal: string | null
  cobertura: string[]
}

export function PassoDados({
  nome,
  instrumentos,
  dados,
  onMudar,
  onContinuar,
  salvando,
}: {
  nome: string
  instrumentos: Instrumento[]
  dados: DadosDoMusico
  onMudar: (d: DadosDoMusico) => void
  onContinuar: () => void
  salvando: boolean
}) {
  function alternarCobertura(id: string) {
    const tem = dados.cobertura.includes(id)
    onMudar({
      ...dados,
      cobertura: tem
        ? dados.cobertura.filter((i) => i !== id)
        : [...dados.cobertura, id],
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight">Oi, {nome}!</h2>
        <p className="text-muted-foreground text-sm">
          Confere se está certo. É rapidinho, e só uma vez.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsapp" className="text-base">
          Seu WhatsApp
        </Label>
        <Input
          id="whatsapp"
          type="tel"
          inputMode="tel"
          placeholder="(00) 00000-0000"
          value={dados.whatsapp}
          onChange={(e) => onMudar({ ...dados, whatsapp: e.target.value })}
          className="h-12 text-base"
        />
        <p className="text-muted-foreground text-xs">
          Para a liderança te chamar se precisar de cobertura de última hora.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-base">Seu instrumento principal</Label>
        <div className="grid grid-cols-2 gap-2">
          {instrumentos.map((i) => {
            const ativo = dados.principal === i.id
            return (
              <button
                key={i.id}
                type="button"
                onClick={() =>
                  onMudar({
                    ...dados,
                    principal: ativo ? null : i.id,
                    cobertura: dados.cobertura.filter((c) => c !== i.id),
                  })
                }
                className={`flex min-h-12 items-center gap-2 rounded-lg border px-3 py-2 text-base transition-colors ${
                  ativo
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <span aria-hidden>{i.emoji}</span>
                {i.nome}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-base">Também consigo cobrir</Label>
        <p className="text-muted-foreground text-xs">
          Opcional. Marque só o que você tocaria de verdade num culto.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {instrumentos
            .filter((i) => i.id !== dados.principal)
            .map((i) => {
              const ativo = dados.cobertura.includes(i.id)
              return (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => alternarCobertura(i.id)}
                  className={`flex min-h-12 items-center gap-2 rounded-lg border px-3 py-2 text-base transition-colors ${
                    ativo
                      ? 'border-foreground bg-accent'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  <span aria-hidden>{i.emoji}</span>
                  {i.nome}
                </button>
              )
            })}
        </div>
      </div>

      <Button
        onClick={onContinuar}
        disabled={salvando}
        className="h-12 w-full text-base"
      >
        {salvando ? 'Salvando…' : 'Continuar'}
      </Button>
    </div>
  )
}
