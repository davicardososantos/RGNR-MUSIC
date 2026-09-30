'use client'

import Link from 'next/link'
import { RAMPA } from '../ui'
import { useDica } from './dica'

type Props = {
  linhas: { id: string; nome: string }[]
  datas: { id: string; data: string; rotulo: string; dia: string; href: string; semRespostas: boolean }[]
  celulas: Record<string, { sim: string[]; sePrecisar: string[] }>
}

const nomes = (lista: string[]) =>
  lista.length <= 3 ? lista.join(', ') : `${lista.slice(0, 3).join(', ')} e mais ${lista.length - 3}`

/**
 * Quem pode tocar cada instrumento em cada data (30/09/2026).
 *
 * Mapa de calor numa escala de um tom só: mais claro = mais gente que disse
 * "sim" e toca aquele instrumento. O buraco é o que interessa, então o zero
 * ganha contorno de alerta e o número escrito, e o 1 também vem escrito. O
 * resto fica no balão, com os nomes. O pontinho roxo marca quem está no "se
 * precisar": é o plano B da célula.
 */
export function MapaCobertura({ linhas, datas, celulas }: Props) {
  const { caixa, mostrar, mostrarNoElemento, esconder, balao } = useDica()

  return (
    <div ref={caixa} className="relative" onPointerLeave={esconder}>
      <div className="-mx-5 overflow-x-auto px-5 pb-2 lg:mx-0 lg:px-0">
        <table className="w-full border-separate border-spacing-[2px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-[#0c0c11]" />
              {datas.map((d) => (
                <th key={d.id} scope="col" className="min-w-9 px-0 pb-1.5 font-normal">
                  <Link href={d.href} className="group block text-center">
                    <span className="text-muted-foreground block text-[10px] uppercase">{d.dia}</span>
                    <span className="block text-xs font-medium tabular-nums group-hover:underline">{d.rotulo}</span>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.id}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-[#0c0c11] pr-3 text-left text-sm font-medium whitespace-nowrap"
                >
                  {l.nome}
                </th>
                {datas.map((d) => {
                  const c = celulas[`${l.id}|${d.id}`] ?? { sim: [], sePrecisar: [] }
                  const n = c.sim.length
                  if (d.semRespostas) {
                    const cedo = { valor: 'Ninguém respondeu ainda', rotulo: `${d.dia} ${d.rotulo}` }
                    return (
                      <td key={d.id} className="p-0">
                        <div
                          tabIndex={0}
                          role="img"
                          aria-label={`${d.rotulo}: ninguém respondeu esta data ainda`}
                          onPointerMove={(e) => mostrar(e, cedo)}
                          onFocus={(e) => mostrarNoElemento(e.currentTarget, cedo)}
                          onBlur={esconder}
                          className="h-10 rounded-lg border border-dashed border-white/10 outline-none"
                        />
                      </td>
                    )
                  }
                  const conteudo = {
                    valor: n === 0 ? 'Ninguém disse sim' : `${n} ${n === 1 ? 'pode' : 'podem'}`,
                    rotulo: `${l.nome} · ${d.dia} ${d.rotulo}`,
                    detalhe: [
                      n ? `Sim: ${nomes(c.sim)}` : null,
                      c.sePrecisar.length ? `Se precisar: ${nomes(c.sePrecisar)}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Nenhuma resposta positiva ainda',
                  }
                  return (
                    <td key={d.id} className="p-0">
                      <div
                        tabIndex={0}
                        role="img"
                        aria-label={`${l.nome} em ${d.rotulo}: ${n} disseram sim, ${c.sePrecisar.length} se precisar`}
                        onPointerMove={(e) => mostrar(e, conteudo)}
                        onFocus={(e) => mostrarNoElemento(e.currentTarget, conteudo)}
                        onBlur={esconder}
                        className={`relative flex h-10 items-center justify-center rounded-lg text-xs font-semibold outline-none transition-transform hover:scale-105 focus-visible:scale-105 ${
                          n === 0 ? 'border-destructive/60 text-destructive border border-dashed' : 'text-white/90'
                        }`}
                        style={n ? { background: RAMPA[Math.min(n, 5) - 1] } : undefined}
                      >
                        {n <= 1 ? n : null}
                        {c.sePrecisar.length > 0 && (
                          <span className="bg-roxo ring-background absolute top-1 right-1 h-1.5 w-1.5 rounded-full ring-1" />
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <span className="flex items-center gap-1.5">
          Disseram sim
          {RAMPA.map((cor, i) => (
            <span key={cor} className="flex items-center gap-1">
              <span className="h-3 w-4 rounded-[3px]" style={{ background: cor }} />
              <span className="tabular-nums">{i === 4 ? '5+' : i + 1}</span>
            </span>
          ))}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="border-destructive/60 h-3 w-4 rounded-[3px] border border-dashed" />
          ninguém
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-roxo h-1.5 w-1.5 rounded-full" />
          tem alguém no se precisar
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-4 rounded-[3px] border border-dashed border-white/15" />
          ninguém respondeu ainda
        </span>
      </div>
      {balao}
    </div>
  )
}
