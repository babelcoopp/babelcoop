export const meta = {
  name: 'pesquisa-profunda',
  description: 'Varredura paralela de um tema em vários ângulos, verificação cruzada e síntese gravada em memoria/conhecimento',
  whenToUse: 'Quando o Marcelo pedir "pesquisar a fundo", "descobrir tudo sobre" ou comparar opções de mercado',
  phases: [{ title: 'Ângulos' }, { title: 'Varredura' }, { title: 'Verificação' }, { title: 'Síntese' }],
}
const tema = String(typeof args === 'string' ? args : (args && (args.tema || args.prompt)) || '').trim()
const hoje = String((args && args.hoje) || 'sem-data')
const MOTOR = '/Users/marcelomaximos/Desktop/babel-os/motor'
log(`Pesquisa profunda: ${tema} (${hoje})`)

phase('Ângulos')
const plano = await agent(`Tema: "${tema}". Liste de 4 a 6 ângulos de pesquisa distintos (oficial, prática, críticas, números, Brasil, oportunidades para um clube de empresários). Só o JSON.`, {
  label: 'ângulos', model: 'haiku', schema: { type: 'object', required: ['angulos'], properties: { angulos: { type: 'array', items: { type: 'string' } } } },
})
const angulos = (plano && Array.isArray(plano.angulos) && plano.angulos.length) ? plano.angulos : ['fatos e números oficiais', 'concorrentes e referências', 'riscos e críticas', 'oportunidades para um clube de empresários']

phase('Varredura')
const achados = (await parallel(angulos.map(a => () =>
  agent(`Pesquise "${tema}" pelo ângulo: ${a}. Devolva fatos numerados, cada um com URL e data. Português.`, { label: a, agentType: 'pesquisador' })
))).filter(Boolean)

phase('Verificação')
const verificados = (await pipeline(achados, (texto, _orig, i) =>
  agent(`Verifique estes achados, marque cada fato como confirmado (2+ fontes), único (1 fonte) ou contraditório, e corrija datas:\n${texto}`, { label: `verificar ${i + 1}`, model: 'sonnet' })
)).filter(Boolean)

phase('Síntese')
const slug = tema.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tema'
const sintese = await agent(
  `Sintetize em português do Brasil, para o Marcelo (fundador do Reino): 10 fatos que importam, 3 oportunidades, 3 riscos. Grave com /usr/bin/python3 ${MOTOR}/remember.py --type knowledge --source research --topic ${slug} --title "Pesquisa profunda: ${tema}" --tags pesquisa --sources "<urls|separadas>" --text "<síntese com fontes>". Material:\n${verificados.join('\n\n')}`,
  { label: 'síntese' },
)
return sintese || 'A síntese falhou; os achados parciais estão em memoria/relatorios/.'
