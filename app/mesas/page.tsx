'use client';

import { useState, useRef } from 'react';
import { AppShell } from '@/components/app-shell';
import { useTables } from '@/hooks/useTables';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Plus,
  Grid3X3,
  List,
  Users,
  Circle,
  Coffee,
  Trash2,
  Pencil,
  Move,
  Lock,
  Unlock,
  Utensils,
} from 'lucide-react';
import { Table } from '@/lib/supabase';
import Link from 'next/link';

export default function MesasPage() {
  const { tables, loading, createTable, updateTable, deleteTable, updateTablePositions } = useTables();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [draggedTable, setDraggedTable] = useState<Table | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    number: 1,
    name: '',
    capacity: 4,
    status: 'livre' as 'livre' | 'ocupada' | 'reservada' | 'fechada',
    position_x: 0,
    position_y: 0,
    width: 80,
    height: 80,
  });

  const handleOpenDialog = (table?: Table) => {
    if (table) {
      setEditingTable(table);
      setForm({
        number: table.number,
        name: table.name || '',
        capacity: table.capacity,
        status: table.status,
        position_x: table.position_x,
        position_y: table.position_y,
        width: table.width,
        height: table.height,
      });
    } else {
      setEditingTable(null);
      const maxNumber = Math.max(...tables.map((t) => t.number), 0);
      setForm({
        number: maxNumber + 1,
        name: '',
        capacity: 4,
        status: 'livre',
        position_x: 0,
        position_y: 0,
        width: 80,
        height: 80,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingTable) {
        await updateTable(editingTable.id, form);
        toast.success('Mesa atualizada com sucesso');
      } else {
        await createTable(form);
        toast.success('Mesa criada com sucesso');
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar mesa');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta mesa?')) {
      try {
        await deleteTable(id);
        toast.success('Mesa excluída com sucesso');
      } catch (error) {
        toast.error('Erro ao excluir mesa');
      }
    }
  };

  const handleStatusChange = async (id: string, status: Table['status']) => {
    try {
      await updateTable(id, { status });
      toast.success('Status atualizado');
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDragStart = (e: React.DragEvent, table: Table) => {
    setDraggedTable(table);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedTable || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - draggedTable.width / 2;
    const y = e.clientY - rect.top - draggedTable.height / 2;

    const position_x = Math.max(0, Math.min(x, rect.width - draggedTable.width));
    const position_y = Math.max(0, Math.min(y, rect.height - draggedTable.height));

    await updateTable(draggedTable.id, { position_x, position_y });
    setDraggedTable(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'livre':
        return 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-400';
      case 'ocupada':
        return 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-400';
      case 'reservada':
        return 'bg-amber-100 dark:bg-amber-900/30 border-amber-500 text-amber-700 dark:text-amber-400';
      case 'fechada':
        return 'bg-gray-100 dark:bg-gray-900/30 border-gray-500 text-gray-700 dark:text-gray-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'livre':
        return <Unlock className="h-4 w-4" />;
      case 'ocupada':
        return <Lock className="h-4 w-4" />;
      case 'reservada':
        return <Coffee className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'livre':
        return 'Livre';
      case 'ocupada':
        return 'Ocupada';
      case 'reservada':
        return 'Reservada';
      case 'fechada':
        return 'Fechada';
      default:
        return status;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mesas</h1>
            <p className="text-muted-foreground">Gerencie as mesas do estabelecimento</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Mesa
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Livres</p>
                  <p className="text-2xl font-bold text-green-600">
                    {tables.filter((t) => t.status === 'livre').length}
                  </p>
                </div>
                <Unlock className="h-8 w-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ocupadas</p>
                  <p className="text-2xl font-bold text-red-600">
                    {tables.filter((t) => t.status === 'ocupada').length}
                  </p>
                </div>
                <Lock className="h-8 w-8 text-red-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reservadas</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {tables.filter((t) => t.status === 'reservada').length}
                  </p>
                </div>
                <Coffee className="h-8 w-8 text-amber-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{tables.length}</p>
                </div>
                <Utensils className="h-8 w-8 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {viewMode === 'grid' ? (
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">Mapa de Mesas</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                ref={containerRef}
                className="relative h-[500px] bg-muted/30 rounded-lg border-2 border-dashed"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {tables.map((table) => (
                  <div
                    key={table.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, table)}
                    className={`absolute flex flex-col items-center justify-center rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${getStatusColor(table.status)}`}
                    style={{
                      left: table.position_x,
                      top: table.position_y,
                      width: table.width,
                      height: table.height,
                    }}
                    onClick={() => handleOpenDialog(table)}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      {getStatusIcon(table.status)}
                      <span className="text-lg font-bold">{table.number}</span>
                    </div>
                    <span className="text-xs opacity-75">{getStatusLabel(table.status)}</span>
                    <span className="text-xs opacity-75">
                      <Users className="h-3 w-3 inline mr-1" />
                      {table.capacity}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Move className="h-3 w-3" />
                Arraste as mesas para reposicionar
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {tables.map((table) => (
              <Card
                key={table.id}
                className={`overflow-hidden border-l-4 ${
                  table.status === 'livre' ? 'border-l-green-500' :
                  table.status === 'ocupada' ? 'border-l-red-500' :
                  table.status === 'reservada' ? 'border-l-amber-500' : 'border-l-gray-500'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">Mesa {table.number}</span>
                    <Badge className={getStatusColor(table.status)}>
                      {getStatusLabel(table.status)}
                    </Badge>
                  </div>
                  {table.name && (
                    <p className="text-sm text-muted-foreground mb-2">{table.name}</p>
                  )}
                  <div className="flex items-center text-sm text-muted-foreground mb-4">
                    <Users className="h-4 w-4 mr-1" />
                    {table.capacity} lugares
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={table.status}
                      onValueChange={(value) => handleStatusChange(table.id, value as Table['status'])}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="livre">Livre</SelectItem>
                        <SelectItem value="ocupada">Ocupada</SelectItem>
                        <SelectItem value="reservada">Reservada</SelectItem>
                        <SelectItem value="fechada">Fechada</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenDialog(table)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(table.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTable ? 'Editar Mesa' : 'Nova Mesa'}</DialogTitle>
              <DialogDescription>
                Configure os dados da mesa
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number">Número *</Label>
                  <Input
                    id="number"
                    type="number"
                    min="1"
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacidade</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome (opcional)</Label>
                <Input
                  id="name"
                  placeholder="Ex: Mesa da varanda"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm({ ...form, status: value as Table['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="livre">Livre</SelectItem>
                    <SelectItem value="ocupada">Ocupada</SelectItem>
                    <SelectItem value="reservada">Reservada</SelectItem>
                    <SelectItem value="fechada">Fechada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
