import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Icone } from '@/components/icone'
import { Cobertura } from '@/components/escala/cobertura'
import { carregarEscala } from '@/lib/dados-escala'
import { dataPorExtenso } from '@/lib/datas'

export const dynamic = 'force-dynamic'

export default async function CoberturaPage({
  params,
}: PageProps<'/admin/evento/[data]/cobertura'>) {
  const { data } = await params
  const escala = await carregarEscala(data)

  if (!escala) notFound()

  const { evento, funcoes, musicos, escalacoes } = escala
  const fire = evento.tipo === 'fire'

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href={`/admin/evento/${data}`}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← voltar para a escala
        </Link>

        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          <Icone
            nome={fire ? 'fire' : 'culto'}
            className={`h-5 w-5 shrink-0 ${fire ? 'text-lima' : 'text-roxo-claro'}`}
          />
          Quem pode cobrir
        </h1>

        <p className="text-muted-foreground text-sm">
          {dataPorExtenso(evento.data)}. Para quando alguém avisa em cima da hora
          que não vem.
        </p>
      </div>

      <Cobertura
        evento={evento}
        funcoes={funcoes}
        musicos={musicos}
        escalacoesIniciais={escalacoes}
      />

      <p className="text-muted-foreground border-border border-t pt-4 text-xs">
        Só aparece quem disse que pode ou que topa cobrir, e que ainda não está
        escalado em outra função. Substituir troca na hora e guarda quem saiu.
      </p>
    </div>
  )
}
