import type { MetadataRoute } from 'next'

/**
 * O app na tela do celular (30/09/2026). "Adicionar à tela inicial" abre a
 * área do músico sem a barra do navegador, como um app. Os ícones saem do
 * logo do RGNR MUSIC (public/icone-*.png, gerados com o sharp).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RGNR Music · Banda',
    short_name: 'RGNR Music',
    description: 'Suas escalas, suas datas e quem toca com você.',
    lang: 'pt-BR',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0a0a0e',
    theme_color: '#0a0a0e',
    icons: [
      { src: '/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
