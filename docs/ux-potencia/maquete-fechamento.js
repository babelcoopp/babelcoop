'use strict';
// Som e clipboard locais da apresentação; nenhum acesso ao app ou às contas.
const reviewStops=[
 ['01','construir','Construir juntos','Projeto, arquivos, resultado e terminal no mesmo lugar.'],
 ['02','concluir','Levar até o fim','Cinco modelos, etapas, cronômetro e passagem de trabalho.'],
 ['03','agentes','Potência com contexto','Claude Code, Codex, OpenCode e Vyra; cooperação e navegador.'],
 ['04','maquina','Dar espaço à construção','Mapa em tela inteira e universo da Máquina.'],
 ['05','reuniao','Apresentar o que nasceu','Palco pelo terminal, transmissão e desenho no iPad.'],
 ['06','pets','Um lugar vivo','Cinco companheiros, depois 30; gestos e ponteiro.'],
 ['07','ritmo','Trabalhar no seu ritmo','Playlist, bordas suaves e seleção que já copia.'],
 ['08','criador','O corpo pode crescer','Módulos, relatos, versões e prova de cada melhoria.'],
 ['09','vyra','Experiência para Vyra','Substrato, modo solo e laboratório secundário.']
];
pages.plano=()=>`<div class="content-page"><div class="eyebrow">BABEL-COOP / APRESENTAÇÃO DO PLANO / 25.09.2026</div><section class="plan-hero"><div><h1>Construir juntos.<br><em>Chegar até o fim.</em></h1><p>Um lugar para você e a equipe transformarem intenção em projeto, com arquivos, tarefas, terminais e agentes no mesmo contexto.</p><div class="hero-actions">${go('construir','Explorar a proposta ↗','primary')}${go('ritmo','Música e seleção')}</div></div><div class="plan-numbers"><div><strong>21</strong><span>VISTAS NAVEGÁVEIS</span></div><div><strong>79</strong><span>REQUISITOS MAPEADOS</span></div><div><strong>133</strong><span>TAREFAS COM ACEITE</span></div><div><strong>4</strong><span>IAS NO CATÁLOGO</span></div></div></section><div class="spaced" style="margin-top:30px"><span class="eyebrow">O PERCURSO DA SUA REVISÃO</span><span class="pill">Proposta para sua análise</span></div><div class="plan-route">${reviewStops.map(([n,id,t,d])=>go(id,`<span class="eyebrow">${n} / EXPLORAR ↗</span><strong>${t}</strong><small>${d}</small>`)).join('')}</div><div class="plan-links"><a href="HISTORICO-CODEX.md">Conversa recuperada ↗</a><a href="PLANO-DAS-TELAS.md">Plano das telas ↗</a><a href="TODO.md">Ordem de construção ↗</a><a href="MUSICA-SELECAO-E-ACEITE.md">Régua de aceite ↗</a></div><div class="empty-info">O plano está em apresentação. As tarefas de implementação continuam abertas. Dados de equipe são exemplos; pets e mundos são conceitos visuais. Você pode percorrer todas as vistas pelo seletor no topo.</div></div>`;

const musicDemo={tracks:[{name:'GOD ON THE CODE · Liminal Stages',url:'/audio-theus.mp3'}],index:0,level:0,intensity:.45,enabled:true,copied:'',autoCopy:true,frame:0,context:null,analyser:null};
const reviewAudio=document.createElement('audio');
reviewAudio.preload='none';reviewAudio.volume=.25;document.body.append(reviewAudio);
const reviewEdge=document.createElement('div');reviewEdge.className='audio-edge';reviewEdge.setAttribute('aria-hidden','true');document.body.append(reviewEdge);
const reduceMusic=matchMedia('(prefers-reduced-motion: reduce)');
function musicSafe(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function musicTime(n){return Number.isFinite(n)?`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`:'0:00';}
pages.ritmo=()=>`<div class="content-page">${heading('IDENTIDADE / MÚSICA E GESTOS','O trabalho encontra seu ritmo.','Sua música acompanha a construção. A seleção já prepara o próximo gesto.',go('plano','Visão do plano'))}<div class="music-layout"><section><div class="music-art"><span class="eyebrow">PLAYLIST BABEL-COOP · PRIMEIRA FAIXA</span><h2>GOD ON<br>THE CODE</h2><small>Ambient Vaporwave · Liminal Stages</small></div><div class="music-controls"><button data-music="previous" aria-label="Faixa anterior">←</button><button class="primary" data-music="play">${reviewAudio.paused?'Tocar':'Pausar'}</button><button data-music="next" aria-label="Próxima faixa">→</button><label>Volume <input aria-label="Volume da música" id="music-volume" type="range" min="0" max="1" step=".01" value="${reviewAudio.volume}"></label></div><input class="music-seek" id="music-seek" aria-label="Posição da música" type="range" min="0" max="100" value="0"><div class="spaced"><span id="music-time" class="demo-status">0:00 / 0:00</span><label class="pill">+ Adicionar MP3 <input id="music-files" type="file" accept="audio/*" multiple style="max-width:180px"></label></div><div id="music-tracks">${musicTracks()}</div><div class="field"><label><input id="music-edge" type="checkbox" ${musicDemo.enabled?'checked':''}> Bordas acompanhando a música</label><label>Intensidade <input id="music-intensity" type="range" min="0" max="1" step=".05" value="${musicDemo.intensity}"></label></div><p class="demo-status" id="music-status" role="status">Áudio local, iniciado somente ao tocar. Original preservado; versão leve prevista no plano.</p></section><section><span class="eyebrow">SELECIONAR → COPIAR → COLAR</span><h2 style="margin-top:16px">Um gesto a menos.</h2><p class="muted" style="margin-top:15px;line-height:1.8">Selecione o trecho abaixo e cole no campo com ⌘V no Mac ou Ctrl+V no Windows.</p><label class="field"><span><input type="checkbox" id="selection-auto" ${musicDemo.autoCopy?'checked':''}> Copiar ao concluir a seleção</span></label><div class="selection-example" id="selection-example" tabindex="0">Uma equipe. Um projeto.<br>Construir → conferir → entregar.<br>A próxima ação continua de onde paramos.</div><button class="selection-object" data-copy-object aria-pressed="false">Selecionar peça · Inscrições</button><p id="selection-status" class="demo-status" role="status">Texto: cópia exata. Peça: representação textual nesta maquete.</p><label class="field" for="clipboard-dest">Cole aqui para conferir</label><textarea class="clipboard-dest" id="clipboard-dest" placeholder="⌘V / Ctrl+V"></textarea><div class="empty-info" style="margin-top:25px">No app, texto, terminal, arquivos e objetos terão contratos de colagem próprios. Aqui você confere texto e a referência de uma peça, usando a área de transferência real do navegador.</div><div class="plan-links"><a href="MUSICA-SELECAO-E-ACEITE.md">Ver comportamentos e aceites ↗</a></div></section></div></div>`;
function musicTracks(){return musicDemo.tracks.map((t,i)=>`<div class="music-track ${musicDemo.index===i?'active':''}"><span>${String(i+1).padStart(2,'0')} · ${musicSafe(t.name)}</span><button data-track="${i}" aria-label="Tocar faixa ${i+1}">▶</button></div>`).join('');}
function musicStatus(t){const el=document.querySelector('#music-status');if(el)el.textContent=t;}
function stopMusicPulse(){cancelAnimationFrame(musicDemo.frame);musicDemo.frame=0;musicDemo.level=0;reviewEdge.style.opacity='0';}
function musicPulse(){
 stopMusicPulse();
 if(reviewAudio.paused||document.hidden||reduceMusic.matches||!musicDemo.enabled||!musicDemo.analyser)return;
 const bins=new Uint8Array(musicDemo.analyser.frequencyBinCount);let last=0;
 function tick(now){
  if(reviewAudio.paused||document.hidden||reduceMusic.matches||!musicDemo.enabled){stopMusicPulse();return;}
  if(now-last>45){last=now;musicDemo.analyser.getByteFrequencyData(bins);let sum=0;for(let i=1;i<80;i++)sum+=bins[i];const energy=sum/(79*255);musicDemo.level+=.12*(energy-musicDemo.level);reviewEdge.style.opacity=String(Math.min(.5,musicDemo.level*musicDemo.intensity));}
  musicDemo.frame=requestAnimationFrame(tick);
 }musicDemo.frame=requestAnimationFrame(tick);
}
async function playReviewMusic(index=musicDemo.index){
 const track=musicDemo.tracks[index];if(!track)return;
 try{
  if(!musicDemo.context){const AC=window.AudioContext||window.webkitAudioContext;musicDemo.context=new AC();musicDemo.analyser=musicDemo.context.createAnalyser();musicDemo.analyser.fftSize=1024;musicDemo.analyser.smoothingTimeConstant=.85;const source=musicDemo.context.createMediaElementSource(reviewAudio);source.connect(musicDemo.analyser);musicDemo.analyser.connect(musicDemo.context.destination);}
  await musicDemo.context.resume();
  if(musicDemo.index!==index||!reviewAudio.getAttribute('src')){musicDemo.index=index;reviewAudio.src=track.url;}
  await reviewAudio.play();musicPulse();musicStatus('Reproduzindo o áudio local. O pulso acompanha a energia suavizada da música.');refreshReviewMusic();
 }catch{musicStatus('Não foi possível tocar esta faixa. Adicione o MP3 pelo seletor para reconectar.');stopMusicPulse();}
}
function refreshReviewMusic(){const play=document.querySelector('[data-music="play"]');if(play)play.textContent=reviewAudio.paused?'Tocar':'Pausar';const tracks=document.querySelector('#music-tracks');if(tracks)tracks.innerHTML=musicTracks();document.querySelector('.music-mini')?.classList.toggle('playing',!reviewAudio.paused);}
async function copyReviewSelection(text){
 if(!musicDemo.autoCopy||!text)return;
 try{await navigator.clipboard.writeText(text);musicDemo.copied=text;const el=document.querySelector('#selection-status');if(el)el.textContent='Copiado para a área de transferência. Agora cole com ⌘V / Ctrl+V.';}
 catch{const el=document.querySelector('#selection-status');if(el)el.textContent='O navegador não permitiu copiar. Use ⌘C / Ctrl+C; a seleção permanece disponível.';}
}
function completeReviewSelection(){const s=getSelection();if(!s||s.isCollapsed)return;const node=s.anchorNode?.parentElement;if(!node?.closest('#selection-example'))return;copyReviewSelection(s.toString());}
document.addEventListener('pointerup',completeReviewSelection);
document.addEventListener('keyup',e=>{if(e.key==='Shift'||e.shiftKey)completeReviewSelection();});
document.addEventListener('click',e=>{
 const key=e.target.closest('[data-music]')?.dataset.music;
 if(key==='play'){if(reviewAudio.paused)playReviewMusic();else reviewAudio.pause();}
 if(key==='previous'||key==='next')playReviewMusic((musicDemo.index+(key==='next'?1:-1)+musicDemo.tracks.length)%musicDemo.tracks.length);
 const track=e.target.closest('[data-track]');if(track)playReviewMusic(Number(track.dataset.track));
 const object=e.target.closest('[data-copy-object]');if(object){object.setAttribute('aria-pressed','true');copyReviewSelection('Inscrições · tabela · projeto Órbita');}
});
document.addEventListener('input',e=>{
 if(e.target.id==='music-volume')reviewAudio.volume=Number(e.target.value);
 if(e.target.id==='music-intensity')musicDemo.intensity=Number(e.target.value);
 if(e.target.id==='music-seek'&&Number.isFinite(reviewAudio.duration))reviewAudio.currentTime=reviewAudio.duration*Number(e.target.value)/100;
});
document.addEventListener('change',e=>{
 if(e.target.id==='music-edge'){musicDemo.enabled=e.target.checked;musicPulse();}
 if(e.target.id==='selection-auto')musicDemo.autoCopy=e.target.checked;
 if(e.target.id==='music-files'){for(const file of e.target.files)musicDemo.tracks.push({name:file.name,url:URL.createObjectURL(file)});refreshReviewMusic();}
});
reviewAudio.addEventListener('pause',()=>{stopMusicPulse();refreshReviewMusic();});
reviewAudio.addEventListener('play',refreshReviewMusic);
reviewAudio.addEventListener('ended',()=>{stopMusicPulse();if(musicDemo.tracks.length>1)playReviewMusic((musicDemo.index+1)%musicDemo.tracks.length);});
reviewAudio.addEventListener('error',()=>{stopMusicPulse();musicStatus('Faixa indisponível. Use + Adicionar MP3 para escolher o arquivo.');});
reviewAudio.addEventListener('timeupdate',()=>{const t=document.querySelector('#music-time'),seek=document.querySelector('#music-seek');if(t)t.textContent=`${musicTime(reviewAudio.currentTime)} / ${musicTime(reviewAudio.duration)}`;if(seek&&Number.isFinite(reviewAudio.duration))seek.value=String(reviewAudio.currentTime/reviewAudio.duration*100);});
document.addEventListener('visibilitychange',musicPulse);reduceMusic.addEventListener('change',musicPulse);
const renderBeforeReview=render;
render=function(id=state.screen){renderBeforeReview(id);refreshReviewMusic();reviewAudio.dispatchEvent(new Event('timeupdate'));if(location.hash!==`#${id}`)history.replaceState(null,'',`#${id}`);};
window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(pages[id])render(id);});
render(pages[location.hash.slice(1)]?location.hash.slice(1):'plano');
