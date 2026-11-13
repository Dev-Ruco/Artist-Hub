import type { Artist, Post, ArtistEvent } from '../types/domain';

// Nomes e conteúdos inteiramente fictícios. Nunca exibir como dados reais.
export const demoArtists: Artist[] = [
  {
    id: 'demo-artista-1', slug: 'artista-piloto', display_name: 'Artista Piloto',
    tagline: 'A tua música. A tua comunidade.', avatar_url: null,
    banner_url: null, accent_color: '#A9E96C', is_verified: true,
  },
  {
    id: 'demo-artista-2', slug: 'artista-convidado', display_name: 'Artista Convidado',
    tagline: 'Uma comunidade mais próxima.', avatar_url: null,
    banner_url: null, accent_color: '#D6A8FF', is_verified: false,
  },
];
export const demoPosts: Post[] = [
  { id: 'demo-post-1', artist_id: 'demo-artista-1', title: 'Bem-vindos ao nosso espaço', body: 'Esta é a nossa comunidade. Aqui vamos partilhar novidades, bastidores e momentos especiais.', media_url: null, category: 'novidade', published_at: '2026-11-12T17:00:00Z' },
  { id: 'demo-post-2', artist_id: 'demo-artista-1', title: 'Nos bastidores', body: 'Estamos a preparar novas experiências para os nossos fãs. Acompanha o que vem a seguir.', media_url: null, category: 'bastidores', published_at: '2026-11-10T09:00:00Z' },
  { id: 'demo-post-3', artist_id: 'demo-artista-2', title: 'Um novo começo', body: 'A comunidade do artista convidado está a ganhar forma.', media_url: null, category: 'musica', published_at: '2026-11-11T12:00:00Z' },
];
export const demoEvents: ArtistEvent[] = [
  { id: 'demo-evento-1', artist_id: 'demo-artista-1', title: 'Encontro com os fãs', venue: 'Local a anunciar', city: 'Maputo', starts_at: '2026-12-20T16:00:00+02:00', ticket_url: null },
];
