'use client';

import { useState, useEffect, useMemo } from 'react';
import { AppShell } from '@/components/app-shell';
import { useRooms, useRoomTimeRates, useRoomOccupancies } from '@/hooks/useRooms';
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
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Plus,
  BedDouble,
  Clock,
  AlertCircle,
  CheckCircle,
  Play,
  Square,
  MoreHorizontal,
  Pencil,
  Trash2,
  Settings,
  User,
  Phone,
  Calendar,
  DollarSign,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Room, RoomOccupancy, RoomTimeRate } from '@/lib/supabase';
import { addMinutes, differenceInMinutes, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TIME_TYPES = [
  { value: '30min', label: '30 minutos' },
  { value: '1h', label: '1 hora' },
  { value: '2h', label: '2 horas' },
  { value: '3h', label: '3 horas' },
  { value: '6h', label: '6 horas' },
  { value: 'pernoite', label: 'Pernoite' },
];

const ROOM_STATUSES = [
  { value: 'livre', label: 'Livre', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'ocupado', label: 'Ocupado', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'limpeza', label: 'Limpeza', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'manutencao', label: 'Manutenção', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
  { value: 'reservado', label: 'Reservado', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
];

function TimeCountdown({ occupancy, onCheckout, rates }: { occupancy: RoomOccupancy; onCheckout: () => void; rates: RoomTimeRate[] }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!occupancy.expected_exit_time) return null;

  const exitTime = new Date(occupancy.expected_exit_time);
  const diffMinutes = differenceInMinutes(exitTime, now);

  const isOvertime = diffMinutes < 0;
  const absMinutes = Math.abs(diffMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;

  const rate = rates.find((r) => r.time_type === occupancy.time_type);
  const overtimePrice = isOvertime ? Math.ceil(absMinutes / 30) * (rate?.price || 0) * 0.3 : 0;

  const percentage = rate ? Math.min(100, Math.max(0, ((rate.minutes + diffMinutes) / rate.minutes) * 100)) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Tempo</span>
        <span className={`text-lg font-bold ${isOvertime ? 'text-red-500' : ''}`}>
          {isOvertime ? '+' : ''}{hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}
        </span>
      </div>
      <Progress
        value={percentage}
        className={`h-2 ${isOvertime ? 'bg-red-100' : ''}`}
      />
      {isOvertime && (
        <div className="flex items-center gap-2 text-red-500 text-sm animate-pulse">
          <AlertCircle className="h-4 w-4" />
          <span>Tempo excedido!</span>
          <span className="font-medium">
            +R$ {overtimePrice.toFixed(2)}
          </span>
        </div>
      )}
      <Button
        variant={isOvertime ? 'destructive' : 'default'}
        className="w-full"
        onClick={onCheckout}
      >
        <Square className="h-4 w-4 mr-2" />
        Finalizar
      </Button>
    </div>
  );
}

export default function QuartosPage() {
  const { rooms, loading: roomsLoading, createRoom, updateRoom, deleteRoom } = useRooms();
  const { rates, updateRate } = useRoomTimeRates();
  const { occupancies, checkIn, checkOut, calculateOvertime } = useRoomOccupancies();

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [checkInDialog, setCheckInDialog] = useState(false);
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [roomDialog, setRoomDialog] = useState(false);
  const [ratesDialog, setRatesDialog] = useState(false);
  const [selectedOccupancy, setSelectedOccupancy] = useState<RoomOccupancy | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const [checkInForm, setCheckInForm] = useState({
    guestName: '',
    guestDocument: '',
    guestPhone: '',
    timeType: '1h' as const,
    notes: '',
  });

  const [roomForm, setRoomForm] = useState({
    number: '',
    name: '',
    type: '',
    price: 0,
    notes: '',
    status: 'livre' as Room['status'],
  });

  const [rateForm, setRateForm] = useState<Record<string, number>>({});

  useEffect(() => {
    const initialRates: Record<string, number> = {};
    rates.forEach((rate) => {
      initialRates[rate.time_type] = rate.price;
    });
    setRateForm(initialRates);
  }, [rates]);

  const activeOccupancies = useMemo(() => {
    const map = new Map<string, RoomOccupancy>();
    occupancies.forEach((o) => {
      if (o.status === 'ativo') {
        map.set(o.room_id, o);
      }
    });
    return map;
  }, [occupancies]);

  const handleOpenCheckIn = (room: Room) => {
    setSelectedRoom(room);
    setCheckInForm({
      guestName: '',
      guestDocument: '',
      guestPhone: '',
      timeType: '1h',
      notes: '',
    });
    setCheckInDialog(true);
  };

  const handleCheckIn = async () => {
    if (!selectedRoom) return;
    try {
      await checkIn(selectedRoom.id, {
        guestName: checkInForm.guestName || undefined,
        guestDocument: checkInForm.guestDocument || undefined,
        guestPhone: checkInForm.guestPhone || undefined,
        timeType: checkInForm.timeType,
        notes: checkInForm.notes || undefined,
      });
      toast.success('Check-in realizado com sucesso');
      setCheckInDialog(false);
    } catch (error) {
      toast.error('Erro ao realizar check-in');
    }
  };

  const handleCheckout = async () => {
    if (!selectedOccupancy) return;
    try {
      const { price } = calculateOvertime(selectedOccupancy);
      await checkOut(selectedOccupancy.id, price);
      toast.success('Check-out realizado com sucesso');
      setCheckoutDialog(false);
      setSelectedOccupancy(null);
    } catch (error) {
      toast.error('Erro ao realizar check-out');
    }
  };

  const handleOpenRoomDialog = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setRoomForm({
        number: room.number,
        name: room.name || '',
        type: room.type || '',
        price: room.price,
        notes: room.notes || '',
        status: room.status,
      });
    } else {
      setEditingRoom(null);
      setRoomForm({
        number: '',
        name: '',
        type: '',
        price: 0,
        notes: '',
        status: 'livre',
      });
    }
    setRoomDialog(true);
  };

  const handleSaveRoom = async () => {
    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, roomForm);
        toast.success('Quarto atualizado');
      } else {
        await createRoom({ ...roomForm, active: true });
        toast.success('Quarto criado');
      }
      setRoomDialog(false);
    } catch (error) {
      toast.error('Erro ao salvar quarto');
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este quarto?')) {
      try {
        await deleteRoom(id);
        toast.success('Quarto excluído');
      } catch (error) {
        toast.error('Erro ao excluir quarto');
      }
    }
  };

  const handleSaveRates = async () => {
    try {
      for (const [timeType, price] of Object.entries(rateForm)) {
        const rate = rates.find((r) => r.time_type === timeType);
        if (rate) {
          await updateRate(rate.id, price);
        }
      }
      toast.success('Valores atualizados');
      setRatesDialog(false);
    } catch (error) {
      toast.error('Erro ao atualizar valores');
    }
  };

  const getStatusColor = (status: string) => {
    return ROOM_STATUSES.find((s) => s.value === status)?.color || '';
  };

  return (
    <AppShell>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Quartos</h1>
            <p className="text-muted-foreground">Controle de ocupação dos quartos</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setRatesDialog(true)}>
              <DollarSign className="h-4 w-4 mr-2" />
              Valores
            </Button>
            <Button onClick={() => handleOpenRoomDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Quarto
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {ROOM_STATUSES.map((status) => (
            <Card key={status.value}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{status.label}</p>
                    <p className="text-2xl font-bold">
                      {rooms.filter((r) => r.status === status.value).length}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${status.color}`}>
                    <BedDouble className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="ativos">
          <TabsList>
            <TabsTrigger value="ativos">Disponíveis</TabsTrigger>
            <TabsTrigger value="ocupados">Ocupados</TabsTrigger>
            <TabsTrigger value="todos">Todos</TabsTrigger>
          </TabsList>

          <TabsContent value="ativos" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rooms
                .filter((r) => r.status === 'livre' || r.status === 'limpeza')
                .map((room) => (
                  <Card key={room.id} className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">Quarto {room.number}</CardTitle>
                        <Badge className={getStatusColor(room.status)}>
                          {ROOM_STATUSES.find((s) => s.value === room.status)?.label}
                        </Badge>
                      </div>
                      {room.name && <CardDescription>{room.name}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BedDouble className="h-4 w-4" />
                          {room.type || 'Standard'}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Valor base</span>
                          <span className="font-bold">R$ {room.price.toFixed(2)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button onClick={() => handleOpenCheckIn(room)}>
                            <Play className="h-4 w-4 mr-2" />
                            Check-in
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenRoomDialog(room)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateRoom(room.id, { status: 'limpeza' })}>
                                Limpeza
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateRoom(room.id, { status: 'manutencao' })}>
                                Manutenção
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteRoom(room.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="ocupados" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rooms
                .filter((r) => r.status === 'ocupado')
                .map((room) => {
                  const occupancy = activeOccupancies.get(room.id);
                  return (
                    <Card key={room.id} className="border-l-4 border-l-red-500">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl">Quarto {room.number}</CardTitle>
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            Ocupado
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {occupancy ? (
                          <div className="space-y-4">
                            {occupancy.guest_name && (
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                {occupancy.guest_name}
                              </div>
                            )}
                            {occupancy.guest_phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                {occupancy.guest_phone}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {TIME_TYPES.find((t) => t.value === occupancy?.time_type)?.label}
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Entrada</span>
                              <span>
                                {new Date(occupancy.entry_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm font-bold">
                              <span>Valor</span>
                              <span>R$ {occupancy.base_price.toFixed(2)}</span>
                            </div>
                            <TimeCountdown
                              occupancy={occupancy}
                              rates={rates}
                              onCheckout={() => {
                                setSelectedOccupancy(occupancy);
                                setCheckoutDialog(true);
                              }}
                            />
                          </div>
                        ) : (
                          <p className="text-muted-foreground">Carregando...</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>

          <TabsContent value="todos" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rooms.map((room) => (
                <Card
                  key={room.id}
                  className={`border-l-4 ${
                    room.status === 'livre' ? 'border-l-green-500' :
                    room.status === 'ocupado' ? 'border-l-red-500' :
                    room.status === 'limpeza' ? 'border-l-blue-500' :
                    room.status === 'manutencao' ? 'border-l-gray-500' : 'border-l-amber-500'
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">Quarto {room.number}</span>
                      <Badge className={getStatusColor(room.status)}>
                        {ROOM_STATUSES.find((s) => s.value === room.status)?.label}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleOpenRoomDialog(room)}
                      >
                        Editar
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => updateRoom(room.id, { status: 'livre' })}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Livre
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateRoom(room.id, { status: 'limpeza' })}>
                            Limpeza
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateRoom(room.id, { status: 'manutencao' })}>
                            Manutenção
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={checkInDialog} onOpenChange={setCheckInDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Check-in - Quarto {selectedRoom?.number}</DialogTitle>
              <DialogDescription>
                Registre a entrada do hóspede
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Hóspede</Label>
                  <Input
                    placeholder="Nome completo"
                    value={checkInForm.guestName}
                    onChange={(e) => setCheckInForm({ ...checkInForm, guestName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    placeholder="Telefone"
                    value={checkInForm.guestPhone}
                    onChange={(e) => setCheckInForm({ ...checkInForm, guestPhone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Documento</Label>
                  <Input
                    placeholder="CPF ou RG"
                    value={checkInForm.guestDocument}
                    onChange={(e) => setCheckInForm({ ...checkInForm, guestDocument: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tempo</Label>
                  <Select
                    value={checkInForm.timeType}
                    onValueChange={(value) => setCheckInForm({ ...checkInForm, timeType: value as typeof checkInForm.timeType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label} - R$ {(rates.find((r) => r.time_type === type.value)?.price || 0).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Input
                  placeholder="Observações..."
                  value={checkInForm.notes}
                  onChange={(e) => setCheckInForm({ ...checkInForm, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCheckInDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCheckIn}>
                <Play className="h-4 w-4 mr-2" />
                Iniciar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={checkoutDialog} onOpenChange={setCheckoutDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Check-out</DialogTitle>
              <DialogDescription>
                Finalizar estadia
              </DialogDescription>
            </DialogHeader>
            {selectedOccupancy && (
              <div className="grid gap-4 py-4">
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quarto</span>
                    <span className="font-medium">{selectedOccupancy.room?.number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hóspede</span>
                    <span className="font-medium">{selectedOccupancy.guest_name || 'Não informado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entrada</span>
                    <span className="font-medium">
                      {new Date(selectedOccupancy.entry_time).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor Base</span>
                    <span className="font-medium">R$ {selectedOccupancy.base_price.toFixed(2)}</span>
                  </div>
                </div>
                {(() => {
                  const { minutes, price } = calculateOvertime(selectedOccupancy);
                  if (minutes > 0) {
                    return (
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                        <p className="text-red-600 dark:text-red-400 font-medium mb-2">
                          Tempo Excedido: {Math.floor(minutes / 60)}h {minutes % 60}min
                        </p>
                        <p className="text-red-700 dark:text-red-300">
                          Valor adicional: R$ {price.toFixed(2)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="bg-primary/10 rounded-lg p-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>
                      R$ {(
                        selectedOccupancy.base_price +
                        (calculateOvertime(selectedOccupancy).price || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setCheckoutDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCheckout}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Finalizar Check-out
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={roomDialog} onOpenChange={setRoomDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRoom ? 'Editar Quarto' : 'Novo Quarto'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número *</Label>
                  <Input
                    value={roomForm.number}
                    onChange={(e) => setRoomForm({ ...roomForm, number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    placeholder="Ex: Suíte Master"
                    value={roomForm.name}
                    onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Input
                    placeholder="Ex: Standard, Luxo..."
                    value={roomForm.type}
                    onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço Base</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={roomForm.price}
                    onChange={(e) => setRoomForm({ ...roomForm, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              {editingRoom && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={roomForm.status}
                    onValueChange={(value) => setRoomForm({ ...roomForm, status: value as Room['status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOM_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Observações</Label>
                <Input
                  value={roomForm.notes}
                  onChange={(e) => setRoomForm({ ...roomForm, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRoomDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveRoom}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={ratesDialog} onOpenChange={setRatesDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Valores por Período</DialogTitle>
              <DialogDescription>
                Configure os valores para cada período de permanência
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {TIME_TYPES.map((type) => (
                <div key={type.value} className="flex items-center justify-between">
                  <Label className="flex-1">{type.label}</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-24"
                      value={rateForm[type.value] || 0}
                      onChange={(e) => setRateForm({ ...rateForm, [type.value]: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRatesDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveRates}>Salvar Valores</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
