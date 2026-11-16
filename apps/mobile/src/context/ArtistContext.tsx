import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { demoArtists } from '../data/demo';
import { db, isDemoMode } from '../lib/supabase';
import { BRAND_ARTIST_NAME, BRAND_ARTIST_SLUG } from '../config/brand';
import type { Artist } from '../types/domain';

type ArtistContextValue = {
  selected: Artist | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};
const ArtistContext = createContext<ArtistContextValue | undefined>(undefined);

// Uma aplicação = um artista. A filtragem é aplicada igualmente ao modo
// demonstrativo e à consulta real, nunca apenas na interface.
function asBrandedArtist(artist: Artist): Artist {
  return { ...artist, display_name: BRAND_ARTIST_NAME };
}

export function ArtistProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<Artist | null>(
    isDemoMode ? (demoArtists.find(a => a.slug === BRAND_ARTIST_SLUG) ?? null) : null
  );
  const [loading, setLoading] = useState(!isDemoMode);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (isDemoMode) {
      const artist = demoArtists.find(a => a.slug === BRAND_ARTIST_SLUG) ?? null;
      setSelected(artist ? asBrandedArtist(artist) : null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: queryError } = await db()
      .from('artists')
      .select('id,slug,display_name,tagline,avatar_url,banner_url,accent_color,is_verified')
      .eq('slug', BRAND_ARTIST_SLUG)
      .eq('status', 'active')
      .limit(1);
    if (queryError) {
      setError(queryError.message);
      setSelected(null);
    } else {
      const artist = (data?.[0] ?? null) as Artist | null;
      setSelected(artist ? asBrandedArtist(artist) : null);
      setError(null);
    }
    setLoading(false);
  }

  useEffect(() => { void refresh(); }, []);

  const value = useMemo(() => ({ selected, loading, error, refresh }), [selected, loading, error]);
  return <ArtistContext.Provider value={value}>{children}</ArtistContext.Provider>;
}

export function useArtist() {
  const ctx = useContext(ArtistContext);
  if (!ctx) throw new Error('useArtist requer ArtistProvider');
  return ctx;
}
