import { PaginaFormulario } from '@/components/formulario/pagina-formulario'

export { metadata } from '@/components/formulario/pagina-formulario'

/**
 * O formulário sem login, como era até 30/09/2026.
 *
 * A raiz virou a área do músico (com login). Este endereço fica como
 * reserva para quem ainda não consegue entrar lá, por exemplo quem não tem
 * data de nascimento no cadastro. Não há link para cá na área: os gestores
 * mandam direto para quem precisar.
 */
export const dynamic = 'force-dynamic'

export default function Formulario() {
  return <PaginaFormulario />
}
