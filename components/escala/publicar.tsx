'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Icone } from '@/components/icone'
import { alternarPublicacao } from '@/actions/escala'
import type { Evento } from '@/lib/tipos'

/**
 * O interruptor entre rascunho e publicada (30/09/2026).
 *
 * Publicada = cada escalado vê a escala na área dele, com quem toca junto,
 * e pode confirmar ou avisar imprevisto. Nada é enviado: o aviso para o
 * grupo continua sendo de vocês, no WhatsApp.
 */
export function Publicar({
  evento,
  escalados,
  confirmados,
}: {
  evento: Evento
  escalados: number
  confirmados: number
}) {
  const [publicada, setPublicada] = useState(evento.status === 'publicada')
  const [pendente, iniciar] = useTransition()

  function alternar() {
    const alvo = !publicada
    setPublicada(alvo)
    iniciar(async () => {
      try {
        await alternarPublicacao({ eventoId: evento.id, data: evento.data, publicar: alvo })
        toast.success(alvo ? 'Escala publicada: os escalados já veem' : 'Escala de volta para rascunho')
      } catch (e) {
        setPublicada(!alvo)
        toast.error(e instanceof Error ? e.message : 'Não consegui mudar')
      }
    })
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
        publicada ? 'border-lima/40 bg-lima/5' : 'border-border border-dashed'
      }`}
    >
      <div className="min-w-0 text-sm">
        <p className="flex items-center gap-2 font-medium">
          <Icone
            nome={publicada ? 'concluido' : 'editar'}
            className={`h-3.5 w-3.5 ${publicada ? 'text-lima' : 'text-muted-foreground'}`}
          />
          {publicada ? 'Publicada' : 'Rascunho'}
        </p>
        <p className="text-muted-foreground">
          {publicada
            ? escalados
              ? `Os escalados já veem na área deles. ${confirmados} de ${escalados} confirmaram.`
              : 'Publicada, mas ainda sem ninguém escalado.'
            : 'Só vocês veem. Publique quando a escala estiver pronta.'}
        </p>
      </div>
      <button
        type="button"
        onClick={alternar}
        disabled={pendente}
        className={`h-10 shrink-0 rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-60 ${
          publicada
            ? 'border-border text-muted-foreground hover:text-foreground border'
            : 'bg-lima text-primary-foreground hover:bg-lima-clara'
        }`}
      >
        {publicada ? 'Voltar para rascunho' : 'Publicar escala'}
      </button>
    </div>
  )
}
