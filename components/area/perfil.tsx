'use client'

import { useState } from 'react'
import { Icone } from '@/components/icone'
import { diaEMes, mascaraTelefone } from './formato'
import type { InstrumentoArea, PerfilArea } from './tipos'
import { Avatar, TituloSecao, vidro } from './ui'

/**
 * Perfil: o que antes era o passo 2 do formulário (instrumentos e
 * WhatsApp), mais foto, nome completo, aniversário e e-mail do cadastro da
 * igreja. Instrumento continua sendo a verdade do próprio músico (PRD
 * §5.1); nível quem define é a liderança.
 */
export function TelaPerfil({
  eu,
  instrumentos,
  onSalvar,
  onSair,
}: {
  eu: PerfilArea
  instrumentos: InstrumentoArea[]
  onSalvar: (p: { whatsapp: string; principal: string | null; toca: string[] }) => Promise<boolean>
  onSair: () => void
}) {
  const [toco, setToco] = useState(new Set(eu.toca))
  const [principal, setPrincipal] = useState<string | null>(eu.principal)
  const [whatsapp, setWhatsapp] = useState(eu.whatsapp ? mascaraTelefone(eu.whatsapp) : '')
  const [salvando, setSalvando] = useState(false)

  const nomeDo = (id: string | null) => instrumentos.find((i) => i.id === id)?.nome

  function alternar(id: string) {
    const novo = new Set(toco)
    if (novo.has(id)) {
      novo.delete(id)
      if (principal === id) setPrincipal([...novo][0] ?? null)
    } else {
      novo.add(id)
      if (!principal) setPrincipal(id)
    }
    setToco(novo)
  }

  async function salvar() {
    setSalvando(true)
    await onSalvar({ whatsapp, principal, toca: [...toco] })
    setSalvando(false)
  }

  const dados: ['aniversario' | 'email', string, string | null][] = [
    ['aniversario', 'Aniversário', eu.aniversario ? diaEMes(eu.aniversario) : null],
    ['email', 'E-mail', eu.email],
  ]

  return (
    <div className="space-y-9">
      <div className={`${vidro} relative overflow-hidden p-6 sm:p-8`}>
        <div className="bg-roxo/25 absolute -top-20 -right-10 h-56 w-56 rounded-full blur-3xl" />
        <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <Avatar nome={eu.nome} foto={eu.foto} tamanho="xl" destaque />
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight">{eu.nome}</h1>
            {eu.nomeCompleto && <p className="text-muted-foreground">{eu.nomeCompleto}</p>}
            {nomeDo(principal) && <p className="text-lima mt-2 text-sm font-medium">{nomeDo(principal)}</p>}
          </div>
        </div>
      </div>

      <section>
        <TituloSecao>O que você toca</TituloSecao>
        <p className="text-muted-foreground -mt-1 mb-4 text-sm">
          Toque para marcar. A estrela é o seu instrumento principal.
        </p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {instrumentos.map((i) => {
            const marcado = toco.has(i.id)
            const ehPrincipal = principal === i.id
            return (
              <div
                key={i.id}
                className={`flex items-center justify-between rounded-2xl border p-1.5 pl-4 transition-colors ${
                  marcado ? 'border-lima/40 bg-lima/[0.07]' : 'border-white/[0.07] bg-white/[0.02]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => alternar(i.id)}
                  aria-pressed={marcado}
                  className={`flex-1 py-2.5 text-left text-sm font-medium ${marcado ? '' : 'text-muted-foreground'}`}
                >
                  {i.nome}
                </button>
                {marcado && (
                  <button
                    type="button"
                    onClick={() => setPrincipal(i.id)}
                    aria-label={`Tornar ${i.nome} o principal`}
                    aria-pressed={ehPrincipal}
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
          <label className="flex items-center gap-4 px-5 py-3">
            <Icone nome="telefone" className="text-muted-foreground h-4 w-4 shrink-0" />
            <span className="text-muted-foreground w-24 shrink-0 text-sm">WhatsApp</span>
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(mascaraTelefone(e.target.value))}
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="(11) 9 0000-0000"
              className="placeholder:text-muted-foreground/50 min-w-0 flex-1 bg-transparent py-1 font-medium tabular-nums outline-none"
            />
          </label>
          {dados
            .filter(([, , valor]) => valor)
            .map(([icone, rotulo, valor]) => (
              <div key={rotulo} className="flex items-center gap-4 px-5 py-4">
                <Icone nome={icone} className="text-muted-foreground h-4 w-4 shrink-0" />
                <span className="text-muted-foreground w-24 shrink-0 text-sm">{rotulo}</span>
                <span className="min-w-0 truncate font-medium">{valor}</span>
              </div>
            ))}
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
          onClick={salvar}
          disabled={salvando}
          className="bg-lima text-primary-foreground hover:bg-lima-clara h-12 flex-1 rounded-2xl font-semibold transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {salvando ? 'Salvando…' : 'Salvar'}
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
