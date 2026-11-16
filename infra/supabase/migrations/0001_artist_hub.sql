-- Artist Hub / migração 0001
-- Executar no Supabase PostgreSQL com uma conta administrativa.
-- Configurar mrbowapp como exposed schema no PostgREST ANTES de utilizar o cliente mobile.
-- Nenhum service_role ou segredo deverá ser incluído na aplicação móvel.

begin;

-- O schema mrbowapp ja foi criado no Supabase self-hosted.
create schema if not exists mrbowapp;

grant usage on schema mrbowapp to anon, authenticated, service_role;

create table if not exists mrbowapp.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Fã',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_name_check check (char_length(display_name) between 1 and 80)
);

create table if not exists mrbowapp.artists (
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

create table if not exists mrbowapp.artist_staff (
  artist_id uuid not null references mrbowapp.artists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'moderator')),
  created_at timestamptz not null default now(),
  primary key (artist_id, user_id)
);

-- Função definer evita recursão de RLS; não deve ser alterada por utilizadores normais.
create or replace function mrbowapp.is_artist_staff(p_artist_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from mrbowapp.artist_staff s
    where s.artist_id = p_artist_id and s.user_id = (select auth.uid())
  );
$$;
revoke all on function mrbowapp.is_artist_staff(uuid) from public;
grant execute on function mrbowapp.is_artist_staff(uuid) to authenticated;

create table if not exists mrbowapp.artist_memberships (
  artist_id uuid not null references mrbowapp.artists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  level text not null default 'fan' check (level in ('fan', 'vip', 'promax')),
  points integer not null default 0 check (points >= 0),
  joined_at timestamptz not null default now(),
  primary key (artist_id, user_id)
);
create index if not exists membership_user_idx on mrbowapp.artist_memberships(user_id);

create table if not exists mrbowapp.posts (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references mrbowapp.artists(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  title text not null check (char_length(title) between 2 and 200),
  body text not null check (char_length(body) between 1 and 6000),
  media_url text,
  category text not null default 'novidade' check (category in ('novidade', 'musica', 'bastidores')),
  visibility text not null default 'public' check (visibility in ('public', 'vip')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz not null default now()
);
create index if not exists posts_artist_date_idx on mrbowapp.posts(artist_id, published_at desc);

create table if not exists mrbowapp.events (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references mrbowapp.artists(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 200),
  venue text not null,
  city text not null,
  starts_at timestamptz not null,
  ticket_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint ticket_url_https check (ticket_url is null or ticket_url ~* '^https://')
);
create index if not exists events_artist_start_idx on mrbowapp.events(artist_id, starts_at);

create table if not exists mrbowapp.message_requests (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references mrbowapp.artists(id) on delete cascade,
  fan_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 10 and 1000),
  request_type text not null default 'free' check (request_type in ('free', 'paid')),
  status text not null default 'pending' check (status in ('pending', 'answered', 'declined')),
  created_at timestamptz not null default now(),
  replied_at timestamptz
);
create index if not exists requests_artist_status_idx on mrbowapp.message_requests(artist_id, status, created_at desc);
create index if not exists requests_fan_idx on mrbowapp.message_requests(fan_id, created_at desc);

-- Protecção inicial contra envio repetitivo: máximo de 3 perguntas gratuitas
-- por fã e por artista num período móvel de 24 horas.
create or replace function mrbowapp.limit_free_questions()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.request_type = 'free' and (
    select count(*) from mrbowapp.message_requests r
    where r.fan_id = new.fan_id and r.artist_id = new.artist_id
      and r.request_type = 'free' and r.created_at > now() - interval '24 hours'
  ) >= 3 then
    raise exception 'Limite de 3 perguntas por 24 horas atingido.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke all on function mrbowapp.limit_free_questions() from public;
create trigger trg_limit_free_questions before insert on mrbowapp.message_requests
  for each row execute function mrbowapp.limit_free_questions();

create table if not exists mrbowapp.conversations (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references mrbowapp.artists(id) on delete cascade,
  kind text not null check (kind in ('fan_to_artist', 'fan_to_fan', 'group')),
  title text,
  created_at timestamptz not null default now(),
  unique(id, artist_id)
);
create table if not exists mrbowapp.conversation_members (
  conversation_id uuid not null references mrbowapp.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key(conversation_id, user_id)
);
create table if not exists mrbowapp.messages (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null,
  conversation_id uuid not null,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  foreign key (conversation_id, artist_id) references mrbowapp.conversations(id, artist_id) on delete cascade,
  unique(id, artist_id)
);
create index if not exists messages_conversation_idx on mrbowapp.messages(conversation_id, created_at desc);

create or replace function mrbowapp.is_conversation_member(p_conversation uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from mrbowapp.conversation_members cm
    where cm.conversation_id = p_conversation and cm.user_id = (select auth.uid())
  );
$$;
revoke all on function mrbowapp.is_conversation_member(uuid) from public;
grant execute on function mrbowapp.is_conversation_member(uuid) to authenticated;

-- Dados financeiros: apenas servidor fiável escreve. Nunca fazer INSERT por parte do cliente.
create table if not exists mrbowapp.payments (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references mrbowapp.artists(id) on delete cascade,
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
create table if not exists mrbowapp.entitlements (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references mrbowapp.artists(id) on delete cascade,
  fan_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  payment_id uuid,
  created_at timestamptz not null default now(),
  check (expires_at is null or expires_at > starts_at),
  foreign key (payment_id, artist_id) references mrbowapp.payments(id, artist_id)
);
create index if not exists entitlements_lookup_idx on mrbowapp.entitlements(artist_id, fan_id, code);

create table if not exists mrbowapp.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references mrbowapp.artists(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_message_id uuid,
  reason text not null check (char_length(reason) between 5 and 1000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'closed')),
  created_at timestamptz not null default now(),
  foreign key (target_message_id, artist_id) references mrbowapp.messages(id, artist_id)
);

-- RLS obrigatório em todas as tabelas expostas.
alter table mrbowapp.profiles enable row level security;
alter table mrbowapp.artists enable row level security;
alter table mrbowapp.artist_staff enable row level security;
alter table mrbowapp.artist_memberships enable row level security;
alter table mrbowapp.posts enable row level security;
alter table mrbowapp.events enable row level security;
alter table mrbowapp.message_requests enable row level security;
alter table mrbowapp.conversations enable row level security;
alter table mrbowapp.conversation_members enable row level security;
alter table mrbowapp.messages enable row level security;
alter table mrbowapp.payments enable row level security;
alter table mrbowapp.entitlements enable row level security;
alter table mrbowapp.moderation_reports enable row level security;

create policy profiles_self_select on mrbowapp.profiles for select to authenticated
  using (user_id = (select auth.uid()));
create policy profiles_self_insert on mrbowapp.profiles for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy profiles_self_update on mrbowapp.profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy artists_public_select on mrbowapp.artists for select to anon, authenticated
  using (status = 'active');
create policy artists_staff_select on mrbowapp.artists for select to authenticated
  using (mrbowapp.is_artist_staff(id));
create policy staff_own_select on mrbowapp.artist_staff for select to authenticated
  using (user_id = (select auth.uid()) or mrbowapp.is_artist_staff(artist_id));

create policy memberships_own_select on mrbowapp.artist_memberships for select to authenticated
  using (user_id = (select auth.uid()) or mrbowapp.is_artist_staff(artist_id));
create policy memberships_join on mrbowapp.artist_memberships for insert to authenticated
  with check (
    user_id = (select auth.uid()) and level = 'fan' and points = 0
    and exists (select 1 from mrbowapp.artists a where a.id = artist_id and a.status = 'active')
  );

create policy posts_public_select on mrbowapp.posts for select to anon, authenticated
  using (status = 'published' and visibility = 'public' and published_at <= now()
    and exists (select 1 from mrbowapp.artists a where a.id = posts.artist_id and a.status = 'active'));
create policy posts_staff_select on mrbowapp.posts for select to authenticated
  using (mrbowapp.is_artist_staff(artist_id));
create policy events_public_select on mrbowapp.events for select to anon, authenticated
  using (status = 'published' and exists (select 1 from mrbowapp.artists a where a.id = events.artist_id and a.status = 'active'));
create policy events_staff_select on mrbowapp.events for select to authenticated
  using (mrbowapp.is_artist_staff(artist_id));

create policy requests_fan_read on mrbowapp.message_requests for select to authenticated
  using (fan_id = (select auth.uid()) or mrbowapp.is_artist_staff(artist_id));
create policy requests_fan_insert on mrbowapp.message_requests for insert to authenticated
  with check (
    fan_id = (select auth.uid()) and request_type = 'free' and status = 'pending' and replied_at is null
    and exists (select 1 from mrbowapp.artists a where a.id = artist_id and a.status = 'active')
  );

create policy conversations_members_read on mrbowapp.conversations for select to authenticated
  using (mrbowapp.is_conversation_member(id) or mrbowapp.is_artist_staff(artist_id));
create policy conversation_members_read on mrbowapp.conversation_members for select to authenticated
  using (mrbowapp.is_conversation_member(conversation_id));
create policy messages_members_read on mrbowapp.messages for select to authenticated
  using (mrbowapp.is_conversation_member(conversation_id) or mrbowapp.is_artist_staff(artist_id));
create policy messages_members_insert on mrbowapp.messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and mrbowapp.is_conversation_member(conversation_id));

create policy payments_fan_read on mrbowapp.payments for select to authenticated
  using (fan_id = (select auth.uid()) or mrbowapp.is_artist_staff(artist_id));
create policy entitlements_fan_read on mrbowapp.entitlements for select to authenticated
  using (fan_id = (select auth.uid()) or mrbowapp.is_artist_staff(artist_id));
create policy reports_self_or_staff_read on mrbowapp.moderation_reports for select to authenticated
  using (reporter_id = (select auth.uid()) or mrbowapp.is_artist_staff(artist_id));
create policy reports_create on mrbowapp.moderation_reports for insert to authenticated
  with check (reporter_id = (select auth.uid()) and status = 'open'
    and exists (select 1 from mrbowapp.artists a where a.id = artist_id and a.status = 'active')); 

-- Princípio do menor privilégio. Não dar UPDATE a pagamentos, níveis ou benefícios ao cliente.
grant select on mrbowapp.artists, mrbowapp.posts, mrbowapp.events to anon, authenticated;
grant select on mrbowapp.profiles, mrbowapp.artist_staff, mrbowapp.artist_memberships,
  mrbowapp.message_requests, mrbowapp.conversations, mrbowapp.conversation_members,
  mrbowapp.messages, mrbowapp.payments, mrbowapp.entitlements,
  mrbowapp.moderation_reports to authenticated;
grant insert on mrbowapp.artist_memberships, mrbowapp.message_requests,
  mrbowapp.messages, mrbowapp.moderation_reports, mrbowapp.profiles to authenticated;
grant update on mrbowapp.profiles to authenticated;
grant all on all tables in schema mrbowapp to service_role;

commit;
