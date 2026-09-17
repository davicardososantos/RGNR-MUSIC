import { PaginaFormulario } from '@/components/formulario/pagina-formulario'

export { metadata } from '@/components/formulario/pagina-formulario'

// A lista de músicos e os eventos mudam pouco, mas uma resposta gravada
// precisa aparecer na volta — nada de cache estático aqui.
export const dynamic = 'force-dynamic'

export default function Home() {
  return <PaginaFormulario />
}
