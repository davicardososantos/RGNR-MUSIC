'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Icone, type NomeIcone } from '@/components/icone'
import { linkWhatsApp, mensagemCobranca, primeiroNome } from '@/lib/whatsapp'
import { STATUS_LABEL, type Evento, type RespostaDisponibilidade } from '@/lib/tipos'
import type { LinhaResposta } from '@/lib/dados-admin'

const ICONE_DA_RESPOSTA: Record<RespostaDisponibilidade, NomeIcone> = {
  sim: 'sim',
  se_precisar: 'sePrecisar',
  nao: 'nao',
}

const COR_DA_RESPOSTA: Record<RespostaDisponibilidade, string> = {
  sim: 'bg-lima/15 text-lima',
  se_precisar: 'bg-roxo/20 text-roxo-claro',
  nao: 'bg-muted text-muted-foreground',
}

export function LinhaMusico({
  linha,
  eventos,
  urlFormulario,
}: {
  linha: LinhaResposta
  eventos: Evento[]
  urlFormulario: string
}) {
  const [copiado, setCopiado] = useState(false)

  const mensagem = mensagemCobranca(primeiroNome(linha.nome), urlFormulario)
  const zap = linkWhatsApp(linha.whatsapp, mensagem)
  const status = STATUS_LABEL[linha.status]

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensagem)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      toast.error('Não consegui copiar. Selecione o texto na mão.')
    }
  }

  return (
    <div className="border-border rounded-xl border p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-medium">
            <span className="truncate">{linha.nome}</span>
            {linha.outroAparelho && (
              <Icone
                nome="atencao"
                className="text-roxo-claro h-3.5 w-3.5 shrink-0"
              />
            )}
          </p>
          <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
            <Icone nome={status.icone} className="h-3 w-3" />
            {status.texto}
            {linha.precisaConfirmacaoDupla && ' · confirmação dupla'}
          </p>
        </div>

        {!linha.respondeu && (
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={copiar}
              className="border-border hover:bg-accent rounded-lg border px-2.5 py-1.5 text-xs transition-colors"
            >
              {copiado ? 'copiado' : 'copiar'}
            </button>
            {zap ? (
              <a
                href={zap}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-lima text-primary-foreground rounded-lg px-2.5 py-1.5 text-xs font-medium"
              >
                WhatsApp
              </a>
            ) : (
              <span className="text-muted-foreground px-2.5 py-1.5 text-xs">
                sem telefone
              </span>
            )}
          </div>
        )}
      </div>

      {linha.respondeu && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {eventos.map((e) => {
            const r = linha.respostas[e.id]
            const dia = e.data.slice(8)
            return (
              <span
                key={e.id}
                title={`${dia}/${e.data.slice(5, 7)}`}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
                  r ? COR_DA_RESPOSTA[r] : 'bg-muted/40 text-muted-foreground/60'
                }`}
              >
                {dia}
                {r && <Icone nome={ICONE_DA_RESPOSTA[r]} className="h-2.5 w-2.5" />}
              </span>
            )
          })}
        </div>
      )}

      {linha.outroAparelho && (
        <p className="text-muted-foreground mt-2 text-xs">
          Respondido de um aparelho diferente do primeiro. Vale confirmar com a
          pessoa.
        </p>
      )}
    </div>
  )
}
