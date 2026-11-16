import type { Artist, Post, ArtistEvent } from '../types/domain';

// Conteúdos fictícios do piloto exclusivo de Mr. Bow. Não são publicações oficiais.
export const demoArtists: Artist[] = [
  {
    id: 'demo-artista-1', slug: 'mr-bow', display_name: 'Mr. Bow',
    tagline: 'A música aproxima-nos. Descobre novidades, bastidores e comunidade.',
    avatar_url: null, banner_url: null, accent_color: '#F1AC42', is_verified: false,
  },
];
export const demoPosts: Post[] = [
  {
    id: 'demo-post-1', artist_id: 'demo-artista-1', title: 'Bem-vindo à comunidade',
    body: 'Conteúdo fictício para testar a apresentação das novidades e dos conteúdos exclusivos de Mr. Bow.',
    media_url: null, category: 'novidade', published_at: '2026-11-12T17:00:00Z',
  },
  {
    id: 'demo-post-2', artist_id: 'demo-artista-1', title: 'Por detrás da música',
    body: 'Exemplo da área destinada a bastidores, histórias e momentos especiais.',
    media_url: null, category: 'bastidores', published_at: '2026-11-10T09:00:00Z',
  },
];
export const demoEvents: ArtistEvent[] = [];
