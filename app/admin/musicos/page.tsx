import { ListaPessoas } from '@/components/painel/lista-pessoas'
import { Cabecalho } from '@/components/painel/ui'
import { listarElenco } from '@/lib/dados-musico'

export const metadata = { title: 'Pessoas · Gestão da Banda' }
export const dynamic = 'force-dynamic'

export default async function MusicosPage() {
  const elenco = await listarElenco()
  const doMusic = elenco.filter((m) => m.banda === 'music')
  const naArea = doMusic.filter((m) => m.noFormulario && m.entrouNaArea).length

  return (
    <div className="space-y-8">
      <Cabecalho
        titulo="Pessoas"
        subtitulo={`${doMusic.length} na Banda · ${naArea} já entraram na área do músico. Toque num nome para ver a ficha.`}
      />
      <ListaPessoas elenco={elenco} />
    </div>
  )
}
