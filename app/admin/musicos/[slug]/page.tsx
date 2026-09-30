import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Icone } from '@/components/icone'
import { AcessoDaFicha } from '@/components/admin/acesso-da-ficha'
import { AvisosDaFicha } from '@/components/admin/avisos-da-ficha'
import { CadastroDoVoluts } from '@/components/admin/cadastro-voluts'
import { DatasDaFicha } from '@/components/admin/datas-da-ficha'
import { Numero, Rosto, Secao, Selo, vidro } from '@/components/painel/ui'
import { carregarFicha } from '@/lib/dados-musico'
import { linkWhatsApp } from '@/lib/whatsapp'
import { NIVEL_LABEL, ORDEM_LABEL, PRESENCA_LABEL, STATUS_LABEL } from '@/lib/tipos'

export const dynamic = 'force-dynamic'

export default async function MusicoPage({ params }: PageProps<'/admin/musicos/[slug]'>) {
  const { slug } = await params
  const ficha = await carregarFicha(slug)

  if (!ficha) notFound()

  const status = STATUS_LABEL[ficha.status]
  const zap = linkWhatsApp(ficha.whatsapp, '')
  const { resumo } = ficha
  const foto = ficha.voluts?.fotoUrl ? `/foto/${ficha.id}` : null

  return (
    <div className="space-y-8">
      <Link
        href="/admin/musicos"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <Icone nome="anterior" className="h-3 w-3" />
        Pessoas
      </Link>

      {/* Cabeçalho da pessoa */}
      <div className={`${vidro} relative overflow-hidden p-6 sm:p-8`}>
        <div className="bg-roxo/20 absolute -top-24 -right-16 h-64 w-64 rounded-full blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <Rosto nome={ficha.nome} foto={foto} tamanho="xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">{ficha.nome}</h1>
              {ficha.voluts?.nomeCompleto && <p className="text-muted-foreground">{ficha.voluts.nomeCompleto}</p>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Selo>
                <Icone nome={status.icone} className="h-3 w-3" />
                {status.texto}
              </Selo>
              {ficha.presenca && <Selo>presença {PRESENCA_LABEL[ficha.presenca].toLowerCase()}</Selo>}
              {ficha.ehLider && <Selo tom="lima">liderança</Selo>}
              {ficha.banda !== 'music' && <Selo tom="roxo">apoio externo</Selo>}
            </div>
            {ficha.nota && <p className="text-muted-foreground text-sm">{ficha.nota}</p>}
          </div>
          {zap && (
            <a
              href={zap}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-lima text-primary-foreground hover:bg-lima-clara inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-all active:scale-[0.97]"
            >
              <Icone nome="telefone" className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Numero rotulo="Tocou" icone="musica" valor={resumo.tocou} detalhe="como titular" />
        <Numero rotulo="Escalado" icone="escala" valor={resumo.proximasEscalas} detalhe="nas próximas datas" />
        <Numero rotulo="Disse sim" icone="sim" valor={resumo.sim} detalhe="em todas as datas" />
        <Numero
          rotulo="Sem resposta"
          icone="respostas"
          valor={resumo.faltamAbertas}
          detalhe="nas datas abertas"
          alerta={resumo.faltamAbertas > 0 && ficha.banda === 'music'}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
        <div className="space-y-8">
          <AvisosDaFicha musicoId={ficha.id} nome={ficha.nome} avisos={ficha.avisos} />

          <Secao titulo="Instrumentos">
            {ficha.instrumentos.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum instrumento cadastrado ainda.</p>
            ) : (
              <div className={`${vidro} divide-y divide-white/[0.05] overflow-hidden`}>
                {ficha.instrumentos.map((i) => (
                  <div
                    key={i.id}
                    className={`flex items-center justify-between gap-3 px-4 py-3 text-sm ${i.ativo ? '' : 'opacity-60'}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{i.nome}</span>
                      {i.principal && <Selo tom="lima">principal</Selo>}
                      {!i.ativo && <span className="text-muted-foreground text-xs">informou que não toca</span>}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {i.nivel ? NIVEL_LABEL[i.nivel] : 'sem nível'} · {ORDEM_LABEL[i.ordem]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Secao>

          {ficha.banda === 'music' && (
            <AcessoDaFicha
              musicoId={ficha.id}
              slug={ficha.slug}
              whatsapp={ficha.whatsapp}
              aniversario={ficha.aniversario}
              ultimoAcesso={ficha.ultimoAcesso}
              temTelefoneDoCadastro={ficha.temTelefoneDoCadastro}
            />
          )}

          {ficha.voluts && <CadastroDoVoluts cadastro={ficha.voluts} />}
        </div>

        <div className="space-y-8">
          <Secao titulo={`Próximas datas · ${ficha.proximas.length}`}>
            {ficha.proximas.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma data pela frente.</p>
            ) : (
              <DatasDaFicha datas={ficha.proximas} musicoId={ficha.id} slug={ficha.slug} nome={ficha.nome} ajustavel />
            )}
          </Secao>

          {ficha.passadas.length > 0 && (
            <Secao titulo={`Histórico · ${ficha.passadas.length}`}>
              <DatasDaFicha
                datas={ficha.passadas}
                musicoId={ficha.id}
                slug={ficha.slug}
                nome={ficha.nome}
                ajustavel={false}
              />
            </Secao>
          )}
        </div>
      </div>
    </div>
  )
}
