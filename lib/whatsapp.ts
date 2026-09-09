/**
 * O WhatsApp vem digitado à mão pelo músico no formulário, em qualquer
 * formato: "(11) 98765-4321", "11987654321", "+55 11 98765 4321".
 * Aqui vira o que o wa.me aceita: só dígitos, com DDI.
 */
export function normalizarTelefone(bruto: string | null): string | null {
  if (!bruto) return null

  const digitos = bruto.replace(/\D/g, '')
  if (digitos.length < 10) return null // nem DDD + número dá

  // 10 ou 11 dígitos = número brasileiro sem DDI
  if (digitos.length <= 11) return `55${digitos}`

  // Já veio com 55 na frente
  if (digitos.startsWith('55') && digitos.length <= 13) return digitos

  return digitos
}

export function linkWhatsApp(telefone: string | null, mensagem: string): string | null {
  const numero = normalizarTelefone(telefone)
  if (!numero) return null
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
}

/** Mensagem de cobrança de quem ainda não respondeu. */
export function mensagemCobranca(primeiroNome: string, url: string) {
  return (
    `Oi, ${primeiroNome}! Tudo bem?\n\n` +
    `Ainda falta você marcar sua disponibilidade de setembro. ` +
    `Leva menos de dois minutos:\n${url}\n\n` +
    `Sua resposta ajuda demais na hora de montar a escala. ` +
    `Vai ser muito bom ter você com a gente!`
  )
}

/** Mensagem para acionar cobertura quando alguém cai da escala. */
export function mensagemCobertura(
  primeiroNome: string,
  funcao: string,
  dia: string,
) {
  return (
    `Oi, ${primeiroNome}! Você marcou que poderia no dia ${dia}. ` +
    `Consegue cobrir ${funcao}? Abriu uma vaga.`
  )
}

export function primeiroNome(nome: string) {
  return nome.split(' ')[0]
}
