import { createServer } from 'node:http';
import { createClient } from '@supabase/supabase-js';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

// SERVICO PRIVADO, NAO DESTINADO A EXECUCAO NO CLIENTE MOVEL.
// Este servico NAO gera intencoes de pagamento e NAO confirma pagamentos.
// Nunca expor SUPABASE_SERVICE_ROLE_KEY nem LIVEKIT_API_SECRET no Expo.
const required = [
  'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
  'LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET',
];
for (const variable of required) {
  if (!process.env[variable]) {
    throw new Error('Variavel de servidor obrigatoria em falta: ' + variable);
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const roleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const livekitUrl = process.env.LIVEKIT_URL;
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const allowedOrigins = (process.env.ALLOWED_WEB_ORIGINS || '')
  .split(',').map(x => x.trim()).filter(Boolean);
const port = Number(process.env.PORT || 8080);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT invalida');
}
if (!/^https:\/\//.test(supabaseUrl) || !/^wss:\/\//.test(livekitUrl)) {
  throw new Error('Supabase deve usar HTTPS e LiveKit deve usar WSS');
}

const supabaseAuth = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const supabaseAdmin = createClient(supabaseUrl, roleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const livekitApiUrl = livekitUrl.replace(/^wss:/, 'https:');
const rooms = new RoomServiceClient(livekitApiUrl, apiKey, apiSecret);

function respond(res, status, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, private',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'",
    ...extraHeaders,
  });
  res.end(payload);
}

function getCors(req) {
  const origin = req.headers.origin;
  if (!origin) return { accepted: true, headers: {} };
  if (!allowedOrigins.includes(origin)) return { accepted: false, headers: {} };
  return {
    accepted: true,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Vary': 'Origin',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  };
}

async function readJson(req) {
  let data = '';
  for await (const chunk of req) {
    data += chunk.toString('utf8');
    if (data.length > 8192) throw new Error('Pedido demasiado grande');
  }
  const parsed = JSON.parse(data);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('JSON invalido');
  }
  return parsed;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const server = createServer(async (req, res) => {
  const cors = getCors(req);
  if (!cors.accepted) return respond(res, 403, { error: 'Origem nao permitida' });
  if (req.method === 'OPTIONS') return respond(res, 204, {}, cors.headers);
  if (req.method === 'GET' && req.url === '/healthz') {
    return respond(res, 200, { status: 'ok' }, cors.headers);
  }
  if (req.method !== 'POST' || req.url !== '/v1/calls/token') {
    return respond(res, 404, { error: 'Endpoint inexistente' }, cors.headers);
  }

  // JWT do Supabase Auth, validado no servidor com getUser(), nunca no cliente.
  const header = req.headers.authorization || '';
  const token = /^Bearer (.+)$/i.exec(header)?.[1];
  if (!token) return respond(res, 401, { error: 'Sessao obrigatoria' }, cors.headers);

  try {
    const payload = await readJson(req);
    const bookingId = payload.booking_id;
    if (typeof bookingId !== 'string' || !uuidPattern.test(bookingId)) {
      return respond(res, 400, { error: 'Identificador invalido' }, cors.headers);
    }
    const { data: auth, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !auth.user?.id) {
      return respond(res, 401, { error: 'Sessao invalida ou expirada' }, cors.headers);
    }

    // A funcao SQL so devolve uma sessao com pagamento confirmado, dentro
    // da janela marcada e para o fa titular ou staff autorizado.
    // Um token LiveKit nunca e emitido com base apenas no booking_id.
    const { data, error } = await supabaseAdmin.schema('artist_hub')
      .rpc('authorize_call_participant', {
        p_booking_id: bookingId,
        p_user_id: auth.user.id,
      });
    if (error) {
      // Nao enviar erros SQL, dados internos ou configuracoes ao cliente.
      return respond(res, 503, { error: 'Autorizacao da chamada indisponivel' }, cors.headers);
    }
    const call = data?.[0];
    if (!call?.room_name || !call?.slot_ends_at || !['audio', 'video'].includes(call.call_kind)) {
      return respond(res, 403, { error: 'Chamada ainda nao autorizada' }, cors.headers);
    }

    const milliseconds = Date.parse(call.slot_ends_at) - Date.now();
    if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
      return respond(res, 403, { error: 'Janela de chamada terminada' }, cors.headers);
    }
    const ttl = Math.min(300, Math.max(30, Math.ceil(milliseconds / 1000)));

    try {
      await rooms.createRoom({
        name: call.room_name,
        maxParticipants: 2,
        emptyTimeout: 120,
        departureTimeout: 120,
      });
    } catch (roomError) {
      // Idempotencia: uma sala ja criada nao e um erro. Falhar fechado para
      // qualquer outra falha de rede, credenciais ou configuracao.
      const text = String(roomError?.message || '');
      if (!/already exists|already_exist|alreadyexists/i.test(text)) throw roomError;
    }

    const access = new AccessToken(apiKey, apiSecret, {
      identity: auth.user.id, // UUID opaco; nunca email ou nome.
      ttl,
    });
    access.addGrant({
      room: call.room_name,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: false,
      roomCreate: false,
      roomAdmin: false,
    });
    const jwt = await access.toJwt();
    return respond(res, 200, {
      url: livekitUrl,
      token: jwt,
      call_kind: call.call_kind,
      slot_ends_at: call.slot_ends_at,
    }, cors.headers);
  } catch {
    // Inclui falhas do LiveKit e JSON invalido. Nunca devolver detalhes sensiveis.
    return respond(res, 503, { error: 'Nao foi possivel preparar a chamada' }, cors.headers);
  }
});

server.requestTimeout = 15_000;
server.headersTimeout = 10_000;
server.listen(port, '0.0.0.0', () => {
  process.stdout.write('Call gateway activo na porta ' + port + '\n');
});
