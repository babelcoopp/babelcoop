/* Babel Coop — protótipo · conteúdos de exemplo dos arquivos e gerador de PDF */
window.BC = window.BC || {};

(function (BC) {
  'use strict';

  var U = BC.util;

  /* ---------- PDF de verdade, gerado na página (Helvetica, WinAnsi) ---------- */

  var WIN = { 0x2014: 0x97, 0x2013: 0x96, 0x2026: 0x85, 0x201C: 0x93, 0x201D: 0x94, 0x2018: 0x91, 0x2019: 0x92, 0x2022: 0x95 };

  function pdfTexto(s) {
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s[i], c = s.charCodeAt(i);
      if (ch === '(' || ch === ')' || ch === '\\') out += '\\' + ch;
      else if (c < 128) out += ch;
      else {
        var cod = WIN[c] || (c >= 160 && c <= 255 ? c : 63);
        out += '\\' + ('00' + cod.toString(8)).slice(-3);
      }
    }
    return out;
  }

  function quebrar(texto, largura) {
    var palavras = texto.split(' '), linhas = [], atual = '';
    palavras.forEach(function (p) {
      if ((atual + ' ' + p).trim().length > largura) { linhas.push(atual.trim()); atual = p; }
      else atual += ' ' + p;
    });
    if (atual.trim()) linhas.push(atual.trim());
    return linhas;
  }

  function pagina(titulo, linhas, n, total) {
    var c = '0.525 0.439 1 rg 0 812 595 30 re f\n';
    c += 'BT /F2 10 Tf 1 1 1 rg 40 823 Td (' + pdfTexto('BABEL · ' + titulo) + ') Tj ET\n';
    c += 'BT /F2 20 Tf 0.1 0.08 0.2 rg 56 760 Td (' + pdfTexto(titulo) + ') Tj ET\n';
    var y = 726;
    linhas.forEach(function (l) {
      if (y < 80) return;
      if (l.indexOf('# ') === 0) {
        y -= 6;
        c += 'BT /F2 13 Tf 0.1 0.08 0.2 rg 56 ' + y + ' Td (' + pdfTexto(l.slice(2)) + ') Tj ET\n';
        y -= 22;
        return;
      }
      quebrar(l, 92).forEach(function (parte) {
        c += 'BT /F1 11 Tf 0.25 0.23 0.33 rg 56 ' + y + ' Td (' + pdfTexto(parte) + ') Tj ET\n';
        y -= 16;
      });
      y -= 4;
    });
    c += 'BT /F1 9 Tf 0.5 0.5 0.6 rg 56 40 Td (' + pdfTexto('página ' + n + ' de ' + total) + ') Tj ET\n';
    return c;
  }

  /* doc = { titulo, paginas: [[linha, ...], ...] } → Uint8Array com um PDF válido */
  BC.pdf = {
    gerar: function (doc) {
      var kids = [], corpo = [], n = 4;
      doc.paginas.forEach(function (linhas, i) {
        var pg = ++n, ct = ++n, fluxo = pagina(doc.titulo, linhas, i + 1, doc.paginas.length);
        kids.push(pg + ' 0 R');
        corpo.push([pg, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' + ct + ' 0 R >>']);
        corpo.push([ct, '<< /Length ' + fluxo.length + ' >>\nstream\n' + fluxo + '\nendstream']);
      });
      var lista = [
        [1, '<< /Type /Catalog /Pages 2 0 R >>'],
        [2, '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + doc.paginas.length + ' >>'],
        [3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'],
        [4, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>']
      ].concat(corpo);
      var s = '%PDF-1.4\n', pos = [];
      lista.forEach(function (o) { pos[o[0]] = s.length; s += o[0] + ' 0 obj\n' + o[1] + '\nendobj\n'; });
      var xref = s.length, total = lista.length + 1;
      s += 'xref\n0 ' + total + '\n0000000000 65535 f \n';
      for (var i = 1; i < total; i++) s += ('000000000' + pos[i]).slice(-10) + ' 00000 n \n';
      s += 'trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';
      var bytes = new Uint8Array(s.length);
      for (var j = 0; j < s.length; j++) bytes[j] = s.charCodeAt(j) & 255;
      return bytes;
    }
  };

  /* ---------- imagens (SVG) ---------- */

  function svgUrl(svg) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }

  function banner(titulo, sub) {
    return svgUrl('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="628" viewBox="0 0 1200 628">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a1350"/><stop offset="1" stop-color="#0c2a4a"/></linearGradient>' +
      '<radialGradient id="r" cx="0.8" cy="0.3" r="0.6"><stop offset="0" stop-color="#29ccec" stop-opacity="0.55"/><stop offset="1" stop-color="#29ccec" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="1200" height="628" fill="url(#g)"/><rect width="1200" height="628" fill="url(#r)"/>' +
      '<text x="80" y="300" font-family="Helvetica, Arial, sans-serif" font-size="84" font-weight="700" fill="#ffffff">' + U.esc(titulo) + '</text>' +
      '<text x="84" y="372" font-family="Helvetica, Arial, sans-serif" font-size="34" fill="#cfe9ff">' + U.esc(sub) + '</text></svg>');
  }

  function organograma() {
    var caixas = [['Theus', 520, 60], ['Comercial', 150, 260], ['Operação', 520, 260], ['Produto', 890, 260]];
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="480" viewBox="0 0 1200 480"><rect width="1200" height="480" fill="#0d1526"/>' +
      '<path d="M600 130 V200 M230 200 H970 M230 200 V260 M600 200 V260 M970 200 V260" stroke="#42597d" stroke-width="3" fill="none"/>';
    caixas.forEach(function (c) {
      svg += '<rect x="' + c[1] + '" y="' + c[2] + '" width="160" height="70" rx="10" fill="#151e35" stroke="#8670ff" stroke-width="2"/>' +
        '<text x="' + (c[1] + 80) + '" y="' + (c[2] + 43) + '" text-anchor="middle" font-family="Helvetica, Arial" font-size="24" fill="#e4dcff">' + c[0] + '</text>';
    });
    return svgUrl(svg + '</svg>');
  }

  /* ---------- conteúdo dos arquivos ---------- */

  var README = [
    '# Como usamos o Babel Coop', '',
    'Bem-vindo à Estação. Aqui fica tudo o que a equipe cria, e todo mundo pode ver.', '',
    '## Onde ficam as coisas', '',
    '| Pasta | O que tem |', '|---|---|',
    '| EQUIPE/Reuniões | atas geradas no fim de cada reunião |',
    '| EQUIPE/Mapas | mapas mentais |',
    '| EQUIPE/Quadros | quadros do iPad e do brainstorm |',
    '| EQUIPE/Aprendizados | o que a equipe aprendeu (a IA lê) |',
    '| a sua pasta | o seu trabalho, visível para todos |', '',
    '## Três regras', '',
    '1. **Terminou uma demanda?** Escreva o que aprendeu.',
    '2. **Travou?** Clique em *Pedir ajuda*: o arquivo vai junto.',
    '3. **Errou?** *Versões → Voltar como estava*.', '',
    '## Comandos úteis no terminal', '',
    '```bash', 'coop ajuda', 'coop buscar "reembolso"', 'coop aprendi "cliente de clínica prefere proposta curta"', '```', '',
    '> A IA do terminal lê os aprendizados da equipe antes de começar.'
  ].join('\n');

  var PRECOS = [
    '<!doctype html>', '<html lang="pt-BR">', '<head>', '<meta charset="utf-8">', '<title>Babel OS · Preços</title>', '<style>',
    '  body { margin: 0; font-family: system-ui, sans-serif; background: #0b0f1d; color: #e8ecff; }',
    '  header { padding: 48px 24px 8px; text-align: center; }',
    '  h1 { font-size: 40px; margin: 0 0 8px; }',
    '  .sub { color: #9aa6c8; margin: 0; }',
    '  .planos { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; padding: 32px 24px 60px; }',
    '  .plano { width: 260px; border: 1px solid #2a3355; border-radius: 14px; padding: 24px; background: #121833; }',
    '  .plano.destaque { border-color: #8670ff; box-shadow: 0 0 0 1px #8670ff, 0 20px 50px rgba(134, 112, 255, .25); }',
    '  .preco { font-size: 34px; font-weight: 700; margin: 12px 0; }',
    '  .preco small { font-size: 14px; color: #9aa6c8; font-weight: 400; }',
    '  ul { padding-left: 18px; color: #c3cbe8; line-height: 1.7; }',
    '  button { width: 100%; padding: 12px; border: 0; border-radius: 10px; background: #8670ff; color: #fff; font-weight: 600; cursor: pointer; }',
    '</style>', '</head>', '<body>',
    '  <header><h1>Planos Babel OS</h1><p class="sub">Atendimento com IA para a sua empresa</p></header>',
    '  <section class="planos">',
    '    <div class="plano"><h2>Mensal</h2><div class="preco">R$ 1.000 <small>/mês</small></div>',
    '      <ul><li>1 agente de IA</li><li>WhatsApp e site</li><li>Suporte em horário comercial</li></ul><button data-plano="mensal">Quero este</button></div>',
    '    <div class="plano destaque"><h2>Anual</h2><div class="preco">R$ 850 <small>/mês</small></div>',
    '      <ul><li>Tudo do mensal</li><li>2 meses de desconto</li><li>Implantação inclusa</li></ul><button data-plano="anual">Quero este</button></div>',
    '  </section>', '</body>', '</html>'
  ].join('\n');

  var APPJS = [
    '// Guarda o plano escolhido e leva para a contratação',
    "const botoes = document.querySelectorAll('[data-plano]');", '',
    'botoes.forEach((botao) => {',
    "  botao.addEventListener('click', () => {",
    '    const plano = botao.dataset.plano;',
    "    localStorage.setItem('plano-escolhido', plano);",
    '    window.location.href = `/contratar?plano=${plano}`;',
    '  });', '});'
  ].join('\n');

  var CALCULO = [
    '"""Calcula comissões separando renovação e cliente novo."""',
    'from dataclasses import dataclass', '',
    'TAXA_NOVO = 0.10', 'TAXA_RENOVACAO = 0.04', '', '',
    '@dataclass', 'class Venda:', '    vendedor: str', '    valor: float', '    renovacao: bool', '', '',
    'def comissao(venda: Venda) -> float:',
    '    taxa = TAXA_RENOVACAO if venda.renovacao else TAXA_NOVO',
    '    return round(venda.valor * taxa, 2)', '', '',
    'def total_por_vendedor(vendas: list[Venda]) -> dict[str, float]:',
    '    totais: dict[str, float] = {}', '    for v in vendas:',
    '        totais[v.vendedor] = totais.get(v.vendedor, 0) + comissao(v)', '    return totais'
  ].join('\n');

  var SCRIPT = [
    '#!/usr/bin/env bash', '# Gera o relatório semanal de demandas a partir do acervo', 'set -euo pipefail', '',
    'MES="${1:-$(date +%m)}"', 'echo "Gerando relatório de ${MES}..."', '',
    'coop buscar "demanda concluída" --mes "$MES" --json > /tmp/demandas.json',
    'jq -r \'.[] | "\\(.pessoa)\\t\\(.titulo)\\t\\(.trabalho)"\' /tmp/demandas.json | sort > "relatorios/demandas-${MES}.tsv"',
    'echo "Pronto: relatorios/demandas-${MES}.tsv"'
  ].join('\n');

  var ROTEIRO = [
    '# Roteiro · vídeo depoimento (Clínica Sorriso)', '', '**Duração:** 60 s · **Formato:** vertical 9:16', '',
    '## Abertura (0–10 s)', 'A Dra. Paula conta como era antes: *"A gente perdia paciente no WhatsApp à noite."*', '',
    '## Meio (10–45 s)', '- A recepção com a Babel respondendo de madrugada', '- A agenda cheia na segunda de manhã', '',
    '## Fim (45–60 s)', 'O número que mudou para ela, dito com as palavras dela.', '',
    '> Revisar com o Theus antes de gravar.'
  ].join('\n');

  var ATA_ANTIGA = function (quando) {
    return ['# Ata · reunião geral (' + quando + ')', '', '**Participantes:** Theus, Ana, Bruno, Carla, Davi, Eva, Felipe, Iara, João', '',
      '## Pauta', '- [x] Campanha do mês', '- [x] Site novo', '- [x] Demandas com cronômetro', '',
      '## Decisões', '- As demandas com cronômetro começam a valer na segunda.', '- Toda pausa leva motivo.', '',
      '## Próximos passos', '- **João**: página de preços em homologação até quinta.', '- **Eva**: roteiro do depoimento até sexta.'].join('\n');
  };

  var MAPA = JSON.stringify({ raiz: { id: 'r', texto: 'Babel Coop', filhos: [
    { id: 'a', texto: 'Estação', filhos: [{ id: 'a1', texto: 'Explorador e editor', filhos: [] }, { id: 'a2', texto: 'Terminal com IA', filhos: [] }, { id: 'a3', texto: 'Demandas com cronômetro', filhos: [] }] },
    { id: 'b', texto: 'TV', filhos: [{ id: 'b1', texto: 'Painel', filhos: [] }, { id: 'b2', texto: 'Reunião', filhos: [] }, { id: 'b3', texto: 'Cuidando da gente', filhos: [] }] },
    { id: 'c', texto: 'Inteligência', filhos: [{ id: 'c1', texto: 'Acervo sem LLM', filhos: [] }, { id: 'c2', texto: 'Aprendizados', filhos: [] }, { id: 'c3', texto: 'Sonho', filhos: [] }] },
    { id: 'd', texto: 'iPad', filhos: [{ id: 'd1', texto: 'Quadro ao vivo na TV', filhos: [] }] }
  ] } });

  var QUADRO = JSON.stringify({ itens: [
    { id: 'p1', tipo: 'postit', x: 80, y: 80, w: 190, h: 120, cor: '#ffcf5c', texto: 'Clínicas em Campinas' },
    { id: 'p2', tipo: 'postit', x: 320, y: 60, w: 190, h: 120, cor: '#7fd6a6', texto: 'Depoimento em vídeo' },
    { id: 'p3', tipo: 'postit', x: 560, y: 110, w: 190, h: 120, cor: '#ff7ab8', texto: 'Indique e ganhe' },
    { id: 'p4', tipo: 'postit', x: 200, y: 280, w: 200, h: 120, cor: '#88d7ea', texto: 'Webinar com dentistas' },
    { id: 't1', tipo: 'texto', x: 480, y: 330, texto: 'meta: 50 clientes' },
    { id: 's1', tipo: 'traco', cor: '#c7a2ff', largura: 3, pontos: [[270, 140], [300, 128], [320, 122]] },
    { id: 's2', tipo: 'traco', cor: '#c7a2ff', largura: 3, pontos: [[510, 120], [540, 150], [560, 165]] },
    { id: 's3', tipo: 'traco', cor: '#29ccec', largura: 4, pontos: [[470, 350], [475, 370], [620, 372], [640, 366]] }
  ] });

  /* lista inicial: [caminho, tipo, tamanho, minutos desde a mudança, conteúdo] */
  BC.conteudos = {
    pdf: function (titulo, paginas) { return JSON.stringify({ titulo: titulo, paginas: paginas }); },
    arquivos: function () {
      var hojeMenos7 = U.dataArquivo(new Date(Date.now() - 7 * U.DIA));
      var pdf = BC.conteudos.pdf;
      return [
        ['equipe/Reuniões/' + hojeMenos7 + ' reunião geral.md', 'md', '1 KB', 7 * 1440, ATA_ANTIGA(hojeMenos7)],
        ['equipe/Mapas/Babel Coop.mapa', 'mapa', '2 KB', 180, MAPA],
        ['equipe/Quadros/Brainstorm campanha.quadro', 'quadro', '3 KB', 95, QUADRO],
        ['theus/README.md', 'md', '1 KB', 30, README],
        ['theus/notas/ideias soltas.md', 'md', '1 KB', 12, '# Ideias soltas\n\n- A TV mostrar quem pode ajudar quem\n- Quadro do iPad ao vivo nas reuniões\n- Pergunta da semana na segunda de manhã\n- Prompt bom vira receita no terminal'],
        ['theus/Planejamento Q4.pdf', 'pdf', '2,1 MB', 40, pdf('Planejamento Q4', [
          ['# Objetivo do trimestre', 'Chegar a 80 clientes ativos com atendimento em menos de 1 minuto.', '# Três frentes', 'Comercial: clínicas e escritórios em Campinas e região.', 'Produto: relatórios de comissão e nova página de preços.', 'Equipe: Babel Coop funcionando no escritório, com a TV e o iPad.'],
          ['# Riscos', 'Dependência do servidor no Mac do Theus até comprar o mini PC.', 'Tempo de implantação por cliente ainda alto (média de 6 dias).']])],
        ['theus/Organograma.png', 'imagem', '640 KB', 300, organograma()],
        ['theus/scripts/gerar-relatorio.sh', 'sh', '1 KB', 1500, SCRIPT],
        ['ana/Proposta Grupo Norte.pdf', 'pdf', '1,3 MB', 95, pdf('Proposta Grupo Norte', [['# Escopo', 'Atendimento com IA nos 4 escritórios do Grupo Norte, em WhatsApp e site.', '# Investimento', 'Implantação de R$ 1.000 e mensalidade de R$ 1.000 por unidade.', '# Prazo', 'Implantação em até 10 dias úteis após a assinatura.']])],
        ['bruno/Proposta Clínica Vida.pdf', 'pdf', '980 KB', 12, pdf('Proposta Clínica Vida', [['# Escopo', 'Agendamento pelo WhatsApp com confirmação automática na véspera.', '# Condição', 'Desconto de 8% no plano anual, a aprovar.']])],
        ['carla/Fluxo de caixa setembro.csv', 'csv', '4 KB', 60, 'item,valor,situação\nRecebido,84200,ok\nA receber,41900,em dia\nDespesas,57300,ok\nSaldo,68800,positivo'],
        ['carla/Notas de despesas/viagem-campinas.pdf', 'pdf', '3,4 MB', 26, pdf('Reembolso · viagem a Campinas', [['# Despesas', 'Combustível: R$ 212,40', 'Pedágio: R$ 38,60', 'Almoço com cliente: R$ 146,00', '# Total', 'R$ 397,00, aguardando aprovação do Theus.']])],
        ['davi/relatorio-comissoes/README.md', 'md', '1 KB', 30, '# Relatório de comissões\n\nSepara comissão de **cliente novo** (10%) e de **renovação** (4%).\n\n- `calculo.py`: as regras\n- Teste com o Felipe antes de subir'],
        ['davi/relatorio-comissoes/calculo.py', 'py', '1 KB', 28, CALCULO],
        ['eva/Campanha/banner-1200x628.png', 'imagem', '1,8 MB', 16, banner('Campanha de ' + U.mes(), 'Atendimento com IA que não dorme')],
        ['eva/Campanha/roteiro-depoimento.md', 'md', '1 KB', 52, ROTEIRO],
        ['eva/Campanha/video-depoimento.mp4', 'video', '1,4 GB', 2200, null],
        ['felipe/Procedimento de suporte v3.pdf', 'pdf', '760 KB', 4000, pdf('Procedimento de suporte v3', [['# Entrada', 'Todo chamado entra pela Iara, que faz a triagem e define a prioridade.', '# Resolução', 'O Felipe resolve; se passar de 4 horas, avisa o cliente e a Iara.', '# Validação', 'A Iara confirma com o cliente e fecha o chamado.', '# Prazo', 'Resposta em até 24 horas úteis.']])],
        ['felipe/Chamados agosto.csv', 'csv', '2 KB', 1500, 'chamado,assunto,aberto,resolvido,horas\n470,Login não funciona,01/08,01/08,3\n471,Boleto duplicado,02/08,03/08,20\n472,Agenda não sincroniza,05/08,05/08,2\n473,Mudar de plano,06/08,06/08,1\n474,Erro no relatório,08/08,09/08,26'],
        ['gabi/Vaga SDR.md', 'md', '1 KB', 330, '# Vaga · SDR\n\n**Área:** Vendas · **Regime:** CLT\n\n## O que faz\n- Primeiro contato com clínicas e escritórios\n- Agenda reuniões para a Ana e o Bruno\n\n## O que buscamos\n- Gosta de conversar e de rotina organizada'],
        ['hugo/Inventário do escritório.xlsx', 'binario', '72 KB', 9000, null],
        ['iara/Respostas rápidas.txt', 'txt', '2 KB', 90, 'BOM DIA\nBom dia! Aqui é a Iara, da Babel. Como posso ajudar?\n\nBOLETO\nVou verificar o seu boleto agora e te retorno em até 1 hora.\n\nFORA DO HORÁRIO\nNosso atendimento humano volta às 8h. A assistente da Babel pode ajudar agora mesmo.'],
        ['joao/site-novo/precos.html', 'html', '3 KB', 180, PRECOS],
        ['joao/site-novo/app.js', 'js', '1 KB', 175, APPJS]
      ];
    }
  };
})(window.BC);
