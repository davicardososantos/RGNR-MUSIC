import Link from 'next/link'
import { Icone } from '@/components/icone'
import { TabelaRelatorio } from '@/components/admin/tabela-relatorio'
import { carregarRelatorios, type LinhaRelatorio } from '@/lib/relatorios'

export const metadata = { title: 'Relatórios — Gestão' }
export const dynamic = 'force-dynamic'

function Destaque({
  titulo,
  explicacao,
  vazio,
  linhas,
  detalhe,
}: {
  titulo: string
  explicacao: string
  vazio: string
  linhas: LinhaRelatorio[]
  detalhe: (l: LinhaRelatorio) => string
}) {
  return (
    <section className="space-y-2.5">
      <div className="space-y-1">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          {titulo}
        </h2>
        <p className="text-muted-foreground text-xs">{explicacao}</p>
      </div>

      {linhas.length === 0 ? (
        <p className="border-border text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center text-sm">
          {vazio}
        </p>
      ) : (
        <div className="space-y-2">
          {linhas.map((l) => (
            <Link
              key={l.id}
              href={`/admin/musicos/${l.slug}`}
              className="border-border hover:bg-accent/40 flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-colors"
            >
              <span className="truncate font-medium">{l.nome}</span>
              <span className="text-muted-foreground shrink-0 text-xs">
                {detalhe(l)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

export default async function RelatoriosPage() {
  const { linhas, eventosPassados, respondiveis, datasAbertas } =
    await carregarRelatorios()

  // Disse que podia e quase não foi chamado. É o caso que some sozinho:
  // ninguém reclama de não ser escalado, a pessoa só para de responder.
  const disponiveisPoucoChamados = [...linhas]
    .filter((l) => l.sim >= 2 && l.tocou <= 1 && l.status !== 'fora')
    .sort((a, b) => b.sim - a.sim || a.tocou - b.tocou)
    .slice(0, 6)

  const carregando = [...linhas].sort((a, b) => b.tocou - a.tocou).slice(0, 5)

  const sumiram = linhas.filter(
    (l) => l.faltamAbertas === datasAbertas && datasAbertas > 0,
  )

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <Link href="/admin" className="text-muted-foreground hover:text-foreground text-sm">
          ← painel
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground text-sm">
          {linhas.length} pessoas no formulário, {eventosPassados} datas já
          realizadas e {datasAbertas} abertas agora.
        </p>
      </div>

      <Destaque
        titulo="Disponíveis e pouco chamados"
        explicacao="Marcaram que podiam em duas datas ou mais e tocaram no máximo uma vez. Vale um olhar antes de fechar a próxima escala."
        vazio="Ninguém nessa situação agora."
        linhas={disponiveisPoucoChamados}
        detalhe={(l) => `${l.sim} vezes disse que podia · tocou ${l.tocou}`}
      />

      <Destaque
        titulo="Carregando a escala"
        explicacao="Quem mais tocou nas datas já realizadas. Serve para revezar antes de cansar."
        vazio="Nenhuma escala registrada ainda."
        linhas={carregando}
        detalhe={(l) => `tocou ${l.tocou}`}
      />

      <Destaque
        titulo="Sem nenhuma resposta"
        explicacao="Não responderam nenhuma das datas abertas. É com quem a cobrança do WhatsApp começa."
        vazio="Todo mundo respondeu pelo menos uma data."
        linhas={sumiram}
        detalhe={() => `${datasAbertas} em branco`}
      />

      <section className="space-y-2.5">
        <div className="space-y-1">
          <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Todo mundo
          </h2>
          <p className="text-muted-foreground text-xs">
            Toque no cabeçalho para ordenar. <strong>Tocou</strong> conta como
            titular em data já realizada, <strong>pode</strong> conta os
            &ldquo;sim&rdquo; e <strong>resp.</strong> é quanto das{' '}
            {respondiveis} datas respondíveis a pessoa respondeu.
          </p>
        </div>
        <TabelaRelatorio linhas={linhas} respondiveis={respondiveis} />
      </section>

      <p className="text-muted-foreground flex items-start gap-2 text-xs">
        <Icone nome="atencao" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Os números começam em setembro de 2026, quando as escalas passaram a ser
        registradas aqui. Quem tocou antes disso não aparece.
      </p>
    </div>
  )
}
