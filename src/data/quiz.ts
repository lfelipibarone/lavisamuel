export type QuizQuestion = {
  id: string
  prompt: string
  options: string[]
  answerIndex: number
}

/** Gabarito provisório — ajuste em answerIndex se os noivos quiserem outra verdade oficial. */
export const quizQuestions: QuizQuestion[] = [
  {
    id: 'q10',
    prompt: 'Quem demora mais no banho?',
    options: ['Lavi', 'Samuel', 'Os dois', 'Depende do shampoo'],
    answerIndex: 0,
  },
  {
    id: 'q11',
    prompt: 'Quem faz o casal se atrasar?',
    options: ['Lavi', 'Samuel', 'Os dois', 'O trânsito (versão oficial)'],
    answerIndex: 0,
  },
  {
    id: 'q12',
    prompt: 'Quem fala “já estou pronto” sem nem ter começado a se arrumar?',
    options: ['Lavi', 'Samuel', 'Os dois', 'Ninguém admite'],
    answerIndex: 1,
  },
  {
    id: 'q13',
    prompt: 'Quem diz “só mais cinco minutinhos” e dorme por mais uma hora?',
    options: ['Lavi', 'Samuel', 'Os dois', 'O despertador desistiu'],
    answerIndex: 1,
  },
  {
    id: 'q14',
    prompt: 'Quem demora mais para escolher o que vai comer?',
    options: ['Lavi', 'Samuel', 'Os dois', 'O cardápio inteiro'],
    answerIndex: 0,
  },
  {
    id: 'q15',
    prompt: 'Quem fala “não estou com fome” e depois come metade do prato do outro?',
    options: ['Lavi', 'Samuel', 'Os dois', 'Mistério gastronômico'],
    answerIndex: 1,
  },
  {
    id: 'q16',
    prompt: 'Quem é mais teimoso em uma discussão completamente besta?',
    options: ['Lavi', 'Samuel', 'Os dois', 'Empate técnico'],
    answerIndex: 2,
  },
  {
    id: 'q17',
    prompt: 'Quem pede desculpas primeiro?',
    options: ['Lavi', 'Samuel', 'Os dois', 'Quem quer paz mais rápido'],
    answerIndex: 1,
  },
  {
    id: 'q18',
    prompt: 'Quem tem mais dificuldade de admitir que está errado?',
    options: ['Lavi', 'Samuel', 'Os dois', 'O orgulho coletiva'],
    answerIndex: 0,
  },
  {
    id: 'q19',
    prompt: 'Quem começa uma discussão e cinco minutos depois já esqueceu o motivo?',
    options: ['Lavi', 'Samuel', 'Os dois', 'Nem eles lembram'],
    answerIndex: 1,
  },
  {
    id: 'q20',
    prompt: 'Quem tem mais ciúmes?',
    options: ['Lavi', 'Samuel', 'Os dois', 'Ciúme disfarçado de “cuidado”'],
    answerIndex: 2,
  },
  {
    id: 'q21',
    prompt: 'Quem é mais provável de fazer drama por uma coisa pequena?',
    options: ['Lavi', 'Samuel', 'Os dois', 'Oscar da sessão da tarde'],
    answerIndex: 0,
  },
  {
    id: 'q22',
    prompt: 'Quem manda mais mensagens durante o dia?',
    options: ['Lavi', 'Samuel', 'Os dois', 'Áudios de 3 minutos'],
    answerIndex: 0,
  },
  {
    id: 'q23',
    prompt: 'Quem visualiza e esquece de responder?',
    options: ['Lavi', 'Samuel', 'Os dois', '“Vi agora” às 23h'],
    answerIndex: 1,
  },
  {
    id: 'q24',
    prompt: 'Quem fala mais “eu avisei”?',
    options: ['Lavi', 'Samuel', 'Os dois', 'Playlist de “eu avisei”'],
    answerIndex: 0,
  },
  {
    id: 'q25',
    prompt: 'Quem tem mais chance de perder alguma coisa e colocar a culpa no outro?',
    options: ['Lavi', 'Samuel', 'Os dois', 'A chave sumiu sozinha'],
    answerIndex: 1,
  },
  {
    id: 'q26',
    prompt: 'Quem escolheria o filme e dormiria antes da metade?',
    options: ['Lavi', 'Samuel', 'Os dois', 'Ronco no segundo ato'],
    answerIndex: 1,
  },
  {
    id: 'q27',
    prompt: 'Quem chora mais em filme ou série?',
    options: ['Lavi', 'Samuel', 'Os dois', 'Até comercial emociona'],
    answerIndex: 0,
  },
  {
    id: 'q28',
    prompt: 'Quem tem mais chance de comprar alguma coisa que não precisava?',
    options: ['Lavi', 'Samuel', 'Os dois', '“Estava em promoção”'],
    answerIndex: 0,
  },
  {
    id: 'q29',
    prompt: 'Quem é mais provável de sugerir “vamos sair” e desistir quando chega a hora?',
    options: ['Lavi', 'Samuel', 'Os dois', 'Pijama venceu'],
    answerIndex: 2,
  },
]

export function scoreMessage(score: number, total: number): string {
  const ratio = score / total
  if (ratio === 1) return 'Grau máximo de amizade íntima. Pode ser padrinho/madrinha honorário(a).'
  if (ratio >= 0.7) return 'Você conhece bem essa história de amor. Quase família.'
  if (ratio >= 0.4) return 'Bom esforço! Ainda dá tempo de estudar o casal até o dia 24.'
  return 'Nota de participação com carinho. O importante é estar na festa.'
}
