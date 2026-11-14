import type { Artist, Post, ArtistEvent } from '../types/domain';

// Conteúdos meramente ilustrativos: não representam comunicados ou eventos oficiais.
export const demoArtists: Artist[] = [
  {
    id: 'demo-artista-1', slug: 'mr-bow', display_name: 'Mr Bow',
    tagline: 'A música aproxima-nos. Descobre novidades, bastidores e comunidade.',
    avatar_url: null, banner_url: null, accent_color: '#F1AC42', is_verified: false,
  },
  {
    id: 'demo-artista-2', slug: 'artista-convidado', display_name: 'Artista Convidado',
    tagline: 'Uma comunidade mais próxima.', avatar_url: null,
    banner_url: null, accent_color: '#D6A8FF', is_verified: false,
  },
];
export const demoPosts: Post[] = [
  {
    id: 'demo-post-1', artist_id: 'demo-artista-1', title: 'Bem-vindo ao espaço de fãs',
    body: 'Exemplo de publicação para apresentar como funcionarão as novidades e os conteúdos exclusivos.',
    media_url: null, category: 'novidade', published_at: '2026-11-12T17:00:00Z',
  },
  {
    id: 'demo-post-2', artist_id: 'demo-artista-1', title: 'Por detrás da música',
    body: 'Pré-visualização do espaço reservado aos bastidores, histórias e momentos especiais.',
    media_url: null, category: 'bastidores', published_at: '2026-11-10T09:00:00Z',
  },
  {
    id: 'demo-post-3', artist_id: 'demo-artista-2', title: 'Um novo começo',
    body: 'Demonstração de outra comunidade de artista na plataforma.',
    media_url: null, category: 'musica', published_at: '2026-11-11T12:00:00Z',
  },
];
export const demoEvents: ArtistEvent[] = [];
