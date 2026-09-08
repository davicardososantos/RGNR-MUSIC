import Image from 'next/image'
import { Icone } from '@/components/icone'
import { Formulario } from '@/components/formulario/formulario'
import { musicosDesteNavegador } from '@/lib/chave-edicao'
import {
  listarEventosAbertos,
  listarInstrumentos,
  listarMusicosDoFormulario,
} from '@/lib/dados'

export const metadata = {
  title: 'Disponibilidade de setembro — Banda RGNR',
  description: 'Marque em quais datas de setembro você pode tocar.',
}

// A lista de músicos e os eventos mudam pouco, mas uma resposta gravada
// precisa aparecer na volta — nada de cache estático aqui.
export const dynamic = 'force-dynamic'

export default async function SetembroPage() {
  const [musicos, eventos, instrumentos, jaRespondidos] = await Promise.all([
    listarMusicosDoFormulario(),
    listarEventosAbertos(),
    listarInstrumentos(),
    musicosDesteNavegador(),
  ])

  if (eventos.length === 0) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-sm space-y-3 text-center">
          <Icone nome="encerrado" className="text-muted-foreground mx-auto h-9 w-9" />
          <h1 className="text-xl font-semibold">Respostas encerradas</h1>
          <p className="text-muted-foreground text-sm">
            A escala de setembro já foi fechada. Qualquer coisa, fala com o Davi ou o
            André.
          </p>
        </div>
      </main>
    )
  }

  const prazo = eventos.find((e) => e.prazo_resposta)?.prazo_resposta ?? null

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 sm:py-12">
      <header className="mb-8 space-y-4">
        <Image
          src="/logo-rgnr-music.jpg"
          alt="RGNR MUSIC"
          width={501}
          height={501}
          priority
          className="border-border h-16 w-16 rounded-xl border object-cover"
        />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Disponibilidade de setembro
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Leva menos de dois minutos.
          </p>
        </div>
      </header>

      <Formulario
        musicos={musicos}
        eventos={eventos}
        instrumentos={instrumentos}
        prazo={prazo}
        jaRespondidos={jaRespondidos}
      />

      <footer className="text-muted-foreground mt-10 text-center text-xs">
        Só a liderança vê as respostas.
      </footer>
    </main>
  )
}
