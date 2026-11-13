# Publicação no Coolify — Web de demonstração

O Artist Hub é, em primeiro lugar, uma aplicação React Native para Android/iOS. O Dockerfile publica **apenas** a versão de demonstração Web da aplicação, utilizando Expo Web e Nginx.

## Configuração no Coolify

1. Abra a aplicação correspondente ao repositório `Dev-Ruco/Artist-Hub`.
2. Em **General**, confirme Git Source = `main` e **Base Directory** = `/` (raiz).
3. Escolha **Build Pack = Dockerfile**, com **Dockerfile Location = `/Dockerfile`**.
4. Configure **Ports Exposes = `80`**, pois o servidor Nginx escuta na porta 80 dentro do contentor.
5. Deixe **Ports Mappings** vazio, quando utilizar o domínio público do proxy.
6. Grave e execute **Redeploy**. Se o serviço antigo tiver sido criado como Nixpacks/Railpack, confirme que a alteração do Build Pack realmente foi aplicada.
7. Confirme nos *deployment logs* a construção do Expo Web e o arranque do Nginx. O URL temporário deve mostrar a demonstração com a faixa “Dados fictícios”.
8. Opcionalmente, use `/healthz` no URL temporário para confirmar resposta `ok`.

## Se persistir 502 Bad Gateway

- Confirme o estado do contentor (Running/Healthy) e os *Runtime Logs*.
- Em **General**, verifique que a porta exposta é **80**, e não 3000, 8080 nem 8081.
- Verifique o **Domain** configurado no Coolify: deve corresponder ao host que está a abrir.
- Confirme que o proxy Coolify está activo e que o serviço partilha a rede necessária.
- Se o build falhar, copie o erro concreto dos *Deployment Logs*; o URL não funcionará antes de o contentor estar em execução.

## Limitações

- Não é um APK nem um IPA. A compilação móvel será feita posteriormente com EAS Build.
- Sem variáveis `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, funciona em modo demonstrativo.
- Para ligar o backend em produção, as variáveis `EXPO_PUBLIC_*` são incorporadas **no build**. Nunca coloque chaves secretas neste formato.
- O Nginx serve um SPA estático; não existem serviços API neste contentor.
