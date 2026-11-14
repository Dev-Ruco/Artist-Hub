# Expo Hosting — pré-visualização do Artist Hub

Esta é a forma recomendada para abrir o piloto no navegador sem depender do servidor Coolify. A aplicação móvel mantém-se em `apps/mobile`.

## Pré-requisitos

- Conta Expo: https://expo.dev/signup
- GitHub `Dev-Ruco/Artist-Hub`, branch `main`
- Node.js 22 e npm
- O projecto usa `expo.web.output = "single"`, formato suportado pelo Expo Hosting

## Primeiro lançamento: associar à conta Expo

No Mac, abra o Terminal e execute:

```bash
git clone https://github.com/Dev-Ruco/Artist-Hub.git
cd Artist-Hub
npm install
cd apps/mobile
npx --yes eas-cli@latest login
npx --yes eas-cli@latest init
npx expo export --platform web
npx --yes eas-cli@latest deploy
```

1. Na primeira execução, autorize a criação/ligação do projecto na sua conta Expo.
2. Escolha um subdomínio de pré-visualização disponibilizado pela Expo (o nome solicitado poderá não estar disponível).
3. O comando devolverá **o URL real da pré-visualização** e a ligação para os detalhes no Expo.
4. O `eas init` acrescenta o identificador do projecto Expo a `apps/mobile/app.json`. Guarde-o no GitHub:

```bash
cd ../..
git add apps/mobile/app.json
git commit -m "chore: associar Artist Hub ao projecto Expo"
git push origin main
```

Não adicione palavras-passe, tokens nem chaves secretas ao repositório.

## Publicações posteriores (navegador)

Depois de associar o projecto:

```bash
# A partir da raiz do repositório:
npm run deploy:web:preview
```

A publicação para o URL **de produção** (apenas quando estiver pronta):

```bash
npm run deploy:web:production
```

Os comandos exportam a aplicação para `apps/mobile/dist` antes do envio.

## Automatização a partir da branch main

O ficheiro `apps/mobile/.eas/workflows/deploy-preview.yml` está preparado para publicar uma pré-visualização em cada push para a `main`.

Para activar a automatização no Expo:
1. Entre em https://expo.dev e abra o projecto recém-criado.
2. Nas definições do projecto, abra **GitHub** e ligue `Dev-Ruco/Artist-Hub` através da aplicação oficial Expo GitHub.
3. Nas definições da ligação GitHub, ajuste **Base directory** para `apps/mobile` (monorepo).
4. A partir dessa ligação, o Expo Workflows poderá executar o fluxo `deploy-preview.yml` após os próximos pushes.

Ligar o repositório no Expo é uma acção de autorização do proprietário. A simples criação do ficheiro de workflow no GitHub **não publica** a aplicação nem fornece um URL.

## O que será publicado?

Por omissão, um ambiente de demonstração com dados fictícios. Para integração real com Supabase:
- `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` devem ser definidos no **build**.
- Nunca insira `service_role` ou outros segredos em variáveis `EXPO_PUBLIC_*`.
- Um site de pré-visualização poderá ser público; não utilize dados privados de clientes neste ambiente.

## Diagnóstico

- `npx expo export --platform web` produz `dist/`.
- `npx --yes eas-cli@latest whoami` mostra a conta Expo autenticada.
- `eas deploy` só funciona após o projecto estar ligado a uma conta Expo.
- No Expo Dashboard, consulte os logs da publicação e a URL atribuída.

Documentação oficial: https://docs.expo.dev/eas/hosting/get-started/

## Correcção da associação Expo no fluxo automático

O projecto Expo já criado é `@ruco222/ruco`. A aplicação conserva o nome visível "Artist Hub - Piloto" e utiliza no `app.json` os valores `owner: ruco222` e `slug: ruco`, que correspondem à conta Expo ligada ao repositório.

O fluxo `deploy-preview.yml` inclui um hook `after_checkout` que associa automaticamente o projecto existente com o identificador `EAS_BUILD_PROJECT_ID`, fornecido pelo executor dos Expo Workflows. Assim, não cria um segundo projecto em cada publicação e evita a falha "EAS project not configured" em modo não interactivo.

Para o desenvolvimento local, associe uma vez o projecto usando o comando completo `eas init --id ...` mostrado no painel Expo; o identificador não foi inserido neste repositório porque a captura anterior não o apresentava por completo.
