import {chromium} from '../../app/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const report={at:new Date().toISOString(),scope:'Maquete V4; não testa o aplicativo instalado',views:[],checks:[],errors:[],screenshots:[]};
const b=await chromium.launch({channel:'chrome',headless:true});
const ensure=(value,message)=>{if(!value)throw new Error(message);};
try{
 const p=await b.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>report.errors.push(e.message));
 await p.goto('http://127.0.0.1:4790/PLANO-V4-VISUAL.html');
 const routes=await p.locator('#screen-picker option').evaluateAll(els=>els.map(e=>e.value));
 for(const viewport of [{width:1440,height:900},{width:1223,height:800}]){
  await p.setViewportSize(viewport);
  for(const id of routes){
   await p.selectOption('#screen-picker',id);
   ensure((await p.locator('#screen').innerText()).trim().length>30,'Vista vazia: '+id);
   const bounds=await p.locator('#v3-terminal').boundingBox();ensure(bounds&&bounds.width>=280&&bounds.x+bounds.width<=viewport.width+2,'Terminal fora da tela: '+id);
   const overflow=await p.evaluate(()=>({page:document.documentElement.scrollWidth>innerWidth+2,screen:document.querySelector('#screen').scrollWidth>document.querySelector('#screen').clientWidth+2}));
   if(overflow.page||overflow.screen)report.errors.push('Overflow '+id+' '+viewport.width+': '+JSON.stringify(overflow));
   report.views.push({id,width:viewport.width,terminalRight:true});
  }
 }
 await p.setViewportSize({width:1440,height:900});await p.selectOption('#screen-picker','construir');
 await p.locator('#v3-command-input').fill('Pedido preservado na V4');
 await p.selectOption('#screen-picker','laboratorio');ensure(await p.locator('#v3-command-input').inputValue()==='Pedido preservado na V4','Pedido perdido');
 await p.reload();ensure(await p.locator('#v3-command-input').inputValue()==='Pedido preservado na V4','Pedido perdido ao reabrir');ensure(await p.locator('#screen-picker').inputValue()==='laboratorio','Aba ativa não retomada');report.checks.push('Pedido e aba ativa persistem entre telas e reload');
 await p.locator('.v4-layout-controls [data-v4="left"]').click();ensure(!await p.locator('.v4-context').isVisible(),'Contexto não recolheu');await p.locator('.v4-layout-controls [data-v4="left"]').click();ensure(await p.locator('.v4-context').isVisible(),'Contexto não voltou');
 await p.locator('.v4-layout-controls [data-v4="right"]').click();ensure(Math.abs((await p.locator('#v3-terminal').boundingBox()).width-44)<2,'Terminal sem faixa recolhida');await p.locator('.v4-terminal-restore').click();ensure((await p.locator('#v3-terminal').boundingBox()).width>=280,'Terminal não restaurou');
 await p.locator('.v4-layout-controls [data-v4="tabs"]').click();ensure(!await p.locator('.v4-tab-list').isVisible(),'Abas não recolheram');await p.locator('.v4-layout-controls [data-v4="tabs"]').click();report.checks.push('Contexto, abas e terminal recolhem e restauram');
 await p.selectOption('#screen-picker','mapa');await p.locator('.v4-layout-controls [data-v4="focus"]').click();ensure(!await p.locator('.v4-context').isVisible(),'Foco não ampliou');ensure(await p.locator('#v3-terminal').isVisible(),'Foco ocultou terminal');await p.keyboard.press('Escape');ensure(await p.locator('#screen-picker').inputValue()==='mapa','Escape perdeu artefato');ensure(await p.locator('.v4-context').isVisible(),'Escape não restaurou');report.checks.push('Foco mantém terminal; Escape conserva o mapa');
 await p.selectOption('#screen-picker','loja');await p.locator('[data-v4-close="loja"]').click();ensure(await p.locator('#screen-picker').inputValue()!=='loja','Fechar aba falhou');report.checks.push('Fechar aba volta a outra aba existente');
 const before=(await p.locator('#v3-terminal').boundingBox()).width;await p.locator('#v4-right-divider').focus();await p.keyboard.press('ArrowLeft');ensure((await p.locator('#v3-terminal').boundingBox()).width>before,'Resize por teclado falhou');report.checks.push('Divisor redimensiona terminal por teclado');
 await p.locator('[data-v3-mode="app"]').click();await p.locator('#v3-command-input').fill('abra o laboratório');await p.locator('#v3-command-input').press('Enter');ensure(await p.locator('#screen-picker').inputValue()==='laboratorio','Comando não abriu laboratório');report.checks.push('Comando navega para Laboratório de IAs');
 await p.screenshot({path:path.join(dir,'V4-laboratorio.png')});report.screenshots.push('V4-laboratorio.png');
 await p.selectOption('#screen-picker','maquina');ensure(await p.locator('#v4-world canvas').count()===1,'Cena 3D ausente');
 await p.locator('[data-v4-world="list"]').click();ensure(await p.locator('.v4-piece-list').isVisible(),'Lista equivalente ausente');await p.locator('[data-v4-piece="data"]').click();ensure(await p.locator('.v4-piece-detail').isVisible(),'Seleção não abre inspector');await p.locator('[data-axis="x"]').fill('4.25');await p.locator('[data-axis="x"]').press('Tab');await p.locator('[data-v4-world="list"]').click();await p.locator('[data-v4-piece="data"]').click();ensure(await p.locator('[data-axis="x"]').inputValue()==='4.25','XYZ não persistiu na peça');
 const canvas=await p.locator('#v4-world canvas').boundingBox();await p.mouse.move(canvas.x+canvas.width*.3,canvas.y+canvas.height*.2);await p.mouse.down();await p.mouse.move(canvas.x+canvas.width*.3+100,canvas.y+canvas.height*.2+30,{steps:5});await p.mouse.up();report.checks.push('3D carregou, lista selecionou mesma peça, XYZ conservado e câmera arrastada');
 await p.locator('[data-v4-detail-close]').click();await p.screenshot({path:path.join(dir,'V4-maquina.png')});report.screenshots.push('V4-maquina.png');
 await p.selectOption('#screen-picker','construir');await p.screenshot({path:path.join(dir,'V4-estacao.png')});report.screenshots.push('V4-estacao.png');
 await p.locator('[data-action="theme"]').first().click();ensure(await p.locator('html').getAttribute('data-theme')==='vibe','Vibe não mudou');ensure(await p.locator('#v3-terminal').isVisible(),'Vibe perdeu terminal');report.checks.push('Tech/Vibe conservam a estação');
}catch(e){report.errors.push(e.stack||e.message);}finally{await b.close();report.passed=report.errors.length===0;fs.writeFileSync(path.join(dir,'VERIFICACAO-V4.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify({passed:report.passed,views:report.views.length,checks:report.checks,errors:report.errors},null,2));
if(!report.passed)process.exitCode=1;
