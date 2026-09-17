import Image from 'next/image'
import { Icone } from '@/components/icone'
import { Formulario } from '@/components/formulario/formulario'
import { musicosDesteNavegador } from '@/lib/chave-edicao'
import { chaveDoMes, hojeISO, listaPorExtenso, nomeDaChave } from '@/lib/datas'
import {
  listarEventosAbertos,
  listarInstrumentos,
  listarMusicosDoFormulario,
  respostasDesteNavegador,
} from '@/lib/dados'

export const metadata = {
  title: 'Sua disponibilidade — Banda RGNR',
  description: 'Marque em quais datas você pode tocar.',
}

/**
 * A tela do formulário.
 *
 * Mostra todas as datas abertas de uma vez, separadas por mês. Antes havia
 * uma página por mês e o músico que quisesse responder outubro e novembro
 * tinha de achar o próprio nome e conferir os instrumentos duas vezes. As
 * rotas antigas (`/outubro`) continuam existindo e trazem para cá, porque
 * esses links já foram colados no WhatsApp.
 */
export async function PaginaFormulario() {
  const [musicos, eventos, instrumentos, desteNavegador] = await Promise.all([
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
            Não há nenhuma data aberta agora. Qualquer coisa, fala com o Davi ou o
            André.
          </p>
        </div>
      </main>
    )
  }

  // Depois do retorno acima: sem data aberta não há o que conferir.
  const jaRespondidas = await respostasDesteNavegador(
    desteNavegador,
    eventos.map((e) => e.id),
  )

  const meses = listaPorExtenso([
    ...new Set(eventos.map((e) => nomeDaChave(chaveDoMes(e.data)))),
  ])

  // Prazo vencido não é prazo. As datas de setembro carregam um prazo de
  // 09/09 que já passou, e sem o corte a tela diria "até 9 de setembro" para
  // quem está respondendo novembro.
  const hoje = hojeISO()
  const prazo =
    eventos.find((e) => e.prazo_resposta && e.prazo_resposta >= hoje)
      ?.prazo_resposta ?? null

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
            Disponibilidade de {meses}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {eventos.length === 1
              ? 'É uma data só.'
              : `São ${eventos.length} datas. Marque todas de uma vez e você não precisa voltar mês que vem.`}
          </p>
        </div>
      </header>

      <Formulario
        musicos={musicos}
        eventos={eventos}
        instrumentos={instrumentos}
        prazo={prazo}
        totalAberto={eventos.length}
        jaRespondidas={jaRespondidas}
      />

      <footer className="text-muted-foreground mt-10 text-center text-xs">
        Só a liderança vê as respostas.
      </footer>
    </main>
  )
}
