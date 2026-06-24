'use client';

import { useState, useMemo } from 'react';
import { AppShell } from '@/components/app-shell';
import { useRooms, useRoomOccupancies, useReservations } from '@/hooks/useRooms';
import { useTables } from '@/hooks/useTables';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Calendar,
  Plus,
  Clock,
  User,
  Phone,
  Mail,
  Users,
  BedDouble,
  Utensils,
  ArrowRight,
  CheckCircle,
  XCircle,
  CalendarDays,
} from 'lucide-react';
import { format, isToday, startOfDay, endOfDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RecepcaoPage() {
  const { rooms } = useRooms();
  const { tables } = useTables();
  const { occupancies, checkIn } = useRoomOccupancies();
  const { reservations, createReservation, updateReservation, cancelReservation } = useReservations();

  const [reservationDialog, setReservationDialog] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const [reservationForm, setReservationForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '19:00',
    guests: 2,
    notes: '',
  });

  const todayReservations = useMemo(() => {
    return reservations.filter((r) => {
      const resDate = new Date(r.reservation_date);
      return isToday(resDate) && r.status === 'confirmada';
    });
  }, [reservations]);

  const upcomingReservations = useMemo(() => {
    const tomorrow = addDays(new Date(), 1);
    return reservations.filter((r) => {
      const resDate = new Date(r.reservation_date);
      return resDate >= tomorrow && r.status === 'confirmada';
    }).slice(0, 10);
  }, [reservations]);

  const handleCreateReservation = async () => {
    try {
      await createReservation({
        room_id: selectedRoomId,
        table_id: selectedTableId,
        customer_name: reservationForm.customerName,
        customer_phone: reservationForm.customerPhone || null,
        customer_email: reservationForm.customerEmail || null,
        reservation_date: reservationForm.date,
        reservation_time: reservationForm.time,
        guests: reservationForm.guests,
        notes: reservationForm.notes || null,
        status: 'confirmada',
      });
      toast.success('Reserva criada com sucesso');
      setReservationDialog(false);
      setReservationForm({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '19:00',
        guests: 2,
        notes: '',
      });
      setSelectedRoomId(null);
      setSelectedTableId(null);
    } catch (error) {
      toast.error('Erro ao criar reserva');
    }
  };

  const handleCancelReservation = async (id: string) => {
    if (confirm('Tem certeza que deseja cancelar esta reserva?')) {
      try {
        await cancelReservation(id);
        toast.success('Reserva cancelada');
      } catch (error) {
        toast.error('Erro ao cancelar reserva');
      }
    }
  };

  const handleCheckInFromReservation = async (reservation: typeof reservations[0]) => {
    if (reservation.room_id) {
      const room = rooms.find((r) => r.id === reservation.room_id);
      if (room && room.status === 'livre') {
        await checkIn(room.id, {
          guestName: reservation.customer_name,
          guestPhone: reservation.customer_phone || undefined,
          timeType: '1h',
        });
        await updateReservation(reservation.id, { status: 'checkin' });
        toast.success('Check-in realizado');
      }
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Recepção</h1>
            <p className="text-muted-foreground">Gerenciamento de check-in e reservas</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setReservationDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Reserva
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Quartos Disponíveis</p>
                  <p className="text-3xl font-bold">{rooms.filter((r) => r.status === 'livre').length}</p>
                </div>
                <BedDouble className="h-10 w-10 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Mesas Livres</p>
                  <p className="text-3xl font-bold">{tables.filter((t) => t.status === 'livre').length}</p>
                </div>
                <Utensils className="h-10 w-10 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Reservas Hoje</p>
                  <p className="text-3xl font-bold">{todayReservations.length}</p>
                </div>
                <Calendar className="h-10 w-10 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Hóspedes Ativos</p>
                  <p className="text-3xl font-bold">{occupancies.length}</p>
                </div>
                <Users className="h-10 w-10 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="quartos">
          <TabsList>
            <TabsTrigger value="quartos">Quartos</TabsTrigger>
            <TabsTrigger value="mesas">Mesas</TabsTrigger>
            <TabsTrigger value="hospedes">Hóspedes Ativos</TabsTrigger>
            <TabsTrigger value="reservas">Reservas</TabsTrigger>
          </TabsList>

          <TabsContent value="quartos" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rooms.map((room) => (
                <Card
                  key={room.id}
                  className={`border-l-4 ${
                    room.status === 'livre' ? 'border-l-green-500' :
                    room.status === 'ocupado' ? 'border-l-red-500' :
                    'border-l-gray-500'
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Q{room.number}</CardTitle>
                      <Badge variant={room.status === 'livre' ? 'default' : 'secondary'}>
                        {room.status === 'livre' ? 'Disponível' :
                         room.status === 'ocupado' ? 'Ocupado' : room.status}
                      </Badge>
                    </div>
                    {room.name && <CardDescription>{room.name}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    {room.status === 'livre' && (
                      <Button
                        className="w-full"
                        onClick={() => {
                          setSelectedRoomId(room.id);
                          setReservationDialog(true);
                        }}
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Reservar/Check-in
                      </Button>
                    )}
                    {room.status === 'ocupado' && occupancies.find((o) => o.room_id === room.id) && (
                      <div className="text-sm text-muted-foreground">
                        <p>{occupancies.find((o) => o.room_id === room.id)?.guest_name || 'Hóspede'}</p>
                        <p>
                          {format(new Date(occupancies.find((o) => o.room_id === room.id)?.entry_time || ''), 'HH:mm')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mesas" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tables.map((table) => (
                <Card
                  key={table.id}
                  className={`border-l-4 ${
                    table.status === 'livre' ? 'border-l-green-500' :
                    table.status === 'ocupada' ? 'border-l-red-500' :
                    table.status === 'reservada' ? 'border-l-amber-500' : 'border-l-gray-500'
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Mesa {table.number}</CardTitle>
                      <Badge variant={table.status === 'livre' ? 'default' : 'secondary'}>
                        {table.status === 'livre' ? 'Livre' :
                         table.status === 'ocupada' ? 'Ocupada' :
                         table.status === 'reservada' ? 'Reservada' : table.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      <Users className="h-4 w-4 inline mr-1" />
                      {table.capacity} lugares
                    </p>
                    {table.status === 'livre' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSelectedTableId(table.id);
                          setReservationDialog(true);
                        }}
                      >
                        Reservar
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="hospedes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hóspedes Atuais</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {occupancies.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum hóspede no momento</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {occupancies.map((occ) => (
                        <div
                          key={occ.id}
                          className="flex items-center justify-between p-4 rounded-lg border"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <User className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium">{occ.guest_name || 'Hóspede'}</span>
                            </div>
                            {occ.guest_phone && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Phone className="h-3 w-3" />
                                {occ.guest_phone}
                              </p>
                            )}
                            {occ.room && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Quarto {occ.room.number}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge>
                              {occ.time_type === 'pernoite' ? 'Pernoite' : occ.time_type}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              Entrada: {format(new Date(occ.entry_time), 'HH:mm')}
                            </p>
                            {occ.expected_exit_time && (
                              <p className="text-sm text-muted-foreground">
                                Saída prevista: {format(new Date(occ.expected_exit_time), 'HH:mm')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reservas" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Reservas de Hoje
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {todayReservations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma reserva para hoje</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {todayReservations.map((res) => (
                        <div key={res.id} className="flex items-start justify-between p-3 rounded-lg border">
                          <div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{res.customer_name}</span>
                            </div>
                            {res.room && (
                              <p className="text-sm text-muted-foreground">
                                Quarto {res.room.number}
                              </p>
                            )}
                            {res.table && (
                              <p className="text-sm text-muted-foreground">
                                Mesa {res.table.number}
                              </p>
                            )}
                            {res.reservation_time && (
                              <p className="text-sm flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {res.reservation_time}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {res.room_id && (
                              <Button
                                size="sm"
                                onClick={() => handleCheckInFromReservation(res)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Check-in
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelReservation(res.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Próximas Reservas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingReservations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma reserva futura</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingReservations.map((res) => (
                        <div key={res.id} className="flex items-start justify-between p-3 rounded-lg border">
                          <div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{res.customer_name}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(res.reservation_date), "dd MMM", { locale: ptBR })}
                              {res.reservation_time && ` - ${res.reservation_time}`}
                            </p>
                            {res.room && (
                              <Badge variant="outline" className="mt-1">
                                Q{res.room.number}
                              </Badge>
                            )}
                            {res.table && (
                              <Badge variant="outline" className="mt-1">
                                M{res.table.number}
                              </Badge>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelReservation(res.id)}
                          >
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={reservationDialog} onOpenChange={(open) => {
          setReservationDialog(open);
          if (!open) {
            setSelectedRoomId(null);
            setSelectedTableId(null);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Reserva</DialogTitle>
              <DialogDescription>
                {selectedRoomId && `Quarto ${rooms.find((r) => r.id === selectedRoomId)?.number}`}
                {selectedTableId && `Mesa ${tables.find((t) => t.id === selectedTableId)?.number}`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Cliente *</Label>
                  <Input
                    value={reservationForm.customerName}
                    onChange={(e) => setReservationForm({ ...reservationForm, customerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={reservationForm.customerPhone}
                    onChange={(e) => setReservationForm({ ...reservationForm, customerPhone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={reservationForm.customerEmail}
                    onChange={(e) => setReservationForm({ ...reservationForm, customerEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pessoas</Label>
                  <Input
                    type="number"
                    min="1"
                    value={reservationForm.guests}
                    onChange={(e) => setReservationForm({ ...reservationForm, guests: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={reservationForm.date}
                    onChange={(e) => setReservationForm({ ...reservationForm, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    value={reservationForm.time}
                    onChange={(e) => setReservationForm({ ...reservationForm, time: e.target.value })}
                  />
                </div>
              </div>
              {!selectedRoomId && !selectedTableId && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quarto (opcional)</Label>
                    <Select
                      value={selectedRoomId || ''}
                      onValueChange={setSelectedRoomId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.filter((r) => r.status === 'livre').map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            Quarto {room.number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Mesa (opcional)</Label>
                    <Select
                      value={selectedTableId || ''}
                      onValueChange={setSelectedTableId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {tables.filter((t) => t.status === 'livre').map((table) => (
                          <SelectItem key={table.id} value={table.id}>
                            Mesa {table.number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Observações</Label>
                <Input
                  value={reservationForm.notes}
                  onChange={(e) => setReservationForm({ ...reservationForm, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReservationDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateReservation} disabled={!reservationForm.customerName}>
                Criar Reserva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
