# Plano V4 conferido · 26/09/2026 00:24

Theus pediu uma revisão final focada: confrontar a estação anterior no estilo VS Code, V1, V2 e o estado atual; corrigir o plano para preservar telas, 3D e potência com melhor gestão do espaço; abrir a V4. [[Dominic]] executou sozinho, conforme o pedido integral desta análise.

## Resultado

- `docs/ux-potencia/PLANO-V4.md`: comparativo, gestão de abas/painéis, destinos completos, 3D, terminal/métricas, laboratório humano + IA×IA, pastas opcionais e ordem de produção.
- `CHECK-V4.md`: 83 requisitos documentais com destino e limite. Não marca implementação como concluída.
- `PLANO-V4-VISUAL.html`, `maquete-v4.css`, `maquete-v4.js`: 30 vistas; casca de estação, terminal direito, abas fecháveis/recolhíveis, contexto/terminal redimensionáveis, foco restaurável, pedido/abas/layout persistidos; destinos de Equipe/Metas/Loja/Oficina/Perfil/Ajustes/Uso/Parede recuperados.
- Cena Three.js local: orbitar, zoom, pan, selecionar, mover peça, editar XYZ e lista equivalente. Renderização sob demanda e liberação de recursos ao sair. Dados e corpos da cena são ilustrativos; backend não é executado.
- `apresentar-v4.mjs`: apresentação no loopback `http://127.0.0.1:4790/PLANO-V4-VISUAL.html`; README aponta V4 como versão atual.

## Evidência

A interface atual do app em `127.0.0.1:4711` foi aberta por Playwright/Chrome e observada em captura 1440×900. A casca e módulos foram lidos no código. Fonte de WhatsApp explicita ausência de pareamento real; corpo 3D calcula posições em grade e repõe câmera; bancada integrada do laboratório não foi encontrada nas integrações consultadas.

`verificar-v4.mjs` passou: 60 carregamentos (30 vistas × 1440/1223 px), sem erro JS ou overflow de página/área central; oito grupos de interação verificaram retomada, recolhimento, foco, fechamento de aba, resize por teclado, comando para laboratório, 3D/lista/XYZ e Tech/Vibe. Capturas `V4-estacao.png`, `V4-maquina.png`, `V4-laboratorio.png` e resultado `VERIFICACAO-V4.json` em docs/ux-potencia. Revisão visual encontrou quebra de linha no retorno do terminal e aba ativa fora da faixa visível; corrigidos, capturas refeitas e conferência repetida com sucesso. Checagem de sintaxe passou.

## Limites

Somente plano/apresentação/documentação foram alterados. Nenhum build, instalação, migração, envio externo ou execução de agente foi feito. Os testes verificam a maquete; não comprovam laboratório real, WhatsApp, cooperação entre computadores, iPad/Pencil, autorização integral, pacote ou recuperação. Esses pontos estão no gate de produção da V4. Pesquisa Vyra/Gemma e 30 pets não viraram bloqueios ocultos para a estação.
