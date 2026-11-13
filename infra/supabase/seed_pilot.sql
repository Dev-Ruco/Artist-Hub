-- Exemplos fictícios: executar DEPOIS da migração 0001.
-- Estes dados servem apenas para testar a ligação à aplicação.
with new_artists as (
  insert into artist_hub.artists (slug, display_name, tagline, accent_color, is_verified, status)
  values
    ('artista-piloto', 'Artista Piloto', 'A tua música. A tua comunidade.', '#A9E96C', true, 'active'),
    ('artista-convidado', 'Artista Convidado', 'Uma comunidade mais próxima.', '#D6A8FF', false, 'active')
  on conflict (slug) do update set display_name = excluded.display_name,
    tagline = excluded.tagline, status = 'active'
  returning id, slug
)
insert into artist_hub.posts (artist_id, title, body, category, visibility, status)
select id, 'Bem-vindos ao nosso espaço', 'Esta é uma publicação fictícia de teste. Aqui teremos novidades e bastidores.',
  'novidade', 'public', 'published' from new_artists where slug = 'artista-piloto';
