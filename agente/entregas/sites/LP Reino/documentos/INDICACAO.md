# A corrente de indicação do Reino

## Como funciona hoje na LP
1. **Alguém compartilha um link** com o próprio código:
   `https://<dominio-da-lp>/?ref=CODIGO&de=Marcelo`
   - `ref` = código de quem indicou (é o que liga a rede).
   - `de` = primeiro nome de quem indicou, só para a Carta de Apresentação ("Marcelo te apresentou ao Reino").
2. **A LP guarda o `ref`** em `localStorage` assim que a pessoa chega, e o mantém mesmo que ela volte depois sem o parâmetro.
3. **No pré-cadastro**, o `ref` vai junto com os dados para o Supabase (`pre_cadastros.ref`).
4. **O Supabase devolve** a `matricula` (número da Primeira Corte) e um `codigo` único do novo membro.
5. **A tela de boas-vindas monta a Carta dele**: `?ref=<codigo-novo>&de=<primeiro-nome>`, pronta para o WhatsApp.
6. **O botão "Conhecer o Reino demonstrativo"** leva ao app com o mesmo `ref`, para o app registrar quem indicou.

Resultado: cada pessoa que entra vira um novo elo. A consulta do ranking está no fim de `supabase-pre-cadastro.sql`.

## O que falta para fechar o ciclo com o app
O app (`o-reino.vercel.app`) já entende `?ref=` (arquivo `servicos/afiliados.js`) e gera links próprios. Faltam três ligações:

1. **O link de afiliado do app deve apontar para a LP**, não para o app. Em `afiliados.js`, o link é montado assim:
   ```js
   const linkDe = (codigo) => dominio() + "/?ref=" + codigo;
   ```
   Trocar `dominio()` pelo domínio da LP faz todo convite cair na experiência imersiva antes do cadastro.
2. **Usar o mesmo código nos dois lados.** O ideal é o app ser a fonte do código: quando o pré-cadastrado virar membro, o app reaproveita o `codigo` que a LP gerou (ou a LP passa a consultar o código do app). Sem isso, a mesma pessoa teria dois códigos.
3. **Unir as duas tabelas na inauguração**: casar `pre_cadastros.whatsapp` com o cadastro do app para saber quem da Primeira Corte virou membro e quem indicou quem.

## Sugestão de formato do código
Curto, legível e sem ambiguidade (sem 0/O e 1/I), por exemplo `REI-7K4M2`. Assim o empresário pode até ditar o código por telefone.
