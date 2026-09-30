'use client'

import { Icone } from '@/components/icone'
import {
  EU,
  EVENTOS,
  HOJE,
  dataLonga,
  diaDaSemana,
  diaDoMes,
  nomeDoMes,
  type EscalaExemplo,
  type Resposta,
} from './dados-exemplo'
import { CartaoProximaEscala, eventoDa } from './escalas'
import { AnelProgresso, Avatar, RESPOSTA, TituloSecao, vidro } from './ui'

function saudacao() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

export function TelaInicio({
  respostas,
  escalas,
  onRapida,
  onAbrirEscala,
  onConfirmar,
  onAbrirData,
  onVerDatas,
}: {
  respostas: Record<string, Resposta>
  escalas: EscalaExemplo[]
  onRapida: () => void
  onAbrirEscala: (eventoId: string) => void
  onConfirmar: (eventoId: string) => void
  onAbrirData: (eventoId: string) => void
  onVerDatas: () => void
}) {
  const proxima = escalas[0]
  const faltam = EVENTOS.filter((e) => !respostas[e.id])
  const feitas = EVENTOS.length - faltam.length
  const escalados = new Set(escalas.map((s) => s.eventoId))

  return (
    <div className="space-y-8 lg:space-y-10">
      <div>
        <p className="text-muted-foreground text-sm first-letter:uppercase">{dataLonga(HOJE)}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight lg:text-4xl">
          {saudacao()}, {EU.nome}
        </h1>
      </div>

      {proxima ? (
        <CartaoProximaEscala
          escala={proxima}
          onAbrir={() => onAbrirEscala(proxima.eventoId)}
          onConfirmar={() => onConfirmar(proxima.eventoId)}
        />
      ) : (
        <div className={`${vidro} p-6`}>
          <p className="font-medium">Nenhuma escala publicada para você ainda.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Quando a liderança publicar, ela aparece aqui primeiro.
          </p>
        </div>
      )}

      {faltam.length > 0 ? (
        <button
          type="button"
          onClick={onRapida}
          className="group border-roxo/30 from-roxo/20 relative flex w-full items-center gap-5 overflow-hidden rounded-[2rem] border bg-gradient-to-br to-transparent p-5 text-left transition-all hover:border-roxo/60 active:scale-[0.99] sm:p-6"
        >
          <AnelProgresso feitas={feitas} total={EVENTOS.length} />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold tracking-tight">
              {faltam.length} {faltam.length === 1 ? 'data espera' : 'datas esperam'} sua resposta
            </p>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Menos de um minuto. Arraste os cartões e pronto.
            </p>
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
      )}

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
          {EVENTOS.slice(0, 10).map((e) => {
            const r = respostas[e.id]
            const toco = escalados.has(e.id)
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => onAbrirData(e.id)}
                className={`relative w-[5.5rem] shrink-0 snap-start rounded-2xl border px-3 py-3 text-left transition-all hover:-translate-y-0.5 lg:w-auto ${
                  toco
                    ? 'border-lima/50 bg-lima/[0.08]'
                    : r
                      ? 'border-white/[0.07] bg-white/[0.02]'
                      : 'border-roxo/40 border-dashed bg-roxo/[0.06]'
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
                      <span className="text-muted-foreground">{RESPOSTA[r].rotulo}</span>
                    </>
                  ) : (
                    <span className="text-roxo-claro font-medium">Responder</span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* No celular e em telas médias, o que no computador fica na lateral */}
      <div className="xl:hidden">
        <Numeros escalas={escalas} respostas={respostas} />
      </div>
    </div>
  )
}

function Numeros({ escalas, respostas }: { escalas: EscalaExemplo[]; respostas: Record<string, Resposta> }) {
  const respondidas = EVENTOS.filter((e) => respostas[e.id]).length
  return (
    <section>
      <TituloSecao>Seu 2026</TituloSecao>
      <div className="grid grid-cols-3 gap-2.5">
        {[
          [String(EU.tocouNoAno), 'vezes tocou'],
          [String(escalas.length), 'escalas marcadas'],
          [`${Math.round((respondidas / EVENTOS.length) * 100)}%`, 'datas respondidas'],
        ].map(([valor, rotulo]) => (
          <div key={rotulo} className={`${vidro} px-4 py-4`}>
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
  onAbrirEscala,
}: {
  escalas: EscalaExemplo[]
  respostas: Record<string, Resposta>
  onAbrirEscala: (eventoId: string) => void
}) {
  const proxima = escalas[0]
  return (
    <>
      {proxima && (
        <section>
          <TituloSecao>
            Com você {diaDaSemana(eventoDa(proxima).data)}
          </TituloSecao>
          <div className={`${vidro} divide-y divide-white/[0.05] overflow-hidden`}>
            {proxima.formacao.map((c) => (
              <button
                key={c.nome}
                type="button"
                onClick={() => onAbrirEscala(proxima.eventoId)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
              >
                <Avatar nome={c.nome} tamanho="sm" destaque={c.voce} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{c.voce ? 'Você' : c.nome}</span>
                  <span className="text-muted-foreground block truncate text-xs">{c.funcao}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
      <Numeros escalas={escalas} respostas={respostas} />
    </>
  )
}
