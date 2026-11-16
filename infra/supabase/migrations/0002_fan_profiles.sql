-- Artist Hub / migracao 0002
-- Criar um perfil inicial quando um utilizador se regista pelo Supabase Auth.
-- Executar depois de 0001_artist_hub.sql, primeiro num ambiente de testes.
-- A funcao de perfil nao confere qualquer beneficio VIP nem privilegio de staff.
begin;

create or replace function artist_hub.create_fan_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  fan_name text;
begin
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

commit;
