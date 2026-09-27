# Como instalar o babel-coop

Guia para quem vai entrar na equipe. O Theus manda **o instalador**. Todo mundo precisa estar **na mesma rede** (o mesmo Wi-Fi ou o mesmo cabo do escritório): é por ela que o app acha a equipe sozinho, sem copiar nada.

## 1. Baixar

| Computador | Arquivo |
|---|---|
| Mac com chip Apple (M1, M2, M3, M4…) | `babel-coop-0.1.0-arm64.dmg` |
| Windows 10 ou 11 (64 bits) | `babel-coop-0.1.0-windows-x64.exe` |

Mac com processador Intel ainda não tem instalador: fale com o Theus.

## 2. Instalar no Mac

1. Abra o `.dmg` e arraste o **babel-coop** para a pasta **Aplicativos**.
2. Na primeira vez, o macOS avisa que não conseguiu verificar o app, porque ele ainda não tem a assinatura da Apple. Para liberar (só uma vez):
   - clique com o botão direito (ou Control + clique) no babel-coop, em Aplicativos → **Abrir** → **Abrir**;
   - se esse botão não aparecer: **Ajustes do Sistema → Privacidade e Segurança**, role até "babel-coop foi bloqueado" → **Abrir assim mesmo** → digite a senha do Mac;
   - ou, no Terminal, um comando só (tira a marca de "baixado da internet" e o app abre direto):
     ```
     xattr -dr com.apple.quarantine "/Applications/babel-coop.app"
     ```
   Se o app não abrir de jeito nenhum depois de copiado por AirDrop ou pendrive, é a mesma marca: rode o comando acima.
3. Quando o Mac perguntar se o babel-coop pode encontrar dispositivos na rede local, clique em **Permitir**. Sem isso ninguém da equipe vê você.

## 3. Instalar no Windows

1. Dê dois cliques no `.exe`.
2. Se aparecer "O Windows protegeu o computador" (SmartScreen): **Mais informações → Executar assim mesmo**.
3. A instalação é automática (não pede senha de administrador), cria o atalho na Área de Trabalho e abre o app.
4. Se o Firewall do Windows perguntar, marque **Redes privadas** e clique em **Permitir acesso**.

## 4. Entrar na equipe

1. Na primeira vez, o app abre a tela de boas-vindas e procura a equipe no Wi-Fi. Em poucos segundos aparece **Equipe babel · Theus**.
2. Escreva **seu nome** e clique em **Pedir para entrar**.
3. A tela mostra um **código de 4 dígitos**, e o mesmo código aparece no topo da Estação do Theus. Olhem as duas telas juntos:
   - **você** confere com a tela do Theus e clica em **O código bateu** (ou **Não bateu**, se for diferente);
   - **o Theus** só clica em **Aceitar** se a sua tela mostra o mesmo código.
4. Com o código conferido dos dois lados e o Theus tendo aceitado, o app entra sozinho na equipe, sem copiar nem colar nada.

Por que conferir: o código sai das duas pontas (do seu computador e da Estação do Theus). Se outro computador no Wi-Fi se meter no meio, fingindo ser o Theus para você ou você para o Theus, os códigos das duas telas saem diferentes, salvo 1 chance em 10.000. Por isso a conferência vale os dois lados, número por número. Código diferente: clique em **Não bateu** (o pedido é cancelado), avise o Theus e peça de novo ao lado dele.

Se o Theus recusar, a tela avisa e você pode pedir de novo. Um pedido sem resposta vale 10 minutos. Se alguém da equipe já usa o seu nome, o pedido é recusado: peça com o nome completo.

**Não achou a equipe?** Confira se o computador está no mesmo Wi-Fi da gestão e, no Mac, se o babel-coop pode usar a rede local (**Ajustes do Sistema → Privacidade e Segurança → Rede Local**). No Windows, o Firewall precisa permitir o app em **Redes privadas** (passo 3.4).

**Plano B: o token.** Se a rede do escritório bloquear a busca, o Theus gera um token (**Equipe → Convidar pessoa**) e manda pelo WhatsApp. Cole o token no campo **Plano B** da tela de boas-vindas e clique em **Entrar com o token**. O token é a sua chave: não passe o seu para outra pessoa e não publique em lugar nenhum.

## 5. O que cada um vê

- **Você** abre a Estação com o seu nome e o seu terminal. Em **Terminais**, a parede mostra ao vivo quem está online e os terminais de cada pessoa.
- **Todos veem todos.** Para mexer no terminal de alguém: a gestão (o Theus) entra direto, quem é do mesmo projeto também, e os outros pedem para entrar, e o dono aceita com um clique. Quem está no seu terminal aparece com um selo, e você encerra quando quiser.
- **Pausar** o seu terminal esconde tudo o que sair durante a pausa, na hora e depois.
- Os seus dados ficam na pasta **BabelCoop**, dentro da sua pasta pessoal. Instalar uma versão nova por cima não apaga nada.

## 6. Para o Theus: fundar a equipe e aceitar quem chega

1. No seu computador, na primeira vez: tela de boas-vindas → **Sou o primeiro computador da equipe** → seu nome → **Fundar a equipe**.
2. Mande o instalador para a pessoa. Quando ela pedir para entrar, aparece no topo da sua Estação (e em **Equipe**): **"<nome> quer entrar na equipe · código NNNN"**. Confira o código com ela e clique em **Aceitar** (ou **Recusar**). O convite vai cifrado só para o computador dela: quem estiver escutando o Wi-Fi não pega nada.
3. Plano B, se a busca não funcionar na rede: **Equipe → Convidar pessoa** → nome → **Gerar token** → **Copiar**, e mande pelo WhatsApp.
4. Onde pegar os instaladores:
   - **GitHub**: aba **Actions** → "terminal · node-pty no Electron e instaladores" → a última execução verde → **Artifacts** (`babel-coop-mac` e `babel-coop-windows`). Cada um baixa como `.zip`: abra o zip para tirar o `.dmg` ou o `.exe`.
   - **No seu Mac**: `cd app && npm run empacotar` gera o `.app` e o `.dmg` em `app/dist/` (sem assinatura Apple, com selo ad hoc e sem marca de quarentena). O `.exe` sai do GitHub Actions, no runner Windows (`npm run dist:win`).

## Para tirar os avisos

Os avisos da primeira abertura existem porque o app ainda não é assinado. Para tirá-los, o Theus precisa de:

- **Mac**: uma conta no Apple Developer Program, um certificado **Developer ID Application** e a **notarização** do app pela Apple. Com o certificado e os dados da conta guardados como segredos do GitHub, o empacotamento passa a assinar e notarizar sozinho, e o aviso some.
- **Windows**: um **certificado de assinatura de código** (de uma autoridade certificadora ou pelo serviço de assinatura da Microsoft). O SmartScreen para de avisar depois que o app assinado ganha reputação.

As duas coisas dependem de conta e de pagamento do Theus. Os preços estão nos sites da Apple e das emissoras de certificado.
