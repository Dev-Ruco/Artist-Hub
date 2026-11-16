# Arquitectura multiartista

**Decisão actual (Novembro de 2026):** o produto publicado é uma aplicação **exclusiva de Mr. Bow**. O núcleo do sistema permanece tecnicamente reutilizável para futuras aplicações independentes de outros artistas. Não existe selector público nem marketplace na aplicação Mr. Bow. Ver [decisão de produto](decisao-produto-mr-bow.md).

## Princípio nuclear

Uma única plataforma gere múltiplas comunidades, mas **cada registo de negócio pertence a um `artist_id`**. Contas de fãs podem associar-se a vários artistas; os direitos e os pagamentos não são transferíveis entre comunidades sem regra explícita.

```text
Android / iOS — aplicação piloto React Native
  |  Public URL + publishable/anon key
  v
Supabase Auth --------- identidade global do fã
  |
  v
PostgREST / Realtime (schema mrbowapp, RLS)
  |          |              |               |
  v          v              v               v
artists   posts/events   memberships    message_requests
  |                                           |
  +-------- artist_id (isolamento) -----------+
  |
  +--- conversas e mensagens (preparadas, não activadas)
  +--- pagamentos/entitlements (apenas servidor fiável)

Fase posterior:
Painel admin -> API administrativa com verificação de staff -> DB
Gateway financeiro -> Webhook verificado -> entitlement -> app
```

## Modelos de distribuição

1. **Piloto actual:** uma app apenas de Mr. Bow, com identidade e conteúdo exclusivos, sem selector de outros artistas.
2. **White-label:** build separada para cada artista, com `EXPO_PUBLIC_ARTIST_SLUG` (já aceite no starter), nome, bundle ID, ícone e esquema visual próprios. A distribuição usa o mesmo código, nunca dados cruzados.
3. **Marketplace:** opcionalmente uma aplicação agregadora com várias comunidades. Não é necessária para a primeira versão comercial.

## Dados

- `artists`: agregado raiz, configurações de marca e estado.
- `profiles`: identidade de fã, independente do artista.
- `artist_memberships`: pertença do fã, nível, pontos, bloqueio futuro.
- `artist_staff`: autorização do operador por comunidade.
- `posts`, `events`: conteúdos por artista.
- `message_requests`: pedidos gratuitos; `conversations`, `conversation_members`, `messages`: base para futura caixa de mensagens.
- `payments`, `entitlements`: lançamentos financeiros e direitos; escrita só pelo servidor.
- `moderation_reports`: denúncias; interface ainda não construída.

## Modelo de autorização

- O cliente usa `anon/publishable key` e JWT da sessão, nunca `service_role`.
- O PostgREST expõe somente o esquema `mrbowapp` (além dos esquemas administrativos que o Supabase exija).
- RLS controla **quem pode ler/inserir**; as aplicações nunca devem depender exclusivamente de filtros React para isolamento.
- Operações administrativas e mudanças de estado utilizam chamadas de backend seguras, com teste explícito de staff em cada artista.
- Níveis, pontos, confirmação de pagamentos e concessão de benefícios são campos sob controlo do servidor.
- Conversas só são criadas por backend seguro até existir política de gestão de convites, bloqueios e limites de envio.

## Supabase self-hosted — passos necessários

1. Criar uma base de dados/ambiente de teste ou snapshot com possibilidade de rollback.
2. No Supabase self-hosted, quando o esquema `mrbowapp` já existe e está vazio, executar apenas o instalador `infra/supabase/install_mrbowapp_existing_schema.sql` no SQL Editor, depois de backup.
3. Expor `mrbowapp` na configuração de `db-schemas` do PostgREST/Supabase API e reiniciar os serviços relevantes. Confirmar configuração efectiva da instalação.
4. Criar/activar os utilizadores Auth. Se desejado, executar `infra/supabase/seed_pilot.sql`, **apenas em desenvolvimento**.
5. Introduzir URL pública e chave publishable/anon na `.env` da aplicação.
6. Confirmar que o projecto usa HTTPS válido, que emails de confirmação são entregues e que o cliente obtém JWT.
7. Testar RLS com dois utilizadores e dois artistas antes de qualquer lançamento público.

## Integrações futuras

M-Pesa/e-Mola devem passar por backend especializado e credenciais secretas fora da aplicação. Notificações push devem ser tratadas com permissões e preferências individuais. Ficheiros devem ser guardados em buckets privados quando se tratar de conteúdo pago.
