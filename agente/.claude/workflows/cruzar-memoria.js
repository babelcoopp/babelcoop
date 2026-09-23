export const meta = {
  name: 'cruzar-memoria',
  description: 'Cruza toda a memória do organismo para responder uma pergunta do Marcelo com evidências',
  whenToUse: 'Perguntas que dependem de muitas memórias, decisões e conhecimento ao mesmo tempo',
  phases: [{ title: 'Fatiar' }, { title: 'Ler' }, { title: 'Sintetizar' }],
}
const pergunta = String(typeof args === 'string' ? args : (args && (args.pergunta || args.prompt)) || '').trim()
const MOTOR = '/Users/marcelomaximos/Desktop/babel-os/motor'

phase('Fatiar')
const fatias = await agent(
  `Rode "/usr/bin/python3 ${MOTOR}/recall.py --slices 6 --k 40 --search ${JSON.stringify(pergunta)}" e devolva o JSON impresso (fatias: nome + arquivos).`,
  { label: 'fatias', model: 'haiku', schema: { type: 'object', required: ['fatias'], properties: { fatias: { type: 'array', items: { type: 'object', required: ['nome', 'arquivos'], properties: { nome: { type: 'string' }, arquivos: { type: 'array', items: { type: 'string' } } } } } } } },
)
const lista = (fatias && Array.isArray(fatias.fatias)) ? fatias.fatias : []

phase('Ler')
const evidencias = (await pipeline(lista, f =>
  agent(`Leia os arquivos ${f.arquivos.join(', ')} (com Read) e extraia tudo que responde ou contradiz: "${pergunta}". Devolva evidências com id do arquivo e citação curta.`, { label: f.nome, model: 'sonnet' }),
)).filter(Boolean)

phase('Sintetizar')
const resposta = await agent(
  `Pergunta do Marcelo: "${pergunta}". Evidências:\n${evidencias.join('\n---\n')}\nResponda em português, tom WhatsApp, cruzando decisões, projetos e histórico; cite ids entre crases; feche com próximo passo. Depois grave um resumo: /usr/bin/python3 ${MOTOR}/remember.py --type learning --source subagent:cruzar-memoria --title "Cruzamento: ${pergunta.slice(0, 60)}" --tags cruzamento --text "<resumo>"`,
  { label: 'síntese' },
)
return resposta || 'Não consegui sintetizar desta vez; tente /consultar com um tema mais curto.'
