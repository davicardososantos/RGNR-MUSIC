'use client'

import { useMemo, useState } from 'react'
import { Icone } from '@/components/icone'
import { useArea } from './contexto'
import {
  chaveDoMes,
  dataLonga,
  diaDaSemana,
  diaDoMes,
  ehFire,
  iconeDoEvento,
  nomeDoEvento,
  nomeDoMes,
  quando,
} from './formato'
import type { EventoArea, MinhaRespostaArea, Resposta } from './tipos'
import { Etiqueta, RESPOSTA, SeletorResposta, TituloSecao, vidro } from './ui'

type Filtro = 'todas' | 'faltam' | 'respondidas'

function porMes(eventos: EventoArea[]) {
  const mapa = new Map<string, EventoArea[]>()
  for (const e of eventos) mapa.set(chaveDoMes(e.data), [...(mapa.get(chaveDoMes(e.data)) ?? []), e])
  return [...mapa.entries()]
}

const falta = (e: EventoArea, respostas: Record<string, MinhaRespostaArea>) => e.aberto && !respostas[e.id]

function IconeEvento({ evento, className = 'h-3 w-3' }: { evento: EventoArea; className?: string }) {
  return (
    <Icone
      nome={iconeDoEvento(evento)}
      className={`shrink-0 ${className} ${ehFire(evento) ? 'text-roxo-claro' : 'text-lima'}`}
    />
  )
}

/**
 * Todas as datas daqui para frente. No celular, uma lista por mês em que
 * cada linha se responde com um toque. No computador, o calendário do mês.
 */
export function TelaDatas({
  respostas,
  escalados,
  onResponder,
  onAbrirData,
  onRapida,
}: {
  respostas: Record<string, MinhaRespostaArea>
  escalados: Record<string, string>
  onResponder: (eventoId: string, r: Resposta) => void
  onAbrirData: (eventoId: string) => void
  onRapida: () => void
}) {
  const { eventos } = useArea()
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const faltam = eventos.filter((e) => falta(e, respostas)).length

  const visiveis = eventos.filter((e) =>
    filtro === 'todas' ? true : filtro === 'faltam' ? falta(e, respostas) : Boolean(respostas[e.id]),
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">Suas datas</h1>
          <p className="text-muted-foreground mt-2">
            Marcar que pode não é ser escalado. Dá para mudar até a liderança fechar a data.
          </p>
        </div>
        {faltam > 0 && (
          <button
            type="button"
            onClick={onRapida}
            className="bg-roxo flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white shadow-[0_10px_40px_-12px] shadow-roxo/70 transition-all hover:brightness-110 active:scale-[0.97]"
          >
            <Icone nome="rapido" className="h-3.5 w-3.5" />
            Responder {faltam === 1 ? 'a que falta' : `as ${faltam} que faltam`}
          </button>
        )}
      </div>

      {eventos.length === 0 && (
        <div className={`${vidro} p-6 text-center`}>
          <p className="font-medium">Nenhuma data aberta agora.</p>
          <p className="text-muted-foreground mt-1 text-sm">Quando a liderança abrir o próximo mês, ele aparece aqui.</p>
        </div>
      )}

      {/* Celular: lista */}
      <div className="space-y-6 lg:hidden">
        {eventos.length > 0 && (
          <div className="flex gap-1 rounded-full border border-white/[0.07] bg-white/[0.03] p-1">
            {(
              [
                ['todas', 'Todas'],
                ['faltam', `Faltam ${faltam}`],
                ['respondidas', 'Respondidas'],
              ] as const
            ).map(([id, rotulo]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFiltro(id)}
                className={`h-9 flex-1 rounded-full text-sm font-medium transition-colors ${
                  filtro === id ? 'text-foreground bg-white/10' : 'text-muted-foreground'
                }`}
              >
                {rotulo}
              </button>
            ))}
          </div>
        )}

        {eventos.length > 0 && visiveis.length === 0 && (
          <p className="text-muted-foreground py-10 text-center text-sm">
            {filtro === 'faltam' ? 'Nenhuma data esperando você.' : 'Nada por aqui.'}
          </p>
        )}

        {porMes(visiveis).map(([mes, doFiltro]) => {
          const doMes = eventos.filter((e) => chaveDoMes(e.data) === mes)
          return (
            <section key={mes}>
              <div className="sticky top-[4.25rem] z-10 -mx-5 mb-3 flex items-baseline justify-between bg-[#0a0a0e]/85 px-5 py-2 backdrop-blur-md">
                <h2 className="text-lg font-semibold capitalize">{nomeDoMes(doFiltro[0].data)}</h2>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {doMes.filter((e) => respostas[e.id]).length} de {doMes.length} respondidas
                </span>
              </div>
              <div className="space-y-2">
                {doFiltro.map((e) => (
                  <LinhaData
                    key={e.id}
                    evento={e}
                    resposta={respostas[e.id]?.resposta}
                    escalado={escalados[e.id]}
                    onResponder={(r) => onResponder(e.id, r)}
                    onAbrir={() => onAbrirData(e.id)}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* Computador: calendário */}
      {eventos.length > 0 && (
        <div className="hidden lg:block">
          <Calendario respostas={respostas} escalados={escalados} onAbrirData={onAbrirData} />
        </div>
      )}
    </div>
  )
}

function LinhaData({
  evento: e,
  resposta,
  escalado,
  onResponder,
  onAbrir,
}: {
  evento: EventoArea
  resposta: Resposta | undefined
  escalado: string | undefined
  onResponder: (r: Resposta) => void
  onAbrir: () => void
}) {
  const pendente = e.aberto && !resposta
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-3 pl-2 transition-colors ${
        pendente ? 'border-roxo/35 bg-roxo/[0.07]' : 'border-white/[0.07] bg-white/[0.02]'
      }`}
    >
      <button type="button" onClick={onAbrir} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <div className="w-12 shrink-0 text-center">
          <p className="text-muted-foreground text-[10px] font-semibold uppercase">
            {diaDaSemana(e.data).slice(0, 3)}
          </p>
          <p className="text-2xl leading-tight font-semibold tabular-nums">{diaDoMes(e.data)}</p>
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-medium">
            <IconeEvento evento={e} />
            <span className="truncate">{nomeDoEvento(e)}</span>
          </p>
          <p className="text-muted-foreground text-xs">
            {e.hora}
            {e.passagem && ` · passagem ${e.passagem}`}
          </p>
          {escalado ? (
            <p className="text-lima mt-1 text-xs font-medium">Escalado · {escalado}</p>
          ) : (
            !e.aberto && <p className="text-muted-foreground mt-1 text-xs">Respostas encerradas</p>
          )}
        </div>
      </button>
      <SeletorResposta valor={resposta} onMudar={onResponder} desabilitado={!e.aberto} />
    </div>
  )
}

const SEMANA_CURTA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

function Calendario({
  respostas,
  escalados,
  onAbrirData,
}: {
  respostas: Record<string, MinhaRespostaArea>
  escalados: Record<string, string>
  onAbrirData: (eventoId: string) => void
}) {
  const { eventos } = useArea()
  const meses = useMemo(() => [...new Set(eventos.map((e) => chaveDoMes(e.data)))], [eventos])
  const [mes, setMes] = useState(meses[0])

  const [ano, numero] = mes.split('-').map(Number)
  const primeiro = new Date(ano, numero - 1, 1)
  const diasNoMes = new Date(ano, numero, 0).getDate()
  const celulas: (number | null)[] = [
    ...Array(primeiro.getDay()).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ]
  while (celulas.length % 7) celulas.push(null)

  const doDia = (dia: number) => eventos.filter((e) => e.data === `${mes}-${String(dia).padStart(2, '0')}`)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1 rounded-full border border-white/[0.07] bg-white/[0.03] p-1">
          {meses.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMes(m)}
              className={`h-9 rounded-full px-5 text-sm font-medium capitalize transition-colors ${
                mes === m ? 'text-foreground bg-white/10' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {nomeDoMes(`${m}-01`)}
            </button>
          ))}
        </div>
        <Legenda />
      </div>

      <div className={`${vidro} overflow-hidden`}>
        <div className="grid grid-cols-7 border-b border-white/[0.06]">
          {SEMANA_CURTA.map((d) => (
            <p key={d} className="text-muted-foreground py-3 text-center text-xs font-semibold uppercase">
              {d}
            </p>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {celulas.map((dia, i) => (
            <div
              key={i}
              className={`min-h-28 border-white/[0.05] p-2 ${i % 7 ? 'border-l' : ''} ${i >= 7 ? 'border-t' : ''} ${
                dia ? '' : 'bg-white/[0.01]'
              }`}
            >
              {dia && <p className="text-muted-foreground text-xs tabular-nums">{dia}</p>}
              {dia &&
                doDia(dia).map((e) => {
                  const r = respostas[e.id]?.resposta
                  const escalado = escalados[e.id]
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => onAbrirData(e.id)}
                      className={`mt-1.5 w-full rounded-xl border p-2 text-left text-xs transition-all hover:-translate-y-0.5 ${
                        escalado
                          ? 'border-lima/50 bg-lima/10'
                          : falta(e, respostas)
                            ? 'border-roxo/50 bg-roxo/10 border-dashed'
                            : 'border-white/10 bg-white/[0.04]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 font-medium">
                        <IconeEvento evento={e} className="h-2.5 w-2.5" />
                        <span className="truncate">{nomeDoEvento(e)}</span>
                      </span>
                      <span className="mt-1.5 flex items-center gap-1.5">
                        {r ? (
                          <>
                            <span className={`h-2 w-2 rounded-full ${RESPOSTA[r].ponto}`} />
                            <span className="text-muted-foreground">{RESPOSTA[r].rotulo}</span>
                          </>
                        ) : e.aberto ? (
                          <span className="text-roxo-claro">Responder</span>
                        ) : (
                          <span className="text-muted-foreground">Encerrada</span>
                        )}
                      </span>
                      {escalado && <span className="text-lima mt-1 block font-medium">Você toca</span>}
                    </button>
                  )
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Legenda() {
  return (
    <div className="text-muted-foreground flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-xs">
      {(['sim', 'se_precisar', 'nao'] as const).map((r) => (
        <span key={r} className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${RESPOSTA[r].ponto}`} />
          {RESPOSTA[r].rotulo}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="border-roxo h-2 w-2 rounded-full border border-dashed" />
        Falta responder
      </span>
    </div>
  )
}

/** Painel para responder uma data: resposta, passagem e observação. */
export function DetalheData({
  evento: e,
  resposta,
  escalado,
  onSalvar,
  onPronto,
}: {
  evento: EventoArea
  resposta: MinhaRespostaArea | undefined
  escalado: string | undefined
  onSalvar: (r: MinhaRespostaArea) => void
  onPronto: () => void
}) {
  const { hoje } = useArea()
  const [passagem, setPassagem] = useState(resposta?.passagemSom ?? true)
  const [observacao, setObservacao] = useState(resposta?.observacao ?? '')
  const valor = resposta?.resposta
  const disponivel = valor === 'sim' || valor === 'se_precisar'

  const salvar = (r: Resposta, p = passagem, o = observacao) =>
    onSalvar({ resposta: r, passagemSom: p, observacao: o.trim() || null })

  function pronto() {
    if (
      valor &&
      (passagem !== resposta?.passagemSom || (observacao.trim() || null) !== (resposta?.observacao ?? null))
    ) {
      salvar(valor)
    }
    onPronto()
  }

  return (
    <div className="space-y-7 pb-4">
      <div className="space-y-3">
        <Etiqueta>
          <IconeEvento evento={e} />
          {nomeDoEvento(e)}
        </Etiqueta>
        <h2 className="text-3xl font-semibold tracking-tight first-letter:uppercase">{dataLonga(e.data)}</h2>
        <p className="text-muted-foreground">
          {quando(e.data, hoje)} · começa {e.hora}
          {e.passagem && ` · passagem ${e.passagem}`}
        </p>
        {escalado && (
          <p className="text-lima text-sm font-medium">Você já está escalado nesta data: {escalado}.</p>
        )}
      </div>

      {!e.aberto ? (
        <div className={`${vidro} p-5 text-sm`}>
          <p className="font-medium">As respostas para esta data foram encerradas.</p>
          <p className="text-muted-foreground mt-1">
            {valor
              ? `Sua resposta ficou: ${RESPOSTA[valor].rotulo.toLowerCase()}.`
              : 'Você não chegou a responder esta.'}{' '}
            Se algo mudou, fale com a liderança.
          </p>
        </div>
      ) : (
        <>
          <div>
            <TituloSecao>Você pode?</TituloSecao>
            <SeletorResposta valor={valor} onMudar={(r) => salvar(r)} tamanho="grande" />
          </div>

          {disponivel && (
            <div className="animate-[area-surgir_260ms_ease-out] space-y-4">
              {e.passagem && (
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <span className="text-sm">Consigo chegar na passagem de som ({e.passagem})</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={passagem}
                    aria-label="Consigo chegar na passagem de som"
                    onClick={() => setPassagem((p) => !p)}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                      passagem ? 'bg-lima' : 'bg-white/15'
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                        passagem ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              )}
              <textarea
                value={observacao}
                onChange={(ev) => setObservacao(ev.target.value)}
                maxLength={280}
                rows={2}
                placeholder="Alguma observação? Ex.: só chego 20h30"
                className="placeholder:text-muted-foreground/60 focus:border-lima/50 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 text-base outline-none"
              />
            </div>
          )}
        </>
      )}

      <button
        type="button"
        onClick={pronto}
        disabled={e.aberto && !valor}
        className="bg-lima text-primary-foreground hover:bg-lima-clara disabled:text-muted-foreground h-14 w-full rounded-2xl font-semibold transition-all active:scale-[0.98] disabled:bg-white/10"
      >
        {!e.aberto ? 'Fechar' : valor ? 'Pronto' : 'Escolha uma opção'}
      </button>
    </div>
  )
}
