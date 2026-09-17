'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { SeletorNome } from './seletor-nome'
import { PassoDados, type DadosDoMusico } from './passo-dados'
import { CartaoData, type RespostaLocal } from './cartao-data'
import { Icone, type NomeIcone } from '@/components/icone'
import { abrirFormulario, salvarDados, salvarResposta } from '@/actions/disponibilidade'
import { chaveDoMes, dataCurta, diaEMes, nomeDaChave } from '@/lib/datas'
import {
  RESPOSTA_LABEL,
  type Evento,
  type Instrumento,
  type RespostaDisponibilidade,
} from '@/lib/tipos'
import type { MusicoDaLista } from '@/lib/dados'

type Etapa = 'nome' | 'dados' | 'datas' | 'pronto'

const VAZIA: RespostaLocal = { resposta: null, passagemSom: false, observacao: '' }

const ICONE_DA_RESPOSTA: Record<RespostaDisponibilidade, NomeIcone> = {
  sim: 'sim',
  se_precisar: 'sePrecisar',
  nao: 'nao',
}

/**
 * As datas abertas, separadas por mês na ordem do calendário.
 *
 * Com três meses abertos ao mesmo tempo, uma lista corrida de 22 cartões não
 * dava noção de progresso: a pessoa rolava sem saber onde outubro acabava.
 */
function agruparPorMes(eventos: Evento[]) {
  const mapa = new Map<string, Evento[]>()
  for (const e of eventos) {
    const chave = chaveDoMes(e.data)
    mapa.set(chave, [...(mapa.get(chave) ?? []), e])
  }
  return [...mapa.entries()].map(([chave, doMes]) => ({
    chave,
    nome: nomeDaChave(chave),
    eventos: doMes,
  }))
}

export function Formulario({
  musicos,
  eventos,
  instrumentos,
  prazo,
  totalAberto,
  jaRespondidas,
}: {
  musicos: MusicoDaLista[]
  eventos: Evento[]
  instrumentos: Instrumento[]
  prazo: string | null
  totalAberto: number
  jaRespondidas: Record<string, number>
}) {
  const [etapa, setEtapa] = useState<Etapa>('nome')
  const [slug, setSlug] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [abrindo, setAbrindo] = useState<string | null>(null)
  const [salvandoDados, setSalvandoDados] = useState(false)

  const [dados, setDados] = useState<DadosDoMusico>({
    whatsapp: '',
    principal: null,
    cobertura: [],
  })

  const [respostas, setRespostas] = useState<Record<string, RespostaLocal>>({})
  const [salvos, setSalvos] = useState<Record<string, boolean>>({})

  // Mês já respondido inteiro começa recolhido, e só o toque da pessoa muda
  // isso depois. Recolher sozinho no meio do preenchimento faria a lista
  // pular embaixo do dedo bem na hora de conferir o que foi marcado.
  const [recolhidos, setRecolhidos] = useState<Set<string>>(new Set())

  const meses = useMemo(() => agruparPorMes(eventos), [eventos])

  // Um timer por data: o músico toca em "Sim" e a gravação sai logo depois,
  // sem travar a interface nem disparar uma requisição por tecla digitada.
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const gravar = useCallback(
    async (eventoId: string, valor: RespostaLocal, quemSlug: string) => {
      if (!valor.resposta) return
      try {
        await salvarResposta({
          slug: quemSlug,
          eventoId,
          resposta: valor.resposta,
          passagemSom: valor.passagemSom,
          observacao: valor.observacao || null,
        })
        setSalvos((s) => ({ ...s, [eventoId]: true }))
      } catch (e) {
        setSalvos((s) => ({ ...s, [eventoId]: false }))
        toast.error(e instanceof Error ? e.message : 'Não consegui salvar')
      }
    },
    [],
  )

  function mudarResposta(eventoId: string, valor: RespostaLocal) {
    const antes = respostas[eventoId] ?? VAZIA
    const mudouSoOTexto =
      antes.resposta === valor.resposta && antes.passagemSom === valor.passagemSom

    setRespostas((r) => ({ ...r, [eventoId]: valor }))
    setSalvos((s) => ({ ...s, [eventoId]: false }))

    const pendente = timers.current.get(eventoId)
    if (pendente) clearTimeout(pendente)

    // Toque em Sim/Se precisar/Não grava na hora. Esperar 700ms abria uma
    // janela real de perda: no celular a pessoa marca a última data e sai
    // do navegador no mesmo segundo.
    if (!mudouSoOTexto) {
      timers.current.delete(eventoId)
      if (slug) void gravar(eventoId, valor, slug)
      return
    }

    // Só a observação é digitada, e aí a espera evita uma ida ao servidor
    // por tecla.
    const t = setTimeout(() => {
      timers.current.delete(eventoId)
      if (slug) void gravar(eventoId, valor, slug)
    }, 700)

    timers.current.set(eventoId, t)
  }

  /** Garante que nada fique pendente antes de mostrar a tela de conclusão. */
  async function descarregarPendentes() {
    if (!slug) return
    const pendentes = [...timers.current.entries()]
    timers.current.forEach((t) => clearTimeout(t))
    timers.current.clear()
    await Promise.all(
      pendentes.map(([eventoId]) => gravar(eventoId, respostas[eventoId], slug)),
    )
  }

  /**
   * Volta para a lista de nomes. Cancela o que estiver pendente em vez de
   * gravar: quem clica em "não sou eu" está dizendo que a resposta não é
   * dele, e não faz sentido persistir mais nada naquele nome.
   */
  function trocarNome() {
    timers.current.forEach((t) => clearTimeout(t))
    timers.current.clear()
    setEtapa('nome')
    setSlug(null)
    setNome('')
    setRespostas({})
    setSalvos({})
    setRecolhidos(new Set())
    setDados({ whatsapp: '', principal: null, cobertura: [] })
  }

  async function escolherNome(escolhido: string) {
    setAbrindo(escolhido)
    try {
      const dado = await abrirFormulario(escolhido)
      setSlug(escolhido)
      setNome(dado.nome)
      setDados({
        whatsapp: dado.dados.whatsapp ?? '',
        principal: dado.dados.instrumentoPrincipal,
        cobertura: dado.dados.instrumentosCobertura,
      })

      const mapa: Record<string, RespostaLocal> = {}
      const marcados: Record<string, boolean> = {}
      for (const r of dado.respostas) {
        mapa[r.evento_id] = {
          resposta: r.resposta,
          passagemSom: r.passagem_som,
          observacao: r.observacao ?? '',
        }
        marcados[r.evento_id] = true
      }
      setRespostas(mapa)
      setSalvos(marcados)
      setEtapa('dados')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não consegui abrir o formulário')
    } finally {
      setAbrindo(null)
    }
  }

  async function continuarDosDados() {
    if (!slug) return
    setSalvandoDados(true)
    try {
      await salvarDados({
        slug,
        whatsapp: dados.whatsapp || null,
        principal: dados.principal,
        cobertura: dados.cobertura,
      })
      setRecolhidos(
        new Set(
          meses
            .filter((m) => m.eventos.every((e) => respostas[e.id]?.resposta))
            .map((m) => m.chave),
        ),
      )
      setEtapa('datas')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não consegui salvar seus dados')
    } finally {
      setSalvandoDados(false)
    }
  }

  const respondidas = eventos.filter((e) => respostas[e.id]?.resposta).length

  // ----------------------------------------------------------------

  if (etapa === 'nome') {
    return (
      <SeletorNome
        musicos={musicos}
        jaRespondidas={jaRespondidas}
        totalAberto={totalAberto}
        onEscolher={escolherNome}
        carregando={abrindo}
      />
    )
  }

  if (etapa === 'dados') {
    return (
      <PassoDados
        nome={nome}
        instrumentos={instrumentos}
        dados={dados}
        onMudar={setDados}
        onContinuar={continuarDosDados}
        onTrocarNome={trocarNome}
        salvando={salvandoDados}
      />
    )
  }

  if (etapa === 'datas') {
    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight">
              Em quais datas você pode?
            </h2>
            <button
              type="button"
              onClick={trocarNome}
              className="text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-1.5 text-sm underline-offset-4 hover:underline"
            >
              <Icone nome="trocar" className="h-3 w-3" />
              {nome}
            </button>
          </div>
          <p className="text-muted-foreground text-sm">
            Marcar que pode <strong>não</strong> quer dizer que você foi escalado, mas
            que a liderança irá fechar a escala depois e te notificar.
          </p>
        </div>

        <div className="bg-muted/50 space-y-2 rounded-lg px-3 py-2.5">
          <div className="flex items-center justify-between text-sm">
            <span>
              {respondidas === eventos.length ? (
                <span className="text-lima flex items-center gap-1.5">
                  <Icone nome="sim" className="h-3.5 w-3.5" />
                  todas as {eventos.length} respondidas
                </span>
              ) : (
                `${respondidas} de ${eventos.length} respondidas`
              )}
            </span>
            {prazo && (
              <span className="text-muted-foreground">até {diaEMes(prazo)}</span>
            )}
          </div>
          <div className="bg-muted h-1 overflow-hidden rounded-full">
            <div
              className="bg-lima h-full rounded-full transition-all"
              style={{ width: `${(respondidas / eventos.length) * 100}%` }}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Salva sozinho a cada toque. Você não precisa apertar nada no final.
          </p>
        </div>

        <div className="space-y-4">
          {meses.map((mes) => {
            const feitas = mes.eventos.filter((e) => respostas[e.id]?.resposta).length
            const completo = feitas === mes.eventos.length
            const aberto = !recolhidos.has(mes.chave)

            return (
              <section key={mes.chave} className="space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    setRecolhidos((atual) => {
                      const proximo = new Set(atual)
                      if (!proximo.delete(mes.chave)) proximo.add(mes.chave)
                      return proximo
                    })
                  }
                  className="border-border hover:bg-accent/40 flex w-full items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-medium capitalize">{mes.nome}</span>
                    {completo && <Icone nome="sim" className="text-lima h-3.5 w-3.5" />}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-2 text-xs">
                    {feitas} de {mes.eventos.length}
                    <Icone
                      nome="expandir"
                      className={`h-3 w-3 transition-transform ${aberto ? '' : '-rotate-90'}`}
                    />
                  </span>
                </button>

                {aberto && (
                  <div className="space-y-3">
                    {mes.eventos.map((e) => (
                      <CartaoData
                        key={e.id}
                        evento={e}
                        valor={respostas[e.id] ?? VAZIA}
                        onMudar={(v) => mudarResposta(e.id, v)}
                        salvo={Boolean(salvos[e.id])}
                      />
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>

        <Button
          onClick={async () => {
            await descarregarPendentes()
            setEtapa('pronto')
          }}
          disabled={respondidas === 0}
          className="h-12 w-full text-base"
        >
          {respondidas === 0
            ? 'Marque pelo menos uma data'
            : respondidas < eventos.length
              ? `Concluir (faltam ${eventos.length - respondidas})`
              : 'Concluir'}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5 text-center">
        <Icone nome="concluido" className="text-lima mx-auto h-10 w-10" />
        <h2 className="text-xl font-semibold tracking-tight">Valeu, {nome}!</h2>
        <p className="text-muted-foreground text-sm">
          Sua resposta chegou. Você pode voltar neste link e mudar quando quiser.
        </p>
      </div>

      <div className="border-border divide-border divide-y rounded-xl border">
        {meses.map((mes) => (
          <div key={mes.chave}>
            <p className="text-muted-foreground bg-muted/40 px-4 py-1.5 text-xs font-medium tracking-wide uppercase">
              {mes.nome}
            </p>
            <div className="divide-border divide-y">
              {mes.eventos.map((e) => {
                const r = respostas[e.id]?.resposta
                return (
                  <div
                    key={e.id}
                    className="flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <span className="capitalize">{dataCurta(e.data)}</span>
                    {r ? (
                      <span className="flex items-center gap-2">
                        <Icone nome={ICONE_DA_RESPOSTA[r]} className="h-3.5 w-3.5" />
                        {RESPOSTA_LABEL[r].curto}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">sem resposta</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-2">
        <Button variant="outline" onClick={() => setEtapa('datas')} className="h-12 text-base">
          Mudar minha resposta
        </Button>
        <Button
          variant="ghost"
          onClick={trocarNome}
          className="text-muted-foreground h-12 text-base"
        >
          Responder por outra pessoa
        </Button>
      </div>
    </div>
  )
}
