'use client'

import type { ReactNode } from 'react'
import { Icone, type NomeIcone } from '@/components/icone'
import { EU } from './dados-exemplo'
import { Avatar, Fundo, Marca } from './ui'

export type Aba = 'inicio' | 'datas' | 'escalas' | 'perfil'

const ABAS: { id: Aba; rotulo: string; icone: NomeIcone }[] = [
  { id: 'inicio', rotulo: 'Início', icone: 'inicio' },
  { id: 'datas', rotulo: 'Datas', icone: 'datas' },
  { id: 'escalas', rotulo: 'Escalas', icone: 'escala' },
  { id: 'perfil', rotulo: 'Perfil', icone: 'perfil' },
]

function Contador({ n }: { n: number }) {
  if (!n) return null
  return (
    <span className="bg-roxo min-w-5 rounded-full px-1.5 text-center text-[10px] leading-5 font-semibold text-white tabular-nums">
      {n}
    </span>
  )
}

export function AvisoPrototipo({ className = '' }: { className?: string }) {
  return (
    <span
      className={`border-roxo/40 text-roxo-claro inline-flex items-center gap-1.5 rounded-full border border-dashed px-2.5 py-0.5 text-[10px] font-medium tracking-wide uppercase ${className}`}
    >
      Protótipo
    </span>
  )
}

/**
 * A moldura do app. No celular: cabeçalho enxuto e abas embaixo, no alcance
 * do polegar. No computador: menu lateral fixo, conteúdo no centro e, em
 * telas largas, uma coluna à direita com o que importa agora.
 */
export function Casca({
  aba,
  onAba,
  pendentes,
  lateral,
  children,
}: {
  aba: Aba
  onAba: (a: Aba) => void
  pendentes: number
  lateral?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="relative min-h-dvh">
      <Fundo />

      {/* Computador: menu lateral */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.06] bg-[#0b0b10]/70 px-4 py-7 backdrop-blur-xl lg:flex">
        <div className="px-2">
          <Marca />
        </div>

        <nav className="mt-10 space-y-1" aria-label="Seções">
          {ABAS.map((a) => {
            const ativa = aba === a.id
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onAba(a.id)}
                aria-current={ativa ? 'page' : undefined}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  ativa
                    ? 'bg-white/[0.07] text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                }`}
              >
                <Icone
                  nome={a.icone}
                  className={`h-4 w-4 ${ativa ? 'text-lima' : 'text-muted-foreground group-hover:text-foreground'}`}
                />
                <span className="flex-1 text-left">{a.rotulo}</span>
                {a.id === 'datas' && <Contador n={pendentes} />}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto space-y-4">
          <AvisoPrototipo className="ml-2" />
          <button
            type="button"
            onClick={() => onAba('perfil')}
            className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 text-left transition-colors hover:bg-white/[0.06]"
          >
            <Avatar nome={EU.nome} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{EU.nome}</span>
              <span className="text-muted-foreground block text-xs">
                {EU.instrumentos.find((i) => i.principal)?.nome}
              </span>
            </span>
          </button>
        </div>
      </aside>

      {/* Celular: cabeçalho */}
      <header className="sticky top-0 z-20 flex items-center justify-between bg-gradient-to-b from-[#0a0a0e] via-[#0a0a0e]/85 to-transparent px-5 pt-[max(env(safe-area-inset-top),0.9rem)] pb-5 lg:hidden">
        <div className="flex items-center gap-3">
          <Marca compacta />
          <AvisoPrototipo />
        </div>
        <button type="button" onClick={() => onAba('perfil')} aria-label="Meu perfil">
          <Avatar nome={EU.nome} tamanho="sm" />
        </button>
      </header>

      <div className="lg:pl-64">
        <div className="mx-auto flex max-w-6xl gap-10 px-5 pb-36 lg:px-10 lg:pt-12 lg:pb-16">
          <main key={aba} className="min-w-0 flex-1 animate-[area-surgir_320ms_ease-out]">
            {children}
          </main>
          {lateral && (
            <aside className="hidden w-80 shrink-0 animate-[area-surgir_420ms_ease-out] xl:block">
              <div className="sticky top-12 space-y-6">{lateral}</div>
            </aside>
          )}
        </div>
      </div>

      {/* Celular: abas embaixo */}
      <nav
        aria-label="Seções"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.06] bg-[#0a0a0e]/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-4 px-3 pt-2 pb-2">
          {ABAS.map((a) => {
            const ativa = aba === a.id
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onAba(a.id)}
                aria-current={ativa ? 'page' : undefined}
                className="flex flex-col items-center gap-1 py-1 transition-transform active:scale-90"
              >
                <span
                  className={`relative flex h-8 w-14 items-center justify-center rounded-full transition-colors ${
                    ativa ? 'bg-lima/15 text-lima' : 'text-muted-foreground'
                  }`}
                >
                  <Icone nome={a.icone} className="h-[18px] w-[18px]" />
                  {a.id === 'datas' && pendentes > 0 && (
                    <span className="bg-roxo ring-background absolute -top-0.5 right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold text-white ring-2 tabular-nums">
                      {pendentes}
                    </span>
                  )}
                </span>
                <span
                  className={`text-[11px] font-medium ${ativa ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  {a.rotulo}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
