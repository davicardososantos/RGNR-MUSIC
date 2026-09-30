import { notFound } from 'next/navigation'
import { Icone } from '@/components/icone'
import { Cobertura } from '@/components/escala/cobertura'
import { Cabecalho } from '@/components/painel/ui'
import { carregarEscala } from '@/lib/dados-escala'
import { dataPorExtenso } from '@/lib/datas'
import { EVENTO_LABEL } from '@/lib/tipos'

export const dynamic = 'force-dynamic'

export default async function CoberturaPage({
  params,
  searchParams,
}: PageProps<'/admin/evento/[data]/cobertura'>) {
  const { data } = await params
  const { tipo } = await searchParams
  const escala = await carregarEscala(
    data,
    typeof tipo === 'string' ? tipo : undefined,
  )

  if (!escala) notFound()

  const { evento, funcoes, musicos, escalacoes } = escala
  const rotulo = EVENTO_LABEL[evento.tipo]

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Cabecalho
        voltar={{ href: `/admin/evento/${data}?tipo=${evento.tipo}`, rotulo: 'Voltar para a escala' }}
        titulo={
          <span className="flex items-center gap-3">
            <Icone nome={rotulo.icone} className={`h-6 w-6 shrink-0 ${rotulo.cor}`} />
            Quem pode cobrir
          </span>
        }
        subtitulo={
          <span className="first-letter:uppercase">
            {dataPorExtenso(evento.data)}. Para quando alguém avisa em cima da hora que não vem.
          </span>
        }
      />

      <Cobertura
        evento={evento}
        funcoes={funcoes}
        musicos={musicos}
        escalacoesIniciais={escalacoes}
      />

      <p className="text-muted-foreground border-t border-white/[0.06] pt-4 text-xs">
        Só aparece quem disse que pode ou que topa cobrir, e que ainda não está
        escalado em outra função. Substituir troca na hora e guarda quem saiu.
      </p>
    </div>
  )
}
