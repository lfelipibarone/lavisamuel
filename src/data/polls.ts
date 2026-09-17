export type Poll = {
  id: string
  question: string
  options: string[]
}

export const polls: Poll[] = [
  {
    id: 'cry',
    question: 'Quem chora primeiro no altar?',
    options: ['Lavi', 'Samuel', 'Os dois juntos', 'Convidados em massa'],
  },
  {
    id: 'late',
    question: 'Quem chega “só mais cinco minutinhos” atrasado?',
    options: ['Lavi', 'Samuel', 'O cortejo inteiro', 'Ninguém — tem countdown'],
  },
  {
    id: 'dance',
    question: 'Quem domina a pista na festa?',
    options: ['Lavi', 'Samuel', 'A vovó', 'Todo mundo depois do bolo'],
  },
]
