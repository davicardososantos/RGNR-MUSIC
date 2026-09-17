import { redirect } from 'next/navigation'

// O formulário deixou de ser por mês em 17/09/2026: a raiz mostra todas as
// datas abertas de uma vez. Esta rota fica porque o link já foi colado no
// WhatsApp e não pode virar 404.
export default function OutubroPage() {
  redirect('/')
}
