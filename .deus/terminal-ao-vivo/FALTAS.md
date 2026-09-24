# FALTAS — babel-coop/terminal-ao-vivo

Consolidado em 23/09/2026 a partir de evidencias/auditoria/* (9 auditores: conceito, plano, painel, theus, terminal-maquina, funcoes, visao, organismo, checklist). Agrupado por arquivo-fonte afetado.

## Grupo 1: Casca e presenca (interface/hud.js, interface/estacao.css, interface/presenca.js)

### F1.1 — Fotos dos avatares sem brilho
- **O que diz o plano:** Fotos das pessoas com luz/glow/borda colorida pulsando (PLANO §1.6, ordem do Theus 19:46 "foto da pessoa brilhando em volta, luz piscando nas laterais")
- **O que o auditor achou:**
  - `theus/dados.json`: avatarComFoto → `bs: none`, `anim: none`
  - `funcoes/coleta.json`: brilho.avatares → `boxShadow: none, anim: none, filter: none` em ambos
  - `funcoes/coleta2.json`: presencaAtiva.avatares → `shadow=none | anim=none`
  - `painel/dados.json`: fotos → `sh: none, anim: none, filt: none`
  - `conceito/rel-c.json`: medidas.foto → `bl: 2px rgba(0, 0, 0, 0)` (sem borda brilhante)
  - `conceito/rel-b.json`: anel → 3 (presenca), halo → 3, sombraColorida → só 4/9
- **Aceites da MISSAO afetados:** A14 (casca 2030), A15 (presenca), Theus literal "AINDA TÁ FALTANDO"
- **Falta:** borda brilhante (glow box-shadow + border-color animado) nos avatares da barra de atividades, perfil, parede e presenca; luz piscando nas laterais da foto quando há evento

### F1.2 — 13 itens na barra lateral, plano manda 12
- **O que diz o plano:** CONCEITO §3.1 — 12 atividades nesta ordem: Meu dia · Criar · Trabalho (Demandas + Tarefas) · Chat · WhatsApp · Reunião · Terminais · Projetos · Acervo (+ Inteligência) · Equipe (+ Metas + Mapa) · Loja · Oficina; foto 22 px no pé abre o Perfil
- **O que o auditor achou:**
  - `conceito/rel-b.json`: rotulosBarra → ["Meu dia","Criar","Trabalho","Chat","WhatsApp","Reunião","Terminais","Projetos","Acervo","Equipe","Loja","Oficina","TH"] (13 itens)
  - Todas as coletas (painel, funcoes, plano, theus) confirmam 13 rótulos com "TH" solto no lugar da foto 22px
- **Aceites da MISSAO afetados:** A30
- **Falta:** Trocar o 13o item "TH" pela foto de 22 px que abre Perfil; agrupar Demandas+Tarefas sob "Trabalho" e Acervo+Inteligência sob "Acervo" com alternador na lateral

## Grupo 2: TV (interface/tv.js, interface/tv.css)

### F2.1 — "NaN:NaN:NaN" e "NaN%" quando sem campanha
- **O que o auditor achou:**
  - `funcoes/coleta.json`: tv → "SEM CAMPANHA · FALTAM NaN:NaN:NaN" e "NaN% · meta batida"
  - `funcoes/coleta2.json`: tv → mesmo NaN
  - `painel/dados.json`: tv → mesmo
  - `painel/dados2.json`: tv → mesmo
  - `painel/dados3.json`: tv → mesmo
  - `terminal-maquina/resultado-tudo.json`: tv → mesmo
  - `plano/log-1.json`: tv → mesmo
- **Falta:** Quando não há campanha ativa, não mostrar contador regressivo (retirar "FALTAM NaN:NaN:NaN") e não mostrar "NaN%" nem "meta batida" com 0 metas

### F2.2 — Rodapé da TV mostra "prototipo com dados de exemplo"
- **O que o auditor achou:**
  - Toda saída de TV tem: "prototipo com dados de exemplo · atualizado às XX:XX"
  - E "demonstração: sem Estação aberta, a própria TV simula a equipe"
- **Aceites da MISSAO afetados:** A27 (app limpo, sem mockup)
- **Falta:** Remover o rodapé de demonstração no app real; no lugar, mostrar a barra fixa com "online · N na caixa · ◌ memória da sala · N pontos · TV · terminal ao vivo"

### F2.3 — Chão vivo da TV parado
- **O que o auditor achou:** `plano/log-6.json`: tvChao → `paused: true, vis: "0/block"`
- **Aceites da MISSAO afetados:** A14 (casca 2030), PLANO §R4
- **Falta:** O `<video>` do chão vivo (`chao-vivo.mp4`) não está tocando; deve tocar em loop quando a TV está aberta e a sala tem pessoas

### F2.4 — Campanha e metas com dados de exemplo
- **O que o auditor achou:**
  - `plano/log-3x.json`: TV mostra "Clínicas em Campinas · 12 peças com corpo · v6 · carla", equipe de 11 pessoas, "38/50 76% novos clientes"
  - `plano/log-1.json`: TV mostra "CORPO DO PROJETO CLÍNICAS EM CAMPINAS 12 peças com corpo"
  - `funcoes/coleta.json`: metas → "+1 cliente (demonstração)"
- **Aceites da MISSAO afetados:** A27
- **Falta:** Remover dados de exemplo da TV; o corpo do projeto e campanhas devem refletir o estado real da equipe

## Grupo 3: Máquina (interface/maquina.js, interface/maquina.css)

### F3.1 — Dados de exemplo "Clínicas (exemplo)" com timeline mockup
- **O que o auditor achou:**
  - `painel/dados.json`: vistas.maquina → "Máquina · Clínicas (exemplo)", 13 peças, 2 alertas, timeline com "Bruno-bot", "Dev", "Rita"
  - `painel/dados2.json`: maquina → mesmo padrão com exemplo
  - `terminal-maquina/resultado-tudo.json`: maquina → "Clínicas (exemplo)" com todos os dados demo
  - `plano/log-3m.json`: maqTexto → mesmo
  - `plano/log-3x.json`: maqTexto → "Clínicas em Campinas" com 11 pessoas e 34 arquivos simulados
- **Aceites da MISSAO afetados:** A27 (app limpo), A28 (backend 3D real com Supabase)
- **Falta:** Limpar dados de exemplo da Máquina; deixar só o template vazio ou a primeira Máquina real do Theus ligada ao Supabase

### F3.2 — Visual 3D da Máquina inteira não renderiza
- **O que o auditor achou:** `terminal-maquina/resultado-tudo.json`: mq3d → `camada: false, canvas: false, texto: null`
- **Aceites da MISSAO afetados:** A28
- **Falta:** O modo 3D da Máquina inteira não está renderizando (apesar do 3D individual de peça funcionar em `resultado-fase2.json`: camada: true, canvas: true)

### F3.3 — Peças sem corpo 3D no contexto da Máquina
- **O que o auditor achou:** `plano/log-3m.json`: b3d → null
- **Falta:** As peças não estão ganhando corpo 3D quando publicadas; o pipeline 3D funciona para a peça individual mas não integrado à Máquina

## Grupo 4: App limpo (main.js, interface/estacao.js, servidor/)

### F4.1 — Projetos com dados de exemplo
- **O que o auditor achou:**
  - `plano/log-3x.json`: arquivos → 34 arquivos de exemplo (ana/, bruno/, carla/, davila/, eva/, felipe/, gabi/, hugo/, iara/, joao/)
  - `plano/log-3x.json`: projetos → ["clinicas","site","onboarding"]
  - `terminal-maquina/resultado-tudo.json`: criar → "Clínicas (exemplo)" como projeto
  - `painel/dados2.json`: maquinaOutra → false (só um projeto exemplo)
- **Aceites da MISSAO afetados:** A27
- **Falta:** Remover todos os projetos e arquivos de exemplo; o app deve iniciar só com a conta do Theus e o README.md

### F4.2 — Percursos na TV com pessoas simuladas
- **O que o auditor achou:** `plano/log-3x.json`: tv → "SALAS VAZIAS Clínicas · Site novo · Onboarding | FORA DA SALA Ana · Bruno · Carla · Davi · Eva · Felipe · Gabi · Hugo · Iara · João"
- **Falta:** A TV não deve listar pessoas que não existem

## Grupo 5: Parede e terminal (interface/parede.js, interface/terminal.js)

### F5.1 — Avatares na parede sem brilho
- **O que o auditor achou:** `terminal-maquina/resultado-fase2.json`: paredeCartoes → avatares com `sombra: none`, sem borda glow
- **Aceites da MISSAO afetados:** A16 (parede no design 2030)
- **Falta:** Cartões da parede com avatar brilhando e borda glow da cor da pessoa

### F5.2 — Selo ao vivo sem indicador visual de organismo
- **O que o auditor achou:** `terminal-maquina/resultado-tudo.json`: visitante.selo → "carla está no seu terminal" visível mas sem efeitos de organismo (pulso/faíscas no selo)
- **Falta:** O selo "X está no seu terminal Y" deve ter pulso de luz e indicador de organismo (não texto fixo sem vida)

## Grupo 6: Áudio e som (interface/organismo.js)

### F6.1 — Som "espera" tocando quando ≤ 2 efeitos
- **O que checamos:** `painel/dados2.json`: maxVivos → 1~2 ✅ dentro do teto
- **OK.** Não é falta.

### F6.2 — Pulso sem alvo em algumas situações
- **O que o auditor achou:**
  - `conceito/rel-b.json`: organismo → pulso `ok: false, motivo: "sem-alvo"` em 24239 ms
  - `terminal-maquina/resultado-tudo.json`: orgFim → pulso `ok: false, motivo: "sem-alvo"` 2 vezes
- **Falta:** Pulso é disparado sem alvo (objeto no DOM) em alguns momentos; rastrear e corrigir o seletor de alvo

## Grupo 7: Paleta e comandos (interface/paleta.js)

### F7.1 — Paleta não mostra tema
- **O que o auditor achou:** `painel/dados3.json`: paleta → `temaNaPaleta: false`
- **Falta:** A paleta (Ctrl+K) não está mostrando atalhos de tema (Tema roxo / Tema azul)

## Grupo 8: Celular (interface/celular.css)

### F8.1 — Celular ok
- **O que o auditor achou:** `funcoes/coleta.json`: celular → 5 abas: "Meu dia Demandas Chat Criar Mais" ✅
- `checklist`: 50-celular.png capturado ✅
- **Não é falta.**

## Grupo 9: Organismo e placar (interface/organismo.js, interface/placar.js)

### F9.1 — Placar com origem ok
- **O que o auditor achou:** `terminal-maquina/resultado-fase2.json`: placar.depois → "13 pontos · hoje"
- `placar.api` → 17 métodos expostos ✅
- **Não é falta.**

### F9.2 — Teto de 2 efeitos vivos respeitado
- **O que o auditor achou:** `painel/dados2.json`: acerto.contagem.maxVivos → 2 ✅
- `conceito/rel-b.json`: organismo.maxVivos → 2 ✅
- **Não é falta.**

## Grupo 10: Navegador (navegador/)

### F10.1 — Navegador próprio ok
- **O que o auditor achou:** Coleta de screenshot no checklist 64-navegador.png, coletas de copy.md e ler.md ✅
- **Não é falta.**

## Grupo 11: Integração e CI

### F11.1 — CI Windows escrito mas não testado
- **O que consta:** `.github/workflows/terminal-pty.yml` escrito (RODADAS 17:20). Não testado em CI real.
- **Aceites da MISSAO afetados:** A0 (Windows), A29 (instalar outras pessoas)
- **Falta:** Rodar CI Windows e confirmar que passa; corrigir se falhar

## Grupo 12: Empacotamento e instalação

### F12.1 — DMG e EXE não gerados
- **O que consta:** `package.json` tem scripts `empacotar` e `dist:win`. Nunca executados no Mac real.
- **Aceites da MISSAO afetados:** A19 (abre nativo no Mac), A29 (instalar outras pessoas)
- **Falta:** Rodar `npm run empacotar` no Mac e gerar o .dmg; rodar `npm run dist:win` e confirmar o .exe pelo CI

### F12.2 — App não instalado em /Applications
- **Aceites da MISSAO afetados:** A19
- **Falta:** Instalar o .app gerado em /Applications e abrir como aplicativo nativo

## Resumo

| Grupo | Faltas | Prioridade |
|---|---|---|
| F1 — Casca e presença | 2 (fotos sem brilho, barra 13 itens) | Alta |
| F2 — TV | 4 (NaN, footer demo, chão parado, dados exemplo) | Alta |
| F3 — Máquina | 3 (dados exemplo, 3D quebrado, peças sem corpo) | Alta |
| F4 — App limpo | 2 (projetos/arquivos exemplo, pessoas simuladas) | Alta |
| F5 — Parede | 2 (avatares sem brilho, selo sem organismo) | Média |
| F6 — Som | 1 (pulso sem alvo) | Baixa |
| F7 — Paleta | 1 (tema na paleta) | Baixa |
| F11 — CI | 1 (CI Windows não testado) | Alta |
| F12 — Empacotamento | 2 (dmg/exe, instalar) | Alta |

Total: 18 faltas em 9 grupos

Para W7, atacar por grupos: F2+F4 (limpeza mockup) → F1+F5 (design 2030, brilho) → F3+F7 (máquina, paleta) → F6 (som) → F11+F12 (CI e empacotamento).