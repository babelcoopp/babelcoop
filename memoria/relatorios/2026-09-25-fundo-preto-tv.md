# Fundo preto da logo e diagnóstico da TV

2026-09-25 · [[Dominic]]

Theus pediu remover toda borda, fundo preto e logo brilhante; relatou mudança indevida na transmissão da TV. Foi perguntado se, depois da abertura, a TV deve mostrar dados ao vivo ou permanecer na logo. Resposta pendente durante esta investigação; não alterar essa intenção por suposição.

## Evidências

- O fundo do vídeo não é preto: decodificação dos quadros em 0, 1 e 3 segundos mostrou bordas com máximo RGB respectivamente `(10,14,24)`, `(9,13,23)` e `(7,12,22)`. Essa diferença cria o retângulo contra a tela preta.
- O vídeo é quadrado, 960×960. Expandir com `cover` para janela larga aumenta/corta a logo; trocar só o tamanho ou usar máscara não corrige a diferença de fundo.
- CSS alterado para `contrast(1.25)` após `brightness` na abertura: valores até 25,5 são levados a preto. Removida máscara radial; vídeo centralizado/proporcional, bordas/outline/sombra zerados. Mantém escuro→cor.
- Inspeção da janela real: botão Tela da TV abriu `localhost:4711/#tv`; após a abertura apareceu o painel com mapa da sala, demandas, agentes, metas e estado conectado. Não reproduzido bloqueio permanente na logo nesta abertura.
- `system_profiler SPDisplaysDataType` reconheceu somente o LCD interno do Mac, sem TV externa conectada. O código atual já manda a janela para outra tela e coloca em tela cheia quando há outra tela detectada. Não há prova de AirPlay/HDMI físico nesta inspeção.

## Limites

Nenhuma suíte de testes nova foi executada. Diagnóstico de UI e metadados é evidência da abertura observada, não garantia de transmissão física nem resposta à escolha visual pendente.

- 2026-09-25 · [[Dominic]] · captura 14.29.17 do Theus confirmou retângulo azul-escuro no vídeo. CSS contrast(1.25) equaliza fundo preto no app/TV e remove máscara. Build26,4s com assinatura ad hoc conferida; pacote padrão atualizado após fechar app; app reaberto. Abertura da TV observada com logo surgindo sobre preto sem retângulo. macOS só detectou LCD interno; tela estendida física não avaliada.

- 2026-09-25 · Theus mandou parar ajustes e restaurar TV anterior. Fotos localizadas em .deus/terminal-ao-vivo/evidencias/tv/ (depois-abertura-b.png e depois-tv-painel-1920.png). Abertura/estilos/controles recentes da TV revertidos a HEAD; chamada de abertura da Estação removida. Preservadas correções funcionais de projeção e outros módulos.

Restauração empacotada em 26,7s; assinatura ad hoc conferida. Aplicativo encerrado normalmente pelo menu; app/DMG/manifesto padrão substituídos. App deixado fechado, sem novas intervenções.
