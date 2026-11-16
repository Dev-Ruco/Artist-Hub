import { useCallback, useEffect, useRef, useState } from 'react';
import { demoEvents, demoPosts } from '../data/demo';
import { db, isDemoMode } from '../lib/supabase';
import { apiConfigurada, pedirApi, type PublicacaoApi, type EventoApi } from '../lib/api';
import type { ArtistEvent, Post } from '../types/domain';

export function useArtistContent(artistId: string | undefined) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<ArtistEvent[]>([]);
  const [loading, setLoading] = useState(!isDemoMode);
  const [error, setError] = useState<string | null>(null);
  const requestNumber = useRef(0);

  const refresh = useCallback(async () => {
    const request = ++requestNumber.current;
    if (!artistId) { setPosts([]); setEvents([]); setError(null); setLoading(false); return; }
    if (isDemoMode) {
      setPosts(demoPosts.filter(p => p.artist_id === artistId));
      setEvents(demoEvents.filter(e => e.artist_id === artistId));
      setLoading(false);
      return;
    }
    setLoading(true);
    if (apiConfigurada) {
      try {
        const [publicacoes, agenda] = await Promise.all([
          pedirApi<PublicacaoApi[]>('/publicacoes'),
          pedirApi<EventoApi[]>('/eventos'),
        ]);
        if (request !== requestNumber.current) return;
        setPosts(publicacoes.map(item => ({
          id: item.identificador,
          artist_id: artistId,
          title: item.titulo,
          body: item.texto,
          media_url: item.enderecoMultimedia,
          category: item.categoria,
          published_at: item.dataPublicacao,
        })));
        setEvents(agenda.map(item => ({
          id: item.identificador,
          artist_id: artistId,
          title: item.titulo,
          venue: item.local,
          city: item.cidade,
          starts_at: item.dataInicio,
          ticket_url: item.enderecoBilhete,
        })));
        setError(null);
      } catch (erro) {
        if (request === requestNumber.current) {
          setPosts([]);
          setEvents([]);
          setError(erro instanceof Error ? erro.message : 'API indisponível.');
        }
      } finally {
        if (request === requestNumber.current) setLoading(false);
      }
      return;
    }
    const [postResult, eventResult] = await Promise.all([
      db().from('posts').select('id,artist_id,title,body,media_url,category,published_at')
        .eq('artist_id', artistId).eq('status', 'published').eq('visibility', 'public')
        .order('published_at', { ascending: false }).limit(30),
      db().from('events').select('id,artist_id,title,venue,city,starts_at,ticket_url')
        .eq('artist_id', artistId).eq('status', 'published')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true }).limit(30),
    ]);
    if (request !== requestNumber.current) return;
    setError(postResult.error?.message || eventResult.error?.message || null);
    setPosts((postResult.data || []) as Post[]);
    setEvents((eventResult.data || []) as ArtistEvent[]);
    setLoading(false);
  }, [artistId]);
  useEffect(() => { void refresh(); }, [refresh]);
  return { posts, events, loading, error, refresh };
}
