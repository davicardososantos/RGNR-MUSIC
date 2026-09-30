'use client'

import { useState, type FormEvent, type InputHTMLAttributes } from 'react'
import { useRouter } from 'next/navigation'
import { Icone } from '@/components/icone'
import { entrar } from '@/actions/area'
import { mascaraTelefone } from './formato'
import { Fundo, Marca } from './ui'

const soDigitos = (s: string) => s.replace(/\D/g, '')

/** 14/03/2002 */
function mascaraData(valor: string) {
  const d = soDigitos(valor).slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

/** Barras de equalizador, o "pulso" da tela de entrada. */
function Equalizador() {
  const alturas = [0.55, 0.9, 0.4, 1, 0.65, 0.8, 0.45, 0.95, 0.6]
  return (
    <div className="flex h-24 items-end gap-2" aria-hidden>
      {alturas.map((a, i) => (
        <span
          key={i}
          className={`w-2.5 origin-bottom rounded-full ${i % 3 === 1 ? 'bg-roxo' : 'bg-lima'}`}
          style={{
            height: `${a * 100}%`,
            animation: `area-equalizador ${0.9 + (i % 4) * 0.22}s ease-in-out ${i * 0.08}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

function Campo({
  id,
  rotulo,
  icone,
  ...props
}: {
  id: string
  rotulo: string
  icone: 'telefone' | 'aniversario'
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label htmlFor={id} className="block space-y-2">
      <span className="text-muted-foreground text-sm">{rotulo}</span>
      <span className="focus-within:border-lima/60 flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 transition-colors focus-within:bg-white/[0.05]">
        <Icone nome={icone} className="text-muted-foreground h-4 w-4" />
        <input
          id={id}
          className="placeholder:text-muted-foreground/50 h-full w-full bg-transparent text-lg tracking-wide tabular-nums outline-none"
          {...props}
        />
      </span>
    </label>
  )
}

/**
 * Entrada da área do músico: WhatsApp + data de nascimento (decisão do
 * Davi, 30/09/2026). O aparelho fica lembrado por um ano depois disso.
 */
export function TelaEntrar() {
  const router = useRouter()
  const [telefone, setTelefone] = useState('')
  const [nascimento, setNascimento] = useState('')
  const [entrando, setEntrando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const pronto = soDigitos(telefone).length === 11 && soDigitos(nascimento).length === 8

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!pronto || entrando) return
    setEntrando(true)
    setErro(null)
    try {
      const r = await entrar({ telefone, nascimento })
      if (r.ok) {
        router.refresh()
        return
      }
      setErro(r.erro)
    } catch {
      setErro('Não consegui entrar agora. Confira a internet e tente de novo.')
    }
    setEntrando(false)
  }

  return (
    <div className="relative grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <Fundo />

      {/* Computador: o painel da marca */}
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.06] p-12 lg:flex">
        <div className="bg-roxo/30 absolute -bottom-40 -left-20 h-[36rem] w-[36rem] rounded-full blur-[140px]" />
        <Marca />
        <div className="relative space-y-8">
          <Equalizador />
          <h1 className="max-w-md text-5xl leading-[1.05] font-semibold tracking-tight">
            Sua escala, suas datas, <span className="text-lima">seu lugar</span> na banda.
          </h1>
          <p className="text-muted-foreground max-w-sm text-lg">
            Responda as datas em segundos, confirme quando for escalado e veja quem toca com você.
          </p>
        </div>
        <p className="text-muted-foreground relative text-sm">Ministério de Música do RGNR</p>
      </section>

      {/* O formulário */}
      <section className="flex flex-col justify-between px-6 pt-[max(env(safe-area-inset-top),2rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)] lg:justify-center lg:px-16">
        <div className="lg:hidden">
          <Marca />
        </div>

        <div className="mx-auto w-full max-w-sm animate-[area-surgir_500ms_ease-out] py-10">
          <div className="mb-10 space-y-3">
            <div className="lg:hidden">
              <Equalizador />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">Entrar na sua área</h1>
            <p className="text-muted-foreground">Use o seu WhatsApp e a sua data de nascimento.</p>
          </div>

          <form onSubmit={enviar} className="space-y-5">
            <Campo
              id="telefone"
              rotulo="WhatsApp"
              icone="telefone"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="(11) 9 0000-0000"
              value={telefone}
              onChange={(e) => {
                setTelefone(mascaraTelefone(e.target.value))
                setErro(null)
              }}
            />
            <Campo
              id="nascimento"
              rotulo="Data de nascimento"
              icone="aniversario"
              inputMode="numeric"
              autoComplete="bday"
              placeholder="dd/mm/aaaa"
              value={nascimento}
              onChange={(e) => {
                setNascimento(mascaraData(e.target.value))
                setErro(null)
              }}
            />

            {erro && (
              <p
                role="alert"
                className="border-roxo/40 bg-roxo/10 text-roxo-claro flex animate-[area-surgir_200ms_ease-out] items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm"
              >
                <Icone nome="atencao" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={!pronto || entrando}
              className="bg-lima text-primary-foreground hover:bg-lima-clara disabled:text-muted-foreground flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold shadow-[0_10px_40px_-12px] shadow-lima/50 transition-all active:scale-[0.98] disabled:bg-white/10 disabled:shadow-none"
            >
              {entrando ? (
                <span className="flex gap-1" aria-label="Entrando">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="bg-primary-foreground h-1.5 w-1.5 animate-[area-pulso_900ms_ease-in-out_infinite] rounded-full"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </span>
              ) : (
                <>
                  Entrar
                  <Icone nome="avancar" className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          <p className="text-muted-foreground mt-6 text-center text-sm">
            Você entra uma vez e o celular fica lembrado.
          </p>
        </div>

        <p className="text-muted-foreground text-center text-xs">
          Não conseguiu entrar? Fale com a liderança da banda.
        </p>
      </section>
    </div>
  )
}
