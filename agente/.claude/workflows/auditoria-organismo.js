export const meta = {
  name: 'auditoria-organismo',
  description: 'Audita o substrato e a configuração do babel-os (saúde, duplicatas, custo de contexto, hooks) e propõe mutações',
  phases: [{ title: 'Diagnóstico' }, { title: 'Curadoria' }, { title: 'Proposta' }],
}
const MOTOR = '/Users/marcelomaximos/Desktop/babel-os/motor'

phase('Diagnóstico')
const diagnostico = (await parallel([
  () => agent(`Rode /usr/bin/python3 ${MOTOR}/verify.py e /usr/bin/python3 ${MOTOR}/selftest.py --quick e relate problemas.`, { label: 'motor e hooks', model: 'sonnet' }),
  () => agent('Leia /Users/marcelomaximos/Desktop/babel-os/memoria/state.json e graph.json; liste órfãs, similares, duplicadas, projetos sem próximo passo e o tamanho do índice.', { label: 'substrato', model: 'sonnet' }),
  () => agent(`Rode /usr/bin/python3 ${MOTOR}/report.py --state e estime o custo de contexto por sessão (CLAUDE.md, INDICE, rules sem paths, descrições de skills). Sugira cortes.`, { label: 'contexto', model: 'haiku' }),
])).filter(Boolean)

phase('Curadoria')
const curadoria = await agent(`Com base no diagnóstico, consolide o que puder via motor/correct.py --merge e remember.py --supersedes, sem apagar nada:\n${diagnostico.join('\n\n')}`, { label: 'bibliotecário', agentType: 'bibliotecario' })

phase('Proposta')
const proposta = await agent(`Escreva para o Marcelo, em português e estilo WhatsApp, o estado do organismo e 3 mutações propostas (o que, por quê, esforço, se mexe em .claude/):\n${diagnostico.join('\n')}\n${curadoria || ''}`, { label: 'proposta' })
return proposta || 'Auditoria sem proposta final; veja memoria/relatorios/.'
