'use client'

import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { SeletorNome } from './seletor-nome'
import { PassoDados, type DadosDoMusico } from './passo-dados'
import { CartaoData, type RespostaLocal } from './cartao-data'
import { Icone, type NomeIcone } from '@/components/icone'
import { abrirFormulario, salvarDados, salvarResposta } from '@/actions/disponibilidade'
import { dataCurta, diaEMes } from '@/lib/datas'
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

export function Formulario({
  musicos,
  eventos,
  instrumentos,
  prazo,
  jaRespondidos,
}: {
  musicos: MusicoDaLista[]
  eventos: Evento[]
  instrumentos: Instrumento[]
  prazo: string | null
  jaRespondidos: string[]
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
    setRespostas((r) => ({ ...r, [eventoId]: valor }))
    setSalvos((s) => ({ ...s, [eventoId]: false }))

    const anterior = timers.current.get(eventoId)
    if (anterior) clearTimeout(anterior)

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
        jaRespondidos={jaRespondidos}
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

        <div className="bg-muted/50 flex items-center justify-between rounded-lg px-3 py-2 text-sm">
          <span>
            {respondidas} de {eventos.length} respondidas
          </span>
          {prazo && (
            <span className="text-muted-foreground">até {diaEMes(prazo)}</span>
          )}
        </div>

        <div className="space-y-3">
          {eventos.map((e) => (
            <CartaoData
              key={e.id}
              evento={e}
              valor={respostas[e.id] ?? VAZIA}
              onMudar={(v) => mudarResposta(e.id, v)}
              salvo={Boolean(salvos[e.id])}
            />
          ))}
        </div>

        <Button
          onClick={async () => {
            await descarregarPendentes()
            setEtapa('pronto')
          }}
          disabled={respondidas === 0}
          className="h-12 w-full text-base"
        >
          {respondidas === 0 ? 'Marque pelo menos uma data' : 'Concluir'}
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
        {eventos.map((e) => {
          const r = respostas[e.id]?.resposta
          return (
            <div key={e.id} className="flex items-center justify-between px-4 py-3 text-sm">
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
