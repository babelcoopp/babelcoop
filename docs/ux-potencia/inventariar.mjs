import fs from 'node:fs';
import path from 'node:path';

// Leitura estática: não importa nem executa código do app.
const root = process.cwd();
const areas = ['prototipo', 'app/interface'];
const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && !['midia', 'vendor', 'node_modules', 'dist'].includes(e.name)) walk(p);
    else if (e.isFile() && /\.(js|html)$/.test(e.name)) files.push(p);
  }
}
areas.forEach(walk);
const rows = [];
function destino(file) {
  if (/navegador/.test(file)) return ['S09 Navegador', 'UX-052'];
  if (/mindforge|mapamental/.test(file)) return ['S07 Mapa', 'UX-033'];
  if (/maquina|visual3d/.test(file)) return ['S08 Máquina', 'UX-036'];
  if (/ipad|quadro/.test(file)) return ['S12 Quadro no iPad', 'UX-061'];
  if (/terminal-real|terminal\.js|organismo/.test(file)) return ['S06 Agentes e terminal', 'UX-041'];
  if (/parede-real/.test(file)) return ['S06 Terminais da equipe', 'UX-029'];
  if (/explorador|arquivos-real|editor/.test(file)) return ['S04 Construir e S05 Criar', 'UX-019'];
  if (/demandas/.test(file)) return ['S03 Tarefas', 'UX-024'];
  if (/chat/.test(file)) return ['S10 Conversas', 'UX-028'];
  if (/oficina/.test(file)) return ['S15 Preferências e Oficina', 'UX-067'];
  if (/campanha|placar/.test(file)) return ['S02 Resultados e S14 Aprender', 'UX-031'];
  if (/cronometro/.test(file)) return ['S03 Tarefa e tempo pessoal', 'UX-031'];
  return ['Módulo misto: consultar AUDITORIA.md e PLANO-DAS-TELAS.md', 'UX-011'];
}
function add(file, source, index, type, action, label, dynamic, snippet, origin) {
  const [screen, task] = destino(file);
  rows.push([`C${String(rows.length + 1).padStart(4, '0')}`, file, source.slice(0, index).split('\n').length, type, action, label, dynamic, snippet, origin, screen, task, 'localizado no código; aceite visual por instância pendente']);
}
for (const file of files.sort()) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  for (const m of source.matchAll(/<(button|input|textarea|select|a)\b[^>]*>/g)) {
    const tag = m[0];
    if (m[1] === 'a' && !/data-|href|role/.test(tag)) continue;
    const rest = source.slice(m.index + tag.length, m.index + tag.length + 240);
    const label = (tag.match(/(?:aria-label|placeholder|title)="([^"]*)"/)?.[1] || rest.split(/<\/|<button|<input/)[0]).replace(/\s+/g, ' ').slice(0, 200);
    const action = tag.match(/data-(?:acao|tr|term|nav|mq|mm|ip|quadro|comando)="([^"]*)"/)?.[1] || tag.match(/id="([^"]*)"/)?.[1] || '';
    add(file, source, m.index, m[1], action, label, /\+|\$\{/.test(tag + label) ? 'sim' : 'não', (tag + rest.split('\n')[0]).slice(0, 420), 'HTML literal');
  }
  for (const m of source.matchAll(/(?:\bdocument\.createElement|\bh)\(\s*['"](button|input|textarea|select|a)['"]/g)) {
    const snippet = source.slice(m.index, m.index + 620).split('\n').slice(0, 3).join(' ').slice(0, 620);
    const label = snippet.match(/(?:['"]aria-label['"]|title|placeholder|text)\s*:\s*['"]([^'"]*)/)?.[1] || 'rótulo definido dinamicamente; ver trecho';
    add(file, source, m.index, m[1], '', label, 'sim', snippet, m[0].includes('createElement') ? 'createElement' : 'fábrica h');
  }
}
const quote = x => '"' + String(x).replaceAll('"', '""') + '"';
const csv = [['id','arquivo','linha','elemento','acao_ou_id','rotulo_ou_inicio','expressao_dinamica','trecho','origem','destino_proposto','tarefa_de_revisao','cobertura'], ...rows].map(r => r.map(quote).join(',')).join('\n') + '\n';
fs.writeFileSync(path.join(root, 'docs/ux-potencia/INVENTARIO-CONTROLES.csv'), csv);
const counts = {};
rows.forEach(r => { counts[r[1]] = (counts[r[1]] || 0) + 1; });
const origins = {};
rows.forEach(r => { origins[r[8]] = (origins[r[8]] || 0) + 1; });
const summary = { filesRead: files.length, declarations: rows.length, byOrigin: origins, byFile: counts, limits: 'Inventário heurístico de declarações HTML, createElement e fábrica h. Inclui variantes, demos, repetições e controles auxiliares invisíveis. Não resolve expressões nem todas as fábricas; não é contagem de controles visíveis nem prova de funcionamento. Destino é triagem por módulo; módulos mistos e cada instância exigem aceite visual durante implementação.' };
fs.writeFileSync(path.join(root, 'docs/ux-potencia/INVENTARIO-RESUMO.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
