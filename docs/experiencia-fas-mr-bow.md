# Experiência de fãs de Mr. Bow — implementação da fase 1

## Produto
O utilizador descarrega uma aplicação exclusiva de **Mr. Bow** (React Native/Expo), não uma plataforma de escolha entre artistas. O código continua reutilizável como base de futuras aplicações independentes.

## Funcionalidades agora implementadas em código
- **Conta:** registo por email e palavra-passe com nome; iniciar sessão, mostrar/ocultar palavra-passe, pedir email de recuperação; mensagens de erro e confirmação.
- **Perfil:** carregar e actualizar nome em `mrbowapp.profiles`, com RLS; actualizar `full_name` nos metadados Auth para personalizar a saudação.
- **Comunidade:** mostrar se o fã já aderiu; adesão idempotente a `artist_memberships` e filtro de publicações por novidades, música e bastidores.
- **Conteúdos:** feed público filtrado por `artist_id`; fotografias HTTPS com extensões reconhecidas nos cartões; actualização manual.
- **Perguntas:** enviar pedido à equipa e consultar histórico e estados (`pending`, `answered`, `declined`). Limite máximo de três perguntas gratuitas/24 horas aplicado no PostgreSQL pela migração 0001. O indicador da app é apenas informativo: o bloqueio autoritativo continua na base de dados.
- **Distinção entre conteúdos demonstrativos e reais:** não apresentar os exemplos como publicações oficiais.

## Infra-estrutura necessária para funcionalidades reais
1. Num **ambiente Supabase de testes**, executar o instalador `install_mrbowapp_existing_schema.sql` se o esquema `mrbowapp` existir e estiver vazio (agrega as migrações 0001, 0002 e 0003).
2. Expor o schema `mrbowapp` na API do Supabase self-hosted e confirmar HTTPS, Auth e PostgREST.
3. Criar o registo activo do artista `slug = mr-bow`, `display_name = Mr. Bow`. O `seed_pilot.sql` é apenas para desenvolvimento: cria conteúdo fictício, que **não deve ser publicado como notícia real**.
4. Configurar `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Nunca colocar `service_role` no cliente móvel.
5. Confirmar entrega dos emails transaccionais e configurar o URL de recuperação na aplicação e no Supabase. **O ecrã actual permite solicitar o email; a etapa de conclusão da alteração da palavra-passe e o tratamento do deep link ainda exigem implementação e testes.**
6. Testar a adesão com dois utilizadores: cada fã deve ver apenas os seus pedidos e perfil. Validar que ninguém pode alterar o nível VIP, os pontos ou os pagamentos através da chave publicável.
7. Testar em Android e iPhone reais, incluindo teclado, zonas seguras, desempenho do hero, notificações de erros e recuperação de sessão.

## O que continua deliberadamente inactivo
- Conversas privadas em tempo real, mensagens de voz e lives;
- Benefícios e pagamentos VIP;
- Comentários públicos, chat comunitário, denúncias e moderação operacional;
- Painel administrativo de Mr. Bow e ferramentas de publicação de conteúdos;
- Notificações push;
- Publicação nas lojas Android e iOS.

Estas funções só devem ser disponibilizadas ao público depois de existir suporte de backend, moderação, testes RLS e a validação dos requisitos das lojas de aplicações.

## Testes funcionais mínimos
1. Modo demonstração: ecrãs de conteúdos funcionam, registo e envio de perguntas não persistem dados.
2. Registo: validar nome de 2 a 80 caracteres, email válido, palavra-passe de pelo menos 8 caracteres e sessão.
3. Perfil: guardar nome e reler depois de sair e voltar a entrar.
4. Comunidade: aderir uma vez, voltar ao ecrã e confirmar que o estado continua activo.
5. Perguntas: enviar três mensagens válidas em 24 horas; a quarta deve ser recusada pelo trigger na BD.
6. Segurança: o segundo utilizador não pode ler os pedidos, o perfil ou a adesão do primeiro.
7. Feed: filtrar por categoria, abrir sem sessão e verificar que não são apresentados dados privados.
