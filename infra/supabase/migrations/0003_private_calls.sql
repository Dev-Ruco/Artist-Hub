-- 0003: reservas individuais de chamadas de audio e video
-- Executar SOMENTE apos 0001 e 0002, primeiro num ambiente de testes.
-- Nao activa pagamentos, chamadas nem horarios: tudo inicia bloqueado.
begin;

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
  using (fan_id=(select auth.uid()) or artist_hub.is_artist_staff(artist_id));

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

commit;
