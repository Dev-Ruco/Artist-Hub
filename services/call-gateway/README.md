# Gateway de chamadas — Mr. Bow

Serviço **Node.js 22+ separado da aplicação móvel**. O projecto não contém segredos de produção nem está implantado.

## Endpoint

`POST /v1/calls/token`

- Header: `Authorization: Bearer <Supabase access token>`
- Body JSON: `{"booking_id":"uuid"}`
- Exige um utilizador Auth verificado, uma reserva **confirmada**, participação autorizada e uma janela temporal válida.
- Resposta de sucesso: `{ "url": "wss://...", "token": "...", "call_kind": "audio|video", "slot_ends_at": "..." }`.
- Credenciais de sessão expiram rapidamente. **Expiração do token de entrada não termina chamadas activas.** Será necessário adicionar um processo de encerramento das salas no fim do horário antes do lançamento público.

## Configuração

1. Executar a migração `0003_private_calls.sql` num Supabase de testes, depois das migrações 0001 e 0002.
2. Configurar variáveis da lista `.env.example` como *secrets do servidor* no gestor de alojamento. Nunca incluir `service_role` nem `LIVEKIT_API_SECRET` no cliente móvel.
3. Num ambiente isolado, executar `npm install` e `npm run start` a partir de `services/call-gateway`.
4. Expor apenas por HTTPS através de proxy reverso. Configurar rate-limiting persistente, logs sem tokens, monitorização, timeout e protecção contra tráfego abusivo.
5. Configurar as ligações nativas LiveKit apenas quando as versões do SDK, Expo e plugins forem verificadas em dispositivos Android/iOS reais.

## Pagamentos

**Este gateway não cobra nem confirma pagamentos.** Não existe endpoint genérico de webhook porque cada fornecedor (M-Pesa, e-Mola, loja Apple/Google, cartão) exige validações próprias. Quando o fornecedor for escolhido, o backend deverá:

1. Criar ou obter uma reserva via `mrbowapp.request_call_booking` com JWT do fã.
2. Criar a intenção de pagamento no fornecedor, validando montante, moeda e prazo.
3. Confirmar a assinatura e o estado do pagamento através de webhook do fornecedor, evitando repetições.
4. Chamar `mrbowapp.confirm_call_booking_payment` usando apenas `service_role`.
5. Emitir o token de chamada com a API acima durante a janela autorizada.

A aplicação mantém a reserva e cobrança **desactivadas** até este percurso estar concluído.

## Encerramento de chamadas

Antes de produção, um serviço agendado terá de executar o encerramento por hora de fim (por exemplo, com `RoomServiceClient.deleteRoom(roomName)` e actualização de `call_sessions` no servidor). Também é necessário impedir acesso sem confirmação, cancelar salas reembolsadas e reforçar regras antifraude. Não disponibilizar o endpoint ao público sem esses mecanismos.
