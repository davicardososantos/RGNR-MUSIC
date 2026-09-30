import Link from 'next/link'
import { Icone } from '@/components/icone'
import { dataPorExtenso, quandoRelativo } from '@/lib/datas'
import type { DataPainel } from '@/lib/dados-painel'
import { EVENTO_LABEL, nomeDoEvento } from '@/lib/tipos'
import { COR, Medidor, Selo, vidro } from './ui'

/** Mini barra empilhada das respostas, sem interação: os números vêm escritos embaixo. */
function BarraRespostas({ d }: { d: DataPainel }) {
  const total = d.sim + d.sePrecisar + d.nao + d.semResposta || 1
  const partes = [
    [d.sim, COR.sim],
    [d.sePrecisar, COR.sePrecisar],
    [d.nao, COR.nao],
    [d.semResposta, COR.semResposta],
  ] as const
  return (
    <div className="flex h-2 gap-[2px] overflow-hidden rounded-r-[4px]" aria-hidden>
      {partes.map(([v, cor], i) => (v ? <div key={i} style={{ width: `${(v / total) * 100}%`, background: cor }} /> : null))}
    </div>
  )
}

/**
 * Uma data da escala em cartão (30/09/2026): o que falta para ela ficar
 * pronta, de relance. `destaque` é a versão grande do topo do painel.
 */
export function CartaoEscala({ d, destaque = false }: { d: DataPainel; destaque?: boolean }) {
  const rotulo = EVENTO_LABEL[d.tipo]
  const completa = d.posicoes > 0 && d.preenchidas >= d.posicoes
  const publicada = d.status === 'publicada'

  return (
    <Link
      href={`/admin/evento/${d.data}?tipo=${d.tipo}`}
      className={`group relative block overflow-hidden transition-all hover:-translate-y-0.5 ${
        destaque
          ? 'from-lima/60 via-roxo/40 rounded-[2rem] bg-gradient-to-br to-white/[0.04] p-px shadow-[0_30px_80px_-40px] shadow-lima/40'
          : `${vidro} hover:bg-white/[0.05]`
      }`}
    >
      <div className={destaque ? 'relative overflow-hidden rounded-[calc(2rem-1px)] bg-[#0c0c11] p-6 sm:p-7' : 'p-5'}>
        {destaque && <div className="bg-lima/10 absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl" />}

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Icone nome={rotulo.icone} className={`h-3.5 w-3.5 ${rotulo.cor}`} />
              {nomeDoEvento(d)} · {quandoRelativo(d.data)}
            </p>
            <p
              className={`mt-1 font-semibold tracking-tight first-letter:uppercase ${
                destaque ? 'text-3xl sm:text-4xl' : 'text-xl'
              }`}
            >
              {dataPorExtenso(d.data)}
            </p>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {d.hora}
              {d.passagem && ` · passagem ${d.passagem}`}
            </p>
          </div>
          <Icone
            nome="avancar"
            className="text-muted-foreground mt-1 h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
          />
        </div>

        <div className="relative mt-4 flex flex-wrap gap-1.5">
          {publicada ? (
            <Selo tom="lima">
              <Icone nome="concluido" className="h-3 w-3" />
              Publicada
            </Selo>
          ) : (
            <Selo>
              <Icone nome="editar" className="h-3 w-3" />
              Rascunho
            </Selo>
          )}
          {d.imprevistos > 0 && (
            <Selo tom="alerta">
              <Icone nome="imprevisto" className="h-3 w-3" />
              {d.imprevistos} {d.imprevistos === 1 ? 'imprevisto' : 'imprevistos'}
            </Selo>
          )}
          {!d.aberto && (
            <Selo>
              <Icone nome="encerrado" className="h-3 w-3" />
              Respostas fechadas
            </Selo>
          )}
        </div>

        <div className={`relative mt-5 grid gap-5 ${destaque ? 'sm:grid-cols-2' : ''}`}>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">Posições</span>
              <span className={`font-semibold tabular-nums ${completa ? 'text-lima' : ''}`}>
                {d.preenchidas} de {d.posicoes}
              </span>
            </div>
            <Medidor valor={d.preenchidas} total={d.posicoes} />
            {publicada && d.escalados > 0 && (
              <p className="text-muted-foreground text-xs">
                {d.confirmados} de {d.escalados} confirmaram presença
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">Respostas</span>
              <span className="font-semibold tabular-nums">
                {d.sim} <span className="text-muted-foreground font-normal">podem</span>
              </span>
            </div>
            <BarraRespostas d={d} />
            <p className="text-muted-foreground text-xs tabular-nums">
              {d.sePrecisar} se precisar · {d.nao} não · {d.semResposta} sem resposta
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}
