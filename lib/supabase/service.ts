import 'server-only'
import { createClient } from '@supabase/supabase-js'

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
  })
}
