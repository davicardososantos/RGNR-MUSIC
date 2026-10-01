import Link from 'next/link'
import { Icone } from '@/components/icone'
import { CartaoEscala } from '@/components/painel/cartao-escala'
import { MapaCobertura } from '@/components/painel/graficos/mapa-cobertura'
import { RespostasPorData } from '@/components/painel/graficos/respostas-por-data'
import { Botao, Cabecalho, Numero, Rosto, Secao, vidro } from '@/components/painel/ui'
import { carregarImprevistos, carregarInicioAdmin } from '@/lib/dados-admin'
import { carregarPainel } from '@/lib/dados-painel'
import { dataPorExtenso, diaEMes, periodoDoAviso, quandoRelativo } from '@/lib/datas'
import { gestorAtual } from '@/lib/supabase/sessao'
import { nomeDoEvento } from '@/lib/tipos'

export const metadata = { title: 'Painel · Gestão da Banda' }

const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const diaCurto = (iso: string) => SEMANA[new Date(`${iso}T12:00:00`).getDay()]
const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

function saudacao() {
  const h = Number(
    new Intl.DateTimeFormat('pt-BR', { hour: 'numeric', hourCycle: 'h23', timeZone: 'America/Sao_Paulo' }).format(
      new Date(),
    ),
  )
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

const quandoAcesso = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso))

/**
 * O painel dos gestores (30/09/2026): o dia de hoje da banda numa tela.
 * Números de destaque, a próxima escala, o que pede atenção, as respostas
 * por data e o mapa de cobertura por instrumento.
 */
export default async function PainelPage() {
  const [gestor, painel, inicio, imprevistos] = await Promise.all([
    gestorAtual(),
    carregarPainel(),
    carregarInicioAdmin(),
    carregarImprevistos(),
  ])

  const primeiroNome = gestor?.nome?.split(' ')[0] ?? ''
  const proxima = painel.datas[0]
  const abertas = painel.datas.filter((d) => d.aberto)
  const publicada = proxima?.status === 'publicada'

  return (
    <div className="space-y-10">
      <Cabecalho
        titulo={`${saudacao()}, ${primeiroNome}`}
        subtitulo={
          <span className="first-letter:uppercase">
            {dataPorExtenso(painel.hoje)} · {abertas.length} {abertas.length === 1 ? 'data aberta' : 'datas abertas'}{' '}
            para resposta
          </span>
        }
        acoes={
          <>
            {proxima && (
              <Botao href={`/admin/evento/${proxima.data}?tipo=${proxima.tipo}`} icone="escala" tom="lima">
                Montar a próxima
              </Botao>
            )}
            {inicio.faltamResponder > 0 && (
              <Botao href="/admin/respostas" icone="respostas">
                Cobrar respostas
              </Botao>
            )}
          </>
        }
      />

      {/* Números de destaque */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Numero
          rotulo="Respostas em dia"
          icone="respostas"
          valor={`${inicio.emDia}/${inicio.totalMusicos}`}
          detalhe={inicio.faltamResponder ? `${inicio.faltamResponder} ainda faltam` : 'Todo mundo em dia'}
          medidor={{ valor: inicio.emDia, total: inicio.totalMusicos }}
          href="/admin/respostas"
        />
        <Numero
          rotulo="Próxima escala"
          icone="escala"
          valor={proxima ? quandoRelativo(proxima.data) : 'Nada marcado'}
          detalhe={proxima ? `${proxima.preenchidas} de ${proxima.posicoes} posições` : undefined}
          medidor={proxima ? { valor: proxima.preenchidas, total: proxima.posicoes } : undefined}
          href={proxima ? `/admin/evento/${proxima.data}?tipo=${proxima.tipo}` : undefined}
        />
        <Numero
          rotulo="Confirmações"
          icone="concluido"
          valor={publicada ? `${proxima!.confirmados}/${proxima!.escalados}` : 'Rascunho'}
          detalhe={publicada ? 'confirmaram a próxima' : 'Publique para os escalados verem'}
          medidor={publicada ? { valor: proxima!.confirmados, total: proxima!.escalados } : undefined}
          alerta={imprevistos.length > 0}
        />
        <Numero
          rotulo="Área do músico"
          icone="instalar"
          valor={`${painel.adesao.entraram}/${painel.adesao.total}`}
          detalhe="já entraram na área"
          medidor={{ valor: painel.adesao.entraram, total: painel.adesao.total, tom: 'roxo' }}
        />
      </div>

      {/* A próxima escala e o que pede atenção */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:items-start">
        {proxima ? (
          <CartaoEscala d={proxima} destaque />
        ) : (
          <div className={`${vidro} p-6`}>
            <p className="font-medium">Nenhuma data futura cadastrada.</p>
          </div>
        )}

        <Secao titulo="Pede atenção">
          {imprevistos.length === 0 && inicio.avisos.length === 0 ? (
            <div className={`${vidro} flex items-center gap-4 p-5`}>
              <span className="bg-lima/15 text-lima flex h-11 w-11 items-center justify-center rounded-full">
                <Icone nome="sim" className="h-4 w-4" />
              </span>
              <div>
                <p className="font-medium">Tudo tranquilo</p>
                <p className="text-muted-foreground text-sm">Nenhum imprevisto nem aviso em aberto.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {imprevistos.map((i) => (
                <Link
                  key={`${i.slug}-${i.eventoData}`}
                  href={`/admin/evento/${i.eventoData}/cobertura`}
                  className="border-destructive/40 bg-destructive/[0.06] hover:bg-destructive/10 flex items-start gap-3 rounded-2xl border p-4 text-sm transition-colors"
                >
                  <span className="bg-destructive/15 text-destructive flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                    <Icone nome="imprevisto" className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{i.nome}</span>
                    <span className="text-muted-foreground block">
                      {i.funcao} · {i.eventoNome} {quandoRelativo(i.eventoData)}
                    </span>
                    {i.texto && <span className="text-muted-foreground mt-1 block">&ldquo;{i.texto}&rdquo;</span>}
                    <span className="text-destructive mt-1.5 block text-xs font-medium">Ver quem pode cobrir</span>
                  </span>
                </Link>
              ))}
              {inicio.avisos.map((a) => {
                const periodo = periodoDoAviso(a.indisponivelDe, a.indisponivelAte)
                return (
                  <Link
                    key={a.id}
                    href={`/admin/musicos/${a.slug}`}
                    className="border-roxo/30 bg-roxo/[0.06] hover:bg-roxo/10 flex items-start gap-3 rounded-2xl border p-4 text-sm transition-colors"
                  >
                    <span className="bg-roxo/15 text-roxo-claro flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                      <Icone nome="aviso" className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{a.nome}</span>
                      <span className="text-muted-foreground block">{a.texto}</span>
                      {(periodo || a.naoCobrar) && (
                        <span className="text-muted-foreground mt-1 block text-xs">
                          {[periodo && `não pode ${periodo}`, a.naoCobrar && 'não cobrar, falar direto']
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      )}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </Secao>
      </div>

      {/* Respostas por data */}
      {painel.datas.length > 0 && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <Secao
            titulo="Respostas por data"
            descricao={`Das ${painel.total} pessoas da banda, quem pode em cada data.`}
            acao={
              <Link href="/admin/escala" className="text-muted-foreground hover:text-foreground text-xs font-medium">
                Todas as escalas
              </Link>
            }
          >
            <div className={`${vidro} p-5 sm:p-6`}>
              <RespostasPorData
                total={painel.total}
                linhas={painel.datas.slice(0, 10).map((d) => ({
                  id: d.id,
                  href: `/admin/evento/${d.data}?tipo=${d.tipo}`,
                  rotulo: `${diaCurto(d.data)} ${ddmm(d.data)}`,
                  subrotulo: nomeDoEvento(d),
                  sim: d.sim,
                  sePrecisar: d.sePrecisar,
                  nao: d.nao,
                  semResposta: d.semResposta,
                }))}
              />
            </div>
          </Secao>

          <div className="space-y-6">
            <Secao titulo="Aniversariantes" descricao="Nos próximos 30 dias.">
              <div className={`${vidro} divide-y divide-white/[0.05] overflow-hidden`}>
                {painel.aniversarios.length === 0 ? (
                  <p className="text-muted-foreground p-5 text-sm">Ninguém faz aniversário nos próximos 30 dias.</p>
                ) : (
                  painel.aniversarios.slice(0, 5).map((a) => (
                    <Link
                      key={a.slug}
                      href={`/admin/musicos/${a.slug}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]"
                    >
                      <Rosto nome={a.nome} foto={a.foto} tamanho="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{a.nome}</span>
                        <span className="text-muted-foreground block text-xs">
                          {diaEMes(a.data)} · faz {a.idade}
                        </span>
                      </span>
                      <span className={`text-xs font-medium ${a.emDias <= 7 ? 'text-lima' : 'text-muted-foreground'}`}>
                        {a.emDias === 0 ? 'hoje' : quandoRelativo(a.data)}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </Secao>

            <Secao titulo="Entraram na área" descricao="Os acessos mais recentes.">
              <div className={`${vidro} divide-y divide-white/[0.05] overflow-hidden`}>
                {painel.adesao.recentes.length === 0 ? (
                  <p className="text-muted-foreground p-5 text-sm">Ninguém entrou ainda.</p>
                ) : (
                  painel.adesao.recentes.slice(0, 5).map((a) => (
                    <Link
                      key={a.slug}
                      href={`/admin/musicos/${a.slug}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]"
                    >
                      <Rosto nome={a.nome} foto={a.foto} tamanho="sm" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{a.nome}</span>
                      <span className="text-muted-foreground text-xs tabular-nums">{quandoAcesso(a.quando)}</span>
                    </Link>
                  ))
                )}
              </div>
            </Secao>
          </div>
        </div>
      )}

      {/* Mapa de cobertura */}
      {painel.datas.length > 0 && (
        <Secao
          titulo="Cobertura por instrumento"
          descricao="Quantas pessoas que tocam cada instrumento disseram sim em cada data. Passe o dedo ou o mouse para ver os nomes."
        >
          {/* Fundo sólido: a coluna fixa dos instrumentos precisa da mesma cor ao rolar. */}
          <div className="rounded-3xl border border-white/[0.07] bg-[#0c0c11] p-5 sm:p-6">
            <MapaCobertura
              linhas={painel.cobertura.linhas}
              celulas={painel.cobertura.celulas}
              datas={painel.cobertura.datas.map((d) => ({
                id: d.id,
                data: d.data,
                // Data que ninguém respondeu ainda não é buraco: é cedo.
                semRespostas: (painel.datas.find((x) => x.id === d.id)?.semResposta ?? 0) >= painel.total,
                rotulo: ddmm(d.data),
                dia: diaCurto(d.data),
                href: `/admin/evento/${d.data}?tipo=${d.tipo}`,
              }))}
            />
          </div>
        </Secao>
      )}
    </div>
  )
}
