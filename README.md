# Mr. Bow — Aplicação móvel exclusiva (núcleo reutilizável)

Aplicação móvel Android/iOS **de Mr. Bow**, construída com React Native, Expo Router e Supabase. Esta distribuição contém apenas a comunidade de Mr. Bow; a base técnica poderá ser reutilizada futuramente para criar aplicações separadas para outros artistas. Sem selector público de artistas.

## Conteúdo

```text
artist-platform/
├── apps/
│   ├── mobile/                       # Aplicação real Android/iOS
│   │   ├── app/                       # Expo Router: login + 5 separadores
│   │   ├── src/components/            # UI, cartões, selector, eventos
│   │   ├── src/context/               # Sessão Auth e artista activo
│   │   ├── src/hooks/                 # Consultas à base de dados
│   │   ├── src/data/demo.ts           # Exemplos fictícios offline
│   │   ├── src/lib/supabase.ts        # Cliente anon + sessão
│   │   ├── .env.example
│   │   └── eas.json
│   └── admin/                        # Reservado ao painel (fase 1)
├── infra/supabase/migrations/        # SQL de schema + RLS
├── infra/supabase/seed_pilot.sql     # Dados fictícios de desenvolvimento
├── docs/                             # Especificação, arquitectura, roadmap
└── .github/workflows/               # Validação de TypeScript
```

## Requisitos

- Node.js 22.13 ou superior e npm
- Ambiente de desenvolvimento Expo SDK 58
- Android Studio ou dispositivo Android; para iOS, macOS/Xcode ou EAS Build
- Supabase self-hosted com projecto/testes isolados (opcional para demonstração)

## Executar o piloto sem backend

```bash
npm install
npm run start
```

Use o ambiente de desenvolvimento Expo/QR de acordo com a versão instalada no dispositivo. **Não é um website dentro de uma WebView.** A navegação e os componentes são React Native. O modo sem `.env` é demonstrativo: não cria utilizadores e não envia mensagens.

## Ligar Supabase real

1. Execute a migração `infra/supabase/migrations/0001_artist_hub.sql` numa base de testes.
2. Active o esquema `artist_hub` na configuração dos esquemas expostos pela API PostgREST. No self-hosted, depende da configuração do deployment.
3. Execute `infra/supabase/seed_pilot.sql` em desenvolvimento (opcional).
4. Copie `apps/mobile/.env.example` para `apps/mobile/.env` e substitua o URL e a chave publicável. **Não use service_role.**
5. Reinicie o Expo com `npm run start` e verifique os ecrãs e as consultas. Em ambiente real, a autenticação exige serviço de email/confirmacão correctamente configurado.

A aplicação é exclusiva de Mr. Bow por omissão. A configuração está em `apps/mobile/src/config/brand.ts`; o ficheiro `.env.example` fixa `EXPO_PUBLIC_ARTIST_SLUG=mr-bow` e `EXPO_PUBLIC_ARTIST_NAME=Mr. Bow`. O backend deve ter um artista com o slug `mr-bow`.

## Android/iOS — build instalável

```bash
npx eas-cli login
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform ios --profile preview
```

Os comandos acima são instruções para executar no seu computador/ambiente EAS; **não foram executados nesta entrega**. O perfil iOS exige configuração de credenciais apropriadas. Actualize os IDs de aplicação antes de distribuir.

## GitHub

Repositório já criado: `https://github.com/Dev-Ruco/Artist-Hub`. Para o actualizar, na raiz da pasta:

```bash
git pull origin main
# Alterar o codigo, validar e criar um commit apenas quando houver mudancas.
git add .
git commit -m "feat: actualizar aplicacao Mr. Bow"
git push origin main
```



## Limitações do starter

- Não inclui ficheiro `package-lock.json`: o registo npm estava inacessível no ambiente de criação, pelo que não foi possível instalar nem compilar as dependências de forma real.
- A navegação, o desenho inicial e o código são entregues como código-fonte; **APK/IPA não foram compilados**.
- Pagamentos, chats, painel de gestão, push e conteúdos VIP **não estão operacionais**.
- Não usar como aplicação de produção sem os testes de RLS, o fluxo de moderação e a validação de segurança indicados nos documentos.

## Experiência de fãs — fase 1

O projecto inclui o fluxo de registo com nome, pedido de recuperação de acesso, perfil editável, adesão persistente à comunidade, publicações por categoria e histórico de perguntas à equipa de Mr. Bow. A activação com dados reais exige executar as migrações num ambiente de testes, configurar o Supabase Auth e validar as políticas RLS.

- [Implementação e critérios de teste](docs/experiencia-fas-mr-bow.md)
- [Migração de criação de perfis](infra/supabase/migrations/0002_fan_profiles.sql)

O envio de email de recuperação está preparado, mas a conclusão através de deep link nativo ainda necessita de implementação e testes. Chat privado, moderação e pagamentos continuam desactivados.

## Chamadas privadas — áudio e vídeo

A secção **Falar** inclui acesso a um novo ecrã de experiências individuais de áudio/vídeo com Mr. Bow. Existem estruturas para serviços, horários, reservas, pagamentos e autorização de chamada; **as reservas, cobranças e chamadas verdadeiras continuam desactivadas** até existir gateway financeiro, infra-estrutura LiveKit, testes de segurança e autorização de publicação.

- [Ecrã da aplicação](apps/mobile/app/calls/index.tsx)
- [Migração 0003](infra/supabase/migrations/0003_private_calls.sql)
- [Gateway privado de LiveKit](services/call-gateway/README.md)
- [Plano de implementação e segurança](docs/chamadas-privadas-mr-bow.md)

## Documentação

- [Decisão de produto — aplicação exclusiva de Mr. Bow](docs/decisao-produto-mr-bow.md)

- [Especificação técnica](docs/especificacao-tecnica.md)
- [Arquitectura multiartista](docs/arquitectura-multiartista.md)
- [Roadmap](docs/roadmap.md)


## Pré-visualização Web no Coolify (Docker)

Foi acrescentado o suporte de **exportação Web** da aplicação React Native para testar o piloto num URL provisório. O projecto móvel continua a ser a fonte de verdade; esta opção não substitui APK/IPA.

- `Dockerfile` na raiz: compila o Expo Web e publica o resultado com Nginx;
- `deploy/nginx.conf`: porta interna **80** e encaminhamento de rotas para `index.html`;
- `npm run build:web`: constrói a versão Web de demonstração;
- `/healthz`: endpoint de saúde.
- Ver [instruções exactas para Coolify](docs/coolify.md).

**Coolify:** seleccione build por Dockerfile, localização `/Dockerfile`, base `/`, branch `main`, porta exposta `80`. Grave e faça `Redeploy`. Se aparecer 502, verifique os logs e a porta exposta.

Nota: referências anteriores a criar um novo repositório são apenas instruções do starter; a versão actual está em `Dev-Ruco/Artist-Hub`.

## Expo Hosting — pré-visualização pelo navegador

Para testar a aplicação sem Coolify, utilize o **Expo Hosting**. A aplicação já pode ser exportada para Web e o repositório inclui um fluxo de pré-visualização Expo Workflows.

- Primeira publicação: requer ligação do projecto à sua conta Expo (`eas init` + `eas deploy`).
- Publicações seguintes: `npm run deploy:web:preview` na raiz do repositório.
- Automatização: `apps/mobile/.eas/workflows/deploy-preview.yml`; requer ligação GitHub ↔ Expo e **Base directory** = `apps/mobile`.
- **Não existe um URL de Expo válido antes de a primeira publicação estar concluída.**

Veja [as instruções completas de Expo Hosting](docs/expo-hosting.md).

