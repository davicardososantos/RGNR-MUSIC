'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icone, type NomeIcone } from '@/components/icone'
import { sair } from '@/actions/auth'
import { Folha, Fundo, Marca } from '@/components/area/ui'

type Item = { href: string; rotulo: string; icone: NomeIcone; exato?: boolean; tambem?: string[] }

const ITENS: Item[] = [
  { href: '/admin', rotulo: 'Painel', icone: 'inicio', exato: true },
  { href: '/admin/escala', rotulo: 'Escalas', icone: 'escala', tambem: ['/admin/evento'] },
  { href: '/admin/respostas', rotulo: 'Respostas', icone: 'respostas' },
  { href: '/admin/musicos', rotulo: 'Pessoas', icone: 'pessoas' },
  { href: '/admin/relatorios', rotulo: 'Relatórios', icone: 'relatorios' },
  { href: '/admin/historico', rotulo: 'Histórico', icone: 'historico' },
]

// No celular cabem quatro abas e o "Mais".
const NA_BARRA = ITENS.slice(0, 4)
const NO_MAIS = ITENS.slice(4)

function ativo(item: Item, caminho: string) {
  if (item.exato) return caminho === item.href
  return [item.href, ...(item.tambem ?? [])].some((h) => caminho === h || caminho.startsWith(`${h}/`))
}

function Selo({ n }: { n: number }) {
  if (!n) return null
  return (
    <span className="bg-destructive min-w-5 rounded-full px-1.5 text-center text-[10px] leading-5 font-semibold text-white tabular-nums">
      {n}
    </span>
  )
}

/**
 * A moldura do painel dos gestores (30/09/2026). Substitui a fileira de
 * links do topo: no computador, menu lateral fixo; no celular, abas
 * embaixo, no alcance do polegar, com o resto em "Mais".
 */
export function CascaPainel({
  gestor,
  imprevistos,
  children,
}: {
  gestor: string
  imprevistos: number
  children: ReactNode
}) {
  const caminho = usePathname()
  const [mais, setMais] = useState(false)
  const iniciais = gestor
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

  return (
    <div className="relative min-h-dvh flex-1">
      <Fundo />

      {/* Computador: menu lateral */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.06] bg-[#0b0b10]/70 px-4 py-7 backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-3 px-2">
          <Marca compacta />
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">RGNR Music</p>
            <p className="text-muted-foreground text-[11px]">Gestão da Banda</p>
          </div>
        </div>

        <nav className="mt-10 space-y-1" aria-label="Seções do painel">
          {ITENS.map((item) => {
            const eh = ativo(item, caminho)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={eh ? 'page' : undefined}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  eh ? 'text-foreground bg-white/[0.07]' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                }`}
              >
                <Icone
                  nome={item.icone}
                  className={`h-4 w-4 ${eh ? 'text-lima' : 'text-muted-foreground group-hover:text-foreground'}`}
                />
                <span className="flex-1">{item.rotulo}</span>
                {item.href === '/admin' && <Selo n={imprevistos} />}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto space-y-2">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-white/[0.04]"
          >
            <Icone nome="instalar" className="h-4 w-4" />
            Área do músico
          </Link>
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
            <span className="from-lima/90 to-lima-clara/40 text-primary-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold">
              {iniciais}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{gestor}</span>
              <span className="text-muted-foreground block text-xs">Liderança</span>
            </span>
            <form action={sair}>
              <button
                type="submit"
                aria-label="Sair"
                title="Sair"
                className="text-muted-foreground hover:text-foreground flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/[0.06]"
              >
                <Icone nome="sair" className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Celular: cabeçalho */}
      <header className="sticky top-0 z-20 flex items-center justify-between bg-gradient-to-b from-[#0a0a0e] via-[#0a0a0e]/85 to-transparent px-5 pt-[max(env(safe-area-inset-top),0.9rem)] pb-5 lg:hidden">
        <div className="flex items-center gap-2.5">
          <Marca compacta />
          <span className="text-sm font-semibold tracking-tight">Gestão</span>
        </div>
        <button
          type="button"
          onClick={() => setMais(true)}
          aria-label="Menu"
          className="from-lima/90 to-lima-clara/40 text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-semibold"
        >
          {iniciais}
        </button>
      </header>

      <div className="lg:pl-64">
        <main key={caminho} className="mx-auto w-full max-w-6xl animate-[area-surgir_320ms_ease-out] px-5 pb-36 lg:px-10 lg:pt-12 lg:pb-16">
          {children}
        </main>
      </div>

      {/* Celular: abas embaixo */}
      <nav
        aria-label="Seções do painel"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.06] bg-[#0a0a0e]/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 px-2 pt-2 pb-2">
          {NA_BARRA.map((item) => {
            const eh = ativo(item, caminho)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={eh ? 'page' : undefined}
                className="flex flex-col items-center gap-1 py-1 transition-transform active:scale-90"
              >
                <span
                  className={`relative flex h-8 w-12 items-center justify-center rounded-full transition-colors ${
                    eh ? 'bg-lima/15 text-lima' : 'text-muted-foreground'
                  }`}
                >
                  <Icone nome={item.icone} className="h-[18px] w-[18px]" />
                  {item.href === '/admin' && imprevistos > 0 && (
                    <span className="bg-destructive ring-background absolute -top-0.5 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold text-white ring-2">
                      {imprevistos}
                    </span>
                  )}
                </span>
                <span className={`text-[11px] font-medium ${eh ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {item.rotulo}
                </span>
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setMais(true)}
            className="flex flex-col items-center gap-1 py-1 transition-transform active:scale-90"
          >
            <span
              className={`flex h-8 w-12 items-center justify-center rounded-full ${
                NO_MAIS.some((i) => ativo(i, caminho)) ? 'bg-lima/15 text-lima' : 'text-muted-foreground'
              }`}
            >
              <Icone nome="mais" className="h-[18px] w-[18px]" />
            </span>
            <span className="text-muted-foreground text-[11px] font-medium">Mais</span>
          </button>
        </div>
      </nav>

      <Folha aberta={mais} onFechar={() => setMais(false)} titulo="Menu">
        <div className="space-y-2 pb-2">
          <p className="text-muted-foreground mb-4 text-sm">{gestor}</p>
          {[...NO_MAIS, { href: '/', rotulo: 'Área do músico', icone: 'instalar' as NomeIcone }].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMais(false)}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3.5 font-medium"
            >
              <Icone nome={item.icone} className="text-lima h-4 w-4" />
              {item.rotulo}
            </Link>
          ))}
          <form action={sair}>
            <button
              type="submit"
              className="text-muted-foreground flex w-full items-center gap-3 rounded-2xl border border-white/[0.07] px-4 py-3.5 text-left font-medium"
            >
              <Icone nome="sair" className="h-4 w-4" />
              Sair
            </button>
          </form>
        </div>
      </Folha>
    </div>
  )
}
