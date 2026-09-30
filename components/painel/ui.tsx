import Link from 'next/link'
import type { ReactNode } from 'react'
import { Icone, type NomeIcone } from '@/components/icone'

/**
 * Peças do painel dos gestores (30/09/2026), no mesmo idioma visual da área
 * do músico: vidro escuro, lima e roxo, tipografia grande e respiro.
 */

/** Superfície padrão do painel. */
export const vidro = 'rounded-3xl border border-white/[0.07] bg-white/[0.025]'

/** Cores dos gráficos, validadas com o método de dataviz (ver cores abaixo). */
export const COR = {
  // Lima da marca um degrau abaixo: a #cef955 fica clara demais para marca
  // de gráfico no fundo escuro (OKLCH L 0.92). #7fa328 passa em todas as
  // checagens ao lado do roxo (CVD ΔE 25.9, contraste > 3:1).
  sim: '#7fa328',
  sePrecisar: '#8c69cc',
  nao: '#4a4a55',
  semResposta: '#1d1d25',
} as const

/** Escala de um tom (lima) para contagens: 1, 2, 3, 4, 5 ou mais. Validada como rampa. */
export const RAMPA = ['#3e4f17', '#50671b', '#678420', '#7fa328', '#a9d33c'] as const

export function Cabecalho({
  titulo,
  subtitulo,
  voltar,
  acoes,
}: {
  titulo: ReactNode
  subtitulo?: ReactNode
  voltar?: { href: string; rotulo: string }
  acoes?: ReactNode
}) {
  return (
    <header className="space-y-3">
      {voltar && (
        <Link
          href={voltar.href}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <Icone nome="anterior" className="h-3 w-3" />
          {voltar.rotulo}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">{titulo}</h1>
          {subtitulo && <p className="text-muted-foreground max-w-2xl">{subtitulo}</p>}
        </div>
        {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
      </div>
    </header>
  )
}

export function Botao({
  href,
  children,
  icone,
  tom = 'neutro',
}: {
  href: string
  children: ReactNode
  icone?: NomeIcone
  tom?: 'lima' | 'roxo' | 'neutro'
}) {
  const cor = {
    lima: 'bg-lima text-primary-foreground hover:bg-lima-clara shadow-[0_10px_40px_-14px] shadow-lima/60',
    roxo: 'bg-roxo text-white hover:brightness-110 shadow-[0_10px_40px_-14px] shadow-roxo/70',
    neutro: 'border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-foreground',
  }[tom]
  return (
    <Link
      href={href}
      className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-all active:scale-[0.97] ${cor}`}
    >
      {icone && <Icone nome={icone} className="h-3.5 w-3.5" />}
      {children}
    </Link>
  )
}

export function Secao({
  titulo,
  descricao,
  acao,
  children,
  className = '',
}: {
  titulo: ReactNode
  descricao?: ReactNode
  acao?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`space-y-3.5 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="space-y-1">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">{titulo}</h2>
          {descricao && <p className="text-muted-foreground text-sm">{descricao}</p>}
        </div>
        {acao}
      </div>
      {children}
    </section>
  )
}

/** Barra de progresso de uma razão (x de y). A trilha é um degrau do próprio tom. */
export function Medidor({
  valor,
  total,
  tom = 'lima',
  className = '',
}: {
  valor: number
  total: number
  tom?: 'lima' | 'roxo'
  className?: string
}) {
  const fracao = total ? Math.min(valor / total, 1) : 0
  return (
    <div
      className={`h-1.5 overflow-hidden rounded-full ${tom === 'lima' ? 'bg-lima/15' : 'bg-roxo/20'} ${className}`}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={valor}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-700 ${tom === 'lima' ? 'bg-lima' : 'bg-roxo'}`}
        style={{ width: `${fracao * 100}%` }}
      />
    </div>
  )
}

/** Número de destaque: rótulo, valor, um detalhe e, se couber, o medidor. */
export function Numero({
  rotulo,
  valor,
  detalhe,
  icone,
  medidor,
  href,
  alerta = false,
}: {
  rotulo: string
  valor: ReactNode
  detalhe?: ReactNode
  icone: NomeIcone
  medidor?: { valor: number; total: number; tom?: 'lima' | 'roxo' }
  href?: string
  alerta?: boolean
}) {
  const corpo = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">{rotulo}</p>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${
            alerta ? 'bg-destructive/15 text-destructive' : 'bg-white/[0.05] text-muted-foreground'
          }`}
        >
          <Icone nome={icone} className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{valor}</p>
      {detalhe && <p className="text-muted-foreground mt-1 text-sm">{detalhe}</p>}
      {medidor && <Medidor {...medidor} className="mt-4" />}
    </>
  )
  const classe = `${vidro} block p-5 transition-colors ${href ? 'hover:bg-white/[0.05]' : ''} ${
    alerta ? 'border-destructive/40' : ''
  }`
  return href ? (
    <Link href={href} className={classe}>
      {corpo}
    </Link>
  ) : (
    <div className={classe}>{corpo}</div>
  )
}

export function Selo({
  children,
  tom = 'neutro',
}: {
  children: ReactNode
  tom?: 'neutro' | 'lima' | 'roxo' | 'alerta'
}) {
  const cor = {
    neutro: 'border-white/10 bg-white/[0.04] text-muted-foreground',
    lima: 'border-lima/30 bg-lima/10 text-lima',
    roxo: 'border-roxo/40 bg-roxo/15 text-roxo-claro',
    alerta: 'border-destructive/40 bg-destructive/10 text-destructive',
  }[tom]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cor}`}>
      {children}
    </span>
  )
}

/** Iniciais sobre gradiente, com a foto por cima quando houver (servida por /foto/<id>). */
export function Rosto({
  nome,
  foto,
  tamanho = 'md',
}: {
  nome: string
  foto?: string | null
  tamanho?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const medida = { sm: 'h-8 w-8 text-[11px]', md: 'h-11 w-11 text-sm', lg: 'h-16 w-16 text-lg', xl: 'h-24 w-24 text-3xl' }[
    tamanho
  ]
  const iniciais = nome
    .replace(/^Pr\.\s*/, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
  return (
    <span
      className={`from-roxo to-roxo-claro/50 relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br font-semibold text-white ${medida}`}
    >
      {iniciais}
      {foto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      )}
    </span>
  )
}
