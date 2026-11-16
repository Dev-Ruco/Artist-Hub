# Chamadas privadas — Mr. Bow

## Estado da implementação

O produto continua a ser uma aplicação nativa exclusiva de Mr. Bow. Implementámos o primeiro módulo de experiências privadas pagas, sem activar qualquer cobrança ou sessão verdadeira.

### Código já existente
- `apps/mobile/app/calls/index.tsx`: escolha de áudio/vídeo, serviços, duração, preços apenas quando existirem na base de dados, horários, selecção visual e histórico pessoal.
- `apps/mobile/src/hooks/useCallOffers.ts`: consulta de serviços e RPCs de horários/reservas no esquema `artist_hub`.
- `infra/supabase/migrations/0003_private_calls.sql`: cinco tabelas e RPCs para gerir serviços, disponibilidade, bloqueios de pagamento, reservas atómicas e autorização de participação.
- `services/call-gateway`: serviço Node separado da aplicação, com validação do JWT Supabase e geração de token temporário LiveKit para reservas confirmadas.
- `services/call-gateway/Dockerfile`: contentor para implantação futura num servidor separado.

### O que não está activo
- Preços e horários verdadeiros de Mr. Bow: ainda não foram definidos.
- Reservas reais na aplicação: botão intencionalmente desactivado.
- Gateway M-Pesa/e-Mola/cartão ou compras nas lojas: não instalado.
- Realização de chamadas nativas: LiveKit React Native ainda não foi instalado e testado com Expo SDK 58.
- Cron de encerramento de salas: não implementado.
- Painel de gestão de agenda e controlo de sessões: fase seguinte.
- Configuração e implantação na tua instância Supabase: não executadas.

## Modelo de segurança

A função `request_call_booking` atribui uma reserva provisória de 15 minutos, bloqueando o horário para evitar dupla marcação. Impede conflitos com outros tipos de chamada agendados no mesmo período. A reserva é apenas uma intenção pendente; **não equivale a pagamento**.

A venda só é permitida no servidor quando `call_sales_settings.sales_enabled = true` e `payment_backend_ready = true`. Ambos os valores são `false` por omissão.

O fã não pode alterar o valor, confirmar pagamentos ou criar sessões. Só um backend fiável, após confirmar o webhook e os montantes recebidos, pode executar `confirm_call_booking_payment` com credenciais restritas.

O gateway usa `authorize_call_participant`: verifica o utilizador autenticado, confirmação da reserva, horário e a sua relação com o artista. O LiveKit emite token de participação apenas para essa sala. **Não colocar segredos no React Native.**

## Ordem de activação segura

1. Aplicar as migrações `0001`, `0002`, `0003` num ambiente Supabase de testes e verificar as permissões, sem tocar na produção.
2. Configurar os serviços e horários reais de Mr. Bow através de interface administrativa restrita a gestores autorizados.
3. Definir durações, preços, política de cancelamento e não comparência.
4. Escolher o meio de pagamento adequado às regras das lojas Android e iOS; implementar checkout e webhook específico com verificação de assinatura, moeda, montante e idempotência.
5. Testar reservas simultâneas e a expiração de bloqueios após 15 minutos.
6. Implantar o gateway numa instância com HTTPS e segredos de servidor, com rate limiting distribuído, auditoria e monitorização.
7. Acrescentar o SDK LiveKit React Native apenas quando a compatibilidade com a versão do Expo estiver confirmada em compilações Android/iOS.
8. Implementar encerramento das salas após o período contratado; a expiração do token **não expulsa participantes já ligados**.
9. Testar duas contas de fã, conta de gestor, chamadas com rede lenta, privacidade, cancelamento, reembolso e gravações não autorizadas.

## Gestão da agenda

As tabelas foram desenhadas para permitir um futuro painel que crie serviços e slots, abra/feche dias, veja reservas e valide a disponibilidade. Não expor operações de gestão directamente com chave publicável, nem abrir o catálogo sem existir política de pagamentos e equipa responsável.

## Referências técnicas
- LiveKit Expo: https://docs.livekit.io/transport/sdk-platforms/expo/
- LiveKit Server SDK: https://docs.livekit.io/reference/server-sdk-js/
- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/

Última revisão: 16 de Novembro de 2026.
