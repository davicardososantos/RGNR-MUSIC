'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icone } from '@/components/icone'
import { enviarMagicLink } from '@/actions/auth'

export function FormLogin() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setAviso(null)
    try {
      const r = await enviarMagicLink(email)
      setAviso({ ok: r.ok, texto: r.mensagem })
    } catch {
      setAviso({ ok: false, texto: 'Não consegui enviar agora. Tente de novo.' })
    } finally {
      setEnviando(false)
    }
  }

  if (aviso?.ok) {
    return (
      <div className="border-border space-y-3 rounded-xl border p-5 text-center">
        <Icone nome="concluido" className="text-lima mx-auto h-8 w-8" />
        <p className="text-sm">{aviso.texto}</p>
        <p className="text-muted-foreground text-xs">
          Abra o e-mail no mesmo aparelho em que você está agora.
        </p>
        <Button
          variant="ghost"
          className="h-10 w-full text-sm"
          onClick={() => setAviso(null)}
        >
          Usar outro e-mail
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-base">
          Seu e-mail
        </Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="voce@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 text-base"
        />
      </div>

      {aviso && !aviso.ok && (
        <p className="text-destructive text-sm">{aviso.texto}</p>
      )}

      <Button
        type="submit"
        disabled={enviando || !email}
        className="h-12 w-full text-base"
      >
        {enviando ? 'Enviando…' : 'Receber link de acesso'}
      </Button>
    </form>
  )
}
