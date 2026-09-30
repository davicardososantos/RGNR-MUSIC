import Link from 'next/link'
import { Icone } from '@/components/icone'
import { TabelaRelatorio } from '@/components/admin/tabela-relatorio'
import { DisponivelTocou } from '@/components/painel/graficos/disponivel-tocou'
import { Cabecalho, Numero, Secao, vidro } from '@/components/painel/ui'
import { carregarRelatorios, type LinhaRelatorio } from '@/lib/relatorios'

export const metadata = { title: 'Relatórios · Gestão da Banda' }
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
    <div className={`${vidro} flex flex-col p-5`}>
      <h3 className="font-semibold">{titulo}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{explicacao}</p>
      {linhas.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">{vazio}</p>
      ) : (
        <div className="mt-4 divide-y divide-white/[0.05]">
          {linhas.map((l) => (
            <Link
              key={l.id}
              href={`/admin/musicos/${l.slug}`}
              className="flex items-center justify-between gap-3 py-2.5 text-sm transition-colors hover:text-lima"
            >
              <span className="truncate font-medium">{l.nome}</span>
              <span className="text-muted-foreground shrink-0 text-xs">{detalhe(l)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default async function RelatoriosPage() {
  const { linhas, eventosPassados, respondiveis, datasAbertas } = await carregarRelatorios()

  // Disse que podia e quase não foi chamado. É o caso que some sozinho:
  // ninguém reclama de não ser escalado, a pessoa só para de responder.
  const disponiveisPoucoChamados = [...linhas]
    .filter((l) => l.sim >= 2 && l.tocou <= 1 && l.status !== 'fora')
    .sort((a, b) => b.sim - a.sim || a.tocou - b.tocou)
    .slice(0, 6)
  const carregando = [...linhas].sort((a, b) => b.tocou - a.tocou).slice(0, 6)
  const sumiram = linhas.filter((l) => l.faltamAbertas === datasAbertas && datasAbertas > 0)

  const totalTocou = linhas.reduce((s, l) => s + l.tocou, 0)
  const tocaram = linhas.filter((l) => l.tocou > 0).length
  const taxa = respondiveis
    ? Math.round((linhas.reduce((s, l) => s + l.respondidas, 0) / (linhas.length * respondiveis)) * 100)
    : 0

  return (
    <div className="space-y-10">
      <Cabecalho
        titulo="Relatórios"
        subtitulo={`${linhas.length} pessoas, ${eventosPassados} datas já realizadas e ${datasAbertas} abertas agora.`}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Numero rotulo="Datas realizadas" icone="historico" valor={eventosPassados} detalhe="desde setembro de 2026" />
        <Numero
          rotulo="Pessoas que tocaram"
          icone="pessoas"
          valor={`${tocaram}/${linhas.length}`}
          detalhe={`${totalTocou} escalas no total`}
          medidor={{ valor: tocaram, total: linhas.length }}
        />
        <Numero
          rotulo="Taxa de resposta"
          icone="respostas"
          valor={`${taxa}%`}
          detalhe={`de ${respondiveis} datas respondíveis`}
          medidor={{ valor: taxa, total: 100, tom: 'roxo' }}
        />
        <Numero
          rotulo="Sem nenhuma resposta"
          icone="atencao"
          valor={sumiram.length}
          detalhe="nas datas abertas"
          alerta={sumiram.length > 0}
          href="/admin/respostas"
        />
      </div>

      <Secao
        titulo="Disse que podia × tocou"
        descricao="Faixa clara: quantas vezes disse sim. Barra cheia: quantas vezes tocou. Faixa longa com barra curta é quem está disponível e pouco chamado."
      >
        <div className={`${vidro} p-5 sm:p-6`}>
          <DisponivelTocou
            linhas={linhas.map((l) => ({ id: l.id, nome: l.nome, slug: l.slug, sim: l.sim, tocou: l.tocou }))}
          />
        </div>
      </Secao>

      <div className="grid gap-3 lg:grid-cols-3">
        <Destaque
          titulo="Disponíveis e pouco chamados"
          explicacao="Disseram sim em duas datas ou mais e tocaram no máximo uma vez."
          vazio="Ninguém nessa situação agora."
          linhas={disponiveisPoucoChamados}
          detalhe={(l) => `sim ${l.sim} · tocou ${l.tocou}`}
        />
        <Destaque
          titulo="Carregando a escala"
          explicacao="Quem mais tocou. Serve para revezar antes de cansar."
          vazio="Nenhuma escala registrada ainda."
          linhas={carregando}
          detalhe={(l) => `tocou ${l.tocou}`}
        />
        <Destaque
          titulo="Sem nenhuma resposta"
          explicacao="Não responderam nenhuma data aberta. É por quem a cobrança começa."
          vazio="Todo mundo respondeu pelo menos uma data."
          linhas={sumiram}
          detalhe={() => `${datasAbertas} em branco`}
        />
      </div>

      <Secao
        titulo="Todo mundo"
        descricao={
          <>
            Toque no cabeçalho para ordenar. <strong>Tocou</strong> conta como titular em data já realizada,{' '}
            <strong>pode</strong> conta os &ldquo;sim&rdquo; e <strong>resp.</strong> é quanto das {respondiveis}{' '}
            datas respondíveis a pessoa respondeu.
          </>
        }
      >
        <div className={`${vidro} overflow-hidden p-2 sm:p-4`}>
          <TabelaRelatorio linhas={linhas} respondiveis={respondiveis} />
        </div>
      </Secao>

      <p className="text-muted-foreground flex items-start gap-2 text-xs">
        <Icone nome="atencao" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Os números começam em setembro de 2026, quando as escalas passaram a ser registradas aqui. Quem tocou antes
        disso não aparece.
      </p>
    </div>
  )
}
