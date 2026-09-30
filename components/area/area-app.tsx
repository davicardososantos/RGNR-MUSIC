'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { avisarImprevisto, confirmarPresenca, responder, salvarPerfil, sair } from '@/actions/area'
import { Casca, type Aba } from './casca'
import { ProvedorArea } from './contexto'
import { DetalheData, TelaDatas } from './datas'
import { DetalheEscala, TelaEscalas } from './escalas'
import { LateralInicio, TelaInicio } from './inicio'
import { TelaPerfil } from './perfil'
import { RespostaRapida } from './resposta-rapida'
import type { DadosArea, EventoArea, MinhaRespostaArea, Resposta, StatusEscala } from './tipos'
import { Folha } from './ui'

const erroDe = (e: unknown) => (e instanceof Error ? e.message : 'Algo deu errado. Tente de novo.')

/**
 * A área do músico (30/09/2026): a evolução do formulário.
 *
 * A tela muda na hora a cada toque e a gravação vai para o servidor logo
 * atrás. Se o servidor recusar (data fechada, internet caiu), a tela volta
 * ao que era e a pessoa vê o motivo.
 */
export function AreaApp({ dados }: { dados: DadosArea }) {
  const router = useRouter()
  const [aba, setAba] = useState<Aba>('inicio')
  const [respostas, setRespostas] = useState(dados.respostas)
  const [escalas, setEscalas] = useState(dados.escalas)
  const [eu, setEu] = useState(dados.eu)
  const [fila, setFila] = useState<EventoArea[] | null>(null)
  const [escalaAberta, setEscalaAberta] = useState<string | null>(null)
  const [dataAberta, setDataAberta] = useState<string | null>(null)

  const abertos = dados.eventos.filter((e) => e.aberto)
  const pendentes = abertos.filter((e) => !respostas[e.id]).length
  const escalados = Object.fromEntries(
    escalas.map((s) => [s.eventoId, s.planoB ? `plano B de ${s.funcao}` : s.funcao]),
  )

  // ---------- respostas ----------

  const gravarResposta = useCallback(async (eventoId: string, nova: MinhaRespostaArea) => {
    let antes: MinhaRespostaArea | undefined
    setRespostas((atual) => {
      antes = atual[eventoId]
      return { ...atual, [eventoId]: nova }
    })
    try {
      await responder({
        eventoId,
        resposta: nova.resposta,
        passagemSom: nova.passagemSom,
        observacao: nova.observacao,
      })
    } catch (e) {
      setRespostas((atual) => {
        const volta = { ...atual }
        if (antes) volta[eventoId] = antes
        else delete volta[eventoId]
        return volta
      })
      toast.error(erroDe(e))
    }
  }, [])

  /** Toque rápido (lista, cartões): mantém a passagem e a observação que já existiam. */
  const responderRapido = useCallback(
    (eventoId: string, resposta: Resposta, passagemSom?: boolean) => {
      const atual = respostas[eventoId]
      void gravarResposta(eventoId, {
        resposta,
        passagemSom: passagemSom ?? atual?.passagemSom ?? true,
        observacao: atual?.observacao ?? null,
      })
    },
    [respostas, gravarResposta],
  )

  // ---------- escalas ----------

  function mudarStatus(eventoId: string, status: StatusEscala) {
    setEscalas((atual) => atual.map((s) => (s.eventoId === eventoId ? { ...s, status } : s)))
  }

  async function confirmar(eventoId: string) {
    const antes = escalas.find((s) => s.eventoId === eventoId)?.status ?? 'a_confirmar'
    mudarStatus(eventoId, 'confirmado')
    if ('vibrate' in navigator) navigator.vibrate?.([10, 40, 10])
    try {
      await confirmarPresenca({ eventoId })
      toast.success('Presença confirmada. Até lá!')
    } catch (e) {
      mudarStatus(eventoId, antes)
      toast.error(erroDe(e))
    }
  }

  async function imprevisto(eventoId: string, texto: string) {
    try {
      await avisarImprevisto({ eventoId, texto })
      mudarStatus(eventoId, 'imprevisto')
      toast('Aviso enviado para a liderança')
    } catch (e) {
      toast.error(erroDe(e))
    }
  }

  // ---------- perfil e saída ----------

  async function gravarPerfil(p: { whatsapp: string; principal: string | null; toca: string[] }) {
    try {
      await salvarPerfil(p)
      setEu((atual) => ({ ...atual, whatsapp: p.whatsapp.replace(/\D/g, '') || null, principal: p.principal, toca: p.toca }))
      toast.success('Perfil salvo')
      return true
    } catch (e) {
      toast.error(erroDe(e))
      return false
    }
  }

  async function sairDaConta() {
    await sair()
    router.refresh()
  }

  function irPara(a: Aba) {
    setAba(a)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const fecharEscala = useCallback(() => setEscalaAberta(null), [])
  const fecharData = useCallback(() => setDataAberta(null), [])
  const fecharRapida = useCallback(() => setFila(null), [])
  const abrirRapida = () => setFila(abertos.filter((e) => !respostas[e.id]))

  const escala = escalas.find((s) => s.eventoId === escalaAberta)
  const data = dados.eventos.find((e) => e.id === dataAberta)
  const principal = dados.instrumentos.find((i) => i.id === eu.principal)?.nome ?? null

  return (
    <ProvedorArea hoje={dados.hoje} eventos={dados.eventos}>
      <Casca
        aba={aba}
        onAba={irPara}
        pendentes={pendentes}
        eu={{ nome: eu.nome, foto: eu.foto, principal }}
        lateral={
          aba === 'inicio' ? (
            <LateralInicio
              escalas={escalas}
              respostas={respostas}
              tocouNoAno={dados.tocouNoAno}
              onAbrirEscala={setEscalaAberta}
            />
          ) : undefined
        }
      >
        {aba === 'inicio' && (
          <TelaInicio
            nome={eu.nome}
            saudacao={dados.saudacao}
            respostas={respostas}
            escalas={escalas}
            tocouNoAno={dados.tocouNoAno}
            onRapida={abrirRapida}
            onAbrirEscala={setEscalaAberta}
            onConfirmar={confirmar}
            onAbrirData={setDataAberta}
            onVerDatas={() => irPara('datas')}
          />
        )}
        {aba === 'datas' && (
          <TelaDatas
            respostas={respostas}
            escalados={escalados}
            onResponder={(id, r) => responderRapido(id, r)}
            onAbrirData={setDataAberta}
            onRapida={abrirRapida}
          />
        )}
        {aba === 'escalas' && (
          <TelaEscalas
            escalas={escalas}
            historico={dados.historico}
            tocouNoAno={dados.tocouNoAno}
            onAbrir={setEscalaAberta}
          />
        )}
        {aba === 'perfil' && (
          <TelaPerfil eu={eu} instrumentos={dados.instrumentos} onSalvar={gravarPerfil} onSair={sairDaConta} />
        )}
      </Casca>

      <Folha aberta={Boolean(escala)} onFechar={fecharEscala} titulo="Escala">
        {escala && (
          <DetalheEscala
            key={escala.eventoId}
            escala={escala}
            onConfirmar={() => confirmar(escala.eventoId)}
            onImprevisto={(texto) => imprevisto(escala.eventoId, texto)}
          />
        )}
      </Folha>

      <Folha aberta={Boolean(data)} onFechar={fecharData} titulo="Responder data">
        {data && (
          <DetalheData
            key={data.id}
            evento={data}
            resposta={respostas[data.id]}
            escalado={escalados[data.id]}
            onSalvar={(r) => void gravarResposta(data.id, r)}
            onPronto={fecharData}
          />
        )}
      </Folha>

      {fila && (
        <RespostaRapida
          fila={fila}
          onResponder={(id, r, passagem) => responderRapido(id, r, passagem)}
          onFechar={fecharRapida}
        />
      )}
    </ProvedorArea>
  )
}
