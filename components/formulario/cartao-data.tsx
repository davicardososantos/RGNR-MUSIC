'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Icone, type NomeIcone } from '@/components/icone'
import { dataPorExtenso, hora } from '@/lib/datas'
import type { Evento, RespostaDisponibilidade } from '@/lib/tipos'

export type RespostaLocal = {
  resposta: RespostaDisponibilidade | null
  passagemSom: boolean
  observacao: string
}

/**
 * As duas cores da marca RGNR fazem o trabalho semântico:
 * lima = posso, roxo = topo cobrir. Cinza = não posso.
 * A leitura é "colorido significa que dá para contar comigo".
 */
const OPCOES: {
  valor: RespostaDisponibilidade
  icone: NomeIcone
  texto: string
  cor: string
}[] = [
  {
    valor: 'sim',
    icone: 'sim',
    texto: 'Sim',
    cor: 'border-lima bg-lima text-primary-foreground',
  },
  {
    valor: 'se_precisar',
    icone: 'sePrecisar',
    texto: 'Se precisar',
    cor: 'border-roxo bg-roxo text-white',
  },
  {
    valor: 'nao',
    icone: 'nao',
    texto: 'Não',
    cor: 'border-muted-foreground bg-muted text-muted-foreground',
  },
]

export function CartaoData({
  evento,
  valor,
  onMudar,
  salvo,
}: {
  evento: Evento
  valor: RespostaLocal
  onMudar: (r: RespostaLocal) => void
  salvo: boolean
}) {
  const [mostrarObs, setMostrarObs] = useState(Boolean(valor.observacao))

  const fire = evento.tipo === 'fire'
  const disponivel = valor.resposta === 'sim' || valor.resposta === 'se_precisar'
  const horaPassagem = hora(evento.hora_passagem)

  return (
    <div className="border-border rounded-xl border p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-base font-medium">
            <Icone
              nome={fire ? 'fire' : 'culto'}
              className={`h-3.5 w-3.5 shrink-0 ${fire ? 'text-lima' : 'text-roxo-claro'}`}
            />
            {dataPorExtenso(evento.data)}
          </p>
          <p className="text-muted-foreground mt-0.5 text-sm">
            <span className={fire ? 'text-lima' : 'text-roxo-claro'}>
              {evento.titulo ?? (fire ? 'Fire' : 'Culto')}
            </span>{' '}
            · {hora(evento.hora_evento)}
            {horaPassagem && ` · passagem ${horaPassagem}`}
          </p>
        </div>
        {salvo && (
          <span className="text-muted-foreground shrink-0 pt-1 text-xs">salvo</span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {OPCOES.map((o) => {
          const ativo = valor.resposta === o.valor
          return (
            <button
              key={o.valor}
              type="button"
              onClick={() =>
                onMudar({
                  ...valor,
                  resposta: o.valor,
                  passagemSom: o.valor === 'nao' ? false : valor.passagemSom,
                })
              }
              className={`flex min-h-14 flex-col items-center justify-center gap-1.5 rounded-lg border text-sm font-medium transition-colors ${
                ativo ? o.cor : 'border-border hover:bg-accent'
              }`}
            >
              <Icone nome={o.icone} className="h-4 w-4" />
              {o.texto}
            </button>
          )
        })}
      </div>

      {disponivel && (
        <div className="mt-3 space-y-3">
          {horaPassagem && (
            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <Checkbox
                checked={valor.passagemSom}
                onCheckedChange={(c) => onMudar({ ...valor, passagemSom: c === true })}
              />
              Consigo chegar na passagem de som ({horaPassagem})
            </label>
          )}

          {mostrarObs ? (
            <Textarea
              placeholder="Ex.: só chego 20h30"
              value={valor.observacao}
              onChange={(e) => onMudar({ ...valor, observacao: e.target.value })}
              maxLength={280}
              rows={2}
              className="text-base"
            />
          ) : (
            <button
              type="button"
              onClick={() => setMostrarObs(true)}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm underline-offset-4 hover:underline"
            >
              <Icone nome="adicionar" className="h-3 w-3" />
              adicionar observação
            </button>
          )}
        </div>
      )}
    </div>
  )
}
