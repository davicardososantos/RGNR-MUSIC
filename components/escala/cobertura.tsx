'use client'

import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Icone } from '@/components/icone'
import { substituir } from '@/actions/escala'
import {
  candidatosParaFuncao,
  type Candidato,
  type EscalacaoAtual,
  type FuncaoDaEscala,
  type MusicoParaEscala,
} from '@/lib/candidatos'
import { dataCurta } from '@/lib/datas'
import { linkWhatsApp, mensagemCobertura, primeiroNome } from '@/lib/whatsapp'
import { NIVEL_LABEL, ORDEM_LABEL, type Evento } from '@/lib/tipos'

export function Cobertura({
  evento,
  funcoes,
  musicos,
  escalacoesIniciais,
}: {
  evento: Evento
  funcoes: FuncaoDaEscala[]
  musicos: MusicoParaEscala[]
  escalacoesIniciais: EscalacaoAtual[]
}) {
  const [escalacoes, setEscalacoes] = useState(escalacoesIniciais)
  const [, iniciar] = useTransition()

  const porId = useMemo(() => new Map(musicos.map((m) => [m.id, m])), [musicos])
  const dia = dataCurta(evento.data)

  const preenchidas = funcoes.filter((f) =>
    escalacoes.some((e) => e.funcao_id === f.id && e.tipo === 'titular'),
  )

  function trocar(funcao: FuncaoDaEscala, entra: MusicoParaEscala, sai: string) {
    const antes = escalacoes
    setEscalacoes((atual) =>
      atual.map((e) =>
        e.funcao_id === funcao.id && e.tipo === 'titular'
          ? { ...e, musico_id: entra.id }
          : e,
      ),
    )

    iniciar(async () => {
      try {
        await substituir({
          eventoId: evento.id,
          data: evento.data,
          funcaoId: funcao.id,
          entraId: entra.id,
          motivo: null,
        })
        toast.success(`${entra.nome} entrou no lugar de ${sai}`)
      } catch (e) {
        setEscalacoes(antes)
        toast.error(e instanceof Error ? e.message : 'Não consegui substituir')
      }
    })
  }

  if (preenchidas.length === 0) {
    return (
      <div className="border-border rounded-xl border border-dashed p-8 text-center">
        <p className="text-muted-foreground text-sm">
          Nenhuma função escalada ainda. Monte a escala primeiro e esta tela passa a
          mostrar quem pode cobrir cada posição.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {preenchidas.map((funcao) => {
        const atual = escalacoes.find(
          (e) => e.funcao_id === funcao.id && e.tipo === 'titular',
        )!
        const titular = porId.get(atual.musico_id)
        if (!titular) return null

        const grupos = candidatosParaFuncao(funcao, evento, musicos, escalacoes)

        // Quem já está no palco não é cobertura. E quem disse que não pode,
        // também não — nesta tela a pressa é achar quem topa, não convencer.
        const jaEscalados = new Set(
          escalacoes.filter((e) => e.tipo === 'titular').map((e) => e.musico_id),
        )
        const cobertura = [...grupos.podem, ...grupos.sePrecisar].filter(
          (c) => !jaEscalados.has(c.musico.id),
        )

        return (
          <div key={funcao.id} className="border-border rounded-xl border p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-medium">{funcao.nome}</h3>
              <span className="text-muted-foreground text-xs">
                {cobertura.length} podem cobrir
              </span>
            </div>

            <p className="text-muted-foreground mt-1 text-sm">
              Hoje: <span className="text-foreground">{titular.nome}</span>
            </p>

            {cobertura.length === 0 ? (
              <p className="text-muted-foreground mt-3 text-xs">
                Ninguém disponível para esta função além de quem já está escalado.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {cobertura.map((c) => (
                  <LinhaCobertura
                    key={c.musico.id}
                    candidato={c}
                    funcao={funcao}
                    dia={dia}
                    onSubstituir={() => trocar(funcao, c.musico, titular.nome)}
                  />
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

function LinhaCobertura({
  candidato,
  funcao,
  dia,
  onSubstituir,
}: {
  candidato: Candidato
  funcao: FuncaoDaEscala
  dia: string
  onSubstituir: () => void
}) {
  const { musico, nivel, ordem, tocaInstrumento } = candidato

  const zap = linkWhatsApp(
    musico.whatsapp,
    mensagemCobertura(primeiroNome(musico.nome), funcao.nome.toLowerCase(), dia),
  )

  return (
    <li className="bg-muted/30 flex items-center justify-between gap-2 rounded-lg px-3 py-2">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 truncate text-sm font-medium">
          {musico.nome}
          {musico.resposta === 'se_precisar' && (
            <Icone nome="sePrecisar" className="text-roxo-claro h-3 w-3 shrink-0" />
          )}
        </p>
        <p className="text-muted-foreground text-xs">
          {nivel ? NIVEL_LABEL[nivel] : 'sem nível'} · {ORDEM_LABEL[ordem]}
          {!tocaInstrumento && ' · outro instrumento'}
        </p>
        {musico.observacao && (
          <p className="text-foreground/80 mt-0.5 text-xs italic">
            “{musico.observacao}”
          </p>
        )}
      </div>

      <div className="flex shrink-0 gap-1.5">
        {zap && (
          <a
            href={zap}
            target="_blank"
            rel="noopener noreferrer"
            className="border-border hover:bg-accent rounded-lg border px-2.5 py-1.5 text-xs transition-colors"
          >
            chamar
          </a>
        )}
        <button
          type="button"
          onClick={onSubstituir}
          className="bg-lima text-primary-foreground rounded-lg px-2.5 py-1.5 text-xs font-medium"
        >
          substituir
        </button>
      </div>
    </li>
  )
}
