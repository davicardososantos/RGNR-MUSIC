'use client'

import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { Icone } from '@/components/icone'
import { useArea } from './contexto'
import { diaDaSemana, diaDoMes, ehFire, iconeDoEvento, nomeDoEvento, nomeDoMes, quando } from './formato'
import type { EventoArea, Resposta } from './tipos'
import { Comemoracao, RESPOSTA } from './ui'

const LIMIAR = 110

/**
 * Responder as datas que faltam, uma de cada vez, como cartões.
 *
 * Arrastar para a direita é "sim", para a esquerda "não", para cima "se
 * precisar". Os três botões fazem o mesmo, e no computador as setas do
 * teclado também. Cada resposta grava na hora, uma Server Action por cartão.
 *
 * "Chego na passagem de som" vem ligado em todo cartão e a pessoa desliga se
 * for o caso: sem isso, toda resposta rápida chegaria para os gestores como
 * "não passa o som", que na escala é aviso.
 */
export function RespostaRapida({
  fila,
  onResponder,
  onFechar,
}: {
  fila: EventoArea[]
  onResponder: (eventoId: string, resposta: Resposta, passagemSom: boolean) => void
  onFechar: () => void
}) {
  const { hoje } = useArea()
  const [indice, setIndice] = useState(0)
  const [semPassagem, setSemPassagem] = useState<Set<string>>(new Set())
  const [feitas, setFeitas] = useState<Resposta[]>([])
  const [arrasto, setArrasto] = useState({ x: 0, y: 0 })
  const [arrastando, setArrastando] = useState(false)
  const [saindo, setSaindo] = useState<Resposta | null>(null)
  const inicio = useRef<{ x: number; y: number } | null>(null)

  const atual = fila[indice]
  const terminou = indice >= fila.length

  const decidir = useCallback(
    (r: Resposta) => {
      if (!atual || saindo) return
      setSaindo(r)
      if ('vibrate' in navigator) navigator.vibrate?.(12)
      setTimeout(() => {
        onResponder(atual.id, r, !semPassagem.has(atual.id))
        setFeitas((f) => [...f, r])
        setSaindo(null)
        setArrasto({ x: 0, y: 0 })
        setIndice((i) => i + 1)
      }, 280)
    },
    [atual, saindo, onResponder, semPassagem],
  )

  // Volta para o cartão anterior. A resposta dada continua salva até a
  // pessoa escolher outra, que grava por cima.
  const desfazer = useCallback(() => {
    if (indice === 0 || saindo) return
    setFeitas((f) => f.slice(0, -1))
    setIndice((i) => i - 1)
  }, [indice, saindo])

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar()
      else if (terminou) return
      else if (e.key === 'ArrowRight') decidir('sim')
      else if (e.key === 'ArrowLeft') decidir('nao')
      else if (e.key === 'ArrowUp') decidir('se_precisar')
      else if (e.key === 'Backspace') desfazer()
    }
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', tecla)
    return () => {
      document.body.style.overflow = antes
      window.removeEventListener('keydown', tecla)
    }
  }, [decidir, desfazer, onFechar, terminou])

  // ---------------- arrastar ----------------

  function comecar(e: PointerEvent<HTMLDivElement>) {
    if (saindo || (e.target as HTMLElement).closest('[data-sem-arrasto]')) return
    inicio.current = { x: e.clientX, y: e.clientY }
    setArrastando(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function mover(e: PointerEvent<HTMLDivElement>) {
    if (!inicio.current) return
    setArrasto({ x: e.clientX - inicio.current.x, y: e.clientY - inicio.current.y })
  }

  function soltar() {
    if (!inicio.current) return
    inicio.current = null
    setArrastando(false)
    const { x, y } = arrasto
    if (-y > LIMIAR && Math.abs(y) > Math.abs(x)) decidir('se_precisar')
    else if (x > LIMIAR) decidir('sim')
    else if (x < -LIMIAR) decidir('nao')
    else setArrasto({ x: 0, y: 0 })
  }

  const forca = (v: number) => Math.max(0, Math.min(1, v / LIMIAR))
  const intencao = {
    sim: saindo === 'sim' ? 1 : forca(arrasto.x),
    nao: saindo === 'nao' ? 1 : forca(-arrasto.x),
    se_precisar:
      saindo === 'se_precisar' ? 1 : Math.abs(arrasto.y) > Math.abs(arrasto.x) ? forca(-arrasto.y) : 0,
  }

  const transformacao = saindo
    ? {
        sim: 'translate(130vw, 40px) rotate(24deg)',
        nao: 'translate(-130vw, 40px) rotate(-24deg)',
        se_precisar: 'translate(0, -120vh) rotate(0deg)',
      }[saindo]
    : `translate(${arrasto.x}px, ${arrasto.y}px) rotate(${arrasto.x / 16}deg)`

  // ---------------- tela ----------------

  const resumo = {
    sim: feitas.filter((r) => r === 'sim').length,
    se_precisar: feitas.filter((r) => r === 'se_precisar').length,
    nao: feitas.filter((r) => r === 'nao').length,
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Resposta rápida"
      className="fixed inset-0 z-50 flex animate-[area-surgir_260ms_ease-out] flex-col bg-[#07070a]/95 backdrop-blur-2xl"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="bg-lima/20 absolute top-1/3 -right-40 h-96 w-96 rounded-full blur-[120px] transition-opacity duration-200"
          style={{ opacity: intencao.sim }}
        />
        <div
          className="absolute top-1/3 -left-40 h-96 w-96 rounded-full bg-white/10 blur-[120px] transition-opacity duration-200"
          style={{ opacity: intencao.nao }}
        />
        <div
          className="bg-roxo/30 absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-[120px] transition-opacity duration-200"
          style={{ opacity: intencao.se_precisar }}
        />
      </div>

      {/* Topo: fechar, progresso, desfazer */}
      <div className="relative mx-auto flex w-full max-w-md items-center gap-4 px-5 pt-[max(env(safe-area-inset-top),1.25rem)]">
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar"
          className="text-muted-foreground hover:text-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10"
        >
          <Icone nome="fechar" className="h-4 w-4" />
        </button>
        <div className="flex-1 space-y-1.5">
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>Resposta rápida</span>
            <span className="tabular-nums">
              {Math.min(indice + (terminou ? 0 : 1), fila.length)} de {fila.length}
            </span>
          </div>
          <div className="flex gap-1">
            {fila.map((e, i) => (
              <span
                key={e.id}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  i < indice ? RESPOSTA[feitas[i]].ponto : i === indice ? 'bg-white/40' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={desfazer}
          disabled={indice === 0}
          aria-label="Desfazer a última"
          title="Desfazer"
          className="text-muted-foreground hover:text-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 disabled:opacity-30"
        >
          <Icone nome="desfazer" className="h-3.5 w-3.5" />
        </button>
      </div>

      {terminou ? (
        <div className="relative mx-auto flex w-full max-w-md flex-1 animate-[area-surgir_400ms_ease-out] flex-col items-center justify-center px-6 text-center">
          <Comemoracao />
          <h2 className="mt-8 text-3xl font-semibold tracking-tight">Tudo respondido!</h2>
          <p className="text-muted-foreground mt-2">
            Suas respostas já chegaram para a liderança. Dá para mudar quando quiser, em Datas.
          </p>
          <div className="mt-8 flex gap-3">
            {(['sim', 'se_precisar', 'nao'] as const).map((r) => (
              <div key={r} className="w-24 rounded-2xl border border-white/[0.07] bg-white/[0.03] py-3">
                <p className={`text-2xl font-semibold tabular-nums ${RESPOSTA[r].texto}`}>{resumo[r]}</p>
                <p className="text-muted-foreground text-xs">{RESPOSTA[r].rotulo}</p>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="bg-lima text-primary-foreground hover:bg-lima-clara mt-10 h-14 w-full rounded-2xl font-semibold transition-all active:scale-[0.98]"
          >
            Voltar ao início
          </button>
        </div>
      ) : (
        <>
          {/* A pilha de cartões */}
          <div className="relative mx-auto flex w-full max-w-md flex-1 items-center justify-center px-6 py-6">
            <div className="relative aspect-[3/4] max-h-[58dvh] w-full">
              {fila
                .slice(indice, indice + 3)
                .map((e, i) => ({ e, i }))
                .reverse()
                .map(({ e, i }) => {
                  const topo = i === 0
                  return (
                    <div
                      key={e.id}
                      onPointerDown={topo ? comecar : undefined}
                      onPointerMove={topo ? mover : undefined}
                      onPointerUp={topo ? soltar : undefined}
                      onPointerCancel={topo ? soltar : undefined}
                      className={`absolute inset-0 overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] select-none ${
                        topo ? 'cursor-grab touch-none active:cursor-grabbing' : 'pointer-events-none'
                      } ${
                        e.tipo === 'fire'
                          ? 'bg-gradient-to-br from-[#2a1f43] via-[#15121f] to-[#0d0d12]'
                          : 'bg-gradient-to-br from-[#1f2a10] via-[#12150e] to-[#0d0d12]'
                      }`}
                      style={{
                        transform: topo
                          ? transformacao
                          : `translateY(${i * 16}px) scale(${1 - i * 0.05})`,
                        transition:
                          topo && arrastando ? 'none' : 'transform 300ms cubic-bezier(.2,.9,.25,1)',
                        opacity: i === 2 ? 0.5 : 1,
                      }}
                    >
                      <CartaoData
                        evento={e}
                        hoje={hoje}
                        passagem={!semPassagem.has(e.id)}
                        onPassagem={() =>
                          setSemPassagem((atual) => {
                            const novo = new Set(atual)
                            if (!novo.delete(e.id)) novo.add(e.id)
                            return novo
                          })
                        }
                      />
                      {topo && (
                        <>
                          <Carimbo texto="Sim" className="border-lima text-lima top-8 left-6 -rotate-12" forca={intencao.sim} />
                          <Carimbo texto="Não" className="top-8 right-6 rotate-12 border-white/70 text-white/80" forca={intencao.nao} />
                          <Carimbo
                            texto="Se precisar"
                            className="border-roxo-claro text-roxo-claro bottom-24 left-1/2 -translate-x-1/2"
                            forca={intencao.se_precisar}
                          />
                        </>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Os três botões */}
          <div className="relative mx-auto w-full max-w-md px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
            <div className="flex items-end justify-center gap-6">
              <BotaoGrande rotulo="Não" tecla="←" onClick={() => decidir('nao')} className="h-16 w-16 border border-white/15 bg-white/[0.06] text-white hover:bg-white/10">
                <Icone nome="nao" className="h-6 w-6" />
              </BotaoGrande>
              <BotaoGrande rotulo="Se precisar" tecla="↑" onClick={() => decidir('se_precisar')} className="bg-roxo h-14 w-14 text-white hover:brightness-110">
                <Icone nome="sePrecisar" className="h-5 w-5" />
              </BotaoGrande>
              <BotaoGrande rotulo="Sim" tecla="→" onClick={() => decidir('sim')} className="bg-lima text-primary-foreground hover:bg-lima-clara h-16 w-16 shadow-[0_10px_40px_-10px] shadow-lima/60">
                <Icone nome="sim" className="h-6 w-6" />
              </BotaoGrande>
            </div>
            <p className="text-muted-foreground mt-5 text-center text-xs">
              <span className="lg:hidden">Arraste o cartão ou toque num botão</span>
              <span className="hidden lg:inline">Arraste o cartão ou use as setas do teclado</span>
            </p>
          </div>
        </>
      )}
    </div>
  )
}

function CartaoData({
  evento: e,
  hoje,
  passagem,
  onPassagem,
}: {
  evento: EventoArea
  hoje: string
  passagem: boolean
  onPassagem: () => void
}) {
  return (
    <div className="flex h-full flex-col justify-between p-7">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-sm font-medium">
          <Icone nome={iconeDoEvento(e)} className={`h-3.5 w-3.5 ${ehFire(e) ? 'text-roxo-claro' : 'text-lima'}`} />
          {nomeDoEvento(e)}
        </span>
        <span className="text-muted-foreground text-sm">{quando(e.data, hoje)}</span>
      </div>

      <div>
        <p className="text-muted-foreground text-lg capitalize">{diaDaSemana(e.data)}</p>
        <p className="text-[7.5rem] leading-[0.85] font-semibold tracking-tighter tabular-nums">
          {diaDoMes(e.data)}
        </p>
        <p className="mt-2 text-2xl font-medium capitalize">{nomeDoMes(e.data)}</p>
      </div>

      <div className="flex items-end justify-between gap-4 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Começa</p>
          <p className="text-base font-medium">{e.hora}</p>
        </div>
        {e.passagem && (
          <button
            type="button"
            data-sem-arrasto
            onClick={onPassagem}
            role="switch"
            aria-checked={passagem}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 py-2 pr-2 pl-3 text-left"
          >
            <span>
              <span className="text-muted-foreground block text-xs">Chego na passagem</span>
              <span className="block text-base font-medium">{e.passagem}</span>
            </span>
            <span className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${passagem ? 'bg-lima' : 'bg-white/15'}`}>
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${passagem ? 'left-5' : 'left-1'}`}
              />
            </span>
          </button>
        )}
      </div>
    </div>
  )
}

function Carimbo({ texto, forca, className }: { texto: string; forca: number; className: string }) {
  return (
    <span
      className={`pointer-events-none absolute rounded-xl border-[3px] px-3 py-1 text-2xl font-bold tracking-wider uppercase ${className}`}
      style={{ opacity: forca, scale: `${0.8 + forca * 0.2}` }}
    >
      {texto}
    </span>
  )
}

function BotaoGrande({
  rotulo,
  tecla,
  onClick,
  className,
  children,
}: {
  rotulo: string
  tecla: string
  onClick: () => void
  className: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        aria-label={rotulo}
        className={`flex items-center justify-center rounded-full transition-all active:scale-90 ${className}`}
      >
        {children}
      </button>
      <span className="text-muted-foreground text-xs">
        {rotulo}
        <span className="ml-1 hidden rounded border border-white/15 px-1 text-[10px] lg:inline">{tecla}</span>
      </span>
    </div>
  )
}
