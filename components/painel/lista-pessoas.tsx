'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Icone } from '@/components/icone'
import type { LinhaDoElenco } from '@/lib/dados-musico'
import { STATUS_LABEL } from '@/lib/tipos'
import { Rosto, Selo, vidro } from './ui'

type Filtro = 'todos' | 'faltam' | 'semArea' | 'semData'

const FILTROS: { id: Filtro; rotulo: string; teste: (m: LinhaDoElenco) => boolean }[] = [
  { id: 'todos', rotulo: 'Todos', teste: () => true },
  { id: 'faltam', rotulo: 'Faltam responder', teste: (m) => m.noFormulario && m.faltamAbertas > 0 },
  { id: 'semArea', rotulo: 'Nunca entrou na área', teste: (m) => m.noFormulario && !m.entrouNaArea },
  { id: 'semData', rotulo: 'Sem data de nascimento', teste: (m) => m.noFormulario && !m.temNascimento },
]

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/**
 * O elenco em grade, com busca e filtros do dia a dia (30/09/2026): quem
 * falta responder, quem nunca entrou na área do músico e quem ainda não
 * tem data de nascimento (e por isso não consegue entrar).
 */
export function ListaPessoas({ elenco }: { elenco: LinhaDoElenco[] }) {
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')

  const doMusic = elenco.filter((m) => m.banda === 'music' && m.noFormulario)
  // Ex-membros (importados do grupo Multimídia em 30/09/2026): só no histórico.
  const antigos = elenco.filter((m) => m.banda === 'music' && !m.noFormulario)
  const apoio = elenco.filter((m) => m.banda !== 'music')
  const teste = FILTROS.find((f) => f.id === filtro)!.teste
  const termo = semAcento(busca.trim())
  const visiveis = doMusic.filter((m) => teste(m) && (!termo || semAcento(m.nome).includes(termo)))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="focus-within:border-lima/50 flex h-11 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 sm:max-w-xs">
          <Icone nome="buscar" className="text-muted-foreground h-3.5 w-3.5" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar pelo nome"
            className="placeholder:text-muted-foreground/60 w-full bg-transparent text-sm outline-none"
          />
        </label>
        <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:px-0">
          {FILTROS.map((f) => {
            const n = doMusic.filter(f.teste).length
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltro(f.id)}
                className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors ${
                  filtro === f.id
                    ? 'border-lima/40 bg-lima/10 text-lima'
                    : 'text-muted-foreground hover:text-foreground border-white/10'
                }`}
              >
                {f.rotulo}
                {f.id !== 'todos' && <span className="tabular-nums opacity-70">{n}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {visiveis.length === 0 ? (
        <p className="text-muted-foreground py-10 text-center text-sm">Ninguém por aqui.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visiveis.map((m) => (
            <Cartao key={m.id} m={m} />
          ))}
        </div>
      )}

      {antigos.length > 0 && filtro === 'todos' && !termo && (
        <section className="space-y-3 pt-4">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
            Já tocaram com a banda · {antigos.length}
          </h2>
          <p className="text-muted-foreground text-sm">
            Aparecem nas escalas antigas. Não recebem formulário nem entram na área do músico.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {antigos.map((m) => (
              <Cartao key={m.id} m={m} />
            ))}
          </div>
        </section>
      )}

      {apoio.length > 0 && filtro === 'todos' && !termo && (
        <section className="space-y-3 pt-4">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
            Apoio externo · {apoio.length}
          </h2>
          <p className="text-muted-foreground text-sm">
            Não entram no rodízio nem recebem formulário. Aparecem por causa das escalas que já aconteceram.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {apoio.map((m) => (
              <Cartao key={m.id} m={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Cartao({ m }: { m: LinhaDoElenco }) {
  const status = STATUS_LABEL[m.status]
  return (
    <Link
      href={`/admin/musicos/${m.slug}`}
      className={`${vidro} group flex items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:bg-white/[0.05]`}
    >
      <Rosto nome={m.nome} foto={m.foto} tamanho="lg" />
      <span className="min-w-0 flex-1 space-y-1.5">
        <span className="block truncate font-semibold">{m.nome}</span>
        <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Icone nome={status.icone} className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {status.texto}
            {m.instrumentoPrincipal && ` · ${m.instrumentoPrincipal}`}
          </span>
        </span>
        <span className="flex flex-wrap gap-1">
          <Selo>tocou {m.tocou}</Selo>
          {m.noFormulario && m.faltamAbertas > 0 && <Selo tom="roxo">faltam {m.faltamAbertas}</Selo>}
          {m.noFormulario && !m.temNascimento && <Selo tom="alerta">sem data</Selo>}
          {m.noFormulario && m.entrouNaArea && <Selo tom="lima">na área</Selo>}
        </span>
      </span>
    </Link>
  )
}
