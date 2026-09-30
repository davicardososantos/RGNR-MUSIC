import 'server-only'
import { createClient } from '@supabase/supabase-js'

const esperar = (ms: number) => new Promise((ok) => setTimeout(ok, ms))

/**
 * fetch com até 3 tentativas para as falhas passageiras do banco.
 *
 * Em 30/09/2026 a página principal deu erro 500 duas vezes logo depois de
 * um deploy e voltou sozinha no acesso seguinte; em 29/09 o script do bom
 * dia já tinha levado um 401 passageiro na primeira chamada. Sem nova
 * tentativa, uma falha dessas derruba a página inteira para o músico.
 *
 * - 401: o banco recusou antes de executar. Repetir é seguro em qualquer
 *   método.
 * - 5xx, 429 e erro de rede: só repete leitura (GET/HEAD). Escrita pode ter
 *   sido executada antes da resposta se perder, e repetir gravaria duas
 *   vezes.
 */
async function fetchComNovaTentativa(entrada: RequestInfo | URL, opcoes?: RequestInit): Promise<Response> {
  const metodo = (opcoes?.method ?? 'GET').toUpperCase()
  const leitura = metodo === 'GET' || metodo === 'HEAD'

  for (let tentativa = 1; ; tentativa++) {
    const ultima = tentativa >= 3
    try {
      const resposta = await fetch(entrada, opcoes)
      const passageira =
        resposta.status === 401 || (leitura && (resposta.status >= 500 || resposta.status === 429))
      if (!passageira || ultima) return resposta
    } catch (erro) {
      if (!leitura || ultima) throw erro
    }
    await esperar(300 * tentativa)
  }
}

/**
 * Cliente com service role — ignora RLS.
 *
 * O schema roda com RLS deny-all e ZERO policies (PRD §9): anon e
 * authenticated não leem nada. Este cliente é a única porta de entrada
 * ao banco, e ele só existe no servidor.
 *
 * O `import 'server-only'` acima quebra o build se alguém importar
 * este arquivo de um componente client — que é o comportamento desejado.
 */
export function servico() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY. Ver .env.example',
    )
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchComNovaTentativa },
  })
}
