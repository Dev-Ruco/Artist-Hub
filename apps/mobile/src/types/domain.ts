export type Artist = {
  id: string;
  slug: string;
  display_name: string;
  tagline: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  accent_color: string;
  is_verified: boolean;
};

export type Post = {
  id: string;
  artist_id: string;
  title: string;
  body: string;
  media_url: string | null;
  category: 'novidade' | 'musica' | 'bastidores';
  published_at: string;
};

export type ArtistEvent = {
  id: string;
  artist_id: string;
  title: string;
  venue: string;
  city: string;
  starts_at: string;
  ticket_url: string | null;
};
