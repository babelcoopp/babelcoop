# Como instalar o babel-coop

Guia para quem vai entrar na equipe. O Theus manda duas coisas: **o instalador** e **o seu token** (um texto que começa com `babel-`). Todo mundo precisa estar **na mesma rede** (o mesmo Wi-Fi ou o mesmo cabo do escritório).

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

Na primeira vez, o app abre a tela de boas-vindas. **Cole o token** que o Theus mandou e clique em **Entrar na equipe**. Pronto: o app já sabe quem você é e acha a equipe na rede.

O token é a sua chave. Não passe o seu para outra pessoa e não publique em lugar nenhum: cada pessoa recebe o próprio token.

## 5. O que cada um vê

- **Você** abre a Estação com o seu nome e o seu terminal. Em **Terminais**, a parede mostra ao vivo quem está online e os terminais de cada pessoa.
- **Todos veem todos.** Para mexer no terminal de alguém: a gestão (o Theus) entra direto, quem é do mesmo projeto também, e os outros pedem para entrar, e o dono aceita com um clique. Quem está no seu terminal aparece com um selo, e você encerra quando quiser.
- **Pausar** o seu terminal esconde tudo o que sair durante a pausa, na hora e depois.
- Os seus dados ficam na pasta **BabelCoop**, dentro da sua pasta pessoal. Instalar uma versão nova por cima não apaga nada.

## 6. Para o Theus: fundar a equipe e gerar os tokens

1. No seu computador, na primeira vez: tela de boas-vindas → **Sou o primeiro computador da equipe** → seu nome → **Fundar a equipe e gerar tokens**.
2. Para cada pessoa: **Equipe → Convidar pessoa** → nome → **Gerar token** → **Copiar**, e mande pelo WhatsApp junto com o instalador.
3. Onde pegar os instaladores:
   - **GitHub**: aba **Actions** → "terminal · node-pty no Electron e instaladores" → a última execução verde → **Artifacts** (`babel-coop-mac` e `babel-coop-windows`). Cada um baixa como `.zip`: abra o zip para tirar o `.dmg` ou o `.exe`.
   - **No seu Mac**: `cd app && npm run empacotar` gera o `.app` e o `.dmg` em `app/dist/` (sem assinatura Apple, com selo ad hoc e sem marca de quarentena). O `.exe` sai do GitHub Actions, no runner Windows (`npm run dist:win`).

## Para tirar os avisos

Os avisos da primeira abertura existem porque o app ainda não é assinado. Para tirá-los, o Theus precisa de:

- **Mac**: uma conta no Apple Developer Program, um certificado **Developer ID Application** e a **notarização** do app pela Apple. Com o certificado e os dados da conta guardados como segredos do GitHub, o empacotamento passa a assinar e notarizar sozinho, e o aviso some.
- **Windows**: um **certificado de assinatura de código** (de uma autoridade certificadora ou pelo serviço de assinatura da Microsoft). O SmartScreen para de avisar depois que o app assinado ganha reputação.

As duas coisas dependem de conta e de pagamento do Theus. Os preços estão nos sites da Apple e das emissoras de certificado.
