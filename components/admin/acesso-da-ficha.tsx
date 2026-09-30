'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Icone } from '@/components/icone'
import { atualizarContato } from '@/actions/gestao'

const soDigitos = (s: string) => s.replace(/\D/g, '')

function mascaraTelefone(valor: string) {
  const d = soDigitos(valor).slice(-11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 3) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`
}

function mascaraData(valor: string) {
  const d = soDigitos(valor).slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

const paraBR = (iso: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '')

/**
 * O acesso da pessoa à área do músico (30/09/2026): o que ela usa para
 * entrar e quando entrou pela última vez. O gestor corrige aqui quem está
 * sem data de nascimento ou com o WhatsApp errado.
 */
export function AcessoDaFicha({
  musicoId,
  slug,
  whatsapp,
  aniversario,
  ultimoAcesso,
  temTelefoneDoCadastro,
}: {
  musicoId: string
  slug: string
  whatsapp: string | null
  aniversario: string | null
  ultimoAcesso: string | null
  temTelefoneDoCadastro: boolean
}) {
  const [editando, setEditando] = useState(false)
  const [numero, setNumero] = useState(whatsapp ? mascaraTelefone(whatsapp) : '')
  const [nascimento, setNascimento] = useState(paraBR(aniversario))
  const [salvando, iniciar] = useTransition()

  const podeEntrar = Boolean(aniversario) && (Boolean(whatsapp) || temTelefoneDoCadastro)
  const acesso = ultimoAcesso
    ? `Entrou pela última vez em ${new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      }).format(new Date(ultimoAcesso))}`
    : 'Ainda não entrou na área do músico'

  function salvar() {
    iniciar(async () => {
      try {
        await atualizarContato({ musicoId, slug, whatsapp: numero, nascimento })
        toast.success('Dados de acesso salvos')
        setEditando(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Não consegui salvar')
      }
    })
  }

  return (
    <section className="space-y-2.5">
      <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">Acesso à área</h2>
      <div
        className={`space-y-3 rounded-xl border px-4 py-3 text-sm ${
          podeEntrar ? 'border-border' : 'border-roxo/40 bg-roxo/5'
        }`}
      >
        <p className="flex items-start gap-2">
          <Icone
            nome={podeEntrar ? 'concluido' : 'atencao'}
            className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${podeEntrar ? 'text-lima' : 'text-roxo-claro'}`}
          />
          <span>
            {podeEntrar
              ? acesso
              : !aniversario
                ? 'Não consegue entrar: falta a data de nascimento.'
                : 'Não consegue entrar: falta o WhatsApp.'}
          </span>
        </p>

        {editando ? (
          <div className="space-y-2.5">
            <label className="block space-y-1">
              <span className="text-muted-foreground text-xs">WhatsApp</span>
              <input
                value={numero}
                onChange={(e) => setNumero(mascaraTelefone(e.target.value))}
                inputMode="numeric"
                placeholder="(11) 9 0000-0000"
                className="border-border bg-background h-10 w-full rounded-lg border px-3 tabular-nums"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-muted-foreground text-xs">Data de nascimento</span>
              <input
                value={nascimento}
                onChange={(e) => setNascimento(mascaraData(e.target.value))}
                inputMode="numeric"
                placeholder="dd/mm/aaaa"
                className="border-border bg-background h-10 w-full rounded-lg border px-3 tabular-nums"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={salvar}
                disabled={salvando}
                className="bg-lima text-primary-foreground h-9 rounded-lg px-4 font-medium disabled:opacity-60"
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={() => setEditando(false)}
                className="text-muted-foreground h-9 rounded-lg px-3"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2">
            <span>
              {whatsapp ? mascaraTelefone(whatsapp) : 'sem WhatsApp'}
              {' · '}
              {aniversario ? `nasceu em ${paraBR(aniversario)}` : 'sem data de nascimento'}
            </span>
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="text-lima text-sm font-medium underline-offset-4 hover:underline"
            >
              Corrigir
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
