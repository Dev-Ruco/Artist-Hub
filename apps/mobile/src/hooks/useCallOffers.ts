import { useCallback, useEffect, useRef, useState } from 'react';
import { db, isDemoMode } from '../lib/supabase';
import type { AvailableCallSlot, CallService, FanCallBooking } from '../types/calls';

export function useCallOffers(artistId: string | undefined, userId: string | undefined) {
  const [services, setServices] = useState<CallService[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailableCallSlot[]>([]);
  const [bookings, setBookings] = useState<FanCallBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [error, setError] = useState('');
  const serviceRequest = useRef(0);
  const slotRequest = useRef(0);
  const bookingRequest = useRef(0);

  const loadServices = useCallback(async () => {
    const sequence = ++serviceRequest.current;
    setError('');
    if (isDemoMode || !artistId) {
      setServices([]);
      setSelectedServiceId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error: queryError } = await db().from('call_services')
        .select('id,artist_id,kind,title,description,duration_minutes,price_minor,currency')
        .eq('artist_id', artistId).eq('status', 'active')
        .order('duration_minutes', { ascending: true });
      if (sequence !== serviceRequest.current) return;
      if (queryError) throw queryError;
      const rows = (data || []) as CallService[];
      setServices(rows);
      setSelectedServiceId(current => rows.some(item => item.id === current)
        ? current : rows[0]?.id || null);
    } catch {
      if (sequence === serviceRequest.current) setError('Não foi possível carregar os serviços.');
    } finally {
      if (sequence === serviceRequest.current) setLoading(false);
    }
  }, [artistId]);

  const loadSlots = useCallback(async () => {
    const sequence = ++slotRequest.current;
    setSlots([]);
    if (isDemoMode || !artistId || !selectedServiceId) {
      setLoadingSlots(false);
      return;
    }
    setLoadingSlots(true);
    try {
      const { data, error: queryError } = await db().rpc('list_available_call_slots', {
        p_artist_id: artistId,
        p_service_id: selectedServiceId,
      });
      if (sequence !== slotRequest.current) return;
      if (queryError) throw queryError;
      setSlots((data || []) as AvailableCallSlot[]);
    } catch {
      if (sequence === slotRequest.current) setError('Não foi possível consultar os horários.');
    } finally {
      if (sequence === slotRequest.current) setLoadingSlots(false);
    }
  }, [artistId, selectedServiceId]);

  const loadBookings = useCallback(async () => {
    const sequence = ++bookingRequest.current;
    if (isDemoMode || !artistId || !userId) {
      setBookings([]);
      setLoadingBookings(false);
      return;
    }
    setLoadingBookings(true);
    try {
      const { data, error: queryError } = await db().rpc('list_my_call_bookings', {
        p_artist_id: artistId,
      });
      if (sequence !== bookingRequest.current) return;
      if (queryError) throw queryError;
      setBookings((data || []) as FanCallBooking[]);
    } catch {
      if (sequence === bookingRequest.current) setError('Não foi possível consultar as tuas reservas.');
    } finally {
      if (sequence === bookingRequest.current) setLoadingBookings(false);
    }
  }, [artistId, userId]);

  useEffect(() => { void loadServices(); }, [loadServices]);
  useEffect(() => { void loadSlots(); }, [loadSlots]);
  useEffect(() => { void loadBookings(); }, [loadBookings]);

  const reload = useCallback(async () => {
    await Promise.all([loadServices(), loadSlots(), loadBookings()]);
  }, [loadServices, loadSlots, loadBookings]);

  return {
    services,
    selectedServiceId,
    selectService: setSelectedServiceId,
    slots,
    bookings,
    loading,
    loadingSlots,
    loadingBookings,
    error,
    reload,
  };
}
