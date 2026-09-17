export type QuizQuestion = {
  id: string
  prompt: string
  options: string[]
  answerIndex: number
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    prompt: 'Quem demora mais para sair de casa?',
    options: ['Lavi', 'Samuel', 'Empate olímpico', 'Depende do espelho'],
    answerIndex: 0,
  },
  {
    id: 'q2',
    prompt: 'Quem manda mais playlist no carro?',
    options: ['Lavi', 'Samuel', 'O algoritmo decide', 'Silêncio constrangedor'],
    answerIndex: 1,
  },
  {
    id: 'q3',
    prompt: 'Primeiro a chorar no “sim”?',
    options: ['Lavi', 'Samuel', 'Os dois', 'A madrinha'],
    answerIndex: 2,
  },
  {
    id: 'q4',
    prompt: 'Quem lembra datas com precisão militar?',
    options: ['Lavi', 'Samuel', 'O calendário do celular', 'Ninguém, confia'],
    answerIndex: 0,
  },
  {
    id: 'q5',
    prompt: 'Estilo de declaração de amor preferido?',
    options: [
      'Bilhete escondido',
      'Mensagem de madrugada',
      'Abraço sem avisar',
      'Foto no ensaio PB',
    ],
    answerIndex: 2,
  },
  {
    id: 'q6',
    prompt: 'Quem chega atrasado no próprio casamento (hipoteticamente)?',
    options: ['Lavi', 'Samuel', 'O fotógrafo', 'Impossível, tem cronômetro'],
    answerIndex: 3,
  },
  {
    id: 'q7',
    prompt: 'O que mais define o casal?',
    options: [
      'Olhares longos',
      'Risada fácil',
      'Parceria no caos',
      'As três acima, com filtro PB',
    ],
    answerIndex: 3,
  },
]

export function scoreMessage(score: number, total: number): string {
  const ratio = score / total
  if (ratio === 1) return 'Grau máximo de amizade íntima. Pode ser padrinho/madrinha honorário(a).'
  if (ratio >= 0.7) return 'Você conhece bem essa história de amor. Quase família.'
  if (ratio >= 0.4) return 'Bom esforço! Ainda dá tempo de estudar o casal até o dia 24.'
  return 'Nota de participação com carinho. O importante é estar na festa.'
}
