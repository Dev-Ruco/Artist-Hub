# Instalação de Mr. Bow no Supabase self-hosted (Coolify)

Esta instalação é para **Supabase instalado pelo próprio utilizador**, e não para um projecto Supabase Cloud. O SQL foi preparado para o mesmo PostgreSQL que suporta os outros projectos; o novo esquema de negócio é `artist_hub`.

## Antes de executar

1. Fazer um **backup/snapshot verificável** do PostgreSQL existente e garantir que é possível repor o backup.
2. Abrir o Studio do **Supabase self-hosted** → **SQL Editor** (ou utilizar `psql` com role administrativa `postgres`).
3. Executar primeiro esta verificação sem fazer alterações:

```sql
select current_database() as base_de_dados,
       current_user as utilizador_sql,
       to_regnamespace('artist_hub') is not null as esquema_ja_existe,
       to_regclass('auth.users') is not null as autenticacao_supabase_disponivel;
```

Se `esquema_ja_existe = true`, **não executar o instalador inicial**. Fazer antes um inventário dos objectos existentes. O instalador tem um bloqueio que interrompe a execução se encontrar esse esquema.

## Instalar

1. Abrir [o instalador único](../infra/supabase/install_artist_hub_initial.sql) e copiar o SQL integralmente.
2. Colar no SQL Editor do Supabase self-hosted e executar como `postgres`. Não usar a chave pública de API para aplicar migrações.
3. O SQL executa as migrações 0001, 0002 e 0003 numa única transacção. Caso uma falhe, o PostgreSQL cancela a transacção. Não é necessário executar as três separadamente.
4. O instalador regista apenas o artista **Mr. Bow**, `slug='mr-bow'`, **sem** publicar notícias fictícias, configurar preços ou abrir horários.
5. O SQL instala um trigger em `auth.users` para criar o perfil **somente** quando o registo inclui `raw_user_meta_data.artist_app = 'mr-bow'`. Não cria perfis de Mr. Bow para registos normais dos outros projectos. Esse marcador de origem não concede privilégios e não substitui RLS.

## Validar após a instalação

```sql
select count(*) as total_tabelas
from pg_catalog.pg_tables where schemaname = 'artist_hub';

select schemaname, tablename, rowsecurity
from pg_catalog.pg_tables
where schemaname = 'artist_hub'
order by tablename;

select id, slug, display_name, status
from artist_hub.artists where slug = 'mr-bow';

select count(*) as definicoes_financeiras_activas
from artist_hub.call_sales_settings
where sales_enabled or payment_backend_ready;
```

Resultado esperado: **18 tabelas**, todas com `rowsecurity = true`, **um** registo de Mr. Bow e **zero** definições financeiras activas. Não activar serviços pagos enquanto o checkout e os webhooks não estiverem concluídos.

## Expor o esquema na API REST do Supabase self-hosted

No **Coolify**, localizar o serviço **Supabase REST/PostgREST** e a variável `PGRST_DB_SCHEMAS`. Adicionar `artist_hub` à lista **preservando os esquemas já existentes**, por exemplo:

```env
PGRST_DB_SCHEMAS=public,graphql_public,artist_hub
```

**A linha acima é apenas um exemplo.** A instalação pode conter outros esquemas: nunca substituir uma lista existente sem os incluir. O parâmetro deverá chegar ao contentor PostgREST (normalmente o serviço `rest`); alterar apenas o Studio não é suficiente. Recriar/reiniciar **somente os serviços afectados** de forma controlada através do Coolify e testar os serviços já existentes.

A configuração `PGRST_DB_EXTRA_SEARCH_PATH` não serve para expor um esquema pela API. Não adicionar `artist_hub` ao `public` nem deslocar as tabelas para `public`.

### Validar a API

No cliente da aplicação, após configurar as variáveis de ambiente, a consulta `supabase.schema('artist_hub').from('artists')` deve devolver Mr. Bow como artista activo. A API precisa de HTTPS funcional e de uma chave **publicável/anon**, nunca de `service_role` dentro do React Native.

## Variáveis necessárias na aplicação

No ambiente da app React Native:

```env
EXPO_PUBLIC_SUPABASE_URL=https://SEU-ENDERECO-PUBLICO-DO-SUPABASE
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=SUA-CHAVE-PUBLICAVEL-OU-ANON
EXPO_PUBLIC_ARTIST_SLUG=mr-bow
EXPO_PUBLIC_ARTIST_NAME=Mr. Bow
```

Substituir os valores exemplificativos pelos da tua instalação. O URL e a chave devem corresponder ao mesmo Supabase. Não guardar senhas PostgreSQL, chaves `service_role`, JWT secret ou segredos de pagamento no projecto móvel.

## O que **não** fica pronto só com a instalação SQL

- O envio/recepção de emails Supabase Auth depende do SMTP self-hosted.
- A funcionalidade de recuperar palavra-passe ainda precisa do tratamento de deep links nativos e dos testes no dispositivo.
- Pagamentos, webhooks, chamadas e gestão de agenda só ficam operacionais depois dos respectivos serviços de backend e autorização.
- Os testes de RLS para dois utilizadores diferentes e os testes nativos Android/iOS continuam obrigatórios.

## Em caso de erro

O instalador interrompe-se se o esquema `artist_hub` já existir. Se um comando falhar no SQL Editor, registar **a mensagem exacta do erro** sem publicar chaves, passwords, JWTs ou outros segredos, e analisar antes de tentar novamente. Não usar `DROP SCHEMA CASCADE` nem recriar todo o Supabase como tentativa de reparação.

## Referências oficiais

- Supabase — [Using custom schemas](https://supabase.com/docs/guides/api/using-custom-schemas)
- Supabase — [Docker self-hosting](https://supabase.com/docs/guides/self-hosting/docker)
- Supabase — [Docker configuration](https://github.com/supabase/supabase/blob/master/docker/CONFIG.md)
