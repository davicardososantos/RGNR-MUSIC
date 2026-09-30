import { CartaoEscala } from '@/components/painel/cartao-escala'
import { Botao, Cabecalho, Secao } from '@/components/painel/ui'
import { carregarPainel } from '@/lib/dados-painel'
import { chaveDoMes, nomeDaChave } from '@/lib/datas'

export const metadata = { title: 'Escalas · Gestão da Banda' }

export default async function EscalasPage() {
  const { datas } = await carregarPainel()

  const meses = [...new Set(datas.map((d) => chaveDoMes(d.data)))]
  const publicadas = datas.filter((d) => d.status === 'publicada').length
  const completas = datas.filter((d) => d.posicoes > 0 && d.preenchidas >= d.posicoes).length

  return (
    <div className="space-y-10">
      <Cabecalho
        titulo="Escalas"
        subtitulo={
          datas.length === 0
            ? 'Nenhuma data futura cadastrada.'
            : `${datas.length} datas pela frente · ${completas} completas · ${publicadas} publicadas.`
        }
        acoes={
          <Botao href="/admin/historico" icone="historico">
            Histórico
          </Botao>
        }
      />

      {meses.map((mes) => {
        const doMes = datas.filter((d) => chaveDoMes(d.data) === mes)
        return (
          <Secao key={mes} titulo={<span className="capitalize">{nomeDaChave(mes)}</span>}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {doMes.map((d) => (
                <CartaoEscala key={d.id} d={d} />
              ))}
            </div>
          </Secao>
        )
      })}
    </div>
  )
}
