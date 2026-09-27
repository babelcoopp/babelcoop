import {chromium} from '../../app/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const result={at:new Date().toISOString(),browser:'Chrome local via Playwright',views:[],checks:[],errors:[],screenshots:[]};
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
 await page.goto('http://127.0.0.1:4788/PLANO-VISUAL.html');
 const options=await page.locator('#screen-picker option').evaluateAll(els=>els.map(e=>({id:e.value,label:e.textContent})));
 for(const viewport of [{width:1440,height:1000},{width:1223,height:800}]){
  await page.setViewportSize(viewport);
  for(const {id,label}of options){
   await page.selectOption('#screen-picker',id);
   const content=await page.locator('#screen').innerText();
   if(content.trim().length<30)throw new Error('Vista vazia: '+id);
   const size=await page.evaluate(()=>({w:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
   if(size.scroll>size.w+2)result.errors.push(`Overflow horizontal ${id} em ${viewport.width}: ${size.scroll}`);
   result.views.push({id,label,width:viewport.width,rendered:true});
  }
 }
 await page.setViewportSize({width:1440,height:1000});
 await page.selectOption('#screen-picker','agentes');
 await page.getByRole('button',{name:'+ Agente',exact:true}).click();
 const providers=await page.locator('#provider option').allTextContents();
 if(providers.length!==4||!providers.some(x=>x.startsWith('Vyra')))throw new Error('Catálogo incompleto');
 result.checks.push({name:'Quatro IAs no diálogo',providers});
 await page.keyboard.press('Escape');
 await page.selectOption('#screen-picker','construir');
 await page.locator('#agent-input').fill('Rascunho de retomada — ação e contexto.');
 await page.selectOption('#screen-picker','mapa');
 await page.selectOption('#screen-picker','construir');
 if(await page.locator('#agent-input').inputValue()!=='Rascunho de retomada — ação e contexto.')throw new Error('Rascunho perdido');
 result.checks.push({name:'Rascunho preservado ao trocar de vista',passed:true});
 await page.getByRole('button',{name:'+ Criar',exact:true}).click();
 if(!await page.locator('#dialog').isVisible())throw new Error('Criar não abriu');
 await page.keyboard.press('Escape');result.checks.push({name:'Criar abre e Escape fecha',passed:true});
 await page.selectOption('#screen-picker','ritmo');
 await page.locator('[data-copy-object]').click();
 await page.locator('#clipboard-dest').click();await page.keyboard.press('Meta+V');
 if(await page.locator('#clipboard-dest').inputValue()!=='Inscrições · tabela · projeto Órbita')throw new Error('Colagem de referência falhou');
 result.checks.push({name:'Seleção de peça e colagem real via ⌘V',passed:true});
 await page.locator('#clipboard-dest').fill('');
 const box=await page.locator('#selection-example').boundingBox();
 await page.mouse.move(box.x+20,box.y+22);await page.mouse.down();await page.mouse.move(box.x+box.width-15,box.y+box.height-20,{steps:12});await page.mouse.up();
 await page.waitForFunction(()=>document.querySelector('#selection-status').textContent.startsWith('Copiado'));
 const selected=await page.evaluate(()=>getSelection().toString());
 await page.locator('#clipboard-dest').click();await page.keyboard.press('Meta+V');
 if(!selected||await page.locator('#clipboard-dest').inputValue()!==selected)throw new Error('Texto selecionado diverge da colagem');
 result.checks.push({name:'Seleção por arrasto e colagem exata Unicode/multilinha',passed:true});
 await page.locator('#selection-auto').uncheck();
 await page.locator('[data-copy-object]').click();
 if(await page.evaluate(()=>navigator.clipboard.readText())!==selected)throw new Error('Preferência desligada alterou clipboard');
 await page.locator('#selection-auto').check();result.checks.push({name:'Desligar cópia preserva clipboard',passed:true});
 await page.locator('[data-music="play"]').click();
 await page.waitForFunction(()=>!document.querySelector('audio').paused&&document.querySelector('audio').currentTime>.5,{},{timeout:20000});
 await page.waitForTimeout(1000);
 const music=await page.evaluate(()=>({time:reviewAudio.currentTime,duration:reviewAudio.duration,level:musicDemo.level,paused:reviewAudio.paused}));
 if(!(music.duration>0&&music.level>0))throw new Error('Sem duração/energia do MP3 real');
 result.checks.push({name:'MP3 indicado toca e alimenta energia da borda',...music});
 await page.selectOption('#screen-picker','construir');
 if(await page.evaluate(()=>reviewAudio.paused))throw new Error('Trocar tela interrompeu música');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForTimeout(100);
 if(await page.evaluate(()=>musicDemo.frame!==0))throw new Error('Movimento reduzido mantém ciclo');
 result.checks.push({name:'Música persiste entre vistas; movimento reduzido encerra pulso',passed:true});
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.selectOption('#screen-picker','ritmo');await page.locator('[data-music="play"]').click();
 await page.waitForFunction(()=>reviewAudio.paused&&musicDemo.level===0&&musicDemo.frame===0);
 if(await page.evaluate(()=>!reviewAudio.paused||musicDemo.level!==0||musicDemo.frame!==0))throw new Error('Pausa não zerou pulso');
 result.checks.push({name:'Pausa zera o pulso',passed:true});
 for(const [view,theme]of [['plano','tech'],['construir','tech'],['ritmo','tech'],['maquina','tech'],['criador','vibe']]){
  await page.selectOption('#screen-picker',view);
  if(await page.locator('html').getAttribute('data-theme')!==theme)await page.getByRole('button',{name:'Alternar Tech e Vibe',exact:true}).click();
  await page.waitForTimeout(450);
  const file=`VERIFICADO-${view}.png`;await page.screenshot({path:path.join(dir,file),fullPage:true});result.screenshots.push(file);
 }
}catch(e){result.errors.push(e.message);}finally{await browser.close();}
fs.writeFileSync(path.join(dir,'VERIFICACAO-VISUAL.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({views:result.views.length,checks:result.checks,errors:result.errors,screenshots:result.screenshots},null,2));
if(result.errors.length)process.exitCode=1;
