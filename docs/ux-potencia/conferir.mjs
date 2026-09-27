import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

// Conferência estática dos entregáveis. Não executa app, navegador ou testes funcionais.
const dir=path.dirname(new URL(import.meta.url).pathname);
const read=name=>fs.readFileSync(path.join(dir,name),'utf8');
const errors=[];
const taskRows=read('TODO.md').split('\n').filter(l=>/^\| \[ \] UX-\d{3} \|/.test(l));
const tasks=new Map();
for(const line of taskRows){
  const cells=line.split('|').slice(1,-1).map(x=>x.trim());
  const id=cells[0].match(/UX-\d{3}/)[0];
  if(tasks.has(id))errors.push(`Tarefa duplicada: ${id}`);
  tasks.set(id,[...(cells[2].matchAll(/UX-\d{3}/g))].map(m=>m[0]));
}
for(let i=1;i<=133;i++)if(!tasks.has(`UX-${String(i).padStart(3,'0')}`))errors.push(`Tarefa ausente: ${i}`);
if(tasks.size!==133)errors.push(`Contagem inesperada de tarefas: ${tasks.size}`);
for(const [id,deps] of tasks)for(const dep of deps)if(!tasks.has(dep))errors.push(`${id}: dependência inexistente ${dep}`);
const visiting=new Set(),done=new Set();
function visit(id){if(done.has(id))return;if(visiting.has(id)){errors.push(`Ciclo em ${id}`);return;}visiting.add(id);for(const dep of tasks.get(id)||[])visit(dep);visiting.delete(id);done.add(id);}
for(const id of tasks.keys())visit(id);
const reqRows=read('REQUISITOS.md').split('\n').filter(l=>/^\| R\d{2} \|/.test(l));
const requirements=new Set();
for(const line of reqRows){const id=line.match(/R\d{2}/)[0];if(requirements.has(id))errors.push(`Requisito duplicado: ${id}`);requirements.add(id);const refs=[...line.matchAll(/UX-\d{3}/g)].map(m=>m[0]);if(!refs.length)errors.push(`${id}: sem tarefa`);for(const ref of refs)if(!tasks.has(ref))errors.push(`${id}: tarefa ausente ${ref}`);}
for(let i=1;i<=79;i++)if(!requirements.has(`R${String(i).padStart(2,'0')}`))errors.push(`Requisito ausente: ${i}`);
if(requirements.size!==79)errors.push(`Contagem inesperada de requisitos: ${requirements.size}`);
const js=['maquete.js','maquete-ui.js','maquete-projetos.js','maquete-criador.js','maquete-fechamento.js'].map(read).join('\n');
new vm.Script(js,{filename:'maquete-concatenada.js'});
const pages=[...new Set([...js.matchAll(/pages\.(\w+)\s*=/g)].map(m=>m[1]))];
const html=read('PLANO-VISUAL.html');
const options=[...html.matchAll(/<option value="(\w+)">/g)].map(m=>m[1]);
for(const value of options)if(!pages.includes(value))errors.push(`Tela sem função: ${value}`);
for(const value of pages)if(!options.includes(value))errors.push(`Tela fora do seletor: ${value}`);
for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g)){if(!/^(https?:|#|data:)/.test(m[1])&&!fs.existsSync(path.join(dir,m[1])))errors.push(`HTML: recurso ausente ${m[1]}`);}
let localLinks=0;
for(const file of fs.readdirSync(dir).filter(x=>x.endsWith('.md'))){
  const content=read(file);
  for(const m of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){
    const target=m[1].split('#')[0];
    if(!target||target==='CONFERENCIA-DADOS.json'||/^(https?:|mailto:|data:)/.test(target))continue;
    localLinks++;
    if(!fs.existsSync(path.resolve(dir,target)))errors.push(`${file}: link ausente ${target}`);
  }
}
const result={kind:'conferência estática de documentos e maquete',requirements:requirements.size,tasks:tasks.size,allImplementationTasksOpen:!/^\| \[x\] UX-/mi.test(read('TODO.md')),dependencyGraphAcyclic:!errors.some(e=>e.startsWith('Ciclo')),mockupViews:pages.length,combinedJavaScriptSyntax:'válida',localMarkdownLinks:localLinks,inventory:JSON.parse(read('INVENTARIO-RESUMO.json')),errors,limits:['Não executa o JavaScript da maquete em um navegador.','Não valida aparência, áudio, acessibilidade ou interação em runtime.','Não executa testes do app instalado nem compara seu pacote inteiro com a fonte.','Rastreabilidade numérica não substitui leitura semântica dos pedidos.']};
fs.writeFileSync(path.join(dir,'CONFERENCIA-DADOS.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({requirements:result.requirements,tasks:result.tasks,mockupViews:result.mockupViews,localMarkdownLinks:localLinks,errors,limits:result.limits},null,2));
if(errors.length)process.exitCode=1;
