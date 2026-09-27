# Rodadas · babel-coop/maquina-jogo

Modalidade: **somente prompt** (sem hooks). A cápsula é lida antes de cada ação e regravada depois de cada resultado.

- 2026-09-25 04:22 · missão aberta. PGlite 0.5.8 provado no scratchpad: Postgres 17 em WASM abre em 0,9 s, SQL em 9 ms, catálogo com tabelas, colunas, FK, políticas (pg_policies) e gatilhos; insert e count funcionam. Próximo: workflow de construção (banco.js + conector + ponte na tela + efeitos 3D) com revisão adversarial.
- 2026-09-25 04:24 · workflow maquina-banco-real disparado: construir (servidor banco.js+PGlite · ponte coop_banco_*→peças · efeitos 3D) → integrar (e2e banco-real) → 2 revisores adversariais → corrigir. Contrato fixo no script (REST /api/banco/*, ids bd-t-/bd-g-/bd-f-, BC.maquinaEfeitos.tocar).
- 2026-09-25 06:23 · workflow maquina-banco-real concluído: PGlite 0.5.8 por projeto num worker_thread (limite 30 s por operação), migrações em arquivo, diff de catálogo, coop_banco_sql/consulta/estado, peças banco:true com corpo e selo 'no banco local', efeitos 3D (nascer/fio/cadeado/dados/erro) em fila. Revisores: 13 problemas reais, todos corrigidos com teste. Prova: banco.test 28/28, servidor 138/139 (1 pulado), banco-real+maquina-real+coop-ui 18/18, roteiro 109/109; migração de 35 efeitos 9,9 s; prints scratchpad/evid/banco-*.png. Falta: Vibe da Máquina, empacotar, instalar e mostrar ao Theus.
- 2026-09-25 07:01 · maquina-vibe concluído: 2D e 3D no Vibe (papel, alumínio claro, fios roxos, efeitos legíveis), troca ao vivo sem recriar cena; Tech conferido material a material (maquina-vibe 5/5, maquina-real+banco-real 12/12).
- 2026-09-25 07:19 · instalado no Mac do Theus com a parte 1 (e o Vibe).
