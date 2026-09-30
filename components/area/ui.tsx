'use client'

import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { Icone, type NomeIcone } from '@/components/icone'
import { iniciais, type Resposta } from './dados-exemplo'

// ------------------------------------------------------------
// Cores das respostas: as mesmas do formulário (lima = posso,
// roxo = topo cobrir, cinza = não posso).
// ------------------------------------------------------------

export const RESPOSTA: Record<
  Resposta,
  { rotulo: string; icone: NomeIcone; ativo: string; texto: string; ponto: string }
> = {
  sim: {
    rotulo: 'Sim',
    icone: 'sim',
    ativo: 'bg-lima text-primary-foreground border-lima',
    texto: 'text-lima',
    ponto: 'bg-lima',
  },
  se_precisar: {
    rotulo: 'Se precisar',
    icone: 'sePrecisar',
    ativo: 'bg-roxo text-white border-roxo',
    texto: 'text-roxo-claro',
    ponto: 'bg-roxo',
  },
  nao: {
    rotulo: 'Não',
    icone: 'nao',
    ativo: 'bg-white/15 text-foreground border-white/25',
    texto: 'text-muted-foreground',
    ponto: 'bg-white/35',
  },
}

export const ORDEM_RESPOSTAS: Resposta[] = ['sim', 'se_precisar', 'nao']

/** Superfície padrão: vidro escuro com borda quase invisível. */
export const vidro = 'rounded-3xl border border-white/[0.07] bg-white/[0.025]'

// ------------------------------------------------------------

const GRADIENTES = [
  'from-lima/90 to-lima-clara/40 text-primary-foreground',
  'from-roxo to-roxo-claro/50 text-white',
  'from-[#3b2d5c] to-roxo/70 text-white',
  'from-[#2c3a14] to-lima/60 text-white',
  'from-roxo-claro/80 to-[#3b2d5c] text-white',
]

function gradienteDo(nome: string) {
  let h = 0
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return GRADIENTES[h % GRADIENTES.length]
}

/**
 * Iniciais sobre um gradiente da marca. Na versão real entra a foto que
 * veio do Voluts; o protótipo não usa foto de ninguém.
 */
export function Avatar({
  nome,
  tamanho = 'md',
  destaque = false,
  className = '',
}: {
  nome: string
  tamanho?: 'sm' | 'md' | 'lg' | 'xl'
  destaque?: boolean
  className?: string
}) {
  const medida = {
    sm: 'h-8 w-8 text-[11px]',
    md: 'h-10 w-10 text-xs',
    lg: 'h-14 w-14 text-base',
    xl: 'h-24 w-24 text-3xl',
  }[tamanho]

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold ${gradienteDo(
        nome,
      )} ${medida} ${
        destaque ? 'ring-lima ring-offset-background ring-2 ring-offset-2' : 'ring-background ring-2'
      } ${className}`}
    >
      {iniciais(nome)}
    </span>
  )
}

export function Etiqueta({
  children,
  tom = 'neutro',
  className = '',
}: {
  children: ReactNode
  tom?: 'neutro' | 'lima' | 'roxo' | 'cheio'
  className?: string
}) {
  const cor = {
    neutro: 'border-white/10 bg-white/[0.04] text-muted-foreground',
    lima: 'border-lima/30 bg-lima/10 text-lima',
    roxo: 'border-roxo/40 bg-roxo/15 text-roxo-claro',
    cheio: 'border-lima bg-lima text-primary-foreground',
  }[tom]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cor} ${className}`}
    >
      {children}
    </span>
  )
}

export function TituloSecao({ children, acao }: { children: ReactNode; acao?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
        {children}
      </h2>
      {acao}
    </div>
  )
}

/** Três botões redondos (compacto) ou três blocos com texto (grande). */
export function SeletorResposta({
  valor,
  onMudar,
  tamanho = 'compacto',
}: {
  valor: Resposta | undefined
  onMudar: (r: Resposta) => void
  tamanho?: 'compacto' | 'grande'
}) {
  if (tamanho === 'grande') {
    return (
      <div className="grid grid-cols-3 gap-2.5">
        {ORDEM_RESPOSTAS.map((r) => {
          const ativo = valor === r
          return (
            <button
              key={r}
              type="button"
              onClick={() => onMudar(r)}
              aria-pressed={ativo}
              className={`flex h-20 flex-col items-center justify-center gap-2 rounded-2xl border text-sm font-medium transition-all active:scale-[0.96] ${
                ativo ? RESPOSTA[r].ativo : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
              }`}
            >
              <Icone nome={RESPOSTA[r].icone} className="h-4 w-4" />
              {RESPOSTA[r].rotulo}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex shrink-0 gap-1.5">
      {ORDEM_RESPOSTAS.map((r) => {
        const ativo = valor === r
        return (
          <button
            key={r}
            type="button"
            onClick={() => onMudar(r)}
            aria-pressed={ativo}
            aria-label={RESPOSTA[r].rotulo}
            title={RESPOSTA[r].rotulo}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all active:scale-90 ${
              ativo
                ? RESPOSTA[r].ativo
                : 'text-muted-foreground border-white/10 hover:border-white/25 hover:text-foreground'
            }`}
          >
            <Icone nome={RESPOSTA[r].icone} className="h-3.5 w-3.5" />
          </button>
        )
      })}
    </div>
  )
}

export function AnelProgresso({
  feitas,
  total,
  tamanho = 64,
}: {
  feitas: number
  total: number
  tamanho?: number
}) {
  const raio = tamanho / 2 - 5
  const volta = 2 * Math.PI * raio
  const fracao = total ? feitas / total : 1
  return (
    <div className="relative shrink-0" style={{ width: tamanho, height: tamanho }}>
      <svg width={tamanho} height={tamanho} className="-rotate-90">
        <circle cx={tamanho / 2} cy={tamanho / 2} r={raio} fill="none" strokeWidth="5" className="stroke-white/10" />
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          className="stroke-lima transition-[stroke-dashoffset] duration-700"
          strokeDasharray={volta}
          strokeDashoffset={volta * (1 - fracao)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">
        {Math.round(fracao * 100)}%
      </span>
    </div>
  )
}

/**
 * Painel que sobe de baixo no celular e vira gaveta lateral no computador.
 * Fecha no Esc, no fundo escurecido e no X.
 */
export function Folha({
  aberta,
  onFechar,
  titulo,
  children,
}: {
  aberta: boolean
  onFechar: () => void
  titulo: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!aberta) return
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && onFechar()
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', tecla)
    return () => {
      document.body.style.overflow = antes
      window.removeEventListener('keydown', tecla)
    }
  }, [aberta, onFechar])

  if (!aberta) return null

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 animate-[area-surgir_200ms_ease-out] bg-black/60 backdrop-blur-sm"
        onClick={onFechar}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="absolute inset-x-0 bottom-0 max-h-[92dvh] animate-[area-subir_340ms_cubic-bezier(.2,.9,.25,1)] overflow-y-auto overscroll-contain rounded-t-[2rem] border-t border-white/10 bg-[#0d0d12] pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-2xl lg:inset-y-0 lg:right-0 lg:left-auto lg:max-h-none lg:w-[460px] lg:animate-[area-deslizar_340ms_cubic-bezier(.2,.9,.25,1)] lg:rounded-none lg:rounded-l-[2rem] lg:border-t-0 lg:border-l"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-b from-[#0d0d12] via-[#0d0d12]/95 to-transparent px-5 pt-3 pb-4 lg:px-7 lg:pt-6">
          <span className="mx-auto h-1.5 w-10 rounded-full bg-white/15 lg:hidden" />
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="text-muted-foreground hover:text-foreground absolute top-3 right-4 hidden h-9 w-9 items-center justify-center rounded-full border border-white/10 lg:top-6 lg:right-6 lg:flex"
          >
            <Icone nome="fechar" className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="px-5 lg:px-7">{children}</div>
      </div>
    </div>
  )
}

// Partículas da comemoração, fixas para a animação sair igual sempre.
const PARTICULAS = Array.from({ length: 28 }, (_, i) => {
  const angulo = (i / 28) * Math.PI * 2 + (i % 3) * 0.2
  const distancia = 90 + ((i * 37) % 70)
  return {
    dx: `${Math.round(Math.cos(angulo) * distancia)}px`,
    dy: `${Math.round(Math.sin(angulo) * distancia)}px`,
    cor: ['bg-lima', 'bg-roxo-claro', 'bg-white', 'bg-lima-clara'][i % 4],
    tamanho: i % 3 === 0 ? 'h-2.5 w-2.5' : 'h-1.5 w-1.5',
    atraso: `${(i % 5) * 30}ms`,
  }
})

/** O check desenhado, com anéis e estouro de partículas. */
export function Comemoracao() {
  const comprimento = 60
  return (
    <div className="relative mx-auto h-40 w-40">
      <span className="border-lima/60 absolute inset-6 animate-[area-anel_1.4s_ease-out_infinite] rounded-full border-2" />
      <span className="border-roxo/60 absolute inset-6 animate-[area-anel_1.4s_ease-out_0.5s_infinite] rounded-full border-2" />
      {PARTICULAS.map((p, i) => (
        <span
          key={i}
          className={`absolute top-1/2 left-1/2 rounded-full motion-reduce:hidden ${p.cor} ${p.tamanho} animate-[area-estouro_900ms_cubic-bezier(.1,.8,.3,1)_both]`}
          style={
            { '--dx': p.dx, '--dy': p.dy, animationDelay: p.atraso } as CSSProperties
          }
        />
      ))}
      <div className="bg-lima absolute inset-8 flex items-center justify-center rounded-full shadow-[0_0_60px_-10px] shadow-lima/60">
        <svg viewBox="0 0 48 48" className="h-14 w-14">
          <path
            d="M13 25 l7 7 l15 -16"
            fill="none"
            stroke="#10130a"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={comprimento}
            className="animate-[area-traco_500ms_ease-out_250ms_both]"
            style={{ '--comprimento': comprimento } as CSSProperties}
          />
        </svg>
      </div>
    </div>
  )
}

/** A marca: logo do RGNR MUSIC + nome. */
export function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.jpg" alt="" className="h-9 w-9 rounded-xl" />
      {!compacta && (
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">RGNR Music</p>
          <p className="text-muted-foreground text-[11px]">Banda</p>
        </div>
      )}
    </div>
  )
}

/** Brilhos da marca no fundo, parados, atrás de tudo. */
export function Fundo() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="bg-roxo/25 absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full blur-[120px]" />
      <div className="bg-lima/[0.07] absolute top-10 -right-40 h-[26rem] w-[26rem] rounded-full blur-[120px]" />
      <div className="bg-roxo/10 absolute bottom-0 left-1/3 h-80 w-80 rounded-full blur-[120px]" />
    </div>
  )
}
