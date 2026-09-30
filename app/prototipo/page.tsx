import type { Metadata } from 'next'
import { Prototipo } from '@/components/area/prototipo'

/**
 * Protótipo da área do músico (30/09/2026). Rota escondida: não aparece em
 * link nenhum do app e pede aos buscadores para não indexar. Só dados de
 * exemplo, nada lê nem grava no banco.
 */
export const metadata: Metadata = {
  title: 'Área do músico · protótipo',
  robots: { index: false, follow: false },
}

export default async function PrototipoPage({ searchParams }: PageProps<'/prototipo'>) {
  const { tela } = await searchParams
  return <Prototipo tela={typeof tela === 'string' ? tela : undefined} />
}
