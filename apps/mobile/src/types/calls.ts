export type CallKind = 'audio' | 'video';
export type CallService = {
  id: string;
  artist_id: string;
  kind: CallKind;
  title: string;
  description: string;
  duration_minutes: number;
  price_minor: number;
  currency: 'MZN';
};
export type AvailableCallSlot = {
  slot_id: string;
  starts_at: string;
  ends_at: string;
};
export type FanCallBooking = {
  booking_id: string;
  service_title: string;
  call_kind: CallKind;
  duration_minutes: number;
  starts_at: string;
  ends_at: string;
  booking_status: 'awaiting_payment' | 'confirmed' | 'cancelled' | 'expired' | 'completed' | 'refunded';
  price_minor: number;
  currency: 'MZN';
  payment_deadline: string;
};
export const bookingStatusLabels: Record<FanCallBooking['booking_status'], string> = {
  awaiting_payment: 'A aguardar pagamento',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  expired: 'Expirada',
  completed: 'Concluída',
  refunded: 'Reembolsada',
};
