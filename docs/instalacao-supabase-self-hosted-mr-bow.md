# Mr. Bow — instalar no esquema mrbowapp do Supabase self-hosted

O esquema foi criado no Supabase self-hosted através do Coolify, e o SQL Editor confirmou:
```json
{"esquema":"mrbowapp","total_tabelas":0,"tabelas_com_rls":0}
```

**Não utilizar o instalador antigo**, que foi descontinuado. O ficheiro correcto é:

[Instalar no esquema existente mrbowapp](../infra/supabase/install_mrbowapp_existing_schema.sql).

## 1. Fazer backup e verificar o estado da base

Antes de aplicar qualquer alteração à instância partilhada, confirmar que existe um backup PostgreSQL recuperável. No SQL Editor, executar a seguinte consulta, que não altera dados:

```sql
select current_database() as base,
       current_user as utilizador_sql,
       to_regnamespace('mrbowapp') is not null as esquema_existe,
       (select count(*) from pg_catalog.pg_tables
        where schemaname='mrbowapp') as tabelas_existentes;
```

O resultado esperado antes da primeira instalação é `esquema_existe = true` e `tabelas_existentes = 0`. Se já existirem tabelas ou outros objectos, **não executar este instalador inicial**.

## 2. Executar no SQL Editor

1. Abrir [o novo instalador](../infra/supabase/install_mrbowapp_existing_schema.sql) no GitHub.
2. Copiar **todo** o conteúdo, de `BEGIN;` até à consulta `SELECT` final.
3. Colar no SQL Editor do Supabase self-hosted e executar com permissões administrativas.
4. A migração é atómica: qualquer erro antes de `COMMIT` provoca rollback da transacção, desde que o script seja executado integralmente.
5. O instalador interrompe-se se detectar objectos no esquema `mrbowapp`, para não sobrescrever dados.

Cria **18 tabelas** com RLS, funções de segurança e o registo do artista `Mr. Bow`. Cria ainda um trigger restrito em `auth.users`, que só introduz um perfil no `mrbowapp` quando o registo possui o marcador `artist_app = mr-bow` — não altera contas de outros projectos.

O SQL não cria objectos em `public`, não activa pagamentos nem chamadas e não introduz preços ou publicações fictícias.

## 3. Confirmar instalação

No fim do SQL, a consulta de validação deverá indicar:

| tabelas | tabelas_com_rls | artista_mr_bow | vendas_activadas |
|---|---|---|---|
| 18 | 18 | 1 | 0 |

Podes também executar:
```sql
select tablename, rowsecurity from pg_catalog.pg_tables
where schemaname='mrbowapp' order by tablename;
```

## 4. Expor mrbowapp no serviço REST/PostgREST do Coolify

Depois da instalação, no Coolify, abrir as variáveis do serviço Supabase REST/PostgREST e acrescentar `mrbowapp` à lista da variável `PGRST_DB_SCHEMAS` **sem retirar qualquer esquema actualmente utilizado por outros projectos**.

Exemplo meramente ilustrativo:

```env
PGRST_DB_SCHEMAS=public,graphql_public,mrbowapp
```

Manter os restantes valores da tua instalação. Reiniciar apenas o serviço afectado e confirmar que as restantes aplicações continuam a funcionar.

## 5. Ligar a aplicação React Native

`apps/mobile/src/lib/supabase.ts` já aponta para `supabase.schema('mrbowapp')`. Falta fornecer ao Expo o URL público da tua instalação e uma chave publicável/anon:

```env
EXPO_PUBLIC_SUPABASE_URL=https://SEU-SUPABASE
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICAVEL
EXPO_PUBLIC_ARTIST_SLUG=mr-bow
EXPO_PUBLIC_ARTIST_NAME=Mr. Bow
```

Nunca partilhar nem colocar no cliente `service_role`, password PostgreSQL, JWT secret ou credenciais de pagamentos. A chave de serviço só poderá ser usada por servidores protegidos.

## 6. Após a instalação

Testar duas contas de fãs, registo, perfis, RLS, adesão, feed e envio de perguntas. O envio de emails depende do SMTP do Supabase Auth. Reservas de chamadas e compras continuam desactivadas até haver backend financeiro verificado, preços/agenda aprovados e gateway WebRTC operacional.

Se houver erro, comunicar apenas a mensagem PostgreSQL e o número da linha — nunca enviar passwords ou chaves privadas. Não executar comandos `DROP SCHEMA` para corrigir erros.
