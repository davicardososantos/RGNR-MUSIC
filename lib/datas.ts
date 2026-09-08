const SEMANA = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
]

const MES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

/**
 * Datas do banco vêm como 'AAAA-MM-DD'. `new Date('2026-09-11')` seria
 * interpretado como UTC meia-noite e, no fuso do Brasil, voltaria um dia —
 * o Fire de sexta viraria quinta. O 'T12:00:00' evita isso.
 */
function local(iso: string) {
  return new Date(`${iso}T12:00:00`)
}

/** "Sexta-feira, 11 de setembro" */
export function dataPorExtenso(iso: string) {
  const d = local(iso)
  const semana = SEMANA[d.getDay()]
  return `${semana[0].toUpperCase()}${semana.slice(1)}, ${d.getDate()} de ${MES[d.getMonth()]}`
}

/** "sexta 11/09" */
export function dataCurta(iso: string) {
  const d = local(iso)
  const curto = SEMANA[d.getDay()].replace('-feira', '')
  return `${curto} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** "11 de setembro" */
export function diaEMes(iso: string) {
  const d = local(iso)
  return `${d.getDate()} de ${MES[d.getMonth()]}`
}

/** '20:00:00' → '20h' · '18:30:00' → '18h30' */
export function hora(valor: string | null) {
  if (!valor) return null
  const [h, m] = valor.split(':')
  return m && m !== '00' ? `${Number(h)}h${m}` : `${Number(h)}h`
}
