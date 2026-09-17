export const surprisePhrases = [
  'Alerta de fofura: níveis críticos detectados.',
  'Faltam poucos ticks para o “sim”. Respira.',
  'Samuel + Lavi = equação resolvida.',
  'Se o amor fosse Wi-Fi, esse casal teria 5 barras.',
  'Confete mental liberado. Pode sorrir.',
  'Dia 24, 10h: horário nobre do coração.',
  'Você achou um easter egg. Os noivos agradecem a vibe.',
  'Romântico com humor: exatamente o briefing deste site.',
]

export function randomPhrase(exclude?: string): string {
  const pool = surprisePhrases.filter((p) => p !== exclude)
  return pool[Math.floor(Math.random() * pool.length)] ?? surprisePhrases[0]
}
