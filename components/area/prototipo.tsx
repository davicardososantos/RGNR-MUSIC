'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { Casca, type Aba } from './casca'
import { DetalheData, TelaDatas } from './datas'
import { EVENTOS, ESCALAS_INICIAIS, RESPOSTAS_INICIAIS, type EventoExemplo, type Resposta } from './dados-exemplo'
import { DetalheEscala, TelaEscalas } from './escalas'
import { LateralInicio, TelaInicio } from './inicio'
import { TelaPerfil } from './perfil'
import { RespostaRapida } from './resposta-rapida'
import { TelaEntrar } from './tela-entrar'
import { Folha } from './ui'

const ABAS: Aba[] = ['inicio', 'datas', 'escalas', 'perfil']

/**
 * Protótipo navegável da área do músico (30/09/2026).
 *
 * Tudo roda no navegador com dados de exemplo: nada é gravado. `tela` abre
 * direto numa parte (entrar, inicio, datas, escalas, perfil, rapida,
 * escala), para mostrar um pedaço sem clicar até ele.
 */
export function Prototipo({ tela }: { tela?: string }) {
  const [logado, setLogado] = useState(tela !== 'entrar')
  const [aba, setAba] = useState<Aba>(ABAS.includes(tela as Aba) ? (tela as Aba) : 'inicio')
  const [respostas, setRespostas] = useState(RESPOSTAS_INICIAIS)
  const [escalas, setEscalas] = useState(ESCALAS_INICIAIS)
  const [fila, setFila] = useState<EventoExemplo[] | null>(() =>
    tela === 'rapida' ? EVENTOS.filter((e) => !RESPOSTAS_INICIAIS[e.id]) : null,
  )
  const [escalaAberta, setEscalaAberta] = useState<string | null>(
    tela === 'escala' ? ESCALAS_INICIAIS[0].eventoId : null,
  )
  const [dataAberta, setDataAberta] = useState<string | null>(null)

  const pendentes = EVENTOS.filter((e) => !respostas[e.id]).length
  const escalados = Object.fromEntries(escalas.map((s) => [s.eventoId, s.funcao]))

  const responder = useCallback((eventoId: string, r: Resposta | null) => {
    setRespostas((atual) => {
      const novo = { ...atual }
      if (r) novo[eventoId] = r
      else delete novo[eventoId]
      return novo
    })
  }, [])

  function mudarStatus(eventoId: string, status: 'confirmado' | 'imprevisto') {
    setEscalas((atual) => atual.map((s) => (s.eventoId === eventoId ? { ...s, status } : s)))
  }

  function confirmar(eventoId: string) {
    mudarStatus(eventoId, 'confirmado')
    if ('vibrate' in navigator) navigator.vibrate?.([10, 40, 10])
    toast.success('Presença confirmada. Até lá!')
  }

  function irPara(a: Aba) {
    setAba(a)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const fecharEscala = useCallback(() => setEscalaAberta(null), [])
  const fecharData = useCallback(() => setDataAberta(null), [])
  const fecharRapida = useCallback(() => setFila(null), [])
  const abrirRapida = () => setFila(EVENTOS.filter((e) => !respostas[e.id]))

  if (!logado) return <TelaEntrar onEntrar={() => setLogado(true)} />

  const escala = escalas.find((s) => s.eventoId === escalaAberta)
  const data = EVENTOS.find((e) => e.id === dataAberta)

  return (
    <>
      <Casca
        aba={aba}
        onAba={irPara}
        pendentes={pendentes}
        lateral={
          aba === 'inicio' ? (
            <LateralInicio escalas={escalas} respostas={respostas} onAbrirEscala={setEscalaAberta} />
          ) : undefined
        }
      >
        {aba === 'inicio' && (
          <TelaInicio
            respostas={respostas}
            escalas={escalas}
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
            onResponder={responder}
            onAbrirData={setDataAberta}
            onRapida={abrirRapida}
          />
        )}
        {aba === 'escalas' && <TelaEscalas escalas={escalas} onAbrir={setEscalaAberta} />}
        {aba === 'perfil' && <TelaPerfil onSair={() => setLogado(false)} />}
      </Casca>

      <Folha aberta={Boolean(escala)} onFechar={fecharEscala} titulo="Escala">
        {escala && (
          <DetalheEscala
            key={escala.eventoId}
            escala={escala}
            onConfirmar={() => confirmar(escala.eventoId)}
            onImprevisto={() => {
              mudarStatus(escala.eventoId, 'imprevisto')
              toast('Aviso enviado para a liderança')
            }}
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
            onResponder={(r) => responder(data.id, r)}
            onPronto={fecharData}
          />
        )}
      </Folha>

      {fila && <RespostaRapida fila={fila} onResponder={responder} onFechar={fecharRapida} />}
    </>
  )
}
