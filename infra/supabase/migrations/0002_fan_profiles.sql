-- Artist Hub / migracao 0002
-- Criar um perfil inicial quando um utilizador se regista pelo Supabase Auth.
-- Executar depois de 0001_mrbowapp.sql, primeiro num ambiente de testes.
-- A funcao de perfil nao confere qualquer beneficio VIP nem privilegio de staff.
begin;

create or replace function mrbowapp.create_fan_profile()
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

  insert into mrbowapp.profiles (user_id, display_name)
  values (new.id, fan_name)
  on conflict (user_id) do nothing;

  return new;
end;
$$;
revoke all on function mrbowapp.create_fan_profile() from public;

drop trigger if exists on_auth_user_created_mrbowapp on auth.users;
create trigger on_auth_user_created_mrbowapp
  after insert on auth.users
  for each row execute function mrbowapp.create_fan_profile();

commit;
