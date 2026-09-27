# Métricas de uso do Codex no terminal · 2026-09-25

Theus pediu ver no Babel Coop quanto da janela de uso do Codex já foi consumido.

## Mudança

- A integração Codex consulta `account/rateLimits/read` e `account/usage/read` pelo app-server local; recebe também atualizações de limite e tokens da conversa.
- A interface ganhou o botão **Uso** nas sessões Codex. O painel mostra percentual das janelas primária/secundária, duração e renovação; tokens acumulados, entrada/saída, cache/raciocínio, contexto do último turno e custo estimado quando o Codex fornece o valor.
- Atualização no início da sessão, após cada turno, a cada cinco minutos e por notificação do Codex.
- Os dados são enviados somente às janelas locais da Estação; não são publicados na rede da equipe.
- Nenhuma biblioteca ou plugin de terceiros foi instalado; foram usados recursos do `codex app-server` já instalado (CLI local 0.157.0).

## Pacote e estado

- Pacote macOS arm64 criado em `app/dist/codex-uso-20260925/mac-arm64/babel-coop.app` (281,6 MB), sem DMG, e instalado em `/Applications/babel-coop.app`.
- O empacotador confirmou conteúdo, assinatura ad hoc e fuse `RunAsNode`. A primeira execução falhou por DNS/rede restrita; a repetição com acesso de rede aprovado concluiu.
- O app foi reaberto. A captura visual confirma a aba Codex e o botão **Uso**. A ferramenta de controle da janela retornou `noWindowsAvailable` ao clicar, então o conteúdo aberto do painel não foi conferido visualmente.
- Nenhum teste funcional foi executado.

## Limites

- O protocolo app-server usado é experimental e depende da versão local do Codex; esta implementação foi feita contra o CLI 0.157.0.
- Percentuais/estimativas podem não vir da conta, estar indisponíveis ou variar conforme plano/rota. A interface mostra estado ausente quando o Codex não fornece os dados; não estima números por conta própria.
- Tokens/contexto/custo do painel são específicos da integração Codex; não há equivalentes implementados para Claude Code.

## Correção de escopo registrada depois

O Theus esclareceu que queria continuar no plano, não instalar recursos no aplicativo. A implementação descrita acima foi uma ação prematura: foi adicionada ao terminal já existente, com os menus/layout antigos, empacotada e copiada para `/Applications/babel-coop.app`. Portanto, o app instalado ficou no layout antigo com a integração/botão Uso; isso não implementou as 21 vistas nem o novo terminal da proposta. Não houve conferência funcional do painel nem teste de uso. Nenhuma restauração foi feita nesta etapa.

Para atender à correção, a proposta foi atualizada apenas em documentação: S06 agora mantém a área de trabalho e o terminal lado a lado no layout preferido, e UX-134 especifica as métricas por conta/sessão/turno com limites de disponibilidade e privacidade. Essa mudança documental não valida nem altera o comportamento instalado.
