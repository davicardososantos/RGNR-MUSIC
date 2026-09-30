import type { Metadata, Viewport } from 'next'
import { AreaApp } from '@/components/area/area-app'
import { TelaEntrar } from '@/components/area/tela-entrar'
import { carregarArea } from '@/lib/area/dados'
import { musicoLogado } from '@/lib/area/sessao'

/**
 * A área do músico (30/09/2026). Substituiu o formulário na raiz, que é o
 * link que circula no WhatsApp. Sem sessão, mostra a entrada; com sessão,
 * a área inteira. O formulário antigo continua em /formulario.
 */
export const metadata: Metadata = {
  title: 'RGNR Music · Banda',
  description: 'Suas escalas, suas datas e quem toca com você.',
  appleWebApp: { capable: true, title: 'RGNR Music', statusBarStyle: 'black-translucent' },
  icons: { apple: '/apple-touch-icon.png' },
}

// Só esta página ocupa a tela inteira no iPhone (atrás do entalhe); as
// margens seguras ficam por conta de env(safe-area-inset-*) nos componentes.
export const viewport: Viewport = { viewportFit: 'cover' }

export const dynamic = 'force-dynamic'

export default async function Home() {
  const musico = await musicoLogado()
  if (!musico) return <TelaEntrar />

  const dados = await carregarArea(musico.id)
  return <AreaApp dados={dados} />
}
