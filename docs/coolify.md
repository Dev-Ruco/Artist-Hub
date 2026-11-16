# Pré-visualização Web de Mr. Bow no Coolify

A aplicação é nativa em React Native/Expo. O Coolify aloja apenas uma versão Web de teste, separada do Supabase self-hosted.

O ambiente Supabase existente foi confirmado com:
- URL: `https://supabase.datacenterhub.tech`
- Esquema de dados: `mrbowapp` (18 tabelas com RLS)
- Artista: `mr-bow`, nome `Mr. Bow`

**Não alterar o Docker Compose do Supabase para instalar a aplicação Web.** A aplicação deve ser um recurso separado no Coolify.

## Configuração no Coolify

1. Abre a aplicação GitHub do repositório `Dev-Ruco/Artist-Hub` (ou cria uma aplicação separada para este repositório).
2. Em General, confirma a branch `main`, Base Directory `/` e Build Pack/Build Strategy `Dockerfile`.
3. O caminho do Dockerfile é `/Dockerfile`. Configura a porta interna `80`.
4. Em **Environment Variables**, define:

   | Name | Value | Build time |
   |---|---|---|
   | `EXPO_PUBLIC_SUPABASE_URL` | `https://supabase.datacenterhub.tech` | Sim |
   | `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave pública **anon** do teu Supabase | Sim |

5. Se o Coolify utilizar a opção **Advanced → Build → Build arguments**, mantém a configuração compatível com o Dockerfile, que já declara os respectivos `ARG`. A modalidade *Managed manually in Dockerfile* evita declarações duplicadas quando o Coolify permitir.
6. Guarda e executa um novo **Deploy**, e não apenas Restart, porque o Expo incorpora as variáveis no JavaScript durante a compilação.
7. Abre a URL publicada, entra em **Perfil → Ligação à base de dados → Testar ligação**. O resultado esperado é o registo activo de Mr. Bow.

O valor `anon` é uma chave pública incluída no cliente, mas **nunca utilizar `service_role` nem outros segredos**.

## Se o teste falhar

- Não aparece a ligação no ecrã: verifica que o Coolify publicou o último commit da branch main.
- Continua a mostrar modo de demonstração: confirma que a chave `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` está definida, com **Available at build time** activo. É necessário fazer novo Deploy.
- `PGRST106`: verifica que o serviço REST/PostgREST do Supabase expõe `mrbowapp`, sem retirar os outros esquemas.
- API inacessível: confirma o certificado HTTPS, DNS, Kong, CORS e que a instância continua saudável.
- 502 Bad Gateway na pré-visualização: confirma a porta interna `80` e os logs Nginx.

## Limites da pré-visualização Web

Não substitui a aplicação nativa, APK/IPA, nem testa chamadas LiveKit no iOS/Android. Compras, reservas e chamadas continuam bloqueadas.
