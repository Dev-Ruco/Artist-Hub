-- Dados de teste para a aplicacao EXCLUSIVA de Mr. Bow.
-- Ficticios: nao sao comunicados oficiais. Executar APENAS no ambiente de desenvolvimento.
-- Pressupoe a migracao 0001_artist_hub.sql ja aplicada.
with new_artist as (
  insert into artist_hub.artists (slug, display_name, tagline, accent_color, is_verified, status)
  values ('mr-bow', 'Mr. Bow', 'A música aproxima-nos. Descobre novidades, bastidores e comunidade.',
          '#F1AC42', false, 'active')
  on conflict (slug) do update set
    display_name = excluded.display_name,
    tagline = excluded.tagline,
    accent_color = excluded.accent_color,
    status = 'active'
  returning id
)
insert into artist_hub.posts (artist_id, title, body, category, visibility, status)
select id, 'Bem-vindo à comunidade',
  'Conteúdo fictício para testar a apresentação das novidades de Mr. Bow.',
  'novidade', 'public', 'published'
from new_artist;
