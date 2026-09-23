export const meta = {
  name: 'construir-lp',
  description: 'Três propostas de landing page em paralelo, dois juízes, construção da melhor e crítica final',
  whenToUse: 'LP de campanha ou evento importante, quando vale gastar mais para acertar de primeira',
  phases: [{ title: 'Propostas' }, { title: 'Julgamento' }, { title: 'Construção' }, { title: 'Crítica' }],
}
const briefing = String(typeof args === 'string' ? args : (args && (args.briefing || args.prompt)) || '').trim()
const slug = String((args && args.slug) || 'lp-nova').toLowerCase().replace(/[^a-z0-9-]+/g, '-')
const RAIZ = '/Users/marcelomaximos/Desktop/babel-os'

phase('Propostas')
const propostas = (await parallel([1, 2, 3].map(n => () =>
  agent(`Proposta ${n} de estrutura e copy para a LP: ${briefing}. Entregue seções, títulos, CTA e a promessa central. Só texto.`, { label: `proposta ${n}`, model: 'sonnet' })
))).filter(Boolean)
if (!propostas.length) return 'Nenhuma proposta foi gerada; tente /site com o briefing.'

phase('Julgamento')
const notas = (await parallel([0, 1].map(j => () =>
  agent(`Você é o juiz ${j + 1}. Dê nota 0-10 a cada proposta pensando em conversão para empresários brasileiros e diga qual é a melhor:\n${propostas.map((p, i) => `--- Proposta ${i + 1} ---\n${p}`).join('\n')}`,
    { label: `juiz ${j + 1}`, model: 'sonnet', schema: { type: 'object', required: ['notas', 'melhor'], properties: { notas: { type: 'array', items: { type: 'number' } }, melhor: { type: 'integer' }, motivo: { type: 'string' } } } })
))).filter(Boolean)
const soma = propostas.map((_, i) => notas.reduce((acc, n) => acc + ((n && Array.isArray(n.notas) && typeof n.notas[i] === 'number') ? n.notas[i] : 0), 0))
let melhor = 0
soma.forEach((s, i) => { if (s > soma[melhor]) melhor = i })
log(`Proposta vencedora: ${melhor + 1} (soma ${soma[melhor]}; juízes válidos: ${notas.length})`)

phase('Construção')
const construcao = await agent(`Construa ${RAIZ}/entregas/sites/${slug}.html seguindo ${RAIZ}/.claude/rules/entregas-web.md (leia com Read) a partir desta proposta:\n${propostas[melhor]}\nBriefing: ${briefing}\nDevolva o caminho e as seções.`, { label: 'construtor', agentType: 'construtor-web' })

phase('Crítica')
const critica = await agent(`Revise o arquivo ${RAIZ}/entregas/sites/${slug}.html (leia com Read) e aponte até 5 problemas por gravidade, com correção.`, { label: 'crítico', agentType: 'critico' })
return { caminho: `entregas/sites/${slug}.html`, construcao: construcao || '', critica: critica || '', soma }
