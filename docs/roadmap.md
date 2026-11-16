# Roadmap por marcos de entrega

## Marco 0 — Starter (incluído)

- [x] Base React Native + Expo Router para Android/iOS
- [x] Navegação com 5 separadores
- [x] Modo de demonstração offline e selector de artista
- [x] Supabase Auth por email/palavra-passe
- [x] Leitura de feed e eventos com filtros por artista
- [x] Adesão a comunidade e envio de pergunta gratuita
- [x] Primeira migração PostgreSQL com RLS
- [x] Estrutura GitHub e workflow de typecheck
- [ ] Teste de compilação com dependências (npm indisponível neste ambiente)
- [ ] APK/IPA real (requer EAS + credenciais)

## Marco 1 — Segurança e experiência real

- [ ] Testes de isolamento RLS multiartista e antifraude
- [ ] Onboarding com recuperação de conta
- [ ] Criação de perfil do fã
- [ ] Painel básico para publicar notícias e eventos
- [ ] Sistema de denúncia, bloqueio e moderação
- [ ] Optimização de fotografias e uploads com permissões

## Marco 2 — Comunicação

- [ ] Caixa de entrada operacional e prioridades
- [ ] Conversas privadas e chat comunitário moderado
- [ ] Mensagens de voz/fotografias com limites
- [ ] Notificações push e gestão de consentimento

## Marco 3 — Monetização

- [ ] Catálogo de planos e produtos por artista
- [ ] Facturação, webhooks e concessão auditável de direitos
- [ ] Integração dos meios de pagamento permitidos por cada loja
- [ ] Loja física, bilhetes e relatórios financeiros

## Marco 4 — White-label

- [ ] Configuração de ícone, nome, package ID, cores e assets por artista
- [ ] Builds EAS independentes e distribuição por contas autorizadas
- [ ] Portal SaaS e gestão do ciclo de vida de artistas


## Actualização — experiência dos fãs de Mr. Bow (Novembro de 2026)

O produto é uma **aplicação exclusiva de Mr. Bow**, não um marketplace. As funcionalidades seguintes estão implementadas em código e validadas em TypeScript/Expo Web:

- [x] Ecrãs de registo com nome, login e pedido de recuperação de acesso
- [x] Perfil pessoal editável e sincronização do nome com Auth
- [x] Adesão persistente à comunidade e estado de membro
- [x] Feed de publicações filtrado por novidades, música e bastidores
- [x] Apresentação de fotografias HTTPS em publicações
- [x] Envio e histórico de perguntas gratuitas com estados de acompanhamento
- [x] Migração SQL opcional para criar perfis automaticamente no registo
- [ ] Aplicar e testar migrações no Supabase real, com isolamento RLS
- [ ] Completar o fluxo de recuperação da palavra-passe por deep link Android/iOS
- [ ] Testar a aplicação em dispositivos reais e gerar APK/IPA
- [ ] Painel administrativo para publicação de conteúdos
- [ ] Moderação, bloqueios e mecanismos de denúncia antes de chats
- [ ] Funcionalidades VIP e pagamentos seguros, depois da aprovação das políticas de lojas

Ver `docs/experiencia-fas-mr-bow.md`.
