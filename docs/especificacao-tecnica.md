# ARTIST HUB — Especificação técnica, versão 0.1

Data-base: 13 de Novembro de 2026. Documento inicial de engenharia.

## Objectivo

Desenvolver uma plataforma SaaS multiartista com aplicações Android/iOS de marca própria, reutilizando o mesmo núcleo de serviços e isolando, por artista, a comunidade, os conteúdos, os colaboradores e as receitas. O primeiro pacote é um piloto técnico que comprova navegação móvel, autenticação, selecção de artista, feed público, agenda, adesão e envio de perguntas gratuitas.

## Perfis e responsabilidades

- **Visitante:** consulta artistas activos, notícias públicas e eventos publicados.
- **Fã autenticado:** adere a comunidades e envia perguntas gratuitas; mais tarde poderá comprar benefícios.
- **Artista:** gere a identidade e as interacções próprias através de painel seguro (fase futura).
- **Gestor:** publica conteúdos, aprova pedidos e opera vendas de um artista (fase futura).
- **Moderador:** analisa denúncias e aplica bloqueios apenas ao seu artista (fase futura).
- **Operador da plataforma:** cria artistas e gere facturação SaaS, sem exposição de credenciais em clientes móveis (fase futura).

## Domínios funcionais

| Área | Primeiro protótipo | Próximas fases |
|---|---|---|
| Descoberta/identidade | Lista de artistas, contexto seleccionado | Pesquisa, marca própria por APK/IPA |
| Autenticação | Supabase email/palavra-passe | OTP, recuperação de conta, OAuth |
| Comunidade | Adesão e publicações oficiais | Feed interactivo, comentários e moderação |
| Relação com artista | Pergunta gratuita registada | Caixa de entrada, SLA, resposta em áudio/vídeo |
| Eventos | Agenda publicada, URL de bilhetes | Reservas, check-in, QR de bilhetes |
| Fidelização | Campo de nível e pontos reservado no esquema | Regras de pontuação e antifraude |
| Comércio | Tabelas financeiras não operacionais | Pagamentos, subscrições, recibos, reembolsos |
| Administração | Não implementado | Portal de gestão multiartista e relatórios |
| Notificações | Não implementado | Push, preferências e opt-in |

## Critérios de aceitação — piloto

1. Aplicação arranca em Android/iOS como projecto Expo React Native, sem WebView como interface principal.
2. Sem `.env`, funciona em modo **Demonstração**, sem rede, com dados explicitamente fictícios.
3. Com Supabase configurado e esquema exposto, consulta artistas `active`, posts `published/public` e eventos publicados.
4. Um fã consegue criar conta, confirmar o email quando necessário, iniciar sessão e aderir ao artista escolhido.
5. Um fã autenticado consegue enviar uma pergunta de 10 a 1000 caracteres, sem pagamento.
6. Todas as consultas executadas pela aplicação respeitam RLS; dados de um artista não são misturados com os de outro.
7. A aplicação não contém `service_role`, chaves secretas, credenciais bancárias ou confirmação directa de pagamento.

## Fora do âmbito da primeira versão

Chat privado operacional, conteúdo VIP, livestream, vídeos pagos, subscrições, push, moderação interactiva, venda de bilhetes, dashboards e publicação em lojas. A base de dados contém algumas entidades reservadas para estes módulos, mas **não são funcionalidades concluídas**.

## Critérios de qualidade e segurança antes de produção

- Mecanismo de denúncia/bloqueio, moderação, termos de utilização, política de privacidade e consentimento.
- Limites por utilizador/IP, CAPTCHA quando justificável e retenção limitada de mensagens.
- Testes automatizados das políticas de isolamento; testes E2E em Android/iOS.
- Upload privado, moderação de anexos, CDN, optimização de vídeos, observabilidade e auditoria.
- Backups de PostgreSQL e Storage, plano de recuperação e rotação de credenciais.
- Backend de pagamentos com verificação de assinaturas e idempotência; direitos de acesso apenas concedidos após confirmação autorizada.
- Conformidade com as políticas de compras digitais da App Store e Google Play, inclusive quando houver M-Pesa ou e-Mola.

## Monetização — decisão adiada

Construir uma *camada de pagamentos* independente de fornecedores: `purchase_intents` -> provedores -> webhooks verificados -> `payments` -> `entitlements`, com auditoria. A escolha de meios de pagamento e a classificação dos bens digitais/físicos deverá ser feita antes de implementar compras dentro da aplicação. Os valores são definidos por artista e não partilhados entre comunidades.
