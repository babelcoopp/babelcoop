# Referências usadas e aplicação ao Babel

Consultadas em 25/09/2026. Sínteses próprias; não são transcrições. As escolhas de produto abaixo são propostas de [[Dominic]] para o pedido do Theus.

| Fonte primária | O que sustenta | Aplicação proposta, inferida para Babel |
|---|---|---|
| [Nielsen Norman Group — Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) | Dar prioridade às opções centrais e manter acesso reconhecível às avançadas reduz complexidade inicial | Cinco destinos globais; ferramentas avançadas continuam encontráveis por menu, seleção e busca. Nenhum recurso depende exclusivamente de adivinhar um prompt |
| [Nielsen Norman Group — Onboarding Tutorials vs. Contextual Help](https://www.nngroup.com/articles/onboarding-tutorials/) | Instruções fora da tarefa são esquecidas; ajuda contextual deve ser dispensável e recuperável | Retirar os parágrafos fixos; ensinar no arquivo, peça ou tarefa que a pessoa está usando; Aprender reúne a trilha completa |
| [VS Code — User Interface](https://code.visualstudio.com/docs/editing/getting-started/userinterface) | Editores, grupos, painéis e modos de foco adaptam o espaço à atividade | Artefato como centro; painéis recolhíveis; modo de construção integral e restauração do arranjo anterior |
| [VS Code — Basic Editing / overview](https://code.visualstudio.com/docs/editing/getting-started/overview) | Workspace e continuidade são conceitos centrais de um ambiente de edição | Projeto lembra o posto de trabalho por pessoa. É uma inspiração de experiência, não uma afirmação de paridade atual do Babel |
| [Microsoft — Live Share security](https://learn.microsoft.com/en-us/visualstudio/liveshare/reference/security) | Compartilhar um terminal para leitura e dar controle são capacidades distintas | Botões Ver, Pedir controle e Devolver; sempre mostrar quem controla e em qual projeto |
| [MindMeister — Keyboard Shortcuts](https://support.mindmeister.com/hc/en-us/articles/360017398960-Use-Keyboard-Shortcuts) | Navegação, edição hierárquica, zoom, enquadramento e foco podem ser operados pelo teclado | Critérios de fluidez para MindForge: filho/irmão, mover, editar, localizar e enquadrar sem interromper o raciocínio |
| [MindMeister — Present your Mind Map](https://support.mindmeister.com/hc/en-us/articles/8617599921170-Present-your-Mind-Map) | Agrupar tópicos em cenas permite apresentar mantendo o mapa como conteúdo | Roteiro de apresentação salvo como vistas do mapa; reaproveitado no palco da reunião |
| [Apple HIG — Feedback](https://developer.apple.com/design/human-interface-guidelines/feedback) | Feedback próximo da ação e combinação de modalidades ajudam a perceber resultado e progresso | Encaixe de peça, passagem de tarefa e entrega têm assinatura visual e sonora; estados continuam compreensíveis sem som |
| [Apple — Turn a website into an app in Safari on iPad](https://support.apple.com/en-bw/guide/ipad/ipad8f1f7a29/ipados) | O iPad permite adicionar um site como app à tela inicial | Primeira rota proposta para Babel Quadro: app web instalável no iPad. A fonte não prova Pencil, funcionamento offline nem compatibilidade da atual rota Babel; estes têm tarefas próprias |
| [WhatsApp — How to get started on WhatsApp Web](https://faq.whatsapp.com/497209988909970/?cms_platform=web) | A orientação oficial de início vincula o dispositivo ao WhatsApp | O QR deve ser fornecido pela sessão real do serviço. O conteúdo completo desta FAQ não foi extraído pelo navegador de pesquisa; usa-se apenas a orientação encontrada na busca, sem inferir suporte ao Electron |

## Princípios resultantes

Fontes adicionais do complemento:

| Fonte primária | O que sustenta | Aplicação proposta |
|---|---|---|
| [Replicate — catálogo 3D](https://replicate.com/collections/3d-models) | Modelos de texto/imagem/múltiplas vistas para geometria e materiais | Conferir gerador/schema/licença por lote; malha passa por preparação e animação antes de virar pet |
| [Replicate — arquivos de saída](https://replicate.com/docs/topics/predictions/output-files) | Saídas geradas pela API têm retenção temporária | Download imediato, hash, manifesto e armazenamento local dos assets |
| [Khronos — glTF 2.0](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html) | Especificação do formato de assets 3D usado pelo catálogo | Usar contrato verificável de modelo/material/animação; inspecionar os arquivos, sem presumir rig gerado |
| [OpenCode — servidor](https://opencode.ai/docs/server/) e [SDK](https://opencode.ai/docs/sdk/) | Interfaces para sessões e controle programático do agente | Adaptador Babel por versão instalada, com a mesma experiência de contexto e evidência |

### Síntese

Fontes dos complementos finais:

| Fonte primária | Aplicação e limite |
|---|---|
| [Replicate — Recraft V4 SVG](https://replicate.com/recraft-ai/recraft-v4-svg/readme) | Explorar ponteiros/ícones vetoriais; interação, hotspot e qualidade de uso exigem implementação e conferência |
| [Gemma — ajuste de modelos](https://ai.google.dev/gemma/docs/tune) | Dados, mudança de pesos e avaliação reservada; LoRA normalmente conserva dependência da base |
| [Gemma 4 — licença](https://ai.google.dev/gemma/apache_2) e [escopo dos termos](https://ai.google.dev/gemma/terms) | Registrar licença e linhagem do artefato exato; não aplicar indistintamente termos de outra geração |
| [Node — SQLite](https://nodejs.org/download/release/v25.1.0/docs/api/sqlite.html) e [SQLite — FTS5](https://www.sqlite.org/fts5.html) | Caminho local de busca/registro sem Python; compatibilidade do Node embarcado e custo em worker ainda serão medidos |
| [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/) e [WebGPU](https://onnxruntime.ai/docs/tutorials/web/ep-webgpu.html) | Alternativa JS/WASM/GPU para modelos compatíveis; nenhuma conversão de Gemma ou ganho no Babel foi demonstrado |

Fontes locais recebidas: template/retrato HTML e gerador em `/Users/matheussilveirapro/Downloads/criador`; perfil em `/Users/matheussilveirapro/Desktop/Dominic/teste/criador/gemma-vyra`. O artifact Claude online não foi acessível pela ferramenta de pesquisa; não foi usado como conteúdo lido. Pesquisa histórica de backend em `docs/design/SUPABASE_PECAS.md`; nenhuma consulta ao Supabase de produção foi feita nesta missão.

Princípios aplicados:

1. Mostrar onde a pessoa está, com quem está e qual resultado está construindo.
2. Disponibilizar potência por contexto, com entradas visíveis e busca universal.
3. Proteger a continuidade: contexto, rascunhos, histórico, câmera e próxima ação.
4. Dar identidade sensorial ao trabalho verdadeiro: construir, conectar, colaborar e concluir.
5. Ensinar junto da ação e preservar a autonomia de quem já sabe.

As proporções, nomes de telas, tempos de animação e arquitetura descritos no plano são hipóteses de design específicas deste produto. Devem ser avaliados nos cenários do TODO; não são números de desempenho já medidos.
