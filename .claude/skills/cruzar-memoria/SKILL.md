---
name: cruzar-memoria
description: Cruza toda a memória do Ryan para responder uma pergunta que depende de muitas memórias, decisões, projetos e missões ao mesmo tempo, com evidências e ids. Mais caro que /consultar.
argument-hint: "<pergunta>"
disable-model-invocation: true
---
Pergunta: $ARGUMENTS

Se o cabeçalho do índice diz `⏸ PAUSADO`, responda que a memória está pausada e pare.

O Theus pediu uma orquestração. Rode a ferramenta Workflow com um script escrito na hora (inline, nunca gravado em arquivo), nesta receita:

1. **Fatiar:** liste com Glob os arquivos de `memoria/` e `.deus/*/` e agrupe em até 6 fatias por pasta ou tema (perfil e preferências · decisões · projetos · conhecimento · diário e relatórios · missões).
2. **Ler:** um agente por fatia, em pipeline, só leitura. Cada um lê seus arquivos com Read e devolve as evidências que respondem ou contradizem a pergunta, com id e citação curta.
3. **Sintetizar:** um agente cruza decisões, projetos e histórico, aponta contradições e o que está superado, cita ids entre crases e fecha com o próximo passo.

Os agentes do workflow não gravam em `memoria/`. Com o resultado, você responde ao Theus (`🧠 Lembrei:`) e, se o cruzamento revelou algo novo, grava um `learning` ("Cruzamento: <pergunta>") pelo contrato e, se valer, o relatório em `memoria/relatorios/`.

Sem a ferramenta Workflow: faça o mesmo com o Agent, uma chamada por fatia, em paralelo.
