'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Icone } from '@/components/icone'
import { criarAviso, encerrarAviso } from '@/actions/gestao'
import { periodoDoAviso } from '@/lib/datas'
import type { AvisoDoMusico } from '@/lib/tipos'

/**
 * Os recados dos gestores sobre a pessoa (avisos_musico), com o botão de
 * criar um novo e de encerrar os que já não valem.
 *
 * O aviso nunca responde pelo músico: quem avisou que não pode no mês
 * continua sem resposta no formulário, só aparece marcado (PRD §5.1).
 */
export function AvisosDaFicha({
  musicoId,
  nome,
  avisos,
}: {
  musicoId: string
  nome: string
  avisos: AvisoDoMusico[]
}) {
  const [novo, setNovo] = useState(false)
  const [encerrando, iniciarEncerrar] = useTransition()

  function encerrar(aviso: AvisoDoMusico) {
    if (!window.confirm('Encerrar este aviso? Ele sai do painel, mas fica guardado.')) return
    iniciarEncerrar(async () => {
      try {
        await encerrarAviso({ id: aviso.id })
        toast.success('Aviso encerrado')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Não consegui encerrar')
      }
    })
  }

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Avisos{avisos.length > 0 && ` · ${avisos.length}`}
        </h2>
        <button
          type="button"
          onClick={() => setNovo(true)}
          className="text-lima flex items-center gap-1.5 text-sm underline-offset-4 hover:underline"
        >
          <Icone nome="adicionar" className="h-3 w-3" />
          novo aviso
        </button>
      </div>

      {avisos.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nenhum aviso. Use quando a pessoa contar por fora que não pode num
          período, ou quando for melhor falar direto com ela.
        </p>
      ) : (
        <div className="space-y-2">
          {avisos.map((aviso) => {
            const periodo = periodoDoAviso(aviso.indisponivelDe, aviso.indisponivelAte)
            return (
              <div
                key={aviso.id}
                className="border-roxo/30 bg-roxo/5 rounded-lg border px-3 py-2.5 text-sm"
              >
                <p className="flex items-start gap-2">
                  <Icone nome="aviso" className="text-roxo-claro mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{aviso.texto}</span>
                </p>
                <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center justify-between gap-2 pl-5.5 text-xs">
                  <span>
                    {[
                      periodo && `não pode ${periodo}`,
                      aviso.naoCobrar && 'não cobrar o formulário',
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'recado'}
                  </span>
                  <button
                    type="button"
                    onClick={() => encerrar(aviso)}
                    disabled={encerrando}
                    className="hover:text-foreground underline-offset-4 hover:underline"
                  >
                    encerrar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {novo && (
        <NovoAviso musicoId={musicoId} nome={nome} onFechar={() => setNovo(false)} />
      )}
    </section>
  )
}

function NovoAviso({
  musicoId,
  nome,
  onFechar,
}: {
  musicoId: string
  nome: string
  onFechar: () => void
}) {
  const [texto, setTexto] = useState('')
  const [comPeriodo, setComPeriodo] = useState(false)
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')
  const [naoCobrar, setNaoCobrar] = useState(false)
  const [salvando, iniciar] = useTransition()

  const periodoOk = !comPeriodo || (de && ate && de <= ate)
  const podeSalvar = texto.trim().length >= 3 && periodoOk

  function salvar() {
    iniciar(async () => {
      try {
        await criarAviso({
          musicoId,
          texto,
          indisponivelDe: comPeriodo ? de : null,
          indisponivelAte: comPeriodo ? ate : null,
          naoCobrar,
        })
        toast.success(`Aviso de ${nome.split(' ')[0]} salvo`)
        onFechar()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Não consegui salvar')
      }
    })
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo aviso sobre {nome}</DialogTitle>
          <DialogDescription>
            Só os gestores veem. Não muda a resposta da pessoa no formulário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="texto-aviso" className="text-sm font-medium">
              O que aconteceu?
            </label>
            <Textarea
              id="texto-aviso"
              placeholder="Ex.: começou num trabalho novo e não consegue tocar em outubro"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={280}
              rows={3}
              className="text-base"
            />
            <p className="text-muted-foreground text-xs">
              Escreva só o necessário. Assunto pessoal pode ficar no geral.
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <Checkbox checked={comPeriodo} onCheckedChange={(c) => setComPeriodo(c === true)} />
            Avisou que não pode num período
          </label>

          {comPeriodo && (
            <div className="grid grid-cols-2 gap-2 pl-6">
              <label className="space-y-1 text-xs">
                <span className="text-muted-foreground">de</span>
                <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-muted-foreground">até</span>
                <Input type="date" value={ate} min={de || undefined} onChange={(e) => setAte(e.target.value)} />
              </label>
            </div>
          )}

          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <Checkbox
              checked={naoCobrar}
              onCheckedChange={(c) => setNaoCobrar(c === true)}
              className="mt-0.5"
            />
            <span>
              Não cobrar o formulário
              <span className="text-muted-foreground block text-xs">
                Sai da lista de cobrança. O contato fica direto com vocês.
              </span>
            </span>
          </label>

          <Button
            onClick={salvar}
            disabled={!podeSalvar || salvando}
            className="h-12 w-full text-base"
          >
            {salvando ? 'Salvando…' : 'Salvar aviso'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
