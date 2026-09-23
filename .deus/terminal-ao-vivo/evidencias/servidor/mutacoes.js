/* roda o teste de integração contra cópias do servidor com um defeito de propósito cada */
const fs = require('fs'); const path = require('path'); const { spawnSync } = require('child_process');
const APP = '/Users/matheussilveirapro/Desktop/babel-coop/app';
const SP = require('os').tmpdir(); /* as cópias mutantes vão para o temporário do sistema */
const MUT = [
  ['pausa não bloqueia quem assiste', 'terminal.js', `    if (!s.pausada) {\n      s.bytesPublicos += n;`, `    if (true) {\n      s.bytesPublicos += n;`],
  ['dono não confere permissão de teclas', 'servidor.js', `if (!controle.podeDigitar(par.id, id)) return recusar('sem permissão');`, `/* mutação */`],
  ['carteira não é conferida', 'token.js', `  if (motivo) return { erro: motivo };\n  if (typeof m.prova`, `  if (typeof m.prova`],
  ['navegador sem Origin aceito', 'servidor.js', `    if (!origem) return null;                                             /* navegador sem Origin: recusado */`, `    if (!origem) return 'local';`],
  ['pausa não recusa teclas de par', 'servidor.js', `if (terminais.pausada(id)) return recusar('pausado');`, `/* mutação */`]
];
for (const [nome, arq, de, para] of MUT) {
  const dir = fs.mkdtempSync(path.join(SP, 'mut-'));
  fs.cpSync(path.join(APP, 'servidor'), path.join(dir, 'servidor'), { recursive: true });
  fs.copyFileSync(path.join(APP, 'package.json'), path.join(dir, 'package.json'));
  fs.symlinkSync(path.join(APP, 'node_modules'), path.join(dir, 'node_modules'));
  const f = path.join(dir, 'servidor', arq); const s = fs.readFileSync(f, 'utf8');
  if (!s.includes(de)) { console.log('MUTAÇÃO NÃO APLICADA:', nome); continue; }
  fs.writeFileSync(f, s.replace(de, para));
  const r = spawnSync(process.execPath, ['--test', 'testes/servidor/equipe.test.js'], { cwd: APP, env: Object.assign({}, process.env, { BABEL_TESTE_APP: dir }), encoding: 'utf8', timeout: 240000 });
  const out = r.stdout + r.stderr;
  const falhas = out.split('\n').filter((l) => /^\s+✖ /.test(l)).map((l) => l.trim().slice(0, 90));
  const pass = (out.match(/ℹ pass (\d+)/) || [])[1], fail = (out.match(/ℹ fail (\d+)/) || [])[1];
  console.log('\n## ' + nome + ' → pass ' + pass + ' · fail ' + fail);
  falhas.forEach((l) => console.log('   ' + l));
}
