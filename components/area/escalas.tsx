'use client'

import { useState } from 'react'
import { Icone } from '@/components/icone'
import { useArea } from './contexto'
import {
  dataLonga,
  diaDaSemana,
  diaDoMes,
  diasAte,
  ehFire,
  iconeDoEvento,
  nomeDoEvento,
  nomeDoMes,
  quando,
} from './formato'
import type { EscalaArea, EventoArea, HistoricoArea } from './tipos'
import { Avatar, Etiqueta, TituloSecao, vidro } from './ui'

export const colegas = (escala: EscalaArea) => escala.formacao.filter((c) => !c.voce)

function StatusEscala({ escala }: { escala: EscalaArea }) {
  if (escala.status === 'confirmado')
    return (
      <Etiqueta tom="lima">
        <Icone nome="sim" className="h-3 w-3" />
        Presença confirmada
      </Etiqueta>
    )
  if (escala.status === 'imprevisto')
    return (
      <Etiqueta tom="roxo">
        <Icone nome="imprevisto" className="h-3 w-3" />
        Imprevisto avisado
      </Etiqueta>
    )
  return (
    <Etiqueta tom="neutro">
      <span className="bg-lima h-1.5 w-1.5 animate-[area-pulso_1.6s_ease-in-out_infinite] rounded-full" />
      Falta confirmar
    </Etiqueta>
  )
}

function Rostos({ escala, limite = 4 }: { escala: EscalaArea; limite?: number }) {
  const outros = colegas(escala)
  if (outros.length === 0) return null
  const nomes = outros.map((c) => c.nome)
  const texto =
    nomes.length <= 2 ? nomes.join(' e ') : `${nomes.slice(0, 2).join(', ')} e mais ${nomes.length - 2}`
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-1.5">
        {outros.slice(0, limite).map((c) => (
          <Avatar key={`${c.nome}-${c.funcao}`} nome={c.nome} foto={c.foto} tamanho="sm" />
        ))}
      </div>
      <p className="text-muted-foreground min-w-0 truncate text-sm">com {texto}</p>
    </div>
  )
}

function IconeEvento({ evento, className = 'h-3 w-3' }: { evento: EventoArea; className?: string }) {
  return (
    <Icone
      nome={iconeDoEvento(evento)}
      className={`${className} ${ehFire(evento) ? 'text-roxo-claro' : 'text-lima'}`}
    />
  )
}

/** O cartão grande do Início: a próxima vez que a pessoa toca. */
export function CartaoProximaEscala({
  escala,
  onAbrir,
  onConfirmar,
}: {
  escala: EscalaArea
  onAbrir: () => void
  onConfirmar: () => void
}) {
  const { hoje, evento } = useArea()
  const e = evento(escala.eventoId)
  if (!e) return null
  const faltam = diasAte(e.data, hoje)

  return (
    <div className="from-lima/70 via-roxo/50 relative rounded-[2rem] bg-gradient-to-br to-white/[0.04] p-px shadow-[0_30px_80px_-40px] shadow-lima/40">
      <div className="relative overflow-hidden rounded-[calc(2rem-1px)] bg-[#0c0c11] p-6 sm:p-7">
        <div className="bg-lima/15 absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl" />
        <div className="bg-roxo/20 absolute -bottom-32 -left-20 h-64 w-64 rounded-full blur-3xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-4">
            <Etiqueta tom="cheio">
              <Icone nome="musica" className="h-3 w-3" />
              {escala.planoB ? 'Você é plano B' : 'Você toca'} {faltam <= 1 ? quando(e.data, hoje) : diaDaSemana(e.data)}
            </Etiqueta>
            <div>
              <p className="text-muted-foreground text-sm capitalize">
                {nomeDoEvento(e)} · {diaDaSemana(e.data)}
              </p>
              <p className="text-4xl font-semibold tracking-tight sm:text-5xl">
                {diaDoMes(e.data)} de {nomeDoMes(e.data)}
              </p>
            </div>
          </div>
          {faltam > 1 && (
            <div className="text-right">
              <p className="text-lima text-6xl leading-none font-semibold tracking-tighter tabular-nums sm:text-7xl">
                {faltam}
              </p>
              <p className="text-muted-foreground mt-1 text-[11px] font-semibold tracking-[0.2em] uppercase">
                dias
              </p>
            </div>
          )}
        </div>

        <div className="relative mt-6 grid grid-cols-3 gap-2">
          {[
            ['Sua função', escala.funcao],
            ['Passagem', e.passagem ?? 'Sem passagem'],
            ['Começa', e.hora],
          ].map(([rotulo, valor]) => (
            <div key={rotulo} className="min-w-0 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
              <p className="text-muted-foreground text-[11px]">{rotulo}</p>
              <p className="truncate font-semibold">{valor}</p>
            </div>
          ))}
        </div>

        <button type="button" onClick={onAbrir} className="relative mt-5 w-full text-left">
          <Rostos escala={escala} />
        </button>

        <div className="relative mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          {escala.status === 'a_confirmar' ? (
            <>
              <button
                type="button"
                onClick={onConfirmar}
                className="bg-lima text-primary-foreground hover:bg-lima-clara flex h-12 items-center justify-center gap-2 rounded-2xl px-6 font-semibold shadow-[0_10px_40px_-12px] shadow-lima/60 transition-all active:scale-[0.98] sm:flex-1"
              >
                <Icone nome="sim" className="h-4 w-4" />
                Confirmo que vou
              </button>
              <button
                type="button"
                onClick={onAbrir}
                className="text-muted-foreground hover:text-foreground h-12 rounded-2xl px-5 text-sm font-medium transition-colors"
              >
                Tive um imprevisto
              </button>
            </>
          ) : (
            <div className="flex w-full items-center justify-between gap-3">
              <StatusEscala escala={escala} />
              <button
                type="button"
                onClick={onAbrir}
                className="text-lima text-sm font-medium underline-offset-4 hover:underline"
              >
                Ver a escala
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Conteúdo da Folha de uma escala: formação, horários e ações. */
export function DetalheEscala({
  escala,
  onConfirmar,
  onImprevisto,
}: {
  escala: EscalaArea
  onConfirmar: () => void
  onImprevisto: (texto: string) => Promise<void>
}) {
  const { hoje, evento } = useArea()
  const e = evento(escala.eventoId)
  const [avisando, setAvisando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [texto, setTexto] = useState('')
  if (!e) return null

  async function avisar() {
    setEnviando(true)
    try {
      await onImprevisto(texto)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-7 pb-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Etiqueta>
            <IconeEvento evento={e} />
            {nomeDoEvento(e)}
          </Etiqueta>
          <StatusEscala escala={escala} />
        </div>
        <h2 className="text-3xl font-semibold tracking-tight first-letter:uppercase">{dataLonga(e.data)}</h2>
        <p className="text-muted-foreground">{quando(e.data, hoje)}</p>
      </div>

      <div className="border-lima/25 bg-lima/[0.06] rounded-3xl border p-5">
        <p className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
          {escala.planoB ? 'Você é plano B de' : 'Você toca'}
        </p>
        <p className="text-lima mt-1 text-3xl font-semibold tracking-tight">{escala.funcao}</p>
        {escala.planoB && (
          <p className="text-muted-foreground mt-2 text-sm">
            Se alguém não puder, a liderança chama você primeiro.
          </p>
        )}
      </div>

      <div>
        <TituloSecao>Horários</TituloSecao>
        <div className="relative space-y-4 pl-6">
          {e.passagem && (
            <span className="from-roxo to-lima absolute top-2 bottom-2 left-[5px] w-px bg-gradient-to-b" />
          )}
          {(
            [
              e.passagem ? ['Passagem de som', e.passagem, 'bg-roxo'] : null,
              [nomeDoEvento(e), e.hora, 'bg-lima'],
            ].filter(Boolean) as string[][]
          ).map(([rotulo, horaTxt, cor]) => (
            <div key={rotulo} className="relative flex items-baseline justify-between">
              <span className={`absolute top-1.5 -left-6 h-[11px] w-[11px] rounded-full ring-4 ring-[#0d0d12] ${cor}`} />
              <span className="text-sm">{rotulo}</span>
              <span className="font-semibold tabular-nums">{horaTxt}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <TituloSecao>Quem toca com você</TituloSecao>
        <div className="grid grid-cols-2 gap-2.5">
          {escala.formacao.map((c) => (
            <div
              key={`${c.nome}-${c.funcao}`}
              className={`flex items-center gap-3 rounded-2xl border p-3 ${
                c.voce ? 'border-lima/40 bg-lima/[0.06]' : 'border-white/[0.07] bg-white/[0.02]'
              }`}
            >
              <Avatar nome={c.nome} foto={c.foto} destaque={c.voce} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{c.voce ? 'Você' : c.nome}</p>
                <p className="text-muted-foreground truncate text-xs">{c.funcao}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {escala.status === 'imprevisto' ? (
        <div className="border-roxo/30 bg-roxo/10 rounded-3xl border p-5 text-sm">
          <p className="font-medium">A liderança já recebeu o seu aviso.</p>
          <p className="text-muted-foreground mt-1">
            Obrigado por avisar cedo. Eles vão procurar alguém para cobrir você.
          </p>
        </div>
      ) : avisando ? (
        <div className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="font-medium">O que aconteceu?</p>
          <p className="text-muted-foreground text-sm">
            A liderança recebe na hora, junto com a lista de quem pode cobrir você.
          </p>
          <textarea
            value={texto}
            onChange={(ev) => setTexto(ev.target.value)}
            maxLength={280}
            rows={3}
            placeholder="Ex.: fiquei doente, surgiu plantão no trabalho"
            className="placeholder:text-muted-foreground/60 focus:border-roxo/60 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 text-base outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAvisando(false)}
              className="text-muted-foreground h-12 flex-1 rounded-2xl border border-white/10 text-sm font-medium"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={avisar}
              disabled={enviando}
              className="bg-roxo flex h-12 flex-[2] items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
            >
              <Icone nome="enviar" className="h-3.5 w-3.5" />
              {enviando ? 'Avisando…' : 'Avisar a liderança'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {escala.status === 'a_confirmar' && (
            <button
              type="button"
              onClick={onConfirmar}
              className="bg-lima text-primary-foreground hover:bg-lima-clara flex h-14 w-full items-center justify-center gap-2 rounded-2xl font-semibold shadow-[0_10px_40px_-12px] shadow-lima/60 transition-all active:scale-[0.98]"
            >
              <Icone nome="sim" className="h-4 w-4" />
              Confirmo que vou
            </button>
          )}
          <button
            type="button"
            onClick={() => setAvisando(true)}
            className="text-muted-foreground hover:text-foreground flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 text-sm font-medium transition-colors"
          >
            <Icone nome="imprevisto" className="h-3.5 w-3.5" />
            Tive um imprevisto
          </button>
        </div>
      )}
    </div>
  )
}

/** A aba Escalas: as próximas e o que já tocou. */
export function TelaEscalas({
  escalas,
  historico,
  tocouNoAno,
  onAbrir,
}: {
  escalas: EscalaArea[]
  historico: HistoricoArea[]
  tocouNoAno: number
  onAbrir: (eventoId: string) => void
}) {
  const { hoje, evento } = useArea()
  const funcoes = historico.map((h) => h.funcao)
  const maisTocado =
    [...new Set(funcoes)].sort(
      (a, b) => funcoes.filter((f) => f === b).length - funcoes.filter((f) => f === a).length,
    )[0] ?? 'Nada ainda'

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">Suas escalas</h1>
        <p className="text-muted-foreground mt-2">Aparecem aqui assim que a liderança publica.</p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {[
          [String(tocouNoAno), `vezes em ${hoje.slice(0, 4)}`],
          [String(escalas.length), escalas.length === 1 ? 'próxima' : 'próximas'],
          [maisTocado, 'o que mais toca'],
        ].map(([valor, rotulo]) => (
          <div key={rotulo} className={`${vidro} min-w-0 px-4 py-4`}>
            <p className="truncate text-2xl font-semibold tracking-tight tabular-nums">{valor}</p>
            <p className="text-muted-foreground text-xs">{rotulo}</p>
          </div>
        ))}
      </div>

      <section>
        <TituloSecao>Próximas</TituloSecao>
        {escalas.length === 0 ? (
          <div className={`${vidro} p-6`}>
            <p className="font-medium">Nenhuma escala publicada para você agora.</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Quando a liderança publicar uma escala com você, ela aparece aqui e no Início.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {escalas.map((s) => {
              const e = evento(s.eventoId)
              if (!e) return null
              return (
                <button
                  key={s.eventoId}
                  type="button"
                  onClick={() => onAbrir(s.eventoId)}
                  className={`${vidro} group p-5 text-left transition-colors hover:bg-white/[0.05]`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-muted-foreground text-sm first-letter:uppercase">
                        {nomeDoEvento(e)} · {quando(e.data, hoje)}
                      </p>
                      <p className="mt-0.5 text-xl font-semibold tracking-tight first-letter:uppercase">
                        {dataLonga(e.data)}
                      </p>
                    </div>
                    <Icone
                      nome="avancar"
                      className="text-muted-foreground mt-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Etiqueta tom="lima">
                      {s.planoB ? 'Plano B · ' : ''}
                      {s.funcao}
                    </Etiqueta>
                    <StatusEscala escala={s} />
                  </div>
                  <div className="mt-4">
                    <Rostos escala={s} limite={5} />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {historico.length > 0 && (
        <section>
          <TituloSecao>Já tocou</TituloSecao>
          <div className={`${vidro} divide-y divide-white/[0.06] overflow-hidden`}>
            {historico.map((h) => (
              <div key={h.data} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-11 text-center">
                  <p className="text-lg leading-none font-semibold tabular-nums">{diaDoMes(h.data)}</p>
                  <p className="text-muted-foreground mt-1 text-[10px] uppercase">
                    {nomeDoMes(h.data).slice(0, 3)}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{nomeDoEvento(h)}</p>
                  <p className="text-muted-foreground text-xs capitalize">{diaDaSemana(h.data)}</p>
                </div>
                <span className="text-muted-foreground text-right text-sm">{h.funcao}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
