# Artist Hub — Plataforma multiartista · Starter React Native

Projecto-piloto de aplicação móvel Android/iOS **nativa**, criada com React Native, Expo SDK 58, Expo Router e Supabase. Inclui migração PostgreSQL para isolamento multiartista e um modo de demonstração com dados totalmente fictícios.

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

Para uma app exclusiva de um artista, defina `EXPO_PUBLIC_ARTIST_SLUG=artista-piloto`. O exemplo multiartista usa o campo vazio. O nome, ícone e bundle ID de produção serão alterados por marca antes da publicação.

## Android/iOS — build instalável

```bash
npx eas-cli login
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform ios --profile preview
```

Os comandos acima são instruções para executar no seu computador/ambiente EAS; **não foram executados nesta entrega**. O perfil iOS exige configuração de credenciais apropriadas. Actualize os IDs de aplicação antes de distribuir.

## GitHub

Crie um repositório privado novo (ex.: `Dev-Ruco/artist-platform`) e, na raiz desta pasta:

```bash
git init
git branch -M main
git add .
git commit -m "feat: starter React Native multiartista e schema seguro"
git remote add origin https://github.com/Dev-Ruco/artist-platform.git
git push -u origin main
```

O URL acima só será válido **depois** de criar o repositório. Nenhum repositório remoto foi criado ou modificado nesta entrega.

## Limitações do starter

- Não inclui ficheiro `package-lock.json`: o registo npm estava inacessível no ambiente de criação, pelo que não foi possível instalar nem compilar as dependências de forma real.
- A navegação, o desenho inicial e o código são entregues como código-fonte; **APK/IPA não foram compilados**.
- Pagamentos, chats, painel de gestão, push e conteúdos VIP **não estão operacionais**.
- Não usar como aplicação de produção sem os testes de RLS, o fluxo de moderação e a validação de segurança indicados nos documentos.

## Documentação

- [Especificação técnica](docs/especificacao-tecnica.md)
- [Arquitectura multiartista](docs/arquitectura-multiartista.md)
- [Roadmap](docs/roadmap.md)
