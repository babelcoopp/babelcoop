# Captura de ideias faladas na sala

> Pesquisa de 23/09/2026 para a seção 8.7 do `IDEIAS.md`. Caso: Mac principal, tudo local, 11 pessoas, memória de 5 a 10 minutos, botão e palavra de ativação.

## 1. Captura retroativa (memória curta + botão)

O padrão consolidado é "buffer circular + atalho": guarda os últimos N minutos em memória e um atalho salva o que já passou. É o modelo do Instant Replay da NVIDIA, do "Capture that" do Xbox e do Replay Buffer do OBS, adaptado de vídeo para áudio. Em DAWs o conceito se chama "retrospective recording".

- ReplaySorcery (Linux, código aberto): https://github.com/matanui159/ReplaySorcery
- Retrospective recording em DAWs: https://audioplugin.deals/blog/retrospective-recording/
- Limitless Pendant (ex-Rewind): grava o dia inteiro, ~100 h de bateria, com "Consent Mode" que bipa e pausa quando não há consentimento das pessoas ao redor. https://www.layer3labs.io/gear/reviews/limitless-pendant · https://techcrunch.com/2024/04/17/a16z-backed-rewind-pivots-to-build-ai-powered-pendant-to-record-your-conversations

Nenhum produto comercial documentado faz buffer de 5 a 10 minutos de fala em escritório sem gravar em disco. O desenho do Theus é incomum e alinhado com privacidade.

## 2. Gatilhos sem apertar botão

- **Palavra de ativação local**: openWakeWord é aberto, gratuito e treinável ("Babel, guarda isso"). https://github.com/dscripka/openWakeWord. O Porcupine (Picovoice) é comercial: palavra própria grátis só para uso não comercial; planos pagos a partir de US$ 6.000/ano. https://picovoice.ai/products/voice/wake-word/
- **Frase-gatilho na transcrição contínua**: como o whisper.cpp já transcreve os 5 minutos o tempo todo, dá para marcar automaticamente as frases com cara de ideia ("e se a gente", "que tal", "a gente podia") e sugerir na TV "parece que saiu uma ideia, salvar?". Não há produto pronto; é regex sobre o texto.
- **Risada e animação**: heurística caseira sobre o VAD (energia e tom subindo). Sem fonte específica.
- **Botão físico**: Stream Deck, botão BLE, atalho no celular, Apple Watch. Engenharia direta por webhook local.

## 3. Transcrição contínua local em pt-BR

- whisper.cpp tem o exemplo `stream` para microfone em tempo real (`--step 300`), com latência prática de 0,5 a 2 s conforme o modelo. https://github.com/ggml-org/whisper.cpp/blob/master/examples/stream/README.md
- Em Apple Silicon usa Metal e Accelerate; roda bem até num M2. https://neosophie.com/en/blog/20260218-local-whisper
- Comparativo whisper.cpp vs faster-whisper (2026): https://www.promptquorum.com/power-local-llm/local-whisper-stt-comparison-2026
- Usar VAD (Silero) para só transcrever quando há fala e poupar CPU no silêncio.
- Não há benchmark de pt-BR com várias vozes ao mesmo tempo. A mistura de vozes, não o idioma, é o risco a validar na prática.

## 4. Quem falou (diarização)

- WhisperX junta alinhamento por palavra (wav2vec2) com diarização do pyannote. https://github.com/m-bain/whisperX · https://scalastic.io/en/whisper-pyannote-ultimate-speech-transcription/
- Problema conhecido: o VAD do Whisper e o do pyannote desalinham os tempos; mitiga-se mascarando a saída do pyannote dentro dos limites do Whisper.
- Alternativa mais confiável em sala cheia: cada computador grava o próprio microfone e o sistema alinha pelo relógio. Cada trilha já é uma pessoa. Custa 11 captações, mas evita o erro da diarização acústica.

## 5. Microfone de sala para 11 pessoas

- Jabra Speak 750 e Anker PowerConf S330 são viva-voz USB de mesa, bons para mesas pequenas e médias. https://www.amazon.com/clp/B08CM1BCQB · https://www.amazon.com/clp/B09FJ7LWX4
- Para 11 pessoas, microfones de teto ou array (ex.: Shure MXA910) são mais indicados que viva-voz de mesa. https://www.nowmic.com/conference-microphone/
- Sem preço em R$ nas fontes. Cotar em revenda Shure, Jabra e Anker no Brasil. Ordem de grandeza: viva-voz de mesa de US$ 150 a 300; array de teto acima de US$ 2.000.

## 6. O que os outros fazem com a transcrição

- Granola roda no próprio Mac ou Windows, captura microfone e áudio do sistema sem bot, manda o áudio para transcrição na nuvem e não guarda o áudio. https://efficient.app/compare/granola-vs-otter
- Granola e Fathom só processam depois da reunião; nenhum ajuda ao vivo. https://zackproser.com/blog/best-ai-meeting-notes-2026
- tl;dv no plano grátis apaga gravações após 3 meses. https://www.umevo.ai/blogs/ume-all-posts/otter-vs-notta-vs-fireflies-vs-tl-dv-the-ultimate-2026-comparison-for-meeting-transcription
- Todos resumem com LLM. Sem LLM, o caminho é regex e palavras-chave sobre o texto bruto, sem produto de mercado documentado.

## 7. LGPD e privacidade no Brasil

- Gravar áudio de funcionários exige finalidade legítima, transparência (aviso claro, nada escondido) e, em regra, consentimento. Gravação oculta é proibida, e áreas de descanso não podem ser monitoradas. https://ambitojuridico.com.br/a-empresa-pode-gravar-audio-dos-funcionarios/ · https://lgpdsolucoes.com.br/blog/lgpd-monitoramento-funcionarios/ · https://molinatomaz.com.br/2025/09/16/monitoramento-por-cameras-lgpd/
- Falta de aviso prévio expõe a empresa a dano moral e sanção. https://www.migalhas.com.br/depeso/365775/uso-de-cameras-para-monitoramento-do-ambiente-de-trabalho-e-a-lgpd
- Práticas equivalentes às de câmeras: indicador visível de "ouvindo", botão de pausa ao alcance de todos, apagar o áudio bruto assim que virar texto.

## Recomendação para a Babel

1. Microfone de sala tipo array (cotar Shure MXA910 ou equivalente de gama de sala; os viva-voz de mesa não cobrem 11 pessoas).
2. Buffer circular em memória no Mac, com whisper.cpp `stream` e VAD Silero, transcrevendo sempre os últimos 5 minutos. Latência de 1 a 2 s é aceitável para salvar retroativamente.
3. Dois gatilhos: botão físico (Stream Deck ou BLE, zero falso positivo) como principal, e a palavra "Babel, guarda isso" com openWakeWord como reforço. Mais a sugestão automática na TV quando aparece frase com cara de ideia.
4. Primeira versão sem saber quem falou. Se isso for importante, cada computador grava o próprio microfone e o sistema alinha pelo relógio.
5. Áudio apagado assim que vira texto; luz "● sala com memória de 5 min" na TV; botão de pausa em todo lugar; combinado escrito com a equipe antes de ligar.

Pontos com achado parcial, a validar na prática: preço de microfone no Brasil, diarização vs vários microfones, detecção de risada e frase-gatilho.
