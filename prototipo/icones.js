/* babel-coop · icones.js · a família de ícones desenhada à mão (PLANO §2 R10; o Recraft reprovou: 8 de 8 vieram preenchidos)
   Classes: bci e bci-<nome> (o prefixo ic- já é da árvore de arquivos: .ic-mapa pinta fundo).
   Grade: viewBox 24 × 24, área viva 3–21 (margem de 2 px mais meio traço), traço 1,5, pontas e junções redondas,
   sem preenchimento, cor = currentColor. Detalhe interno nunca a menos de 1,5 de vão depois do traço: lê a 16 e a 20 px.
   Ícone é estático sempre (CONCEITO §4): a luz é da peça ou do botão, por evento real, nunca do desenho.
   61 da casca (16 atividades + 45 da casca) · 16 glifos das peças da Máquina (12 + as 4 do Supabase) · 6 estados da Máquina.

   Para os outros:
     BC.icones.svg('gaveta', 16)                       → '<svg …>' pronto para innerHTML (aria-hidden)
     BC.icones.svg('sino', 20, { rotulo: 'Novidades' }) → com <title> e role="img"
     BC.icones.gaveta                                  → só o miolo (<path …/>), para quem monta o próprio <svg>
     BC.icones.tem('robo') · BC.icones.nomes() · BC.icones.grupos · BC.icones.rotulo('robo')
     <span data-icone="cofre" data-tam="16"></span> + BC.icones.hidratar(raiz) → o span ganha o <svg> */
window.BC = window.BC || {};

(function (BC) {
  'use strict';

  var I = {
    /* ---------- as 16 atividades ---------- */
    criar: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M12 11.5v6M9 14.5h6"/>',
    dia: '<path d="M3 17h18"/><path d="M7 17a5 5 0 0 1 10 0"/><path d="M12 6.5V9"/><path d="M6.7 11.7 4.9 9.9"/><path d="m17.3 11.7 1.8-1.8"/><path d="M8.5 20.5h7"/>',
    demandas: '<path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4z"/><path d="M15 8v.5M15 11.75v.5M15 15.5v.5"/>',
    chat: '<path d="M5 4h9.5A1.5 1.5 0 0 1 16 5.5v6a1.5 1.5 0 0 1-1.5 1.5H9l-4 3v-3a1.5 1.5 0 0 1-1.5-1.5v-6A1.5 1.5 0 0 1 5 4z"/><path d="M16 8.5h3.5A1.5 1.5 0 0 1 21 10v6a1.5 1.5 0 0 1-1.5 1.5H19V20l-3.5-2.5h-3A1.5 1.5 0 0 1 11 16v-3"/>',
    reuniao: '<circle cx="12" cy="14.75" r="3.5"/><circle cx="12" cy="7" r="1.75"/><circle cx="4.75" cy="12.1" r="1.75"/><circle cx="19.25" cy="12.1" r="1.75"/>',
    acervo: '<path d="M12 6.5C10.5 5.2 8 4.5 3.5 4.5v13c4.5 0 7 .7 8.5 2"/><path d="M12 6.5c1.5-1.3 4-2 8.5-2v13c-4.5 0-7 .7-8.5 2"/><path d="M12 6.5v13"/>',
    inteligencia: '<path d="M10 3l1.9 5.1L17 10l-5.1 1.9L10 17l-1.9-5.1L3 10l5.1-1.9z"/><path d="M17.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
    terminais: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="m7 9.5 3 2.5-3 2.5"/><path d="M12.5 15H17"/>',
    tarefas: '<rect x="3" y="4" width="4" height="16" rx="1"/><rect x="10" y="4" width="4" height="10" rx="1"/><rect x="17" y="4" width="4" height="13" rx="1"/>',
    metas: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    equipe: '<circle cx="8.75" cy="8" r="3.25"/><path d="M3 20a5.75 5.75 0 0 1 11.5 0"/><circle cx="17" cy="8.75" r="2.25"/><path d="M17.5 14.25a4 4 0 0 1 3.5 4V20"/>',
    mapa: '<path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z"/><path d="M9 4v13.5M15 6.5V20"/>',
    projetos: '<rect x="4" y="8" width="13" height="12" rx="1.5"/><path d="M7.5 5H19a1.5 1.5 0 0 1 1.5 1.5V17"/>',
    whatsapp: '<path d="M7.1 18.5A8.5 8.5 0 1 0 4 14.4L3.5 20.5z"/><path d="M9.2 9c.3 3.3 2.5 5.5 5.8 5.8l1.1-1.6-2.1-1.2-1 .9a4 4 0 0 1-1.8-1.8l.9-1-1.2-2.1z"/>',
    loja: '<path d="M3.5 9 5 4h14l1.5 5"/><path d="M3.5 9a2.83 2.83 0 0 0 5.67 0 2.83 2.83 0 0 0 5.66 0 2.83 2.83 0 0 0 5.67 0"/><path d="M5 11.5V20h14v-8.5"/><path d="M10 20v-4.5h4V20"/>',
    oficina: '<path d="M12.98 13.57A5 5 0 0 0 19.7 7.29L17.58 9.41 14.59 6.42 16.71 4.3A5 5 0 0 0 10.43 11.03L3.83 17.63a1.8 1.8 0 0 0 2.54 2.54z"/>',

    /* ---------- a casca: topo, lateral, rodapé, botões ---------- */
    tv: '<rect x="3" y="4.5" width="18" height="12" rx="1.5"/><path d="M8.5 20h7M12 16.5V20"/>',
    sino: '<path d="M12 3.5v2"/><path d="M6.5 17.5V11a5.5 5.5 0 0 1 11 0v6.5"/><path d="M4.5 17.5h15"/><path d="M10 20.5h4"/>',
    paleta: '<path d="M15 6.5a2.5 2.5 0 1 1 2.5 2.5H6.5A2.5 2.5 0 1 1 9 6.5v11a2.5 2.5 0 1 1-2.5-2.5h11a2.5 2.5 0 1 1-2.5 2.5z"/>',
    fechar: '<path d="M6 6l12 12M18 6 6 18"/>',
    lateral: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
    mais: '<circle cx="5.5" cy="12" r="1.25"/><circle cx="12" cy="12" r="1.25"/><circle cx="18.5" cy="12" r="1.25"/>',
    busca: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.1 15.1 5.4 5.4"/>',
    filtro: '<path d="M3.5 4.5h17L14 12v6l-4 2.5V12z"/>',
    configuracoes: '<path d="M3.5 6H13M17 6h3.5M3.5 12H7M11 12h9.5M3.5 18h9M16.5 18h4"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="14.5" cy="18" r="2"/>',
    perfil: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6 18.7c1.2-2 3.4-3.2 6-3.2s4.8 1.2 6 3.2"/>',
    atualizar: '<path d="M4 12a8 8 0 0 1 13.66-5.66"/><path d="M17.7 3.3v3h-3"/><path d="M20 12a8 8 0 0 1-13.66 5.66"/><path d="M6.3 20.7v-3h3"/>',
    token: '<circle cx="8" cy="16" r="4.5"/><path d="M11.2 12.8 19.5 4.5"/><path d="m17.5 6.5 2.5 2.5M15 9l2 2"/>',

    /* ---------- agentes, presença e terminal ---------- */
    agente: '<circle cx="12" cy="12" r="9"/><rect x="10.75" y="7" width="2.5" height="10" rx="1.25"/><path d="M3 12h2M19 12h2"/>',
    presenca: '<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="18.5" cy="8.5" r="2"/>',
    'ao-vivo': '<circle cx="12" cy="12" r="2"/><path d="M8.5 8.5a5 5 0 0 0 0 7"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M6 6a8.5 8.5 0 0 0 0 12"/><path d="M18 6a8.5 8.5 0 0 1 0 12"/>',
    terminal: '<path d="m4.5 7 5 5-5 5"/><path d="M12 17.5h7.5"/>',
    pausa: '<rect x="6.5" y="5" width="3.5" height="14" rx="1"/><rect x="14" y="5" width="3.5" height="14" rx="1"/>',
    'entrar-terminal': '<path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="M4 12h10.5"/><path d="m11 8 4 4-4 4"/>',
    devolver: '<path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10"/><path d="M9 12h11"/><path d="m16 8 4 4-4 4"/>',
    assumir: '<path d="M4.5 4.5 10 19.5l2.8-6.7 6.7-2.8z"/><path d="m13.5 13.5 5.5 5.5"/>',
    chamar: '<circle cx="9" cy="8" r="3.25"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M15.5 5a4.5 4.5 0 0 1 0 6"/><path d="M18.5 3a8 8 0 0 1 0 10"/>',
    falar: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><path d="M12 18v3M9 21h6"/>',
    'pedir-ajuda': '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="M9.5 9.5 6 6M14.5 9.5 18 6M14.5 14.5 18 18M9.5 14.5 6 18"/>',
    navegador: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
    'raio-x': '<rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M8.5 7.5h7M8.5 16.5h4"/><path d="M3 12h18"/>',
    clonar: '<path d="M15 9V5.5A1.5 1.5 0 0 0 13.5 4h-8A1.5 1.5 0 0 0 4 5.5v8A1.5 1.5 0 0 0 5.5 15H9"/><rect x="9" y="9" width="11" height="11" rx="1.5"/>',
    print: '<path d="M3.5 8V5A1.5 1.5 0 0 1 5 3.5h3M16 3.5h3A1.5 1.5 0 0 1 20.5 5v3M20.5 16v3a1.5 1.5 0 0 1-1.5 1.5h-3M8 20.5H5A1.5 1.5 0 0 1 3.5 19v-3"/><circle cx="12" cy="12" r="3.25"/>',

    /* ---------- ações do objeto ---------- */
    projetar: '<path d="M7 16H4.5A1.5 1.5 0 0 1 3 14.5v-9A1.5 1.5 0 0 1 4.5 4h15A1.5 1.5 0 0 1 21 5.5v9a1.5 1.5 0 0 1-1.5 1.5H17"/><path d="M12 20.5V12"/><path d="m9 15 3-3 3 3"/>',
    'levar-reuniao': '<circle cx="15.5" cy="13.75" r="3"/><circle cx="11.9" cy="8.6" r="1.5"/><circle cx="19.1" cy="8.6" r="1.5"/><path d="M3 13.75h5.5"/><path d="m6 10.75 3 3-3 3"/>',
    versoes: '<path d="M3.5 12a8.5 8.5 0 1 0 2.49-6.01"/><path d="M6 3v3h3"/><path d="M12 7.5V12l3 2"/>',
    salvar: '<path d="M12 3.5v11"/><path d="M7.5 10 12 14.5l4.5-4.5"/><path d="M4 14.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3.5"/>',
    desfazer: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    anexar: '<path d="m20 11.5-7.8 7.8a5 5 0 0 1-7.1-7.1l7.8-7.8a3.3 3.3 0 0 1 4.7 4.7l-7.8 7.8a1.7 1.7 0 0 1-2.4-2.4l7.1-7.1"/>',
    audio: '<path d="M4 10v4M8 6.5v11M12 3.5v17M16 7.5v9M20 10.5v3"/>',
    foto: '<path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h3L9 4.5h6L16.5 7h3A1.5 1.5 0 0 1 21 8.5v10a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/><circle cx="12" cy="13" r="3.5"/>',

    /* ---------- o organismo e o trabalho (pontos com origem, nunca ranking) ---------- */
    pontos: '<path d="M12 3.6 14.17 9.61 20.56 9.82 15.52 13.74 17.29 19.88 12 16.3 6.71 19.88 8.48 13.74 3.44 9.82 9.83 9.61z"/>',
    sequencia: '<path d="M12 21a6 6 0 0 1-6-6c0-2.7 1.3-4.5 2.8-5.8.2 1.8 1 3 2.2 3.6-.4-3.3.8-6.6 3-9.3.6 3.5 4 6.1 4 11.5a6 6 0 0 1-6 6z"/>',
    'tarefa-livre': '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="m8 12.5 3 3 5-6"/>',
    ideia: '<path d="M9 16.5v-1.3c0-1.4-.7-2.4-1.6-3.7A5.5 5.5 0 1 1 16.6 11.5c-.9 1.3-1.6 2.3-1.6 3.7v1.3z"/><path d="M10 20h4"/>',
    aprendizado: '<path d="M12 4.5 3 9.5l9 5 9-5z"/><path d="M6.5 11.44V16c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3v-4.56"/><path d="M21 9.5V15"/>',

    /* ---------- tipos de objeto ---------- */
    pasta: '<path d="M3 7a1.5 1.5 0 0 1 1.5-1.5h4.3l2 2.5h8.7A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/>',
    arquivo: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>',
    maquina: '<rect x="3.5" y="4" width="7" height="5.5" rx="1"/><rect x="13.5" y="4" width="7" height="5.5" rx="1"/><rect x="8.5" y="14.5" width="7" height="5.5" rx="1"/><path d="M7 9.5V12h10V9.5M12 12v2.5"/>',
    quadro: '<rect x="3" y="3.5" width="18" height="13" rx="1.5"/><path d="M6.5 12.5c1.2-2.5 2.6-3.6 4-2 1.4 1.7 2.8 1.6 4.3-.8.7-1.1 1.6-1.3 2.7-.2"/><path d="m8.5 20.5 1.5-4M15.5 20.5l-1.5-4"/>',
    campanha: '<path d="M4.5 9.5H8L15.5 5v14L8 14.5H4.5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1z"/><path d="m8 14.5 1.5 5.5h2l-1.2-4.6"/><path d="M18.5 9a4 4 0 0 1 0 6"/>',

    /* ---------- as 16 peças da Máquina (MAQUINA_PECAS.md, SUPABASE_PECAS.md) ---------- */
    gaveta: '<rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M5 12h14"/><path d="M10 7.75h4M10 16.25h4"/>',
    campo: '<rect x="3" y="8" width="18" height="8" rx="1.5"/><circle cx="7" cy="12" r="1"/><path d="M10.5 12h7"/>',
    fio: '<circle cx="5" cy="17" r="2"/><circle cx="19" cy="7" r="2"/><path d="M7 17c5 0 5-10 10-10"/>',
    chave: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5v-3a4 4 0 0 1 8 0v3"/><path d="M12 14.5v2"/>',
    empresa: '<rect x="6" y="4" width="12" height="16.5" rx="1"/><path d="M3.5 20.5h17"/><path d="M9.5 8h.5M14 8h.5M9.5 12h.5M14 12h.5"/><path d="M10.5 20.5v-4h3v4"/>',
    portaria: '<path d="M3 20.5h18"/><path d="M3 6.5h9"/><path d="M4 20.5v-14h7v14"/><rect x="6" y="9" width="3" height="3.5" rx=".5"/><path d="M11 13.5h8.5"/><path d="M19.5 13.5v7"/>',
    porta: '<path d="M11 21V4.5A1.5 1.5 0 0 1 12.5 3h5A1.5 1.5 0 0 1 19 4.5V21"/><path d="M9.5 21h11"/><circle cx="16.25" cy="12.5" r=".6"/><path d="M3 12h5"/><path d="m5.5 9.5 2.5 2.5-2.5 2.5"/>',
    robo: '<path d="M10.13 5.88 10.44 3.14 13.56 3.14 13.87 5.88A6.4 6.4 0 0 1 16.36 7.32L18.89 6.21 20.46 8.92 18.24 10.56A6.4 6.4 0 0 1 18.24 13.44L20.46 15.08 18.89 17.79 16.36 16.68A6.4 6.4 0 0 1 13.87 18.12L13.56 20.86 10.44 20.86 10.13 18.12A6.4 6.4 0 0 1 7.64 16.68L5.11 17.79 3.54 15.08 5.76 13.44A6.4 6.4 0 0 1 5.76 10.56L3.54 8.92 5.11 6.21 7.64 7.32A6.4 6.4 0 0 1 10.13 5.88z"/><circle cx="12" cy="12" r="2.5"/>',
    deposito: '<path d="M3 20.5h18"/><rect x="4.5" y="14" width="6.5" height="6.5" rx=".75"/><rect x="13" y="14" width="6.5" height="6.5" rx=".75"/><rect x="8.75" y="7.5" width="6.5" height="6.5" rx=".75"/><path d="M6.5 16.5h2.5M15 16.5h2.5M10.75 10h2.5"/>',
    cofre: '<rect x="3.5" y="4" width="17" height="15" rx="1.5"/><path d="M6.5 19v2M17.5 19v2"/><circle cx="11" cy="11.5" r="3.5"/><circle cx="11" cy="11.5" r=".6"/><path d="M17 9.5v4"/>',
    tela: '<rect x="3" y="4.5" width="18" height="15" rx="1.5"/><path d="M3 8.5h18"/><circle cx="6" cy="6.5" r=".4"/><circle cx="8.5" cy="6.5" r=".4"/><path d="M7 12.5h10M7 15.5h6"/>',
    cano: '<path d="M3 9h18M3 15h18"/><path d="M5 7v10M19 7v10"/><circle cx="8.5" cy="12" r=".6"/><circle cx="12" cy="12" r=".6"/><circle cx="15.5" cy="12" r=".6"/>',
    armario: '<rect x="5" y="3" width="14" height="16" rx="1"/><path d="M12 3v16"/><path d="M10 10v2.5M14 10v2.5"/><path d="M6.5 19v1.5M17.5 19v1.5"/>',
    ferramenta: '<rect x="3" y="9" width="18" height="11" rx="1.5"/><path d="M9 9V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V9"/><path d="M3 13.5h7.5M13.5 13.5H21"/><rect x="10.5" y="12" width="3" height="3" rx=".5"/>',
    carteiro: '<rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="M3.5 6.5 12 13l8.5-6.5"/>',
    'casa-de-maquinas': '<rect x="3.5" y="4" width="17" height="6.5" rx="1.5"/><rect x="3.5" y="13.5" width="17" height="6.5" rx="1.5"/><circle cx="7" cy="7.25" r=".6"/><circle cx="7" cy="16.75" r=".6"/><path d="M11 7.25h6M11 16.75h6"/>',

    /* ---------- os 6 estados da Máquina ---------- */
    alerta: '<path d="M12 4 21 19.5H3z"/><path d="M12 9.5v4"/><circle cx="12" cy="16.5" r=".6"/>',
    sujo: '<path d="M20.5 12A8.5 8.5 0 1 1 12 3.5"/><path d="M12 7.5V12l3 2"/><circle cx="18.5" cy="5.5" r="1.5"/>',
    'nao-publicado': '<rect x="4" y="4" width="16" height="16" rx="2" stroke-dasharray="2 3.5"/><circle cx="12" cy="12" r="1"/>',
    fixado: '<path d="M9 3.5h6"/><path d="M10 3.5V9l-3 3.5h10L14 9V3.5"/><path d="M12 12.5V21"/>',
    barrado: '<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>',
    preset: '<path d="M7 12.5V8a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v4.5"/><rect x="3" y="12.5" width="18" height="6.5" rx="1"/><path d="M12 12.5V19"/><path d="M8.25 7a1.25 1.25 0 0 1 2.5 0M13.25 7a1.25 1.25 0 0 1 2.5 0"/>'
  };

  var GRUPOS = {
    atividades: ['criar', 'dia', 'demandas', 'chat', 'reuniao', 'acervo', 'inteligencia', 'terminais', 'tarefas', 'metas', 'equipe', 'mapa', 'projetos', 'whatsapp', 'loja', 'oficina'],
    casca: ['tv', 'sino', 'paleta', 'fechar', 'lateral', 'mais', 'busca', 'filtro', 'configuracoes', 'perfil', 'atualizar', 'token'],
    agentes: ['agente', 'presenca', 'ao-vivo', 'terminal', 'pausa', 'entrar-terminal', 'devolver', 'assumir', 'chamar', 'falar', 'pedir-ajuda', 'navegador', 'raio-x', 'clonar', 'print'],
    acoes: ['projetar', 'levar-reuniao', 'versoes', 'salvar', 'desfazer', 'anexar', 'audio', 'foto'],
    organismo: ['pontos', 'sequencia', 'tarefa-livre', 'ideia', 'aprendizado'],
    tipos: ['pasta', 'arquivo', 'maquina', 'quadro', 'campanha'],
    pecas: ['gaveta', 'campo', 'fio', 'chave', 'empresa', 'portaria', 'porta', 'robo', 'deposito', 'cofre', 'tela', 'cano', 'armario', 'ferramenta', 'carteiro', 'casa-de-maquinas'],
    estados: ['alerta', 'sujo', 'nao-publicado', 'fixado', 'barrado', 'preset']
  };
  /* nomes que a casca já usava e sinônimos do plano: apontam para o mesmo desenho */
  var APELIDOS = { explorador: 'criar', demanda: 'demandas', projeto: 'projetos', meta: 'metas', engrenagem: 'robo', cadeado: 'chave', envelope: 'carteiro', lupa: 'busca', 'ideia-falada': 'falar' };
  var ROTULOS = {
    criar: 'Criar', dia: 'Meu dia', demandas: 'Demandas', chat: 'Chat', reuniao: 'Reunião', acervo: 'Acervo', inteligencia: 'Inteligência da equipe',
    terminais: 'Terminais ao vivo', tarefas: 'Tarefas com fluxo', metas: 'Metas', equipe: 'Equipe', mapa: 'Mapa da equipe', projetos: 'Projetos',
    whatsapp: 'WhatsApp', loja: 'Loja da equipe', oficina: 'Oficina do app',
    tv: 'Tela da TV', sino: 'Novidades', paleta: 'Paleta de comandos', fechar: 'Fechar', lateral: 'Painel lateral', mais: 'Mais', busca: 'Buscar',
    filtro: 'Filtrar', configuracoes: 'Configurações', perfil: 'Perfil', atualizar: 'Atualizar', token: 'Token de instalação',
    agente: 'Agente (a presença no mostrador)', presenca: 'Presença', 'ao-vivo': 'Ao vivo', terminal: 'Terminal', pausa: 'Pausar',
    'entrar-terminal': 'Entrar no terminal', devolver: 'Devolver ao agente', assumir: 'Assumir', chamar: 'Chamar', falar: 'Falar',
    'pedir-ajuda': 'Pedir ajuda', navegador: 'Navegador', 'raio-x': 'Raio-X', clonar: 'Clonar', print: 'Print da tela',
    projetar: 'Projetar na TV', 'levar-reuniao': 'Levar para a reunião', versoes: 'Versões', salvar: 'Salvar', desfazer: 'Desfazer',
    anexar: 'Anexar', audio: 'Áudio', foto: 'Foto',
    pontos: 'Pontos (com origem)', sequencia: 'Sequência', 'tarefa-livre': 'Tarefa livre', ideia: 'Ideia', aprendizado: 'Aprendizado',
    pasta: 'Pasta', arquivo: 'Arquivo', maquina: 'Máquina', quadro: 'Quadro', campanha: 'Campanha',
    gaveta: 'Gaveta · tabela', campo: 'Campo · coluna', fio: 'Fio · relação', chave: 'Chave · quem vê o quê', empresa: 'Empresa · cada uma vê só o seu',
    portaria: 'Portaria · login e papéis', porta: 'Porta · rota de API', robo: 'Robô · gatilho e agendamento', deposito: 'Depósito · arquivos',
    cofre: 'Cofre · segredos', tela: 'Tela · página', cano: 'Cano · tempo real', armario: 'Armário · schema', ferramenta: 'Ferramenta · extensão',
    carteiro: 'Carteiro · e-mail e SMS', 'casa-de-maquinas': 'Casa de Máquinas · infraestrutura',
    alerta: 'Alerta', sujo: 'Mudou e não testou', 'nao-publicado': 'Não publicado (tracejado)', fixado: 'Fixado', barrado: 'Barrado', preset: 'Preset'
  };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function real(nome) { return Object.prototype.hasOwnProperty.call(I, nome) ? nome : (APELIDOS[nome] && I[APELIDOS[nome]] ? APELIDOS[nome] : null); }

  /* svg(nome, tam, { rotulo, classe, traco }) → '<svg …>' ou '' quando o nome não existe (quem chama decide o que mostrar) */
  function svg(nome, tam, op) {
    var n = real(nome); if (!n) return '';
    op = op || {};
    var t = +tam || 20, rot = op.rotulo ? String(op.rotulo) : '';
    return '<svg class="bci bci-' + n + (op.classe ? ' ' + esc(op.classe) : '') + '" data-icone="' + n + '" viewBox="0 0 24 24" width="' + t + '" height="' + t +
      '" fill="none" stroke="currentColor" stroke-width="' + (op.traco || 1.5) + '" stroke-linecap="round" stroke-linejoin="round"' +
      (rot ? ' role="img" aria-label="' + esc(rot) + '"><title>' + esc(rot) + '</title>' : ' aria-hidden="true" focusable="false">') + I[n] + '</svg>';
  }
  /* qualquer elemento com data-icone="nome" (e data-tam, data-rotulo opcionais) ganha o desenho; o <svg> que já é ícone fica como está */
  function hidratar(raiz) {
    var r = raiz || document, n = 0;
    Array.prototype.forEach.call(r.querySelectorAll('[data-icone]:not(svg)'), function (el) {
      var s = svg(el.getAttribute('data-icone'), +el.getAttribute('data-tam') || 20, { rotulo: el.getAttribute('data-rotulo') || '' });
      if (s && el.getAttribute('data-icone-feito') !== el.getAttribute('data-icone')) { el.innerHTML = s; el.setAttribute('data-icone-feito', el.getAttribute('data-icone')); n++; }
    });
    return n;
  }
  function nomes(grupo) { return grupo ? (GRUPOS[grupo] || []).slice() : Object.keys(I); }
  function casca() { return [].concat(GRUPOS.atividades, GRUPOS.casca, GRUPOS.agentes, GRUPOS.acoes, GRUPOS.organismo, GRUPOS.tipos); }

  /* o objeto BC.icones é o próprio mapa nome → miolo; as funções ficam não enumeráveis (Object.keys só devolve ícones) */
  var API = {
    svg: svg, hidratar: hidratar, nomes: nomes, casca: casca,
    tem: function (nome) { return !!real(nome); },
    real: real,
    rotulo: function (nome) { var n = real(nome); return n ? ROTULOS[n] || n : ''; },
    grupos: GRUPOS, apelidos: APELIDOS, rotulos: ROTULOS,
    grade: { viewBox: 24, traco: 1.5, areaViva: [3, 21], margem: 2 }
  };
  var M = {};
  Object.keys(I).forEach(function (k) { M[k] = I[k]; });
  Object.keys(API).forEach(function (k) { Object.defineProperty(M, k, { value: API[k], enumerable: false }); });
  BC.icones = M;

  /* o sino do topo é HTML fixo (index.html): troca só o desenho, mantém o botão, o contador e os ouvintes */
  function topo() {
    var s = document.querySelector('#abrir-coluna > svg');
    if (s && !s.hasAttribute('data-icone')) s.outerHTML = svg('sino', 18);
    hidratar(document);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', topo); else topo();
})(window.BC);
