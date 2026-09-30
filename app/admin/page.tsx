import Link from 'next/link'
import { Icone, type NomeIcone } from '@/components/icone'
import { carregarImprevistos, carregarInicioAdmin } from '@/lib/dados-admin'
import { dataPorExtenso, hora, periodoDoAviso, quandoRelativo } from '@/lib/datas'
import { gestorAtual } from '@/lib/supabase/sessao'
import { EVENTO_LABEL, nomeDoEvento } from '@/lib/tipos'

export const metadata = { title: 'Painel — Escala MUSIC' }

/** Linha de navegação. Alvo de toque generoso: isso é usado no celular. */
function Opcao({
  href,
  icone,
  cor,
  titulo,
  descricao,
  selo,
}: {
  href: string
  icone: NomeIcone
  cor: string
  titulo: string
  descricao: string
  selo?: string
}) {
  return (
    <Link
      href={href}
      className="border-border hover:bg-accent/40 active:bg-accent flex items-center gap-3.5 rounded-xl border px-4 py-3.5 transition-colors"
    >
      <Icone nome={icone} className={`h-5 w-5 shrink-0 ${cor}`} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-medium">{titulo}</span>
          {selo && (
            <span className="bg-roxo/20 text-roxo-claro rounded-full px-2 py-0.5 text-xs font-medium">
              {selo}
            </span>
          )}
        </span>
        <span className="text-muted-foreground block text-sm">{descricao}</span>
      </span>
      <Icone nome="avancar" className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
    </Link>
  )
}

export default async function AdminPage() {
  const [gestor, inicio, imprevistos] = await Promise.all([
    gestorAtual(),
    carregarInicioAdmin(),
    carregarImprevistos(),
  ])
  const { proximo, totalMusicos, emDia, faltamResponder, datasAbertas } = inicio

  const primeiroNome = gestor?.nome?.split(' ')[0] ?? null
  const percentual = totalMusicos ? Math.round((emDia / totalMusicos) * 100) : 0

  return (
    <div className="space-y-7">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {primeiroNome ? `Olá, ${primeiroNome}` : 'Painel'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {emDia} de {totalMusicos} responderam as {datasAbertas} datas abertas (
          {percentual}%)
        </p>
      </div>

      {/* O próximo evento é o que a liderança abre o app para ver. */}
      {proximo ? (
        (() => {
          const { evento, preenchidas, posicoes, responderam, sim } = proximo
          const rotulo = EVENTO_LABEL[evento.tipo]
          const completa = posicoes > 0 && preenchidas >= posicoes

          return (
            <Link
              href={`/admin/evento/${evento.data}?tipo=${evento.tipo}`}
              className="border-border hover:bg-accent/40 block rounded-2xl border p-5 transition-colors"
            >
              <p className="text-muted-foreground flex items-center gap-2 text-xs tracking-wide uppercase">
                <Icone nome={rotulo.icone} className={`h-3.5 w-3.5 ${rotulo.cor}`} />
                Próximo · {quandoRelativo(evento.data)}
              </p>

              <p className="mt-2 text-xl font-semibold tracking-tight">
                {dataPorExtenso(evento.data)}
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                {nomeDoEvento(evento)} · {hora(evento.hora_evento)}
                {evento.hora_passagem && ` · passagem ${hora(evento.hora_passagem)}`}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                <div className={`rounded-lg px-2 py-2 ${rotulo.fundo}`}>
                  <p className={`text-lg font-semibold ${rotulo.cor}`}>
                    {preenchidas}
                    <span className="text-muted-foreground text-sm">/{posicoes}</span>
                  </p>
                  <p className="text-muted-foreground text-xs">posições</p>
                </div>
                <div className="bg-lima/10 rounded-lg px-2 py-2">
                  <p className="text-lima text-lg font-semibold">{sim}</p>
                  <p className="text-muted-foreground text-xs">podem</p>
                </div>
                <div className="bg-muted/50 rounded-lg px-2 py-2">
                  <p className="text-muted-foreground text-lg font-semibold">
                    {responderam}
                  </p>
                  <p className="text-muted-foreground text-xs">respostas</p>
                </div>
              </div>

              <p className="mt-3.5 flex items-center gap-2 text-sm font-medium">
                <Icone
                  nome={completa ? 'concluido' : 'adicionar'}
                  className={`h-3.5 w-3.5 ${completa ? 'text-lima' : 'text-roxo-claro'}`}
                />
                {completa ? 'Escala completa — revisar' : 'Montar a escala'}
              </p>
            </Link>
          )
        })()
      ) : (
        <p className="border-border text-muted-foreground rounded-xl border border-dashed px-4 py-6 text-center text-sm">
          Nenhuma data futura cadastrada.
        </p>
      )}

      {/* Quem avisou pela área do músico que não vai mais poder: pede troca. */}
      {imprevistos.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Imprevistos · {imprevistos.length}
          </h2>
          <div className="space-y-2">
            {imprevistos.map((i) => (
              <Link
                key={`${i.slug}-${i.eventoData}`}
                href={`/admin/evento/${i.eventoData}/cobertura`}
                className="border-destructive/40 bg-destructive/5 hover:bg-destructive/10 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm transition-colors"
              >
                <Icone nome="imprevisto" className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{i.nome}</span>
                  <span className="text-muted-foreground">
                    {' '}
                    · {i.funcao} · {i.eventoNome} {quandoRelativo(i.eventoData)}
                  </span>
                  {i.texto && <span className="text-muted-foreground block">{i.texto}</span>}
                  <span className="text-muted-foreground mt-0.5 block text-xs">ver quem pode cobrir →</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* O recado que um gestor recebeu no WhatsApp e o outro precisa saber. */}
      {inicio.avisos.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Avisos · {inicio.avisos.length}
          </h2>
          <div className="space-y-2">
            {inicio.avisos.map((aviso) => {
              const periodo = periodoDoAviso(aviso.indisponivelDe, aviso.indisponivelAte)
              return (
                <Link
                  key={aviso.id}
                  href={`/admin/musicos/${aviso.slug}`}
                  className="border-roxo/30 bg-roxo/5 hover:bg-roxo/10 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm transition-colors"
                >
                  <Icone nome="aviso" className="text-roxo-claro mt-0.5 h-4 w-4 shrink-0" />
                  <span className="min-w-0">
                    <span className="font-medium">{aviso.nome}</span>
                    <span className="text-muted-foreground block">{aviso.texto}</span>
                    {(periodo || aviso.naoCobrar) && (
                      <span className="text-muted-foreground mt-0.5 block text-xs">
                        {[periodo && `não pode ${periodo}`, aviso.naoCobrar && 'não cobrar, falar direto']
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    )}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {faltamResponder > 0 && (
        <Link
          href="/admin/respostas"
          className="border-roxo/30 bg-roxo/5 hover:bg-roxo/10 flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors"
        >
          <span className="flex items-center gap-2.5">
            <Icone nome="atencao" className="text-roxo-claro h-4 w-4 shrink-0" />
            <span>
              <strong className="font-medium">{faltamResponder}</strong>{' '}
              {faltamResponder === 1 ? 'pessoa ainda não respondeu' : 'pessoas ainda não responderam'}
            </span>
          </span>
          <span className="text-muted-foreground shrink-0">cobrar →</span>
        </Link>
      )}

      <div className="space-y-2.5">
        <Opcao
          href="/admin/escala"
          icone="escala"
          cor="text-roxo-claro"
          titulo="Escalas"
          descricao="Montar e revisar as próximas datas"
          selo={inicio.qtdProximos ? `${inicio.qtdProximos}` : undefined}
        />
        <Opcao
          href="/admin/respostas"
          icone="respostas"
          cor="text-lima"
          titulo="Respostas"
          descricao="Quem pode, quem não pode e quem falta"
          selo={faltamResponder ? `${faltamResponder} faltam` : undefined}
        />
        <Opcao
          href="/admin/musicos"
          icone="pessoas"
          cor="text-lima"
          titulo="Pessoas"
          descricao="A ficha de cada um: escalas, respostas e histórico"
          selo={totalMusicos ? `${totalMusicos}` : undefined}
        />
        <Opcao
          href="/admin/relatorios"
          icone="relatorios"
          cor="text-roxo-claro"
          titulo="Relatórios"
          descricao="Quem mais toca, quem mais se dispõe e quem sumiu"
        />
        <Opcao
          href="/admin/historico"
          icone="historico"
          cor="text-roxo"
          titulo="Histórico"
          descricao="As escalas que já aconteceram"
          selo={inicio.qtdHistorico ? `${inicio.qtdHistorico}` : undefined}
        />
      </div>
    </div>
  )
}
