# PROMPT · construir o Babel Coop inteiro, agora

> Cole este prompt como primeira mensagem para o agente construtor (Claude Code, Codex ou outro), com o terminal aberto NESTA pasta (a raiz do repo `babel-coop`). Escrito pelo Theus em 23/09/2026.

Você vai construir o **Babel Coop**: o sistema da empresa com corpo, à vista de todos — o app de Estação (Electron, **Mac e Windows**) onde a equipe e seus agentes trabalham juntos, com TV sem botão, iPad, celular, WhatsApp, memória da sala e a Máquina (backend visual). O plano já está fechado; sua tarefa é materializar tudo.

## 1. Primeira ação: leia na ordem, antes de construir

1. `DEUS-CRIADOR/PROMPT.md` — o protocolo **DEUS — CRIADOR**. É o seu método de trabalho a partir daqui. Se o seu cliente aceitar skill/subagente, instale por `DEUS-CRIADOR/INSTALAR.md`; senão, trate como system prompt.
2. `IDEIAS.md` — o desenho inteiro do sistema (fase de projeto fechada, v0.4).
3. `CHECKLIST.md` — o que precisa existir; marque `[x]` só com teste real. É a sua régua de "pronto".
4. `UX.md` e `docs/FUNCOES.md` — telas e fluxos, linha por linha.
5. `docs/design/PLANO.md` — o plano de design (identidade, recursos, fases F0–F5) e `docs/design/CONCEITO.md`, `docs/design/GERACAO_REPLICATE.md`, `docs/design/REGUA_ORGANISMO.md`.
6. `prototipo/` — o protótipo v22 já faz 42/42 do roteiro (`docs/testes/roteiro.js`); reaproveite o que o `CHECKLIST.md` §"Do protótipo para o sistema real" manda.
7. `app/` — a base real já esboçada (Electron + servidor Node + token + diário de eventos + node-pty). Complete-a.

## 2. A regra de tempo (ordem do Theus)

**Não existe cronograma em dias ou semanas.** O plano antigo citava "dias 1–2", "semana 1"… — isso foi **removido**: as fases F0–F5 do `docs/design/PLANO.md` são a **ordem de construção**, não datas. Você constrói tudo **agora**, em sequência contínua, até o `CHECKLIST.md` fechar. "Pronto quando" é critério observável (a evidência anotada no checklist), nunca prazo. Não proponha "para a próxima semana", não espere "vai" entre fases: continue enquanto houver item aberto, ação autorizada e recursos — é o protocolo DEUS mandando.

## 3. Materiais gerados por IA: a API da Replicate

Quando precisar gerar materiais (ícones, keyframes, vídeos, peças 3D, som), use a **Replicate** pelo manual pronto: `docs/design/GERACAO_REPLICATE.md` (modelos confirmados, prompts prontos, orçamento US$ 20 com parada em 16, regra de baixar em ≤ 1 h, `MANIFESTO.json`).

- O token está em `~/.config/babel/replicate.env` (variável `REPLICATE_API_TOKEN`). Carregue com `source ~/.config/babel/replicate.env` antes de chamar a API; o script `gera_svg.sh` (§5 do manual) já faz isso.
- **O token nunca entra em arquivo do repo, commit, log ou manifesto.** Se ele vazar no chat, o Theus troca.

## 4. Como trabalhar

- Pasta exclusiva da missão conforme o protocolo DEUS (`MISSAO.md`, `CAPSULA.json`, `RODADAS.md`, `ENTREGA.md`), dentro do repo, sem sujar as pastas de leitura.
- Requisito duro: **Mac E Windows** ao mesmo tempo (instalador .dmg e .exe, node-pty compilado nos dois — teste o Windows antes de tudo, `CHECKLIST.md` §0).
- Commits no repo conforme for fechando itens do checklist; **não faça push** sem ordem do Theus (o repo é privado).
- Fale português do Brasil, direto e curto. Não invente: número com fonte, teste com evidência; o que não foi medido é "sem dado".

## 5. O que demonstrará a conclusão

O `CHECKLIST.md` inteiro `[x]` com evidência por item, o app instalado e rodando em uma máquina Mac e uma Windows na rede local (token de entrada, terminais reais, TV, celular), e o `ENTREGA.md` com a tabela de aceites e os comandos de reprodução.
