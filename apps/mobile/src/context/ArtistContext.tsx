import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { demoArtists } from '../data/demo';
import { db, isDemoMode } from '../lib/supabase';
import type { Artist } from '../types/domain';

type ArtistContextValue = {
  artists: Artist[];
  selected: Artist | null;
  selectArtist: (id: string) => void;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};
const ArtistContext = createContext<ArtistContextValue | undefined>(undefined);
const brandSlug = process.env.EXPO_PUBLIC_ARTIST_SLUG?.trim();
const visibleArtists = (artists: Artist[]) => brandSlug ? artists.filter(a => a.slug === brandSlug) : artists;

export function ArtistProvider({ children }: { children: React.ReactNode }) {
  const [artists, setArtists] = useState<Artist[]>(isDemoMode ? visibleArtists(demoArtists) : []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isDemoMode);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (isDemoMode) { setArtists(visibleArtists(demoArtists)); setLoading(false); return; }
    setLoading(true);
    const { data, error: queryError } = await db()
      .from('artists')
      .select('id,slug,display_name,tagline,avatar_url,banner_url,accent_color,is_verified')
      .eq('status', 'active')
      .order('display_name');
    if (queryError) setError(queryError.message);
    else { setArtists(visibleArtists((data || []) as Artist[])); setError(null); }
    setLoading(false);
  }

  useEffect(() => { void refresh(); }, []);

  const selected = useMemo(() => artists.find(a => a.id === selectedId) || artists[0] || null, [artists, selectedId]);
  const value = useMemo(() => ({ artists, selected, selectArtist: setSelectedId, loading, error, refresh }),
    [artists, selected, loading, error]);
  return <ArtistContext.Provider value={value}>{children}</ArtistContext.Provider>;
}
export function useArtist() {
  const ctx = useContext(ArtistContext);
  if (!ctx) throw new Error('useArtist requer ArtistProvider');
  return ctx;
}
