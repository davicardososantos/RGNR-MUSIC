'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Icone } from '@/components/icone'
import { EU } from './dados-exemplo'
import { Avatar, TituloSecao, vidro } from './ui'

const TODOS = ['Baixo', 'Bateria', 'Cajon', 'Guitarra', 'Teclado', 'Violão']

/**
 * Perfil: o que hoje fica no passo 2 do formulário (instrumentos e
 * WhatsApp) mais o que veio do Voluts. Instrumento continua sendo a
 * verdade do próprio músico (PRD §5.1); nível quem define é a liderança.
 */
export function TelaPerfil({ onSair }: { onSair: () => void }) {
  const [toco, setToco] = useState(new Set(EU.instrumentos.map((i) => i.nome)))
  const [principal, setPrincipal] = useState(EU.instrumentos.find((i) => i.principal)!.nome)

  function alternar(nome: string) {
    setToco((atual) => {
      const novo = new Set(atual)
      if (novo.has(nome)) {
        if (nome === principal) return atual
        novo.delete(nome)
      } else novo.add(nome)
      return novo
    })
  }

  return (
    <div className="space-y-9">
      <div className={`${vidro} relative overflow-hidden p-6 sm:p-8`}>
        <div className="bg-roxo/25 absolute -top-20 -right-10 h-56 w-56 rounded-full blur-3xl" />
        <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <Avatar nome={EU.nome} tamanho="xl" destaque />
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{EU.nome}</h1>
            <p className="text-muted-foreground">{EU.nomeCompleto}</p>
            <p className="text-lima mt-2 text-sm font-medium">
              {principal} · na banda desde {EU.naBandaDesde}
            </p>
          </div>
        </div>
      </div>

      <section>
        <TituloSecao>O que você toca</TituloSecao>
        <p className="text-muted-foreground -mt-1 mb-4 text-sm">
          Toque para marcar. A estrela é o seu instrumento principal.
        </p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {TODOS.map((nome) => {
            const marcado = toco.has(nome)
            const ehPrincipal = principal === nome
            return (
              <div
                key={nome}
                className={`flex items-center justify-between rounded-2xl border p-1.5 pl-4 transition-colors ${
                  marcado ? 'border-lima/40 bg-lima/[0.07]' : 'border-white/[0.07] bg-white/[0.02]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => alternar(nome)}
                  aria-pressed={marcado}
                  className={`flex-1 py-2.5 text-left text-sm font-medium ${marcado ? '' : 'text-muted-foreground'}`}
                >
                  {nome}
                </button>
                {marcado && (
                  <button
                    type="button"
                    onClick={() => setPrincipal(nome)}
                    aria-label={`Tornar ${nome} o principal`}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                      ehPrincipal ? 'text-lima' : 'text-muted-foreground/40 hover:text-muted-foreground'
                    }`}
                  >
                    <Icone nome="principal" className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <TituloSecao>Seus dados</TituloSecao>
        <div className={`${vidro} divide-y divide-white/[0.06]`}>
          {(
            [
              ['telefone', 'WhatsApp', EU.whatsapp],
              ['aniversario', 'Aniversário', EU.aniversario],
            ] as const
          ).map(([icone, rotulo, valor]) => (
            <div key={rotulo} className="flex items-center gap-4 px-5 py-4">
              <Icone nome={icone} className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground w-28 text-sm">{rotulo}</span>
              <span className="font-medium tabular-nums">{valor}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <TituloSecao>No cadastro do Voluts</TituloSecao>
        <div className={`${vidro} space-y-4 p-5`}>
          <div>
            <p className="text-muted-foreground text-xs">Funções</p>
            <p className="mt-0.5">{EU.funcoesVoluts.join(', ')}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Dias que você marcou</p>
            <ul className="mt-0.5 space-y-0.5">
              {EU.diasVoluts.map((d) => (
                <li key={d} className="first-letter:uppercase">
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-muted-foreground text-xs">Para mudar esses dados, atualize no app do Voluts.</p>
        </div>
      </section>

      <section className="border-lima/20 from-lima/[0.08] rounded-3xl border bg-gradient-to-br to-transparent p-5">
        <div className="flex items-start gap-4">
          <span className="bg-lima/15 text-lima flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
            <Icone nome="instalar" className="h-4 w-4" />
          </span>
          <div className="space-y-2 text-sm">
            <p className="text-base font-semibold">Tenha na tela do celular</p>
            <p className="text-muted-foreground">
              <span className="text-foreground font-medium">Android:</span> no Chrome, menu de três pontos,
              Adicionar à tela inicial.
            </p>
            <p className="text-muted-foreground">
              <span className="text-foreground font-medium">iPhone:</span> no Safari, botão Compartilhar,
              Adicionar à Tela de Início.
            </p>
          </div>
        </div>
      </section>

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => toast.success('Perfil salvo')}
          className="bg-lima text-primary-foreground hover:bg-lima-clara h-12 flex-1 rounded-2xl font-semibold transition-all active:scale-[0.98]"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={onSair}
          className="text-muted-foreground hover:text-foreground flex h-12 items-center gap-2 rounded-2xl border border-white/10 px-5 text-sm font-medium"
        >
          <Icone nome="sair" className="h-3.5 w-3.5" />
          Sair
        </button>
      </div>
    </div>
  )
}
