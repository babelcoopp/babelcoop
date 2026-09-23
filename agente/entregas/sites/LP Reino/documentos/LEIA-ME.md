# LP do Reino

## Ver no computador
```bash
cd ~/reino/lp && python3 -m http.server 8080
```
Abra http://localhost:8080. Para testar um convite: http://localhost:8080/?de=Ana&ref=ABC123

## Antes de publicar (TROCAR)
1. **Supabase:** rode `supabase-pre-cadastro.sql` no SQL Editor e preencha `REINO_LP.supabase.url` e `.anon` (chave publicável) no `<head>` do `index.html`. Sem isso, os cadastros ficam só no navegador de quem preencheu.
2. **Canal do WhatsApp:** `REINO_LP.canalWhatsApp`.
3. **Autorização do Diego** para os números da Babel (ou manter "um cliente da Babel").
4. **Benefícios ativos em 23/10:** tirar da lista o que ainda não existir.
5. **Jurídico:** resposta "É pirâmide?" e política de privacidade no rodapé.
6. **og:image** (1200×630) e domínio.
7. **Código de indicação:** a LP gera o próprio código (`pre_cadastros.codigo`); ligar com os códigos de afiliado do app.

## Publicar
A pasta `lp/` é estática: pode ir para a Vercel (novo projeto apontando para esta pasta) ou para qualquer hospedagem. Publicação só com aprovação do Marcelo.

## Estrutura
- `index.html`: copy e estrutura (12 cenas)
- `css/reino.css`: tokens do Babel OS, cenas, mobile, movimento reduzido
- `js/cena-portao.js`: castelo neon + lago (canvas)
- `js/cena-torre.js`: a Babel, torre de 7 terraços (canvas)
- `js/anel.js`: anel 3D (Three.js, sob demanda)
- `js/main.js`: scroll, pins, revelações, Guildas, formulário, Carta
- `js/som.js`: trilha ao vivo (Web Audio)
- `js/guildas.js`, `js/brasil.js`: dados (mapa mental, malha IBGE)
