# Publicar a API Java de Mr. Bow no Coolify

A API é um serviço **novo e separado** do Supabase. **Não modificar o Docker Compose do Supabase.** O backend comunica com a instalação existente através do gateway REST do Supabase, respeitando a segurança RLS.

## 1. Criar um serviço novo no Coolify

1. Abre o projecto de Mr. Bow no Coolify.
2. Escolhe **New Resource → Application → GitHub Repository**.
3. Repositório: `Dev-Ruco/Artist-Hub` · Branch: `main`.
4. Define **Base Directory**: `/apps/backend`.
5. Escolhe **Build Pack: Dockerfile** e Dockerfile na pasta `apps/backend` (normalmente `/Dockerfile` quando a Base Directory já está definida).
6. Porta interna: `8080` (não confundir com a porta 80 da pré-visualização Web).
7. Usa um domínio HTTPS próprio para esta API. O domínio só fica definido quando o utilizador o configurar.

O Dockerfile do backend é `apps/backend/Dockerfile`. O Dockerfile na raiz pertence à pré-visualização Web.

## 2. Definir variáveis do backend

No novo serviço Java, em **Environment Variables**, adiciona:

| Nome | Valor |
|---|---|
| `PORTA_API` | `8080` |
| `SUPABASE_ENDERECO` | `https://supabase.datacenterhub.tech` |
| `SUPABASE_CHAVE_ANONIMA` | A chave **anon** pública do Supabase self-hosted |
| `ORIGENS_PERMITIDAS` | O endereço HTTPS da aplicação Web, quando existir |

Para testar no navegador local, pode temporariamente usar `http://localhost:8081,http://localhost:19006` em `ORIGENS_PERMITIDAS`.

**Nunca introduzir:** `SERVICE_ROLE_KEY`, `JWT_SECRET`, palavra-passe da base de dados ou segredos de pagamento. O código já fixa o esquema `mrbowapp` e o artista `mr-bow`.

A chave anon é pública, mas deves guardá-la na configuração do novo backend e não a divulgar em mensagens. O backend exige-a para iniciar; não inventes outro valor.

## 3. Publicar e testar

1. Guarda as variáveis.
2. Faz Deploy **apenas da nova aplicação Java**, não do Supabase.
3. Em **Health Checks**, configura o percurso `/actuator/health` para a porta interna `8080`.
4. Abre no navegador `https://TEU-DOMINIO-API/actuator/health`; deve apresentar `{"status":"UP"}`.
5. Abre `https://TEU-DOMINIO-API/api/v1/artista`; deve apresentar a resposta de Mr. Bow.
6. Abre `https://TEU-DOMINIO-API/swagger-ui.html` para ver a descrição de todas as rotas.

O resultado `{"status":"UP"}` confirma o arranque do Java, **não** confirma a ligação ao PostgREST. Para isso, o teste de `/api/v1/artista` é indispensável.

## 4. Ligar o React Native e a pré-visualização Web

Só depois da API estar operacional:

- No Expo ou no Coolify da **aplicação Web**, define `EXPO_PUBLIC_API_URL=https://TEU-DOMINIO-API` como variável pública **disponível na compilação**.
- Em modo API Java, não é necessário definir `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` na aplicação.
- Volta a compilar a aplicação móvel/Web. Apenas reiniciar o contentor Web não actualiza variáveis incorporadas no bundle Expo.
- No ecrã **Perfil → Ligação à base de dados → Testar ligação** deve aparecer a indicação de ligação à API Java.

Depois, testar com dois fãs distintos: registo, login, perfil, adesão, perguntas e autorização. Confirmar que um fã não consegue consultar ou alterar os dados do outro. A confirmação de emails precisa de SMTP configurado no Supabase Auth.

## 5. Operação e segurança

- HTTPS obrigatório em produção.
- `ORIGENS_PERMITIDAS` deve conter apenas as origens Web efectivas; não utilizar `*` com aplicações autenticadas.
- Garantir que a API não está acessível sem autenticação nas rotas de perfil, adesão, perguntas e reservas pessoais.
- Não activar pagamentos e chamadas a partir dos ecrãs actuais; as operações continuam deliberadamente bloqueadas.
- Fazer backup da base antes de futuras migrações SQL, especialmente porque o Supabase é partilhado com outros projectos.

## 6. Desenvolvimento local

Com Java 21 e Maven instalados:

```bash
cd apps/backend
cp .env.exemplo .env
# Preencher o valor SUPABASE_CHAVE_ANONIMA no .env local (não enviar ao Git)
set -a
source .env
set +a
mvn test
mvn spring-boot:run
```

O ficheiro `.env` deve estar excluído do Git por `.gitignore`. O ficheiro `.env.exemplo` contém apenas modelos, sem segredos.
