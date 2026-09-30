import Link from 'next/link'
import type { RankingFuncao, SemTocar } from '@/lib/relatorios'
import { COR, vidro } from './ui'

/**
 * Quem segurou cada função desde que há registro (30/09/2026). Pequenos
 * múltiplos, um por função, cada um com barras de um tom só: comprimento =
 * quantas datas a pessoa fez aquela função; o número vai escrito. Função
 * com uma barra enorme e o resto curto é função sem rodízio.
 */
export function Rodizio({ funcoes }: { funcoes: RankingFuncao[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {funcoes.map((f) => {
        const max = Math.max(1, ...f.pessoas.map((p) => p.vezes))
        const lider = f.pessoas[0]
        const fatia = lider && f.total ? Math.round((lider.vezes / f.total) * 100) : 0
        return (
          <div key={f.funcao} className={`${vidro} p-5`}>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-semibold">{f.funcao}</h3>
              <span className="text-muted-foreground text-xs tabular-nums">
                {f.pessoas.length} {f.pessoas.length === 1 ? 'pessoa' : 'pessoas'}
              </span>
            </div>
            {lider && (
              <p className="text-muted-foreground mt-1 text-xs">
                {lider.nome} fez {fatia}% das vezes
              </p>
            )}
            <div className="mt-4 space-y-2">
              {f.pessoas.slice(0, 6).map((p) => (
                <Link key={p.slug} href={`/admin/musicos/${p.slug}`} className="group grid grid-cols-[6rem_minmax(0,1fr)_2rem] items-center gap-2.5">
                  <span className="truncate text-sm group-hover:underline">{p.nome}</span>
                  <span className="h-2.5">
                    <span
                      className="block h-full rounded-r-[4px]"
                      style={{ width: `${(p.vezes / max) * 100}%`, background: COR.sim }}
                    />
                  </span>
                  <span className="text-right text-sm font-semibold tabular-nums">{p.vezes}</span>
                </Link>
              ))}
              {f.pessoas.length > 6 && (
                <p className="text-muted-foreground pt-1 text-xs">
                  e mais {f.pessoas.length - 6}: {f.pessoas.slice(6).map((p) => p.nome).join(', ')}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function haQuanto(iso: string, hoje: string) {
  const dias = Math.round((new Date(`${hoje}T12:00:00`).getTime() - new Date(`${iso}T12:00:00`).getTime()) / 86_400_000)
  if (dias < 7) return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`
  if (dias < 60) return `há ${Math.round(dias / 7)} semanas`
  return `há ${Math.round(dias / 30)} meses`
}

/** Há quanto tempo cada pessoa da banda não toca. Quem nunca tocou vem primeiro. */
export function SemTocarLista({ pessoas, hoje, desde }: { pessoas: SemTocar[]; hoje: string; desde: string | null }) {
  return (
    <div className={`${vidro} divide-y divide-white/[0.05] overflow-hidden`}>
      {pessoas.map((p) => (
        <Link
          key={p.id}
          href={`/admin/musicos/${p.slug}`}
          className="flex items-center justify-between gap-3 px-5 py-3 text-sm transition-colors hover:bg-white/[0.03]"
        >
          <span className="truncate font-medium">{p.nome}</span>
          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
            {p.ultima ? (
              <>
                <span className="text-foreground font-medium">{haQuanto(p.ultima, hoje)}</span> · {Number(p.ultima.slice(8, 10))}{' '}
                {MES[Number(p.ultima.slice(5, 7)) - 1]}/{p.ultima.slice(2, 4)} · {p.total}{' '}
                {p.total === 1 ? 'vez' : 'vezes'}
              </>
            ) : (
              <span className="text-roxo-claro">
                nunca tocou{desde ? ` desde ${MES[Number(desde.slice(5, 7)) - 1]}/${desde.slice(2, 4)}` : ''}
              </span>
            )}
          </span>
        </Link>
      ))}
    </div>
  )
}
