# A Máquina: o backend visual, montado como Lego

> Pedido do Theus em 23/09/2026: a equipe nova não entende de backend. Quando alguém está num brainstorm e o terminal gera os arquivos do backend, precisa existir uma prévia do backend em peças, como o MindMeister ou o n8n, com todos os recursos do Supabase virando peças em linguagem simples, como montar Lego ou um hardware virtual. Enquanto o terminal constrói, a tela se monta sozinha; dá para testar, ver os dados passando e onde ficam guardados. Tem que ser perfeitamente fácil e visual.
>
> Este documento é o pensamento profundo sobre isso. É a peça mais ambiciosa do Babel Coop e a que mais resolve uma dor real da empresa.

---

## 1. A ideia numa frase

**A Máquina é para o backend o que a prévia do site é para o HTML.** O código continua sendo a verdade (migrações SQL, funções, rotas). A Máquina é uma projeção viva dele, em peças com nome de gente, que se monta enquanto o agente trabalha e que dá para cutucar para ver os dados andando.

Três regras que evitam que ela vire mais uma ferramenta que mente:

1. **O código é a fonte da verdade.** A Máquina nunca guarda nada que o código não saiba. Ela lê o repositório e o banco do projeto e desenha: primeiro o banco local do projeto (Postgres local, PGlite, feito em 25/09); depois, com o ok e as credenciais do Theus, o Supabase do projeto do cliente/equipe (a nuvem é a onda seguinte; rede local primeiro). O babel-coop não guarda os próprios dados no Supabase: usa a pasta compartilhada e o diário. Se alguém mexe na Máquina, quem escreve é o agente, no código; a Máquina redesenha. (Revisto em 25/09/2026: era "lê o repositório e o Supabase".)
2. **Nada mexe em produção pela Máquina.** Testes rodam no banco local do projeto (PGlite) ou numa branch do Supabase do projeto. "Publicar" é um passo à parte, com a lista do que muda em português.
3. **Cada peça fala português.** Nunca aparece `tenant_id uuid references tenants(id)`. Aparece "Pacientes · por empresa · cada empresa vê só os seus".

## 2. As peças (o vocabulário)

Cada recurso do Supabase e da Vercel vira uma peça com forma e cor próprias. O nome técnico fica num canto pequeno, para quem quiser.

| Peça | O que é por baixo | Como aparece | Frase modelo |
|---|---|---|---|
| **Gaveta** | tabela | caixa com os campos listados | "guarda os Pacientes" |
| **Campo** | coluna | linha dentro da gaveta | "nome (texto) · nascimento (data) · clínica (ligação)" |
| **Fio** | chave estrangeira / relação | linha entre gavetas | "cada Agendamento pertence a um Paciente" |
| **Chave** | política RLS | cadeado na gaveta | "cada empresa vê só os seus" / "só o dono muda" / "⚠ aberta para todos" |
| **Empresa** | tenant (multi-tenancy) | moldura em volta das gavetas que têm `tenant_id` | "tudo aqui dentro é separado por empresa" |
| **Portaria** | Auth (login, papéis) | peça na entrada da máquina | "entra com e-mail e senha; papéis: dono, atendente" |
| **Porta** | rota de API (Vercel) ou Edge Function | peça com uma seta de entrada | "recebe 'novo agendamento' e grava na gaveta Agendamentos" |
| **Robô** | trigger, pg_cron, webhook, função | engrenagem ligada a uma gaveta ou porta | "quando entra um Paciente, manda o WhatsApp de boas-vindas" |
| **Depósito** | bucket do Storage | prateleira | "guarda as fotos dos pacientes · 1,2 GB" |
| **Cofre** | variáveis de ambiente e segredos | cofre fechado | "precisa de: SUPABASE_URL, SUPABASE_KEY, VERCEL_TOKEN" (nunca mostra o valor) |
| **Tela** | página do frontend que usa a porta | miniatura | "a tela Agenda usa a porta 'listar agendamentos'" |
| **Cano** | Realtime / fila | tubo com bolinhas andando | "cada mudança em Agendamentos avisa a tela na hora" |

**Tipos de campo em português**: texto, número, dinheiro, data, data e hora, sim/não, lista de opções, código (uuid), ligação com <gaveta>, arquivo, JSON ("caixa livre").

**Chaves em português**: a Máquina reconhece os padrões comuns de RLS e traduz. `tenant_id = (auth.jwt() ->> 'tenant_id')::uuid` vira "cada empresa vê só o seu". `user_id = auth.uid()` vira "só o dono vê". `true` vira "⚠ aberta para todos" em vermelho. O que ela não reconhece, o agente traduz uma vez e a tradução fica gravada no próprio banco (`COMMENT ON POLICY`), então a verdade carrega a frase.

## 3. Como a Máquina lê a verdade

Tudo é leitura, código nosso, sem ferramenta de terceiros no meio.

- **Gavetas, campos, fios, chaves, robôs**: consulta ao catálogo do Postgres (`information_schema`, `pg_policies`, `pg_trigger`, `pg_proc`, `cron.job`, `supabase_functions.hooks`) no Supabase local, na branch ou no projeto. Também lê `supabase/migrations/*.sql` do repositório para saber o que ainda não foi aplicado (peças "em construção", tracejadas).
- **Portas**: pasta `supabase/functions/*` e as rotas da Vercel (`app/api/**`, `api/**`, `vercel.json`). O agente escreve um comentário de uma linha no topo de cada função ("recebe X e faz Y"); a Máquina usa esse comentário como frase da peça.
- **Empresa**: toda gaveta com `tenant_id` (ou o nome que o projeto usar; o Theus configura uma vez) entra na moldura. Gaveta com `tenant_id` mas sem chave por empresa ganha o alerta "⚠ por empresa, mas aberta".
- **Depósitos**: `storage.buckets` e as políticas deles.
- **Cofre**: os nomes das variáveis que o código usa (`process.env.X`, `Deno.env.get('X')`) cruzados com o que existe no cofre de cada pessoa. Nunca o valor.
- **Telas**: as páginas do frontend que chamam cada porta (busca no código por `fetch('/api/...')` e pelo cliente Supabase `.from('tabela')`).
- **Cano**: assinaturas Realtime no código (`.channel(...)`, `.on('postgres_changes', ...)`).

A leitura roda de novo sempre que um arquivo muda no repositório ou uma migração é aplicada. Isso é o que faz a tela "se montar sozinha".

## 4. A tela

```
┌ MÁQUINA · Babel OS · ambiente: local ● ────────────── [Testar] [O que muda] [Publicar] ─┐
│                                                                                          │
│   ┌ PORTARIA ┐        ┌───────────── EMPRESA (cada uma vê só o seu) ─────────────┐        │
│   │ e-mail + │        │  ┌ Clínicas ┐     ┌ Pacientes 🔒 ┐     ┌ Agendamentos 🔒 ┐ │        │
│   │ senha    │──────▶ │  │ nome     │────▶│ nome          │────▶│ quando          │ │        │
│   │ dono ·   │        │  │ cnpj     │     │ nascimento    │     │ paciente (fio)  │ │        │
│   │ atendente│        │  └──────────┘     │ foto (depósito)│     │ status (lista)  │ │        │
│   └──────────┘        │                   └───────────────┘     └────────┬────────┘ │        │
│                       └──────────────────────────────────────────────────┼──────────┘        │
│   ┌ PORTA ─────────────────┐                                     ⚙ ROBÔ  │                   │
│   │ novo agendamento       │ ◀── tela Agenda                     "quando entra, avisa       │
│   │ recebe paciente+quando │                                       no WhatsApp"             │
│   └────────────────────────┘                                                                 │
│   🔐 COFRE: SUPABASE_URL ✓ · SUPABASE_KEY ✓ · ZAPI_TOKEN ✗ pedir ao Theus                    │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ 14:32 Rita criou a gaveta Pacientes · 14:33 fechou por empresa · 14:35 ligou o robô WhatsApp │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Três alturas de zoom**, como um mapa: a máquina inteira (empresas, portas, gavetas por domínio), um domínio (Agenda: suas gavetas, portas e robôs) e uma peça (campos, chaves, exemplos de dados).
- **Peças em construção** aparecem tracejadas enquanto a migração não foi aplicada; ficam sólidas quando aplica.
- **Alertas em vermelho** na própria peça: gaveta aberta para todos, campo de ligação sem índice, porta sem checagem de login, cofre com chave faltando.
- **Linha do tempo embaixo**: cada coisa que o agente montou, com hora e nome do agente, clicável.
- **Clicar em qualquer peça** abre à direita, no lugar do terminal ou ao lado dele, a ficha da peça: a frase, os campos, as chaves, "onde fica guardado" (projeto, tabela, região, quantas linhas, backup), quem mexeu por último e o botão "Explicar com a Rita".

## 5. Montar (o brainstorm que vira backend)

A pessoa fala com o agente, no terminal, do jeito dela:

> "Cada clínica tem pacientes e agendamentos. Cada clínica vê só o que é dela. Quando entra um paciente, manda um WhatsApp de boas-vindas."

O agente escreve a migração, as políticas, o trigger e a função. A Máquina, que está aberta no meio, vai se montando: aparece a moldura Empresa, entram as gavetas Clínicas, Pacientes e Agendamentos com os fios, os cadeados fecham, o robô aparece ligado à gaveta Pacientes. Cada peça entra com uma pequena animação de encaixe, na ordem em que o agente fez.

Também dá para montar pela Máquina, arrastando, e o agente escreve o código:

- arrastar uma gaveta nova para dentro da moldura Empresa → o agente adiciona `tenant_id`, a chave "cada empresa vê só o seu" e o índice;
- puxar um fio de Agendamentos para Pacientes → chave estrangeira;
- clicar no cadeado → escolher entre "cada empresa vê só o seu", "só o dono", "todos leem, só o dono muda", "aberta" (com aviso);
- arrastar um robô para uma gaveta → escolher "quando entra", "quando muda", "todo dia às…" e dizer em português o que ele faz.

Toda mudança feita pela Máquina passa pelo agente, aparece no terminal como um cartão "✓ Gaveta Pacientes fechada por empresa · [ver SQL] [desfazer]" e vira uma migração no repositório. A Máquina nunca escreve no banco por conta própria.

## 6. Testar (ver os dados passando)

Botão **Testar** no topo. A Máquina entra em modo teste, com o ambiente marcado em cor (local ou branch; produção não tem modo teste).

1. Escolhe uma porta ("novo agendamento"). A Máquina monta um formulário simples a partir do que a porta recebe (campos com nomes em português, ligações viram listas de escolha).
2. Escolhe "como quem": uma pessoa de teste de cada empresa (a Máquina cria duas empresas de exemplo e um usuário de cada, uma vez).
3. Envia. O pedido anima pela máquina: acende a Portaria ("entrou como Ana, da Clínica Vida"), percorre a porta, chega na gaveta Agendamentos, uma linha nova aparece na gaveta com os valores de verdade, o robô acende ("mandou o WhatsApp · ver o que enviou"), o cano leva a bolinha até a tela Agenda.
4. Tenta como a outra empresa ver a gaveta: o cadeado acende em vermelho, "barrado pela chave: cada empresa vê só o seu". É assim que a equipe entende RLS sem saber o nome.

Como isso funciona por baixo, com código nosso: o Realtime do Supabase (`postgres_changes`) avisa a Máquina de cada linha que entra ou muda, então as gavetas se atualizam ao vivo; os logs das Edge Functions vêm pela API de logs; os pedidos às portas passam por um pequeno proxy da Estação que registra entrada, saída e tempo. Para "ver onde fica guardado": clicar na linha mostra a gaveta, o projeto, a região e quando foi o último backup.

**Dados de exemplo**: um botão "encher de exemplo" cria 20 pacientes e 50 agendamentos em duas empresas, com nomes brasileiros, para a máquina não estar vazia no teste.

## 7. Dividir o trabalho em peças

Cada peça pode ser entregue a alguém: botão direito → "Pedir para o Davi". Vira uma demanda com cronômetro ligada à peça ("montar a porta 'cancelar agendamento'"). A peça mostra a foto do Davi enquanto ele está nela, e a linha do tempo mostra o que ele montou. Quando ele conclui, a peça pisca e o aprendizado dele entra no acervo.

O **Cofre** resolve os envs: o repositório do Babel OS fica na pasta de projeto, mas `.env` nunca vai para a pasta compartilhada. Cada pessoa tem o próprio cofre no computador; a Máquina mostra quais chaves o projeto precisa e quais faltam para aquela pessoa, com o botão "Pedir ao Theus", que manda a chave uma vez pelo chat direto e ela vai para o cofre. O agente roda com as chaves injetadas na hora, sem elas passarem por arquivo compartilhado.

## 8. Publicar

Botão **O que muda**: a lista em português do que está no local ou na branch e não em produção. "Cria a gaveta Pacientes. Fecha Agendamentos por empresa. Liga o robô de WhatsApp." Cada item com "ver SQL".

Botão **Publicar**: aplica as migrações no projeto (`supabase db push`) e publica as portas (`vercel deploy`). Só quem tem permissão. A Máquina mostra o antes e o depois, com as peças novas em verde, as mudadas em âmbar e as removidas em vermelho, e pede confirmação escrita ("digite o nome do projeto").

## 9. Por que dá para fazer

- O Supabase expõe tudo isso por SQL no catálogo do Postgres e pela API de gerenciamento; o Supabase local (`supabase start`) e as branches existem para testar sem medo.
- A Vercel expõe as rotas pelo próprio repositório e os deploys pela CLI e pela API.
- O desenho em peças é o mesmo problema do Construtor Visual de Fluxos e do M Master que o Theus já fez; a base de canvas com nós e fios já existe e é nossa.
- A tradução para português é um dicionário de padrões mais o agente para o resto, guardada no próprio banco como comentário.
- Ver os dados andando é o Realtime que o Supabase já dá, mais um proxy simples.

O que é difícil de verdade, e por isso vem em fatias: manter a Máquina sempre igual ao código (por isso ela só lê), traduzir bem políticas complexas (por isso o agente traduz e a tradução fica gravada) e não deixar ninguém publicar sem entender (por isso "O que muda" vem antes de "Publicar").

## 10. Fatias de construção

1. **Ler e desenhar**: a Máquina lê o Babel OS (local) e desenha gavetas, campos, fios, chaves, empresa, portas, robôs, depósitos e cofre, com o dicionário de português. Clicar mostra a ficha. Só leitura.
2. **Montar sozinha**: observa o repositório e as migrações; redesenha com animação de encaixe a cada mudança do agente; linha do tempo.
3. **Testar**: formulário por porta, "como quem", animação do pedido, gavetas ao vivo pelo Realtime, cadeado barrando, dados de exemplo.
4. **Montar arrastando**: gaveta, fio, cadeado e robô pela Máquina, escrevendo código pelo agente com cartão e desfazer.
5. **Peças para pessoas e cofre**: pedir peça para alguém, foto na peça, chaves faltando e "pedir ao Theus".
6. **O que muda e Publicar**: diff em português, antes e depois, confirmação.

Entra no Babel Coop como uma vista da Estação chamada **Máquina**, disponível dentro de um projeto de código (o Babel OS é o primeiro). A `IDEIAS.md` (5.17) e o `CHECKLIST.md` apontam para cá.
