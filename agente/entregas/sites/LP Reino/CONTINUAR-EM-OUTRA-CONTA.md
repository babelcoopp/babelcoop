# Como continuar o Reino em outra conta do Claude

> Guia escrito em 22/09/2026, no fim da primeira sessão (feita na conta do Diego, diego.amecapao@gmail.com).
> Para: Marcelo Rocha, quando criar a conta dele.

## A boa notícia
**Nada se perde.** Tudo o que construímos está no seu Mac, não na conta do Claude:

| O quê | Onde |
|---|---|
| A LP (código-fonte) | `~/reino/lp/` |
| A LP em arquivo único | `~/Desktop/LP Reino/networkreino.html` |
| Base de conhecimento do Reino | `~/reino/conhecimento/` (e cópias nesta pasta) |
| Instruções permanentes do projeto | `~/reino/CLAUDE.md` |
| Agente e skills | `~/reino/.claude/` |
| Ferramentas (fatiar vídeo, empacotar, testes) | `~/reino/tools/` |
| Esta conversa inteira | `~/Desktop/LP Reino/transcricao-completa.md` |
| Resumo da conversa | `~/Desktop/LP Reino/conversa-reino.md` |

A conta do Claude só dá acesso ao modelo. Os arquivos são seus e ficam no computador.

## Passo a passo na conta nova
1. **Crie a conta** em claude.ai com o seu e-mail e assine um plano que inclua o Claude Code.
2. **Troque a conta no terminal:** abra o Terminal e rode
   ```bash
   claude
   /login
   ```
   Ele desloga a conta atual e abre o navegador para entrar com a nova.
3. **Abra o projeto:**
   ```bash
   cd ~/reino && claude
   ```
   O Claude lê o `CLAUDE.md` sozinho e já sabe as regras do projeto.
4. **Cole esta primeira mensagem:**

   > Leia `CLAUDE.md` e `conhecimento/reino.md` para entender o Reino. A LP está em `lp/` e já publicada em https://networkreino.netlify.app. Leia também `~/Desktop/LP Reino/conversa-reino.md` para saber o que já foi decidido. Depois me diga o que está pendente.

5. **Se quiser recuperar detalhes de alguma decisão**, peça:
   > Leia `~/Desktop/LP Reino/transcricao-completa.md` e me resuma o que foi decidido sobre [assunto].

## O que a conta nova NÃO leva junto
- **As memórias** que eu salvei ficam em `~/.claude/projects/-Users-marcelomaximos/memory/` e são do computador, não da conta: continuam funcionando.
- **Os conectores** (Vercel, Supabase, Netlify, Chrome) são ligados por conta. Na conta nova, reconecte cada um **com as contas certas** (veja a bagunça abaixo).
- **O token da Replicate** está em `~/reino/.env`, no computador. Continua valendo (mas a conta está sem crédito).

## ⚠️ A bagunça de contas (resolver antes de crescer)
Durante a sessão apareceram cinco contas diferentes:

| Serviço | Conta em uso hoje | Situação |
|---|---|---|
| Claude | diego.amecapao@gmail.com | vai virar a sua |
| Vercel (conector) | marcelomaximus@marcelomaximus.com.br | certa, mas sem permissão no escopo principal |
| Vercel (navegador) | silvaadrian481@gmail.com | conta de outra pessoa logada no seu Chrome |
| Netlify | silvaadrian481@gmail.com | **é a dona do site networkreino.netlify.app** |
| Supabase | conta com os projetos "babel landpage" e "dominic…" | não tem o banco do app do Reino |
| App do Reino | Supabase `fxlansnepokjxdikxocb` | em outra conta ainda |

**Recomendação:** escolha um e-mail para ser o dono de tudo (o natural é marcelomaximus@marcelomaximus.com.br), e migre serviço por serviço. Quem é dono da conta é dono do site, do domínio e dos dados dos empresários.

## Pendências da LP (o que pedir para o Claude na conta nova)
1. **Salvar os pré-cadastros** (mais urgente): o SQL está pronto em `~/reino/lp/supabase-pre-cadastro.sql`. Sem isso, quem preenche o formulário se perde.
2. **Link do canal do WhatsApp** da Primeira Corte (campo `canalWhatsApp` no `index.html`).
3. **Autorização do Diego** para usar nome e números do caso da Babel.
4. **Revisão jurídica** da copy e da política de privacidade no rodapé.
5. **Domínio `networkreino.com`** (livre, ~US$ 11 por ano) e ligação com o Netlify ou a Vercel.
6. **Corrente de indicação**: ligar o link de afiliado do app à LP (ver `~/reino/lp/INDICACAO.md`).
7. **Revisar o que estará ativo em 23/10** e tirar da LP o que ainda não existir.

## Como republicar a LP depois de qualquer mudança
```bash
cd ~/reino
python3 tools/empacotar.py "~/Desktop/LP Reino/networkreino.html"
```
Depois arraste o arquivo (ou a pasta `site-networkreino`) em app.netlify.com/drop, dentro do projeto `networkreino`, ou peça para o Claude fazer pelo navegador.
