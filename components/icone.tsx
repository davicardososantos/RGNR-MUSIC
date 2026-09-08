import {
  faArrowRightArrowLeft,
  faBan,
  faBed,
  faClock,
  faFlask,
  faGraduationCap,
  faRightFromBracket,
  faUserTie,
  faCheck,
  faChurch,
  faCircleCheck,
  faCircleExclamation,
  faFire,
  faHandshakeAngle,
  faLock,
  faMusic,
  faPlus,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

/**
 * Ponto único de ícones do projeto.
 *
 * Regra da casa: **nada de emoji na interface.** Emoji renderiza diferente
 * em cada sistema, não herda a cor do texto, não escala com a tipografia e
 * dá ao produto uma cara genérica. Ícone é SVG, herda `currentColor` e
 * alinha com o texto.
 *
 * Para adicionar um ícone, importe de @fortawesome/free-solid-svg-icons e
 * registre aqui com um nome do domínio — não com o nome do desenho. O resto
 * do app pede "sim", não "faCheck".
 */
export const ICONES = {
  // Respostas do formulário
  sim: faCheck,
  sePrecisar: faHandshakeAngle,
  nao: faXmark,

  // Tipos de evento
  fire: faFire,
  culto: faChurch,

  // Estados e ações
  concluido: faCircleCheck,
  encerrado: faLock,
  atencao: faCircleExclamation,
  trocar: faArrowRightArrowLeft,

  // Status do músico (criterios-de-nivel.md) — substituem ✅🕐💤🎓🧪⛔📤👔
  statusAtivo: faCircleCheck,
  statusPresencaBaixa: faClock,
  statusDestreinado: faBed,
  statusEmAvaliacao: faGraduationCap,
  statusEmFormacao: faFlask,
  statusRestricao: faBan,
  statusFora: faRightFromBracket,
  statusLideranca: faUserTie,
  adicionar: faPlus,
  musica: faMusic,
} as const

export type NomeIcone = keyof typeof ICONES

export function Icone({
  nome,
  className,
}: {
  nome: NomeIcone
  className?: string
}) {
  return <FontAwesomeIcon icon={ICONES[nome]} className={className} aria-hidden />
}
