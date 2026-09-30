'use client'

import { Icone } from '@/components/icone'
import { useArea } from './contexto'
import { dataLonga, diaDaSemana, diaDoMes, nomeDoMes } from './formato'
import { CartaoProximaEscala } from './escalas'
import type { EscalaArea, MinhaRespostaArea } from './tipos'
import { AnelProgresso, Avatar, RESPOSTA, TituloSecao, vidro } from './ui'

export function TelaInicio({
  nome,
  saudacao,
  respostas,
  escalas,
  tocouNoAno,
  onRapida,
  onAbrirEscala,
  onConfirmar,
  onAbrirData,
  onVerDatas,
}: {
  nome: string
  saudacao: string
  respostas: Record<string, MinhaRespostaArea>
  escalas: EscalaArea[]
  tocouNoAno: number
  onRapida: () => void
  onAbrirEscala: (eventoId: string) => void
  onConfirmar: (eventoId: string) => void
  onAbrirData: (eventoId: string) => void
  onVerDatas: () => void
}) {
  const { hoje, eventos } = useArea()
  const proxima = escalas[0]
  const abertos = eventos.filter((e) => e.aberto)
  const faltam = abertos.filter((e) => !respostas[e.id])
  const escalados = new Set(escalas.map((s) => s.eventoId))

  return (
    <div className="space-y-8 lg:space-y-10">
      <div>
        <p className="text-muted-foreground text-sm first-letter:uppercase">{dataLonga(hoje)}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight lg:text-4xl">
          {saudacao}, {nome}
        </h1>
      </div>

      {proxima ? (
        <CartaoProximaEscala
          escala={proxima}
          onAbrir={() => onAbrirEscala(proxima.eventoId)}
          onConfirmar={() => onConfirmar(proxima.eventoId)}
        />
      ) : (
        <div className={`${vidro} relative overflow-hidden p-6`}>
          <div className="bg-roxo/15 absolute -top-16 -right-10 h-48 w-48 rounded-full blur-3xl" />
          <p className="relative text-lg font-semibold tracking-tight">Nenhuma escala publicada para você agora</p>
          <p className="text-muted-foreground relative mt-1 text-sm">
            Quando a liderança publicar uma escala com você, ela aparece aqui primeiro, com quem toca junto.
          </p>
        </div>
      )}

      {abertos.length > 0 &&
        (faltam.length > 0 ? (
          <button
            type="button"
            onClick={onRapida}
            className="group border-roxo/30 from-roxo/20 hover:border-roxo/60 relative flex w-full items-center gap-5 overflow-hidden rounded-[2rem] border bg-gradient-to-br to-transparent p-5 text-left transition-all active:scale-[0.99] sm:p-6"
          >
            <AnelProgresso feitas={abertos.length - faltam.length} total={abertos.length} />
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold tracking-tight">
                {faltam.length} {faltam.length === 1 ? 'data espera' : 'datas esperam'} sua resposta
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm">Menos de um minuto. Arraste os cartões e pronto.</p>
            </div>
            <span className="bg-roxo flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition-transform group-hover:translate-x-0.5">
              <Icone nome="rapido" className="h-4 w-4" />
            </span>
          </button>
        ) : (
          <div className={`${vidro} flex items-center gap-4 p-5`}>
            <span className="bg-lima/15 text-lima flex h-11 w-11 items-center justify-center rounded-full">
              <Icone nome="sim" className="h-4 w-4" />
            </span>
            <div>
              <p className="font-medium">Tudo respondido</p>
              <p className="text-muted-foreground text-sm">Obrigado! A liderança já tem suas datas.</p>
            </div>
          </div>
        ))}

      {eventos.length > 0 && (
        <section>
          <TituloSecao
            acao={
              <button
                type="button"
                onClick={onVerDatas}
                className="text-muted-foreground hover:text-foreground text-xs font-medium"
              >
                Ver todas
              </button>
            }
          >
            Próximas datas
          </TituloSecao>
          <div className="-mx-5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0">
            {eventos.slice(0, 12).map((e) => {
              const r = respostas[e.id]?.resposta
              const toco = escalados.has(e.id)
              const pendente = e.aberto && !r
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onAbrirData(e.id)}
                  className={`relative w-[6.5rem] shrink-0 snap-start rounded-2xl border px-3 py-3 text-left transition-all hover:-translate-y-0.5 lg:w-auto ${
                    toco
                      ? 'border-lima/50 bg-lima/[0.08]'
                      : pendente
                        ? 'border-roxo/40 bg-roxo/[0.06] border-dashed'
                        : 'border-white/[0.07] bg-white/[0.02]'
                  }`}
                >
                  <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                    {diaDaSemana(e.data).slice(0, 3)}
                  </p>
                  <p className="text-2xl leading-tight font-semibold tabular-nums">{diaDoMes(e.data)}</p>
                  <p className="text-muted-foreground text-[11px] capitalize">{nomeDoMes(e.data).slice(0, 3)}</p>
                  <span className="mt-2 flex items-center gap-1.5 text-[11px]">
                    {toco ? (
                      <span className="text-lima font-medium">Você toca</span>
                    ) : r ? (
                      <>
                        <span className={`h-1.5 w-1.5 rounded-full ${RESPOSTA[r].ponto}`} />
                        <span className="text-muted-foreground truncate">{RESPOSTA[r].rotulo}</span>
                      </>
                    ) : pendente ? (
                      <span className="text-roxo-claro font-medium">Responder</span>
                    ) : (
                      <span className="text-muted-foreground">Encerrada</span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* No celular e em telas médias, o que no computador fica na lateral */}
      <div className="xl:hidden">
        <Numeros escalas={escalas} respostas={respostas} tocouNoAno={tocouNoAno} />
      </div>
    </div>
  )
}

function Numeros({
  escalas,
  respostas,
  tocouNoAno,
}: {
  escalas: EscalaArea[]
  respostas: Record<string, MinhaRespostaArea>
  tocouNoAno: number
}) {
  const { hoje, eventos } = useArea()
  const abertos = eventos.filter((e) => e.aberto)
  const respondidas = abertos.filter((e) => respostas[e.id]).length
  return (
    <section>
      <TituloSecao>Seu {hoje.slice(0, 4)}</TituloSecao>
      <div className="grid grid-cols-3 gap-2.5">
        {[
          [String(tocouNoAno), tocouNoAno === 1 ? 'vez tocou' : 'vezes tocou'],
          [String(escalas.length), escalas.length === 1 ? 'escala marcada' : 'escalas marcadas'],
          [abertos.length ? `${Math.round((respondidas / abertos.length) * 100)}%` : '100%', 'datas respondidas'],
        ].map(([valor, rotulo]) => (
          <div key={rotulo} className={`${vidro} min-w-0 px-4 py-4`}>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">{valor}</p>
            <p className="text-muted-foreground text-xs">{rotulo}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/** Coluna da direita no computador: a formação da próxima escala e os números. */
export function LateralInicio({
  escalas,
  respostas,
  tocouNoAno,
  onAbrirEscala,
}: {
  escalas: EscalaArea[]
  respostas: Record<string, MinhaRespostaArea>
  tocouNoAno: number
  onAbrirEscala: (eventoId: string) => void
}) {
  const { evento } = useArea()
  const proxima = escalas[0]
  const e = proxima ? evento(proxima.eventoId) : undefined
  return (
    <>
      {proxima && e && (
        <section>
          <TituloSecao>Com você {diaDaSemana(e.data)}</TituloSecao>
          <div className={`${vidro} divide-y divide-white/[0.05] overflow-hidden`}>
            {proxima.formacao.map((c) => (
              <button
                key={`${c.nome}-${c.funcao}`}
                type="button"
                onClick={() => onAbrirEscala(proxima.eventoId)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
              >
                <Avatar nome={c.nome} foto={c.foto} tamanho="sm" destaque={c.voce} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{c.voce ? 'Você' : c.nome}</span>
                  <span className="text-muted-foreground block truncate text-xs">{c.funcao}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
      <Numeros escalas={escalas} respostas={respostas} tocouNoAno={tocouNoAno} />
    </>
  )
}
