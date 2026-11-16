-- MR. BOW / ARTIST HUB — INSTALADOR INICIAL PARA SUPABASE SELF-HOSTED
-- Versao: 2026-11-16 | Fonte: GitHub Dev-Ruco/Artist-Hub
--
-- IMPORTANTE: EXECUTAR UMA UNICA VEZ, NO SQL EDITOR, COM ROLE POSTGRES.
-- Requer extensao pgcrypto, roles Supabase anon/authenticated/service_role
-- e auth.users. Fazer backup/snapshot antes de executar em base partilhada.
-- Nao cria tabelas no schema public.
-- Interrompe se artist_hub ja existir; nao sobrescreve projectos existentes.
-- Nao confirma pagamentos nem activa chamadas: configuracao de vendas permanece OFF.
-- O trigger auth.users (da migracao 0002) so cria perfil quando
-- raw_user_meta_data.artist_app = 'mr-bow'.
--
-- NOTA: para a API funcionar, e necessario acrescentar artist_hub ao
-- PGRST_DB_SCHEMAS no servico REST do Coolify, sem retirar os schemas existentes.

BEGIN;
SET LOCAL lock_timeout = '8s';
SET LOCAL statement_timeout = '180s';

DO $install_guard$
BEGIN
  IF to_regnamespace('artist_hub') IS NOT NULL THEN
    RAISE EXCEPTION 'O schema artist_hub ja existe. Instalacao interrompida para proteger dados. Nao executar novamente.';
  END IF;
  IF to_regprocedure('pg_catalog.gen_random_uuid()') IS NULL THEN
    RAISE EXCEPTION 'Este PostgreSQL nao inclui gen_random_uuid(). Necessaria versao compativel antes da instalacao.';
  END IF;
  IF to_regclass('auth.users') IS NULL THEN
    RAISE EXCEPTION 'Supabase Auth auth.users nao encontrado. Confirme a instancia antes da instalacao.';
  END IF;
END
$install_guard$;


-- =======================================================================
-- MIGRACAO 0001 / infra/supabase/migrations/0001_artist_hub.sql
-- =======================================================================
-- Artist Hub / migração 0001
-- Executar no Supabase PostgreSQL com uma conta administrativa.
-- Configurar artist_hub como exposed schema no PostgREST ANTES de utilizar o cliente mobile.
-- Nenhum service_role ou segredo deverá ser incluído na aplicação móvel.
-- gen_random_uuid() e integrado no PostgreSQL actual; nao instalar extensoes globais.
create schema if not exists artist_hub;

grant usage on schema artist_hub to anon, authenticated, service_role;

create table if not exists artist_hub.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Fã',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_name_check check (char_length(display_name) between 1 and 80)
);

create table if not exists artist_hub.artists (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  tagline text,
  avatar_url text,
  banner_url text,
  accent_color text not null default '#A9E96C',
  is_verified boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'active', 'suspended')),
  created_at timestamptz not null default now(),
  constraint artists_slug check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint artists_name check (char_length(display_name) between 2 and 120)
);

create table if not exists artist_hub.artist_staff (
  artist_id uuid not null references artist_hub.artists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'moderator')),
  created_at timestamptz not null default now(),
  primary key (artist_id, user_id)
);

-- Função definer evita recursão de RLS; não deve ser alterada por utilizadores normais.
create or replace function artist_hub.is_artist_staff(p_artist_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from artist_hub.artist_staff s
    where s.artist_id = p_artist_id and s.user_id = (select auth.uid())
  );
$$;
revoke all on function artist_hub.is_artist_staff(uuid) from public;
grant execute on function artist_hub.is_artist_staff(uuid) to authenticated;

create table if not exists artist_hub.artist_memberships (
  artist_id uuid not null references artist_hub.artists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  level text not null default 'fan' check (level in ('fan', 'vip', 'promax')),
  points integer not null default 0 check (points >= 0),
  joined_at timestamptz not null default now(),
  primary key (artist_id, user_id)
);
create index if not exists membership_user_idx on artist_hub.artist_memberships(user_id);

create table if not exists artist_hub.posts (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artist_hub.artists(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  title text not null check (char_length(title) between 2 and 200),
  body text not null check (char_length(body) between 1 and 6000),
  media_url text,
  category text not null default 'novidade' check (category in ('novidade', 'musica', 'bastidores')),
  visibility text not null default 'public' check (visibility in ('public', 'vip')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz not null default now()
);
create index if not exists posts_artist_date_idx on artist_hub.posts(artist_id, published_at desc);

create table if not exists artist_hub.events (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artist_hub.artists(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 200),
  venue text not null,
  city text not null,
  starts_at timestamptz not null,
  ticket_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint ticket_url_https check (ticket_url is null or ticket_url ~* '^https://')
);
create index if not exists events_artist_start_idx on artist_hub.events(artist_id, starts_at);

create table if not exists artist_hub.message_requests (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artist_hub.artists(id) on delete cascade,
  fan_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 10 and 1000),
  request_type text not null default 'free' check (request_type in ('free', 'paid')),
  status text not null default 'pending' check (status in ('pending', 'answered', 'declined')),
  created_at timestamptz not null default now(),
  replied_at timestamptz
);
create index if not exists requests_artist_status_idx on artist_hub.message_requests(artist_id, status, created_at desc);
create index if not exists requests_fan_idx on artist_hub.message_requests(fan_id, created_at desc);

-- Protecção inicial contra envio repetitivo: máximo de 3 perguntas gratuitas
-- por fã e por artista num período móvel de 24 horas.
create or replace function artist_hub.limit_free_questions()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.request_type = 'free' and (
    select count(*) from artist_hub.message_requests r
    where r.fan_id = new.fan_id and r.artist_id = new.artist_id
      and r.request_type = 'free' and r.created_at > now() - interval '24 hours'
  ) >= 3 then
    raise exception 'Limite de 3 perguntas por 24 horas atingido.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke all on function artist_hub.limit_free_questions() from public;
create trigger trg_limit_free_questions before insert on artist_hub.message_requests
  for each row execute function artist_hub.limit_free_questions();

create table if not exists artist_hub.conversations (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artist_hub.artists(id) on delete cascade,
  kind text not null check (kind in ('fan_to_artist', 'fan_to_fan', 'group')),
  title text,
  created_at timestamptz not null default now(),
  unique(id, artist_id)
);
create table if not exists artist_hub.conversation_members (
  conversation_id uuid not null references artist_hub.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key(conversation_id, user_id)
);
create table if not exists artist_hub.messages (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null,
  conversation_id uuid not null,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  foreign key (conversation_id, artist_id) references artist_hub.conversations(id, artist_id) on delete cascade,
  unique(id, artist_id)
);
create index if not exists messages_conversation_idx on artist_hub.messages(conversation_id, created_at desc);

create or replace function artist_hub.is_conversation_member(p_conversation uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from artist_hub.conversation_members cm
    where cm.conversation_id = p_conversation and cm.user_id = (select auth.uid())
  );
$$;
revoke all on function artist_hub.is_conversation_member(uuid) from public;
grant execute on function artist_hub.is_conversation_member(uuid) to authenticated;

-- Dados financeiros: apenas servidor fiável escreve. Nunca fazer INSERT por parte do cliente.
create table if not exists artist_hub.payments (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artist_hub.artists(id) on delete cascade,
  fan_id uuid not null references auth.users(id) on delete cascade,
  external_reference text unique,
  provider text not null,
  amount_minor bigint not null check (amount_minor >= 0),
  currency char(3) not null default 'MZN',
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unique (id, artist_id)
);
create table if not exists artist_hub.entitlements (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artist_hub.artists(id) on delete cascade,
  fan_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  payment_id uuid,
  created_at timestamptz not null default now(),
  check (expires_at is null or expires_at > starts_at),
  foreign key (payment_id, artist_id) references artist_hub.payments(id, artist_id)
);
create index if not exists entitlements_lookup_idx on artist_hub.entitlements(artist_id, fan_id, code);

create table if not exists artist_hub.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artist_hub.artists(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_message_id uuid,
  reason text not null check (char_length(reason) between 5 and 1000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'closed')),
  created_at timestamptz not null default now(),
  foreign key (target_message_id, artist_id) references artist_hub.messages(id, artist_id)
);

-- RLS obrigatório em todas as tabelas expostas.
alter table artist_hub.profiles enable row level security;
alter table artist_hub.artists enable row level security;
alter table artist_hub.artist_staff enable row level security;
alter table artist_hub.artist_memberships enable row level security;
alter table artist_hub.posts enable row level security;
alter table artist_hub.events enable row level security;
alter table artist_hub.message_requests enable row level security;
alter table artist_hub.conversations enable row level security;
alter table artist_hub.conversation_members enable row level security;
alter table artist_hub.messages enable row level security;
alter table artist_hub.payments enable row level security;
alter table artist_hub.entitlements enable row level security;
alter table artist_hub.moderation_reports enable row level security;

create policy profiles_self_select on artist_hub.profiles for select to authenticated
  using (user_id = (select auth.uid()));
create policy profiles_self_insert on artist_hub.profiles for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy profiles_self_update on artist_hub.profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy artists_public_select on artist_hub.artists for select to anon, authenticated
  using (status = 'active');
create policy artists_staff_select on artist_hub.artists for select to authenticated
  using (artist_hub.is_artist_staff(id));
create policy staff_own_select on artist_hub.artist_staff for select to authenticated
  using (user_id = (select auth.uid()) or artist_hub.is_artist_staff(artist_id));

create policy memberships_own_select on artist_hub.artist_memberships for select to authenticated
  using (user_id = (select auth.uid()) or artist_hub.is_artist_staff(artist_id));
create policy memberships_join on artist_hub.artist_memberships for insert to authenticated
  with check (
    user_id = (select auth.uid()) and level = 'fan' and points = 0
    and exists (select 1 from artist_hub.artists a where a.id = artist_id and a.status = 'active')
  );

create policy posts_public_select on artist_hub.posts for select to anon, authenticated
  using (status = 'published' and visibility = 'public' and published_at <= now()
    and exists (select 1 from artist_hub.artists a where a.id = posts.artist_id and a.status = 'active'));
create policy posts_staff_select on artist_hub.posts for select to authenticated
  using (artist_hub.is_artist_staff(artist_id));
create policy events_public_select on artist_hub.events for select to anon, authenticated
  using (status = 'published' and exists (select 1 from artist_hub.artists a where a.id = events.artist_id and a.status = 'active'));
create policy events_staff_select on artist_hub.events for select to authenticated
  using (artist_hub.is_artist_staff(artist_id));

create policy requests_fan_read on artist_hub.message_requests for select to authenticated
  using (fan_id = (select auth.uid()) or artist_hub.is_artist_staff(artist_id));
create policy requests_fan_insert on artist_hub.message_requests for insert to authenticated
  with check (
    fan_id = (select auth.uid()) and request_type = 'free' and status = 'pending' and replied_at is null
    and exists (select 1 from artist_hub.artists a where a.id = artist_id and a.status = 'active')
  );

create policy conversations_members_read on artist_hub.conversations for select to authenticated
  using (artist_hub.is_conversation_member(id) or artist_hub.is_artist_staff(artist_id));
create policy conversation_members_read on artist_hub.conversation_members for select to authenticated
  using (artist_hub.is_conversation_member(conversation_id));
create policy messages_members_read on artist_hub.messages for select to authenticated
  using (artist_hub.is_conversation_member(conversation_id) or artist_hub.is_artist_staff(artist_id));
create policy messages_members_insert on artist_hub.messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and artist_hub.is_conversation_member(conversation_id));

create policy payments_fan_read on artist_hub.payments for select to authenticated
  using (fan_id = (select auth.uid()) or artist_hub.is_artist_staff(artist_id));
create policy entitlements_fan_read on artist_hub.entitlements for select to authenticated
  using (fan_id = (select auth.uid()) or artist_hub.is_artist_staff(artist_id));
create policy reports_self_or_staff_read on artist_hub.moderation_reports for select to authenticated
  using (reporter_id = (select auth.uid()) or artist_hub.is_artist_staff(artist_id));
create policy reports_create on artist_hub.moderation_reports for insert to authenticated
  with check (reporter_id = (select auth.uid()) and status = 'open'
    and exists (select 1 from artist_hub.artists a where a.id = artist_id and a.status = 'active')); 

-- Princípio do menor privilégio. Não dar UPDATE a pagamentos, níveis ou benefícios ao cliente.
grant select on artist_hub.artists, artist_hub.posts, artist_hub.events to anon, authenticated;
grant select on artist_hub.profiles, artist_hub.artist_staff, artist_hub.artist_memberships,
  artist_hub.message_requests, artist_hub.conversations, artist_hub.conversation_members,
  artist_hub.messages, artist_hub.payments, artist_hub.entitlements,
  artist_hub.moderation_reports to authenticated;
grant insert on artist_hub.artist_memberships, artist_hub.message_requests,
  artist_hub.messages, artist_hub.moderation_reports, artist_hub.profiles to authenticated;
grant update on artist_hub.profiles to authenticated;
grant all on all tables in schema artist_hub to service_role;



-- =======================================================================
-- MIGRACAO 0002 / infra/supabase/migrations/0002_fan_profiles.sql
-- =======================================================================
-- Artist Hub / migracao 0002
-- Criar um perfil inicial quando um utilizador se regista pelo Supabase Auth.
-- Executar depois de 0001_artist_hub.sql, primeiro num ambiente de testes.
-- A funcao de perfil nao confere qualquer beneficio VIP nem privilegio de staff.
create or replace function artist_hub.create_fan_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  fan_name text;
begin
  -- A instancia Auth e partilhada entre varias aplicacoes.
  -- Nunca criar perfis de Mr. Bow para utilizadores de outros projectos.
  -- O sinal de origem serve apenas para criacao do perfil, NAO autoriza permissoes.
  if coalesce(new.raw_user_meta_data->>'artist_app', '') <> 'mr-bow' then
    return new;
  end if;

  fan_name := left(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), 80);
  if char_length(fan_name) < 1 then
    fan_name := 'Fã';
  end if;

  insert into artist_hub.profiles (user_id, display_name)
  values (new.id, fan_name)
  on conflict (user_id) do nothing;

  return new;
end;
$$;
revoke all on function artist_hub.create_fan_profile() from public;

drop trigger if exists on_auth_user_created_artist_hub on auth.users;
create trigger on_auth_user_created_artist_hub
  after insert on auth.users
  for each row execute function artist_hub.create_fan_profile();



-- =======================================================================
-- MIGRACAO 0003 / infra/supabase/migrations/0003_private_calls.sql
-- =======================================================================
-- 0003: reservas individuais de chamadas de audio e video
-- Executar SOMENTE apos 0001 e 0002, primeiro num ambiente de testes.
-- Nao activa pagamentos, chamadas nem horarios: tudo inicia bloqueado.
create table if not exists artist_hub.call_services (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artist_hub.artists(id) on delete cascade,
  kind text not null check (kind in ('audio','video')),
  title text not null check (char_length(title) between 3 and 100),
  description text not null default '',
  duration_minutes integer not null check (duration_minutes between 5 and 60),
  price_minor bigint not null check (price_minor > 0),
  currency char(3) not null default 'MZN' check (currency = 'MZN'),
  status text not null default 'draft' check (status in ('draft','active','paused')),
  created_at timestamptz not null default now(),
  unique(id, artist_id)
);

create table if not exists artist_hub.call_sales_settings (
  artist_id uuid primary key references artist_hub.artists(id) on delete cascade,
  sales_enabled boolean not null default false,
  payment_backend_ready boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists artist_hub.call_slots (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null,
  service_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft','open','blocked')),
  created_at timestamptz not null default now(),
  constraint call_slot_duration_check check (ends_at > starts_at),
  foreign key (service_id, artist_id) references artist_hub.call_services(id, artist_id) on delete cascade,
  unique(id, artist_id, service_id)
);
create index if not exists call_slots_service_time_idx
  on artist_hub.call_slots(service_id, starts_at);

create table if not exists artist_hub.call_bookings (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null,
  service_id uuid not null,
  slot_id uuid not null,
  fan_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment','confirmed','cancelled','expired','completed','refunded')),
  price_minor bigint not null check (price_minor > 0),
  currency char(3) not null default 'MZN' check (currency = 'MZN'),
  payment_id uuid,
  created_at timestamptz not null default now(),
  payment_deadline timestamptz not null,
  confirmed_at timestamptz,
  foreign key (slot_id, artist_id, service_id)
    references artist_hub.call_slots(id, artist_id, service_id),
  foreign key (payment_id, artist_id)
    references artist_hub.payments(id, artist_id),
  unique(id, artist_id)
);
create unique index if not exists call_booking_slot_occupied_idx
  on artist_hub.call_bookings(slot_id)
  where status in ('awaiting_payment','confirmed','completed','refunded');
create index if not exists call_booking_fan_idx
  on artist_hub.call_bookings(fan_id,created_at desc);

create table if not exists artist_hub.call_sessions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique,
  artist_id uuid not null,
  room_name text not null unique,
  status text not null default 'scheduled'
    check (status in ('scheduled','active','completed','failed')),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (booking_id, artist_id) references artist_hub.call_bookings(id,artist_id)
);

alter table artist_hub.call_services enable row level security;
alter table artist_hub.call_sales_settings enable row level security;
alter table artist_hub.call_slots enable row level security;
alter table artist_hub.call_bookings enable row level security;
alter table artist_hub.call_sessions enable row level security;

create policy call_services_public_read on artist_hub.call_services
  for select to anon, authenticated
  using (status='active' and exists (
    select 1 from artist_hub.artists a
    where a.id=call_services.artist_id and a.status='active'
  ));
create policy call_services_staff_read on artist_hub.call_services
  for select to authenticated using (artist_hub.is_artist_staff(artist_id));

-- Slots nao sao consultados directamente pelos fas: usar a RPC que exclui os ocupados.
-- Settings e sessions nunca sao acessiveis directamente ao cliente.
create policy call_bookings_owner_read on artist_hub.call_bookings
  for select to authenticated
  using (
    fan_id=(select auth.uid()) or exists (
      select 1 from artist_hub.artist_staff staff
      where staff.artist_id=call_bookings.artist_id
        and staff.user_id=(select auth.uid())
        and staff.role in ('owner','manager')
    )
  );

grant select on artist_hub.call_services to anon, authenticated;
grant select on artist_hub.call_bookings to authenticated;
grant all on artist_hub.call_services, artist_hub.call_sales_settings,
  artist_hub.call_slots, artist_hub.call_bookings, artist_hub.call_sessions to service_role;

-- Horarios disponiveis sem dados do comprador. O acesso nao cria reservas.
create or replace function artist_hub.list_available_call_slots(
  p_artist_id uuid, p_service_id uuid
)
returns table (slot_id uuid, starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path=''
as $$
  select sl.id, sl.starts_at, sl.ends_at
  from artist_hub.call_slots sl
  join artist_hub.call_services sv on sv.id=sl.service_id and sv.artist_id=sl.artist_id
  join artist_hub.call_sales_settings settings on settings.artist_id=sl.artist_id
  join artist_hub.artists a on a.id=sl.artist_id
  where sl.artist_id=p_artist_id and sl.service_id=p_service_id
    and a.status='active' and sv.status='active' and sl.status='open'
    and settings.sales_enabled and settings.payment_backend_ready
    and sl.starts_at > now()+interval '30 minutes'
    and sl.starts_at < now()+interval '90 days'
    and sl.ends_at-sl.starts_at = make_interval(mins=>sv.duration_minutes)
    and not exists (
      select 1 from artist_hub.call_bookings b where b.slot_id=sl.id and
      (b.status in ('confirmed','completed','refunded') or
       (b.status='awaiting_payment' and b.payment_deadline>now()))
    )
  order by sl.starts_at
  limit 25;
$$;
revoke all on function artist_hub.list_available_call_slots(uuid,uuid) from public;
grant execute on function artist_hub.list_available_call_slots(uuid,uuid) to anon,authenticated;

-- Reserva atomica: apenas hold de 15 minutos para pagamento. O cliente nao pode
-- confirmar ou alterar estados nem precos. A funcao so activa com backend pronto.
create or replace function artist_hub.request_call_booking(p_slot_id uuid)
returns uuid
language plpgsql security definer set search_path=''
as $$
declare
  v_fan uuid;
  v_slot artist_hub.call_slots%rowtype;
  v_service artist_hub.call_services%rowtype;
  v_booked uuid;
begin
  v_fan := auth.uid();
  if v_fan is null then
    raise exception 'Inicie sessao antes de reservar.' using errcode='42501';
  end if;

  select * into v_slot from artist_hub.call_slots
    where id=p_slot_id and status='open' for update;
  if not found then
    raise exception 'Horario indisponivel.' using errcode='P0001';
  end if;

  select * into v_service from artist_hub.call_services
    where id=v_slot.service_id and artist_id=v_slot.artist_id and status='active';
  if not found or v_slot.starts_at <= now()+interval '30 minutes'
    or v_slot.starts_at >= now()+interval '90 days'
    or v_slot.ends_at-v_slot.starts_at <> make_interval(mins=>v_service.duration_minutes)
  then
    raise exception 'Horario nao elegivel para reserva.' using errcode='P0001';
  end if;

  if not exists (
    select 1 from artist_hub.call_sales_settings settings
    join artist_hub.artists a on a.id=settings.artist_id
    where settings.artist_id=v_slot.artist_id and a.status='active'
      and settings.sales_enabled and settings.payment_backend_ready
  ) then
    raise exception 'Reservas ainda nao disponiveis.' using errcode='P0001';
  end if;

  -- Liberta apenas reservas cujo prazo de pagamento terminou.
  update artist_hub.call_bookings set status='expired'
    where slot_id=p_slot_id and status='awaiting_payment' and payment_deadline <= now();

  select b.id into v_booked from artist_hub.call_bookings b
    where b.slot_id=p_slot_id and
      (b.status in ('confirmed','completed','refunded')
       or (b.status='awaiting_payment' and b.payment_deadline>now()))
    limit 1;
  if v_booked is not null then
    raise exception 'Horario ja reservado.' using errcode='P0001';
  end if;

  -- Serializa reservas do mesmo artista e impede sessoes sobrepostas,
  -- mesmo quando o gestor criou alternativas de audio/video no mesmo horario.
  perform 1 from artist_hub.artists a where a.id=v_slot.artist_id for update;
  if exists (
    select 1 from artist_hub.call_bookings b
    join artist_hub.call_slots other on other.id=b.slot_id
    where b.artist_id=v_slot.artist_id
      and other.starts_at < v_slot.ends_at
      and other.ends_at > v_slot.starts_at
      and (b.status in ('confirmed','completed','refunded') or
        (b.status='awaiting_payment' and b.payment_deadline>now()))
  ) then
    raise exception 'O artista ja tem uma sessao nesse periodo.' using errcode='P0001';
  end if;

  if (select count(*) from artist_hub.call_bookings b
      where b.fan_id=v_fan and b.status='awaiting_payment'
        and b.payment_deadline>now()) >= 3 then
    raise exception 'Limite de reservas pendentes atingido.' using errcode='P0001';
  end if;

  insert into artist_hub.call_bookings
    (artist_id,service_id,slot_id,fan_id,price_minor,currency,payment_deadline)
  values (v_slot.artist_id,v_service.id,v_slot.id,v_fan,v_service.price_minor,
    v_service.currency,now()+interval '15 minutes')
  returning id into v_booked;
  return v_booked;
end;
$$;
revoke all on function artist_hub.request_call_booking(uuid) from public;
grant execute on function artist_hub.request_call_booking(uuid) to authenticated;

-- APENAS o backend com service_role pode confirmar pagamento verificado.
-- O backend DEVE confirmar a assinatura do webhook e o valor recebido
-- ANTES de invocar esta funcao. Nunca disponibilizar service_role na app.
create or replace function artist_hub.confirm_call_booking_payment(
  p_booking_id uuid, p_provider text, p_external_reference text
)
returns uuid
language plpgsql security definer set search_path=''
as $$
declare
  v_booking artist_hub.call_bookings%rowtype;
  v_payment_id uuid;
begin
  if char_length(coalesce(p_provider,'')) not between 2 and 40
    or char_length(coalesce(p_external_reference,'')) not between 5 and 180 then
    raise exception 'Dados de pagamento invalidos.';
  end if;
  select * into v_booking from artist_hub.call_bookings where id=p_booking_id for update;
  if not found then raise exception 'Reserva inexistente.'; end if;
  if v_booking.status='confirmed' and v_booking.payment_id is not null then
    if not exists (
      select 1 from artist_hub.payments p
      where p.id=v_booking.payment_id and p.provider=p_provider
        and p.external_reference=p_external_reference and p.status='confirmed'
    ) then
      raise exception 'Referencia de pagamento inconsistente.';
    end if;
    return v_booking.payment_id;
  end if;
  if v_booking.status<>'awaiting_payment' or v_booking.payment_deadline<=now() then
    raise exception 'Reserva expirada ou sem pagamento pendente.';
  end if;

  insert into artist_hub.payments
    (artist_id,fan_id,provider,external_reference,amount_minor,currency,status,confirmed_at)
  values (v_booking.artist_id,v_booking.fan_id,p_provider,p_external_reference,
    v_booking.price_minor,v_booking.currency,'confirmed',now())
  returning id into v_payment_id;

  update artist_hub.call_bookings
    set status='confirmed',payment_id=v_payment_id,confirmed_at=now()
    where id=v_booking.id;

  insert into artist_hub.call_sessions (booking_id,artist_id,room_name)
    values (v_booking.id,v_booking.artist_id,'mrbow-'||v_booking.id::text)
    on conflict (booking_id) do nothing;
  return v_payment_id;
end;
$$;
revoke all on function artist_hub.confirm_call_booking_payment(uuid,text,text) from public;
grant execute on function artist_hub.confirm_call_booking_payment(uuid,text,text) to service_role;

-- O fa consulta apenas as suas reservas, sem acesso ao nome da sala WebRTC.
create or replace function artist_hub.list_my_call_bookings(p_artist_id uuid)
returns table (
  booking_id uuid, service_title text, call_kind text, duration_minutes integer,
  starts_at timestamptz, ends_at timestamptz, booking_status text,
  price_minor bigint, currency char(3), payment_deadline timestamptz
)
language sql stable security definer set search_path=''
as $
  select b.id, sv.title, sv.kind, sv.duration_minutes,
    sl.starts_at, sl.ends_at, b.status, b.price_minor, b.currency, b.payment_deadline
  from artist_hub.call_bookings b
  join artist_hub.call_slots sl on sl.id=b.slot_id
  join artist_hub.call_services sv on sv.id=b.service_id
  where b.artist_id=p_artist_id and b.fan_id=(select auth.uid())
  order by sl.starts_at desc
  limit 40;
$;
revoke all on function artist_hub.list_my_call_bookings(uuid) from public;
grant execute on function artist_hub.list_my_call_bookings(uuid) to authenticated;

-- Servidor de chamadas: verificar identidade do fan ou staff e janela temporal.
-- Este metodo NAO gera token WebRTC e NAO deve ser exposto a anon/authenticated.
create or replace function artist_hub.authorize_call_participant(
  p_booking_id uuid, p_user_id uuid
)
returns table (room_name text, call_kind text, slot_starts_at timestamptz,
  slot_ends_at timestamptz, participant_role text)
language sql stable security definer set search_path=''
as $$
  select cs.room_name, svc.kind, sl.starts_at, sl.ends_at,
    case when b.fan_id=p_user_id then 'fan' else 'artist' end
  from artist_hub.call_bookings b
  join artist_hub.call_slots sl on sl.id=b.slot_id
  join artist_hub.call_services svc on svc.id=b.service_id
  join artist_hub.call_sessions cs on cs.booking_id=b.id
  where b.id=p_booking_id and b.status='confirmed'
    and cs.status in ('scheduled','active')
    and now() >= sl.starts_at-interval '10 minutes'
    and now() < sl.ends_at+interval '5 minutes'
    and (b.fan_id=p_user_id or exists (
      select 1 from artist_hub.artist_staff staff
      where staff.artist_id=b.artist_id and staff.user_id=p_user_id
        and staff.role in ('owner','manager')
    ));
$$;
revoke all on function artist_hub.authorize_call_participant(uuid,uuid) from public;
grant execute on function artist_hub.authorize_call_participant(uuid,uuid) to service_role;


-- Registo inicial UNICO do artista, sem posts falsos nem precos inventados.
INSERT INTO artist_hub.artists
  (slug, display_name, tagline, accent_color, is_verified, status)
VALUES
  ('mr-bow', 'Mr. Bow',
   'A música aproxima-nos. Descobre novidades, bastidores e comunidade.',
   '#F1AC42', false, 'active');

COMMIT;

-- RESULTADO ESPERADO: 18 tabelas, 18 com RLS, 1 artista Mr. Bow.
SELECT
  (SELECT count(*) FROM pg_catalog.pg_tables
   WHERE schemaname = 'artist_hub') AS tabelas,
  (SELECT count(*) FROM pg_catalog.pg_tables
   WHERE schemaname = 'artist_hub' AND rowsecurity) AS tabelas_com_rls,
  (SELECT count(*) FROM artist_hub.artists WHERE slug='mr-bow') AS artista_mr_bow,
  (SELECT count(*) FROM artist_hub.call_sales_settings
   WHERE sales_enabled OR payment_backend_ready) AS configuracoes_financeiras_activas;
