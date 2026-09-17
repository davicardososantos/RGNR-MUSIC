'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Icone, type NomeIcone } from '@/components/icone'
import { linkWhatsApp, mensagemCobranca, primeiroNome } from '@/lib/whatsapp'
import { chaveDoMes, nomeDaChave } from '@/lib/datas'
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
  periodo,
}: {
  linha: LinhaResposta
  eventos: Evento[]
  urlFormulario: string
  periodo: string
}) {
  const [copiado, setCopiado] = useState(false)

  const mensagem = mensagemCobranca(primeiroNome(linha.nome), urlFormulario, periodo)
  const zap = linkWhatsApp(linha.whatsapp, mensagem)
  const status = STATUS_LABEL[linha.status]

  // As datas abertas cobrem mais de um mês: sem separar, o selo "14" tanto
  // podia ser 14/10 quanto 14/11.
  const meses = [...new Set(eventos.map((e) => chaveDoMes(e.data)))]

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
            <Link
              href={`/admin/musicos/${linha.slug}`}
              className="truncate underline-offset-4 hover:underline"
            >
              {linha.nome}
            </Link>
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

        {linha.faltam > 0 && (
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

      <div className="mt-3 space-y-1.5">
        {meses.map((chave) => (
          <div key={chave} className="flex items-center gap-2">
            <span className="text-muted-foreground w-8 shrink-0 text-[11px] tracking-wide uppercase">
              {nomeDaChave(chave).slice(0, 3)}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {eventos
                .filter((e) => chaveDoMes(e.data) === chave)
                .map((e) => {
                  const r = linha.respostas[e.id]
                  return (
                    <span
                      key={e.id}
                      title={`${e.data.slice(8)}/${e.data.slice(5, 7)}`}
                      className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
                        r ? COR_DA_RESPOSTA[r] : 'bg-muted/40 text-muted-foreground/60'
                      }`}
                    >
                      {e.data.slice(8)}
                      {r && (
                        <Icone nome={ICONE_DA_RESPOSTA[r]} className="h-2.5 w-2.5" />
                      )}
                    </span>
                  )
                })}
            </div>
          </div>
        ))}
      </div>

      {linha.outroAparelho && (
        <p className="text-muted-foreground mt-2 text-xs">
          Respondido de um aparelho diferente do primeiro. Vale confirmar com a
          pessoa.
        </p>
      )}
    </div>
  )
}
