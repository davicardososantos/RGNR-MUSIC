import Link from 'next/link'
import { Icone } from '@/components/icone'
import type { ResumoEvento } from '@/lib/dados-admin'
import { dataPorExtenso, diaEMes, hora, quandoRelativo } from '@/lib/datas'
import { EVENTO_LABEL, nomeDoEvento } from '@/lib/tipos'

/**
 * O cartão de uma data no painel.
 *
 * `passado` troca o que o cartão enfatiza: numa data futura o que importa é
 * quem respondeu (ainda dá para montar); numa que já aconteceu, importa quem
 * tocou. Por isso o histórico esconde o bloco de disponibilidade.
 */
export function CartaoEvento({
  resumo,
  passado = false,
}: {
  resumo: ResumoEvento
  passado?: boolean
}) {
  const { evento, sim, sePrecisar, nao, responderam, preenchidas, posicoes } = resumo
  const rotulo = EVENTO_LABEL[evento.tipo]
  const completa = posicoes > 0 && preenchidas >= posicoes

  return (
    <Link
      // ?tipo= é obrigatório: 05/09 tem Conferência e Atmosfera na mesma data.
      href={`/admin/evento/${evento.data}?tipo=${evento.tipo}`}
      className="border-border hover:bg-accent/40 active:bg-accent block rounded-xl border p-4 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-base font-medium">
            <Icone nome={rotulo.icone} className={`h-3.5 w-3.5 shrink-0 ${rotulo.cor}`} />
            {passado ? diaEMes(evento.data) : dataPorExtenso(evento.data)}
          </p>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {nomeDoEvento(evento)} · {hora(evento.hora_evento)}
            {evento.hora_passagem && ` · passagem ${hora(evento.hora_passagem)}`}
          </p>
        </div>
        <span className="text-muted-foreground shrink-0 text-xs">
          {passado ? quandoRelativo(evento.data) : `${responderam} respostas`}
        </span>
      </div>

      {passado ? (
        <p className="text-muted-foreground mt-3 flex items-center gap-2 text-sm">
          <Icone nome="musica" className={`h-3.5 w-3.5 shrink-0 ${rotulo.cor}`} />
          {preenchidas > 0
            ? `${preenchidas} ${preenchidas === 1 ? 'posição registrada' : 'posições registradas'}`
            : 'Escala não registrada'}
        </p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="bg-lima/10 rounded-lg px-2 py-2">
              <p className="text-lima text-lg font-semibold">{sim}</p>
              <p className="text-muted-foreground text-xs">podem</p>
            </div>
            <div className="bg-roxo/15 rounded-lg px-2 py-2">
              <p className="text-roxo-claro text-lg font-semibold">{sePrecisar}</p>
              <p className="text-muted-foreground text-xs">se precisar</p>
            </div>
            <div className="bg-muted/50 rounded-lg px-2 py-2">
              <p className="text-muted-foreground text-lg font-semibold">{nao}</p>
              <p className="text-muted-foreground text-xs">não podem</p>
            </div>
          </div>

          <p className="mt-3 flex items-center gap-2 text-sm">
            <Icone
              nome={completa ? 'concluido' : 'adicionar'}
              className={`h-3.5 w-3.5 shrink-0 ${completa ? 'text-lima' : 'text-muted-foreground'}`}
            />
            <span className={completa ? 'text-lima' : 'text-muted-foreground'}>
              {preenchidas} de {posicoes} posições
            </span>
          </p>

          {evento.prazo_resposta && (
            <p className="text-muted-foreground mt-2 text-xs">
              Prazo anunciado: {diaEMes(evento.prazo_resposta)}. O formulário segue
              aberto até você encerrar.
            </p>
          )}
        </>
      )}
    </Link>
  )
}
