import { useState, useEffect, useCallback } from 'react';
import { Room, RoomOccupancy, RoomTimeRate, Reservation } from '@/lib/supabase';
import { LS_KEYS, getAll, insert, update, remove, generateId, addAuditLog } from '@/lib/local-db';
import { useAuth } from '@/contexts/AuthContext';

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(() => {
    setLoading(true);
    const data = getAll<Room>(LS_KEYS.ROOMS);
    data.sort((a, b) => a.number.localeCompare(b.number));
    setRooms(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const createRoom = (room: Partial<Room>) => {
    const newRoom = insert<Room>(LS_KEYS.ROOMS, {
      ...room,
      id: generateId(),
    } as Room);
    addAuditLog('create_room', 'rooms', newRoom.id, null, newRoom);
    setRooms((prev) => [...prev, newRoom]);
    return newRoom;
  };

  const updateRoom = (id: string, updates: Partial<Room>) => {
    const updated = update<Room>(LS_KEYS.ROOMS, id, updates);
    if (!updated) throw new Error('Room not found');
    addAuditLog('update_room', 'rooms', id, null, updated);
    setRooms((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return updated;
  };

  const deleteRoom = (id: string) => {
    const removed = remove<Room>(LS_KEYS.ROOMS, id);
    if (!removed) throw new Error('Room not found');
    addAuditLog('delete_room', 'rooms', id, null, null);
    setRooms((prev) => prev.filter((r) => r.id !== id));
  };

  return {
    rooms,
    loading,
    fetchRooms,
    createRoom,
    updateRoom,
    deleteRoom,
  };
}

export function useRoomTimeRates() {
  const [rates, setRates] = useState<RoomTimeRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = getAll<RoomTimeRate>(LS_KEYS.ROOM_TIME_RATES);
    data.sort((a, b) => a.minutes - b.minutes);
    setRates(data);
    setLoading(false);
  }, []);

  const updateRate = (id: string, price: number) => {
    const updated = update<RoomTimeRate>(LS_KEYS.ROOM_TIME_RATES, id, { price });
    if (!updated) throw new Error('Rate not found');
    addAuditLog('update_rate', 'room_time_rates', id, null, updated);
    setRates((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return updated;
  };

  return { rates, loading, updateRate };
}

export function useRoomOccupancies() {
  const [occupancies, setOccupancies] = useState<RoomOccupancy[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchOccupancies = useCallback((activeOnly?: boolean) => {
    setLoading(true);
    let data = getAll<RoomOccupancy>(LS_KEYS.ROOM_OCCUPANCIES);
    const rooms = getAll<Room>(LS_KEYS.ROOMS);

    if (activeOnly) {
      data = data.filter((o) => o.status === 'ativo');
    }

    data = data.map((o) => ({
      ...o,
      room: rooms.find((r) => r.id === o.room_id),
    }));
    data.sort((a, b) => new Date(b.entry_time).getTime() - new Date(a.entry_time).getTime());

    setOccupancies(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOccupancies(true);
  }, [fetchOccupancies]);

  const getTimeRateMinutes = (timeType: string): number => {
    const data = getAll<RoomTimeRate>(LS_KEYS.ROOM_TIME_RATES);
    const rate = data.find((r) => r.time_type === timeType);
    return rate?.minutes || 60;
  };

  const getTimeRatePrice = (timeType: string): number => {
    const data = getAll<RoomTimeRate>(LS_KEYS.ROOM_TIME_RATES);
    const rate = data.find((r) => r.time_type === timeType);
    return rate?.price || 0;
  };

  const checkIn = (
    roomId: string,
    data: {
      guestName?: string;
      guestDocument?: string;
      guestPhone?: string;
      timeType: string;
      notes?: string;
    }
  ) => {
    const minutes = getTimeRateMinutes(data.timeType);
    const basePrice = getTimeRatePrice(data.timeType);

    const entryTime = new Date();
    const expectedExitTime = new Date(entryTime.getTime() + minutes * 60000);

    const rooms = getAll<Room>(LS_KEYS.ROOMS);

    const occupancy = insert<RoomOccupancy>(LS_KEYS.ROOM_OCCUPANCIES, {
      id: generateId(),
      room_id: roomId,
      comanda_id: null,
      guest_name: data.guestName || null,
      guest_document: data.guestDocument || null,
      guest_phone: data.guestPhone || null,
      time_type: data.timeType,
      entry_time: entryTime.toISOString(),
      expected_exit_time: expectedExitTime.toISOString(),
      actual_exit_time: null,
      base_price: basePrice,
      overtime_price: 0,
      total_price: basePrice,
      status: 'ativo',
      notes: data.notes || null,
      user_id: user?.id || null,
      room: rooms.find((r) => r.id === roomId),
    } as RoomOccupancy);

    update<Room>(LS_KEYS.ROOMS, roomId, { status: 'ocupado' });
    addAuditLog('check_in', 'room_occupancies', occupancy.id, null, occupancy);

    const occupancyWithRoom = {
      ...occupancy,
      room: rooms.find((r) => r.id === roomId),
    };

    setOccupancies((prev) => [occupancyWithRoom, ...prev]);
    return occupancyWithRoom;
  };

  const checkOut = (occupancyId: string, overtimePrice: number = 0) => {
    const occupancies = getAll<RoomOccupancy>(LS_KEYS.ROOM_OCCUPANCIES);
    const occupancy = occupancies.find((o) => o.id === occupancyId);

    if (!occupancy) throw new Error('Occupancy not found');

    const totalPrice = occupancy.base_price + overtimePrice;

    update<RoomOccupancy>(LS_KEYS.ROOM_OCCUPANCIES, occupancyId, {
      actual_exit_time: new Date().toISOString(),
      overtime_price: overtimePrice,
      total_price: totalPrice,
      status: 'finalizado',
    });

    update<Room>(LS_KEYS.ROOMS, occupancy.room_id, { status: 'livre' });
    addAuditLog('check_out', 'room_occupancies', occupancyId, null, { totalPrice });

    setOccupancies((prev) => prev.filter((o) => o.id !== occupancyId));
  };

  const calculateOvertime = (occupancy: RoomOccupancy): { minutes: number; price: number } => {
    if (!occupancy.expected_exit_time) return { minutes: 0, price: 0 };

    const now = new Date();
    const expectedExit = new Date(occupancy.expected_exit_time);

    const diffMs = now.getTime() - expectedExit.getTime();
    const diffMinutes = Math.max(0, Math.ceil(diffMs / 60000));

    const overtimePrice = Math.ceil(diffMinutes / 30) * (occupancy.base_price * 0.3);

    return { minutes: diffMinutes, price: overtimePrice };
  };

  return {
    occupancies,
    loading,
    fetchOccupancies,
    checkIn,
    checkOut,
    calculateOvertime,
    getTimeRateMinutes,
    getTimeRatePrice,
  };
}

export function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchReservations = useCallback((date?: string) => {
    setLoading(true);
    let data = getAll<Reservation>(LS_KEYS.RESERVATIONS);
    const rooms = getAll<Room>(LS_KEYS.ROOMS);
    const tables = getAll<{ id: string; number: number; name: string | null }>(LS_KEYS.TABLES);

    if (date) {
      data = data.filter((r) => r.reservation_date === date);
    }

    data = data.map((r) => ({
      ...r,
      room: rooms.find((room) => room.id === r.room_id),
      table: tables.find((t) => t.id === r.table_id),
    }));
    data.sort((a, b) => a.reservation_date.localeCompare(b.reservation_date));

    setReservations(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    fetchReservations(today);
  }, [fetchReservations]);

  const createReservation = (reservation: Partial<Reservation>) => {
    const newReservation = insert<Reservation>(LS_KEYS.RESERVATIONS, {
      ...reservation,
      user_id: user?.id || null,
    } as Reservation);

    const rooms = getAll<Room>(LS_KEYS.ROOMS);
    const tables = getAll<{ id: string; number: number; name: string | null }>(LS_KEYS.TABLES);
    const reservationWithRelations = {
      ...newReservation,
      room: rooms.find((r) => r.id === newReservation.room_id),
      table: tables.find((t) => t.id === newReservation.table_id),
    };

    addAuditLog('create_reservation', 'reservations', newReservation.id, null, newReservation);
    setReservations((prev) => [...prev, reservationWithRelations]);
    return reservationWithRelations;
  };

  const updateReservation = (id: string, updates: Partial<Reservation>) => {
    const updated = update<Reservation>(LS_KEYS.RESERVATIONS, id, updates);
    if (!updated) throw new Error('Reservation not found');
    addAuditLog('update_reservation', 'reservations', id, null, updated);
    setReservations((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return updated;
  };

  const cancelReservation = (id: string) => {
    const updated = update<Reservation>(LS_KEYS.RESERVATIONS, id, { status: 'cancelada' });
    if (!updated) throw new Error('Reservation not found');
    addAuditLog('cancel_reservation', 'reservations', id, null, updated);
    setReservations((prev) => prev.filter((r) => r.id !== id));
  };

  return {
    reservations,
    loading,
    fetchReservations,
    createReservation,
    updateReservation,
    cancelReservation,
  };
}
