import type { ReactNode } from 'react'
import {
  ESCOLARIDADE_LABEL,
  ESTADO_CIVIL_LABEL,
  GENERO_LABEL,
  REDE_LABEL,
  aniversarioComIdade,
  diasPorExtenso,
  linkDaRede,
  type CadastroVoluts,
} from '@/lib/voluts'

const dataBR = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date(iso))

const link = 'text-lima underline-offset-4 hover:underline break-all'

/**
 * O que o Voluts sabe da pessoa, na ficha do painel.
 *
 * Só leitura: quem atualiza é o script de sincronização, e o que estiver
 * errado se corrige no Voluts. Por isso não há botão de editar aqui.
 */
export function CadastroDoVoluts({ cadastro: c }: { cadastro: CadastroVoluts }) {
  const linhas: [string, ReactNode][] = []
  const mais = (rotulo: string, valor: ReactNode | null | undefined) => {
    if (valor) linhas.push([rotulo, valor])
  }

  mais(
    'E-mail',
    c.email && (
      <a href={`mailto:${c.email}`} className={link}>
        {c.email}
      </a>
    ),
  )
  mais('Aniversário', c.aniversario && aniversarioComIdade(c.aniversario))
  mais('Funções', c.funcoes.length > 0 && c.funcoes.join(', '))
  mais(
    'Dias que marcou',
    c.dias.length > 0 && (
      <span className="flex flex-col">
        {diasPorExtenso(c.dias).map((d) => (
          <span key={d}>{d}</span>
        ))}
      </span>
    ),
  )
  mais('Escala mais recente', c.ultimaEscala && dataBR(c.ultimaEscala))
  mais('Profissão', c.profissao)
  mais('Formação', c.formacao)
  mais('Escolaridade', c.escolaridade && (ESCOLARIDADE_LABEL[c.escolaridade] ?? c.escolaridade))
  mais('Estado civil', c.estadoCivil && (ESTADO_CIVIL_LABEL[c.estadoCivil] ?? c.estadoCivil))
  mais('Gênero', c.genero && (GENERO_LABEL[c.genero] ?? c.genero))
  mais(
    'Redes',
    c.redes.length > 0 && (
      <span className="flex flex-col">
        {c.redes.map((r) => (
          <a
            key={r.rede}
            href={linkDaRede(r.rede, r.valor)}
            target="_blank"
            rel="noopener noreferrer"
            className={link}
          >
            {REDE_LABEL[r.rede]}: {r.valor}
          </a>
        ))}
      </span>
    ),
  )

  return (
    <section className="space-y-2.5">
      <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
        Cadastro no Voluts
      </h2>

      <div className="border-border space-y-3 rounded-xl border p-3.5">
        <div className="flex items-center gap-3">
          {c.fotoUrl && (
            // Foto pública do Voluts, fora do domínio do app: <img> simples
            // evita configurar domínio remoto só para isto.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={c.fotoUrl}
              alt=""
              loading="lazy"
              className="bg-muted h-12 w-12 shrink-0 rounded-full object-cover"
            />
          )}
          <div className="min-w-0">
            <p className="font-medium">{c.nomeCompleto ?? 'Sem nome completo'}</p>
            {c.apelido && (
              <p className="text-muted-foreground text-xs">apelido no Voluts: {c.apelido}</p>
            )}
          </div>
        </div>

        {linhas.length > 0 && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
            {linhas.map(([rotulo, valor]) => (
              <div key={rotulo} className="contents">
                <dt className="text-muted-foreground">{rotulo}</dt>
                <dd className="min-w-0">{valor}</dd>
              </div>
            ))}
          </dl>
        )}

        {c.sincronizadoEm && (
          <p className="text-muted-foreground text-xs">
            Trazido do Voluts em {dataBR(c.sincronizadoEm)}. Para corrigir, mude lá.
          </p>
        )}
      </div>
    </section>
  )
}
