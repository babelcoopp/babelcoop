/* Babel Coop · as Estações se acham na rede local
   Anúncio por UDP broadcast a cada 2 s ("estou aqui, na porta X"); quem ouve conecta por WebSocket.
   Não depende de IP fixo nem de servidor central: cada computador é um servidor.
   Quando for para fora do escritório, este arquivo troca o broadcast por um ponto de encontro (VPS); o resto fica igual.
*/
'use strict';
const dgram = require('dgram');
const os = require('os');
const WebSocket = require('ws');
const token = require('./token');

const MORTO = 7000;

class Rede {
  constructor(cfg, diario, aoMensagemDePar) {
    this.cfg = cfg;
    this.diario = diario;
    this.aoMensagemDePar = aoMensagemDePar; /* (par, msg) => void  · terminais e pedidos que passam de máquina em máquina */
    this.pares = new Map(); /* id → { id, nome, host, porta, ts, ws, papel } */
    this.ouvintesPares = [];
  }

  iniciar() {
    this.udp = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    this.udp.on('message', (buf, rinfo) => {
      let m; try { m = JSON.parse(buf.toString()); } catch (e) { return; }
      if (!m || m.coop !== 1 || m.id === this.cfg.id) return;
      this.viu({ id: m.id, nome: m.nome, papel: m.papel, host: rinfo.address, porta: m.porta });
    });
    this.udp.on('error', (e) => console.error('[rede] udp', e.message));
    this.udp.bind(this.cfg.descoberta, () => {
      try { this.udp.setBroadcast(true); } catch (e) { /* alguns sistemas negam */ }
      this.anunciar();
      this.timer = setInterval(() => { this.anunciar(); this.limpar(); this.encontro(); }, 2000);
    });
    this.encontro();
  }

  /* os endereços que vieram no token (a Estação de quem convidou): liga direto, mesmo se o broadcast estiver bloqueado no Wi-Fi */
  encontro() {
    (this.cfg.encontro || []).forEach((end) => {
      const [host, porta] = end.split(':');
      if (!host || !porta) return;
      const ja = [...this.pares.values()].some((p) => p.host === host && String(p.porta) === porta && p.ws && p.ws.readyState === WebSocket.OPEN);
      if (ja) return;
      const chave = 'encontro:' + end;
      if (this.pares.has(chave) && this.pares.get(chave).ws) return;
      const par = { host, porta: +porta, ts: Date.now() };
      this.pares.set(chave, par);
      this.conectar(par);
    });
  }

  anunciar() {
    const msg = Buffer.from(JSON.stringify({ coop: 1, id: this.cfg.id, nome: this.cfg.nome, papel: this.cfg.papel, porta: this.cfg.porta }));
    const destinos = ['255.255.255.255'];
    const ifs = os.networkInterfaces();
    Object.keys(ifs).forEach((k) => ifs[k].forEach((i) => { if (i.family === 'IPv4' && !i.internal && i.netmask) destinos.push(broadcastDe(i.address, i.netmask)); }));
    destinos.forEach((d) => { try { this.udp.send(msg, this.cfg.descoberta, d); } catch (e) { /* interface sem broadcast */ } });
  }

  viu(info) {
    const atual = this.pares.get(info.id) || {};
    const par = Object.assign(atual, info, { ts: Date.now() });
    this.pares.set(info.id, par);
    if (!par.ws && this.cfg.id < info.id) this.conectar(par); /* só um dos dois liga, o de id menor */
    if (!atual.id) this.avisar();
  }

  conectar(par) {
    const ws = new WebSocket('ws://' + par.host + ':' + par.porta + '/ws?par=1');
    par.ws = ws;
    ws.on('open', () => this.ligar(par, ws));
    ws.on('error', () => { par.ws = null; });
    ws.on('close', () => { par.ws = null; this.avisar(); });
  }

  /* um par chegou (tanto faz quem ligou): troca diários e passa a repassar mensagens */
  ligar(par, ws) {
    par.ws = ws;
    ws.send(JSON.stringify({ tipo: 'ola', id: this.cfg.id, nome: this.cfg.nome, papel: this.cfg.papel, porta: this.cfg.porta, equipe: this.cfg.equipe, prova: token.prova(this.cfg.segredo, this.cfg.id), cursores: this.diario.cursores() }));
    ws.on('message', (buf) => {
      let m; try { m = JSON.parse(buf.toString()); } catch (e) { return; }
      if (m.tipo === 'ola') {
        /* só entra quem tem o segredo da equipe (veio no token) */
        if (m.equipe !== this.cfg.equipe || m.prova !== token.prova(this.cfg.segredo, m.id)) { console.warn('[rede] recusado: ' + m.id + ' não é da equipe'); ws.close(); return; }
        [...this.pares.entries()].forEach(([k, v]) => { if (v === par && k !== m.id) this.pares.delete(k); });
        par.id = m.id; par.nome = m.nome; par.papel = m.papel; par.ts = Date.now();
        this.pares.set(par.id, par);
        ws.send(JSON.stringify({ tipo: 'eventos', lista: this.diario.desde(m.cursores) }));
        this.avisar();
        return;
      }
      if (m.tipo === 'eventos') { (m.lista || []).forEach((ev) => this.diario.aceitar(ev)); return; }
      if (m.tipo === 'evento') { this.diario.aceitar(m.evento); return; }
      this.aoMensagemDePar(par, m);
    });
    ws.on('close', () => { par.ws = null; this.avisar(); });
  }

  /* chamado pelo servidor quando alguém liga em /ws?par=1 */
  aceitar(ws, host) { const par = { host, ts: Date.now() }; this.ligar(par, ws); }

  enviar(id, msg) { const p = this.pares.get(id); if (p && p.ws && p.ws.readyState === WebSocket.OPEN) { p.ws.send(JSON.stringify(msg)); return true; } return false; }
  espalhar(msg) { this.pares.forEach((p) => { if (p.ws && p.ws.readyState === WebSocket.OPEN) p.ws.send(JSON.stringify(msg)); }); }

  limpar() {
    const agora = Date.now();
    let mudou = false;
    this.pares.forEach((p, id) => { if (agora - p.ts > MORTO && !(p.ws && p.ws.readyState === WebSocket.OPEN)) { this.pares.delete(id); mudou = true; } });
    if (mudou) this.avisar();
  }

  lista() { return Array.from(this.pares.values()).filter((p) => p.id).map((p) => ({ id: p.id, nome: p.nome, papel: p.papel, host: p.host, porta: p.porta, ligado: !!(p.ws && p.ws.readyState === WebSocket.OPEN) })); }
  aoMudar(fn) { this.ouvintesPares.push(fn); }
  avisar() { const l = this.lista(); this.ouvintesPares.forEach((fn) => fn(l)); }
  parar() { clearInterval(this.timer); try { this.udp.close(); } catch (e) { /* já fechado */ } this.pares.forEach((p) => { if (p.ws) try { p.ws.close(); } catch (e) { /* ok */ } }); }
}

function broadcastDe(ip, mascara) {
  const a = ip.split('.').map(Number), m = mascara.split('.').map(Number);
  return a.map((o, i) => (o & m[i]) | (~m[i] & 255)).join('.');
}

module.exports = { Rede };
