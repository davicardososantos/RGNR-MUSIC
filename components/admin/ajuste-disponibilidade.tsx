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
import { Textarea } from '@/components/ui/textarea'
import { Icone, type NomeIcone } from '@/components/icone'
import { ajustarDisponibilidade } from '@/actions/gestao'
import { dataPorExtenso, hora } from '@/lib/datas'
import { RESPOSTA_LABEL, type RespostaDisponibilidade } from '@/lib/tipos'

const OPCOES: { valor: RespostaDisponibilidade; icone: NomeIcone; cor: string }[] = [
  { valor: 'sim', icone: 'sim', cor: 'border-lima bg-lima text-primary-foreground' },
  { valor: 'se_precisar', icone: 'sePrecisar', cor: 'border-roxo bg-roxo text-white' },
  {
    valor: 'nao',
    icone: 'nao',
    cor: 'border-muted-foreground bg-muted text-muted-foreground',
  },
]

export function AjusteDisponibilidade({
  aberto,
  onFechar,
  musicoId,
  slug,
  nome,
  eventoId,
  data,
  horaPassagem,
  respostaAtual,
  passagemAtual,
}: {
  aberto: boolean
  onFechar: () => void
  musicoId: string
  slug: string
  nome: string
  eventoId: string
  data: string
  horaPassagem: string | null
  respostaAtual: RespostaDisponibilidade | null
  passagemAtual: boolean
}) {
  const [resposta, setResposta] = useState<RespostaDisponibilidade | null>(
    respostaAtual,
  )
  const [passagemSom, setPassagemSom] = useState(passagemAtual)
  const [motivo, setMotivo] = useState('')
  const [salvando, iniciar] = useTransition()

  const passagem = hora(horaPassagem)
  const podeSalvar = Boolean(resposta) && motivo.trim().length >= 3

  function salvar() {
    if (!resposta) return
    iniciar(async () => {
      try {
        await ajustarDisponibilidade({
          musicoId,
          eventoId,
          data,
          slug,
          resposta,
          passagemSom,
          motivo,
        })
        toast.success(`Resposta de ${nome.split(' ')[0]} atualizada`)
        setMotivo('')
        onFechar()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Não consegui ajustar')
      }
    })
  }

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar a resposta de {nome}</DialogTitle>
          <DialogDescription>
            {dataPorExtenso(data)}. Use quando a pessoa avisar por fora do
            formulário. Fica registrado que a mudança foi sua.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {OPCOES.map((o) => {
              const ativo = resposta === o.valor
              return (
                <button
                  key={o.valor}
                  type="button"
                  onClick={() => {
                    setResposta(o.valor)
                    if (o.valor === 'nao') setPassagemSom(false)
                  }}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1.5 rounded-lg border text-sm font-medium transition-colors ${
                    ativo ? o.cor : 'border-border hover:bg-accent'
                  }`}
                >
                  <Icone nome={o.icone} className="h-4 w-4" />
                  {RESPOSTA_LABEL[o.valor].curto}
                </button>
              )
            })}
          </div>

          {passagem && resposta && resposta !== 'nao' && (
            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <Checkbox
                checked={passagemSom}
                onCheckedChange={(c) => setPassagemSom(c === true)}
              />
              Consegue chegar na passagem de som ({passagem})
            </label>
          )}

          <div className="space-y-1.5">
            <label htmlFor="motivo" className="text-sm font-medium">
              Por que está mudando?
            </label>
            <Textarea
              id="motivo"
              placeholder="Ex.: avisou no WhatsApp que vai viajar"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              maxLength={280}
              rows={2}
              className="text-base"
            />
            <p className="text-muted-foreground text-xs">
              Obrigatório. É o que explica, daqui a um mês, por que a resposta
              dela mudou sem ela ter entrado no link.
            </p>
          </div>

          <Button
            onClick={salvar}
            disabled={!podeSalvar || salvando}
            className="h-12 w-full text-base"
          >
            {salvando ? 'Salvando…' : 'Salvar ajuste'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
