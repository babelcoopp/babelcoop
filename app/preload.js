/* babel-coop · o que a interface pode pedir ao Electron (pouco: o resto passa pelo servidor local)
   Nada de Node exposto: só funções que viram mensagens IPC para o main.js, que confere se quem pede é a própria Estação.

   coopElectron.navegador (PROTOCOLO §9 · o navegador próprio dos agentes, sem Chrome):
     registrar(webContentsId, agenteId, {nome, cor, pessoa})  chame no 'dom-ready' do <webview> (é idempotente) → estado
     assumir(agenteId) · devolver(agenteId)                  a pessoa pega e devolve o controle → estado
     selecionar(agenteId, ligar=true)                          modo inspeção; resolve com {seletor, tag, rotulo, elemento} ou null
     raioX(agenteId, {seletor?, busca?, dom?})                 DOM, elemento (HTML, estilos, regras, fontes), fontes, cores, copy, rede, console
     ler(agenteId) · copy(agenteId) · clonar(agenteId) · print(agenteId)  (gravam na pasta compartilhada da pessoa)
     abrir(agenteId, url)                                      a pessoa digitou um endereço (vale mesmo com o controle dela)
     estado(agenteId) · lista()
     aoPasso(fn) · aoEstado(fn) · aoPedirAba(fn)               recebem 'navegador:passo', 'navegador:estado' e 'navegador:aba' ({agente, nome}: uma
                                                               ferramenta do agente chegou antes da aba existir); devolvem a função que para de ouvir
     raioX aceita partes: ['dom','elemento','busca','fontes','cores','copy','rede','console'] (só rede/console = sem varrer a página)
   Erro: a promessa é rejeitada com Error(mensagem em português).
*/
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

function chamar(acao, agente, args) {
  return ipcRenderer.invoke('coop:navegador', acao, agente, args || {}).then((r) => {
    if (r && r.ok) return r.valor;
    throw new Error((r && r.erro) || 'o navegador não respondeu');
  });
}

function ouvir(canal, fn) {
  if (typeof fn !== 'function') return () => {};
  const h = (_e, dados) => { try { fn(dados); } catch (x) { console.error('[babel-coop] ' + canal + ':', x); } };
  ipcRenderer.on(canal, h);
  return () => ipcRenderer.removeListener(canal, h);
}

contextBridge.exposeInMainWorld('coopElectron', {
  abrirTv: () => ipcRenderer.invoke('coop:tv'),
  /* área de transferência pelo processo principal (o Raio-X copia bloco e Markdown mesmo com o foco dentro do webview) */
  copiar: (texto) => ipcRenderer.invoke('coop:copiar', String(texto == null ? '' : texto)),
  eu: () => ipcRenderer.invoke('coop:eu'),
  oficina: (acao, args) => ipcRenderer.invoke('coop:oficina', acao, args || {}).then((r) => {
    if (r && r.ok) return r.valor;
    throw new Error((r && r.erro) || 'A Oficina não respondeu.');
  }),
  plataforma: process.platform,
  navegador: {
    registrar: (webContentsId, agente, opcoes) => chamar('registrar', agente, Object.assign({}, opcoes || {}, { webContentsId })),
    assumir: (agente) => chamar('assumir', agente),
    devolver: (agente) => chamar('devolver', agente),
    selecionar: (agente, ligar) => chamar('selecionar', agente, { ligar: ligar !== false }),
    raioX: (agente, opcoes) => chamar('raioX', agente, opcoes),
    ler: (agente) => chamar('ler', agente),
    copy: (agente) => chamar('copy', agente),
    clonar: (agente) => chamar('clonar', agente),
    print: (agente) => chamar('print', agente),
    abrir: (agente, url) => chamar('abrir', agente, { url }),
    estado: (agente) => chamar('estado', agente),
    lista: () => chamar('lista', null),
    aoPasso: (fn) => ouvir('navegador:passo', fn),
    aoEstado: (fn) => ouvir('navegador:estado', fn),
    aoPedirAba: (fn) => ouvir('navegador:aba', fn)
  }
});
