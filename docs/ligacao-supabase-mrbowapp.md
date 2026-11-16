# Ligação directa da aplicação Mr. Bow ao Supabase self-hosted

**Base:** Supabase alojado no Coolify. **URL:** `https://supabase.datacenterhub.tech`. **Schema:** `mrbowapp`. **Artista:** `mr-bow`.

O SQL já foi executado pelo proprietário e foram confirmadas 18 tabelas com RLS e o registo activo de Mr. Bow. O serviço PostgREST foi configurado para expor `mrbowapp`. A chave pública ainda necessita de ser inserida no ambiente de compilação da aplicação.

## 1. Configurar as variáveis no Expo

Abre [o projecto Expo de Mr. Bow](https://expo.dev/accounts/ruco222/projects/ruco), depois **Project settings → Environment variables → Add Variables**.

Define estas variáveis com o ambiente **preview**:

| Variável | Valor |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://supabase.datacenterhub.tech` |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Valor da **chave pública anon** do Supabase self-hosted |
| `EXPO_PUBLIC_ARTIST_SLUG` | `mr-bow` |
| `EXPO_PUBLIC_ARTIST_NAME` | `Mr. Bow` |

A chave `anon` é publicada no bundle do React Native e só pode ter as permissões autorizadas por RLS. **Nunca usar `service_role`, `JWT_SECRET` ou a password PostgreSQL.**

Para localizar a chave pública na instalação self-hosted, consulta as variáveis de ambiente do Supabase/Kong no Coolify ou as definições API do Studio, caso estejam disponíveis. Os nomes podem variar conforme a instalação; procura `ANON_KEY` ou a chave equivalente para o papel `anon`. **Não copiar `SERVICE_ROLE_KEY`.**

No Expo, a visibilidade pode ser **Sensitive** (ou Plain text) para valores `EXPO_PUBLIC_*`. Não marcar como Secret, porque estas variáveis têm de estar acessíveis no momento da compilação.

**Atenção:** o nome de ambiente tem de ser `preview`; o workflow `apps/mobile/.eas/workflows/deploy-preview.yml` já especifica `environment: preview`. A exportação Expo substitui as variáveis públicas em tempo de compilação.

## 2. Publicar uma nova pré-visualização

Depois de guardar as variáveis, volta ao projecto Expo, abre **Workflows** e executa novamente o workflow de pré-visualização Web. Alterar uma variável não actualiza retroactivamente as compilações existentes.

Ao abrir o resultado publicado, acede ao separador **Perfil**, desce até **Ligação à base de dados** e carrega em **Testar ligação**.

O resultado correcto é:
`Ligação confirmada: o registo activo de Mr. Bow foi encontrado na base de dados.`

A aplicação lê a tabela `mrbowapp.artists` com a chave pública e o cabeçalho de esquema apropriado, usando `supabase.schema('mrbowapp')`. Se o teste falhar:
- `PGRST106`: confirma que `mrbowapp` está na lista `PGRST_DB_SCHEMAS` do container REST, e que este foi reiniciado.
- `401` ou `PGRST301`: valida o valor da chave pública anon e o serviço Kong.
- `42501`: valida os `GRANT` e as políticas de leitura.
- Falha de rede: verifica HTTPS, DNS, CORS e funcionamento do gateway.

## 3. Testar no Mac (opcional)

Dentro da pasta `apps/mobile`, cria `.env.local` com as mesmas variáveis. O `.gitignore` exclui o ficheiro; não o adiciones ao GitHub. Depois executa a aplicação e abre o ecrã Perfil para testar a ligação.

## 4. Depois da ligação

Confirmar registo/início de sessão Supabase Auth, criação de perfil em `mrbowapp.profiles`, adesão de fã à comunidade, leitura de publicações e envio de perguntas. Os serviços VIP, chamadas e pagamentos continuam desactivados até terem backend seguro e testes.

**Não é necessário executar novamente as migrações SQL.**
