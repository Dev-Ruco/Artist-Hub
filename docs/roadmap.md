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


## Fase 3 — experiências privadas com Mr. Bow (16/11/2026)

- [x] Ecrã nativo para escolher chamada de áudio ou vídeo, duração e horário, com preços dependentes de configuração real
- [x] Estrutura PostgreSQL para catálogo, agenda, reserva provisória, pagamentos e sessões isoladas
- [x] RPC para horários disponíveis e histórico de reservas do próprio fã
- [x] Segurança: reservas sobrepostas impedidas, bloqueio de vendas por omissão e confirmação financeira exclusiva do servidor
- [x] Gateway privado preparado para validar JWT Supabase e emitir tokens LiveKit apenas a participantes autorizados
- [x] Dockerfile do gateway e validação de sintaxe no CI
- [ ] Aplicar migração 0003 em Supabase de testes e verificar RLS/conflitos
- [ ] Criar painel de preços, disponibilidade e gestão da agenda de Mr. Bow
- [ ] Escolher meio de pagamento e integrar checkout com webhook verificado e idempotente
- [ ] Instalar LiveKit React Native em build de desenvolvimento compatível com Expo e testar Android/iOS
- [ ] Adicionar encerramento automático das sessões e gestão de cancelamentos, não comparências e reembolsos
- [ ] Publicar após testes de segurança, qualidade e conformidade

Ver `docs/chamadas-privadas-mr-bow.md`.
