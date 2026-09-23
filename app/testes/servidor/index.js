/* Babel Coop · `node --test testes/servidor/` (e `npm run teste`) no Node 24 trata a pasta como módulo e carrega este index.js:
   ele carrega cada *.test.js desta pasta, na ordem do nome. Cada arquivo usa portas próprias (ver o cabeçalho de cada um).
   Também dá para rodar um só: node --test testes/servidor/equipe.test.js
*/
'use strict';
const fs = require('fs');
const path = require('path');

fs.readdirSync(__dirname).filter((n) => n.endsWith('.test.js')).sort().forEach((n) => require(path.join(__dirname, n)));
