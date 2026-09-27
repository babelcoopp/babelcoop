# Auditoria: os planos do Theus contra o código do babel-coop (24/09/2026)

Três subagentes (só leitura) leram inteiros IDEIAS.md, PROMPT-CONSTRUIR.md, docs/CHECK_DO_THEUS.md, memoria/origem/pedido-original.md, a MISSAO/PEDIDOS-W2/FALTAS da missão terminal-ao-vivo, CHECKLIST.md, UX.md, docs/UX_PENEIRA.md, docs/FUNCOES.md, docs/ESTUDO_DESIGN_2030.md, docs/MAQUINA.md e docs/design/*. Prova = código em app/ e prototipo/, não o CHECKLIST. O Ryan conferiu pessoalmente os itens 1 e 8.

## Faltas, por ênfase do Theus
1. **Segurança (CHECKLIST:40, :277):** a mensagem WS `fazer` de um aparelho remoto (celular/iPad na rede) grava qualquer ação no diário assinada pelo dono da Estação (app/servidor/servidor.js, antes do `if (!ehLocal) return`); o diário não confere o autor; `/api/app/publicar` não confere gestão. Conferido pelo Ryan.
2. **Instalar em outras pessoas, Mac e Windows (PROMPT-CONSTRUIR:31, MISSAO:64):** .exe nunca gerado (CI depende do push); .dmg só com assinatura ad hoc (outro Mac barra até ter Developer ID).
3. **Máquina é maquete (MAQUINA.md:3, PLANO.md:78/118, CHECKLIST:235):** sem Supabase, sem leitura do repositório; Testar é animação; Publicar só marca publicada no estado. Textos que prometem o que não acontece: "Onde fica guardado" fixo, "ver SQL" falso, "Aplica as migrações no banco", "O agente escreve a política". Sem montar arrastando.
4. **WhatsApp real com o agente (IDEIAS:127-134, CHECK:33-35):** só QR simulado; sem ferramenta `whatsapp` no MCP.
5. **Memória da sala (IDEIAS:527-545, CHECKLIST:186-196):** nenhum microfone/transcrição.
6. **Bancada/Construtor de telas "tipo Lovable" (IDEIAS:363-366, TELA_CONSTRUTOR:3):** só reordena e edita texto; faltam alças, margem/padding, snap, arquivo:linha, régua de versões, "Ver por pessoa", projetar ao vivo, "Pedir ao agente" com contexto.
7. **Arquivos (CHECKLIST:51-56, IDEIAS:196/207):** gestão não edita arquivo de outro; versões do disco não aparecem; sem "Conflito"; foto de quem salvou é sempre o dono.
8. **Rápidos:** luz de projeção da TV é ciano e o Theus pediu roxa (CHECKLIST:177, conferido); demonstrações que ficaram no app ("+1 cliente (demonstração)", "Já escaneei (simulado)", "Sonhar agora (demonstração)", "Tema roxo (grafo v5)"); "Babel Coop" com maiúscula em textos; agente sem foto e sem botão "parar"; cartão âmbar >10 min na parede; logo PNG→SVG.
9. **Depois:** Yjs (editar junto), voz WebRTC, iPad PWA/HTTPS gravando .quadro, bandeja/abrir com o computador, sonho agendado, PIN, notificações no celular, Loja instalando de verdade (Keychain), atualização automática, três tamanhos de letra na TV, PDF e embeddings no acervo.

## Conflitos para o Theus decidir
- "Nada é gravado nesta fase" (IDEIAS:657) × acervo guarda a saída final do agente em terminal.jsonl.
- Botão Neon do terminal: PENEIRA:48 manda tirar, CHECKLIST:28 pede liga/desliga.
- Degradê no texto do terminal (CHECKLIST:28) × ESTUDO_DESIGN_2030:152 (degradê fora do texto).

## O que está feito (código)
Terminal real e claude dentro; parede ao vivo com controle e pausa; navegador próprio (Assumir, Raio-X, clonar, copy, print); conector coop (TV, demanda, campanha, acervo, Máquina); acervo sem LLM (FTS5 + vetores de trigrama) e APRENDIZADOS.md; token; Oficina com sha256; cronômetro destacável; app limpo; 12 atividades; foto brilhando; Site|Código|3D; 16 corpos 3D da Máquina; .app instalado no Mac.
