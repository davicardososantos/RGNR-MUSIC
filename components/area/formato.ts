import { EVENTO_LABEL, nomeDoEvento as nomeDoEventoBase } from '@/lib/tipos'
import type { NomeIcone } from '@/components/icone'
import type { EventoArea } from './tipos'

/** Datas e rótulos da área do músico. Tudo puro: roda no servidor e no navegador. */

const SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

// Meio-dia: o fuso nunca empurra a data para o dia anterior.
const local = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`)

export const diaDaSemana = (iso: string) => SEMANA[local(iso).getDay()]
export const diaDoMes = (iso: string) => local(iso).getDate()
export const nomeDoMes = (iso: string) => MESES[local(iso).getMonth()]
export const chaveDoMes = (iso: string) => iso.slice(0, 7)

/** "sábado, 3 de outubro" */
export const dataLonga = (iso: string) => `${diaDaSemana(iso)}, ${diaDoMes(iso)} de ${nomeDoMes(iso)}`

/** "14 de março" */
export const diaEMes = (iso: string) => `${diaDoMes(iso)} de ${nomeDoMes(iso)}`

export function diasAte(iso: string, hoje: string) {
  return Math.round((local(iso).getTime() - local(hoje).getTime()) / 86_400_000)
}

/** "hoje", "amanhã", "em 3 dias" */
export function quando(iso: string, hoje: string) {
  const d = diasAte(iso, hoje)
  if (d === 0) return 'hoje'
  if (d === 1) return 'amanhã'
  if (d === -1) return 'ontem'
  return d > 0 ? `em ${d} dias` : `há ${-d} dias`
}

export const nomeDoEvento = (e: Pick<EventoArea, 'tipo' | 'titulo'>) => nomeDoEventoBase(e)

export const iconeDoEvento = (e: Pick<EventoArea, 'tipo'>): NomeIcone => EVENTO_LABEL[e.tipo].icone

/** Fire tem a cara roxa; culto e o resto, a lima (o visual aprovado em 30/09). */
export const ehFire = (e: Pick<EventoArea, 'tipo'>) => e.tipo === 'fire'

export const iniciais = (nome: string) =>
  nome
    .replace(/^Pr\.\s*/, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')

/** (11) 9 8765-4321 */
export function mascaraTelefone(valor: string) {
  const d = valor.replace(/\D/g, '').slice(-11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 3) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`
}
