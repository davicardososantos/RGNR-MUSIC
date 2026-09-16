import { PaginaDoMes, metadataDoMes } from '@/components/formulario/pagina-do-mes'

const ANO = 2026
const MES = 10

export const metadata = metadataDoMes(MES)

// A lista de músicos e os eventos mudam pouco, mas uma resposta gravada
// precisa aparecer na volta — nada de cache estático aqui.
export const dynamic = 'force-dynamic'

export default function OutubroPage() {
  return <PaginaDoMes ano={ANO} mes={MES} />
}
