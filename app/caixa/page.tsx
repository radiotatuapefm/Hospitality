'use client';

import { useState, useMemo } from 'react';
import { AppShell } from '@/components/app-shell';
import { useCashShifts, useCashMovements } from '@/hooks/useCash';
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
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  CreditCard,
  DollarSign,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Play,
  Square,
  History,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MOVEMENT_REASONS = {
  entrada: ['Vendas', 'Suprimento', 'Devolução', 'Ajuste', 'Outros'],
  saida: ['Sangria', 'Pagamento', 'Retirada', 'Ajuste', 'Outros'],
};

export default function CaixaPage() {
  const { currentShift, shifts, loading, openShift, closeShift, fetchShifts } = useCashShifts();
  const { movements, fetchMovements, sangria, suprimento } = useCashMovements(currentShift?.id);

  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  const [movementDialog, setMovementDialog] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [reportDialog, setReportDialog] = useState(false);

  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [closeNotes, setCloseNotes] = useState('');

  const [movementType, setMovementType] = useState<'entrada' | 'saida'>('entrada');
  const [movementAmount, setMovementAmount] = useState(0);
  const [movementReason, setMovementReason] = useState('');
  const [movementNotes, setMovementNotes] = useState('');

  const totalEntradas = useMemo(() => {
    return movements.filter((m) => m.type === 'entrada').reduce((sum, m) => sum + m.amount, 0);
  }, [movements]);

  const totalSaidas = useMemo(() => {
    return movements.filter((m) => m.type === 'saida').reduce((sum, m) => sum + m.amount, 0);
  }, [movements]);

  const expectedBalance = useMemo(() => {
    if (!currentShift) return 0;
    return currentShift.opening_balance + totalEntradas - totalSaidas;
  }, [currentShift, totalEntradas, totalSaidas]);

  const handleOpenShift = async () => {
    try {
      await openShift(openingBalance);
      toast.success('Caixa aberto com sucesso');
      setOpenDialog(false);
      setOpeningBalance(0);
    } catch (error) {
      toast.error('Erro ao abrir caixa');
    }
  };

  const handleCloseShift = async () => {
    try {
      await closeShift(closingBalance, closeNotes);
      toast.success('Caixa fechado com sucesso');
      setCloseDialog(false);
      setClosingBalance(0);
      setCloseNotes('');
    } catch (error) {
      toast.error('Erro ao fechar caixa');
    }
  };

  const handleAddMovement = async () => {
    if (!currentShift) return;
    try {
      if (movementType === 'entrada') {
        await suprimento(currentShift.id, movementAmount, movementReason);
      } else {
        await sangria(currentShift.id, movementAmount, movementReason);
      }
      toast.success(`${movementType === 'entrada' ? 'Suprimento' : 'Sangria'} registrado`);
      setMovementDialog(false);
      setMovementAmount(0);
      setMovementReason('');
      setMovementNotes('');
    } catch (error) {
      toast.error('Erro ao registrar movimentação');
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Caixa</h1>
            <p className="text-muted-foreground">
              {currentShift ? 'Caixa aberto' : 'Nenhum caixa aberto'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!currentShift ? (
              <Button onClick={() => setOpenDialog(true)}>
                <Play className="h-4 w-4 mr-2" />
                Abrir Caixa
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setMovementDialog(true)}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Movimentação
                </Button>
                <Button variant="outline" onClick={() => setHistoryDialog(true)}>
                  <History className="h-4 w-4 mr-2" />
                  Histórico
                </Button>
                <Button variant="destructive" onClick={() => setCloseDialog(true)}>
                  <Square className="h-4 w-4 mr-2" />
                  Fechar Caixa
                </Button>
              </>
            )}
          </div>
        </div>

        {!currentShift ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Nenhum Caixa Aberto</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Abra um novo caixa para começar a registrar movimentações e vendas do dia.
              </p>
              <Button size="lg" onClick={() => setOpenDialog(true)}>
                <Play className="h-5 w-5 mr-2" />
                Abrir Caixa
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Inicial</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {currentShift.opening_balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <ArrowDownRight className="h-4 w-4 text-green-500" />
                    Entradas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <ArrowUpRight className="h-4 w-4 text-red-500" />
                    Saídas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-primary/5 border-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Esperado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {expectedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Movimentações Recentes</CardTitle>
                <CardDescription>
                  Últimas movimentações do caixa atual
                </CardDescription>
              </CardHeader>
              <CardContent>
                {movements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma movimentação registrada</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {movements.slice(0, 10).map((movement) => (
                        <div
                          key={movement.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              movement.type === 'entrada'
                                ? 'bg-green-100 dark:bg-green-900/30'
                                : 'bg-red-100 dark:bg-red-900/30'
                            }`}>
                              {movement.type === 'entrada' ? (
                                <ArrowDownRight className="h-4 w-4 text-green-600" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">
                                {movement.reason || (movement.type === 'entrada' ? 'Entrada' : 'Saída')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <span className={`text-lg font-bold ${
                            movement.type === 'entrada' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {movement.type === 'entrada' ? '+' : '-'}
                            R$ {movement.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Abrir Caixa</DialogTitle>
              <DialogDescription>
                Informe o saldo inicial do caixa
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="openingBalance">Saldo Inicial</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                  <Input
                    id="openingBalance"
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-10"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleOpenShift}>
                <Play className="h-4 w-4 mr-2" />
                Abrir Caixa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Fechar Caixa</DialogTitle>
              <DialogDescription>
                Confirme o fechamento do caixa
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-secondary">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Esperado</p>
                  <p className="text-xl font-bold">
                    R$ {expectedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aberto em</p>
                  <p className="text-sm font-medium">
                    {format(new Date(currentShift?.opened_at || ''), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="closingBalance">Saldo Contado</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                  <Input
                    id="closingBalance"
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-10"
                    value={closingBalance}
                    onChange={(e) => setClosingBalance(parseFloat(e.target.value) || 0)}
                  />
                </div>
                {closingBalance > 0 && closingBalance !== expectedBalance && (
                  <p className={`text-sm ${closingBalance > expectedBalance ? 'text-green-600' : 'text-red-600'}`}>
                    Diferença: R$ {(closingBalance - expectedBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="closeNotes">Observações</Label>
                <Input
                  id="closeNotes"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Motivo da diferença..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCloseDialog(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleCloseShift}>
                <Square className="h-4 w-4 mr-2" />
                Fechar Caixa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={movementDialog} onOpenChange={(open) => {
          setMovementDialog(open);
          if (!open) {
            setMovementType('entrada');
            setMovementAmount(0);
            setMovementReason('');
            setMovementNotes('');
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Movimentação</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={movementType === 'entrada' ? 'default' : 'outline'}
                  onClick={() => setMovementType('entrada')}
                  className="h-20 flex-col"
                >
                  <ArrowDownRight className="h-6 w-6 mb-1 text-green-500" />
                  Entrada
                </Button>
                <Button
                  variant={movementType === 'saida' ? 'destructive' : 'outline'}
                  onClick={() => setMovementType('saida')}
                  className="h-20 flex-col"
                >
                  <ArrowUpRight className="h-6 w-6 mb-1 text-red-500" />
                  Saída
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-10"
                    value={movementAmount}
                    onChange={(e) => setMovementAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Motivo</Label>
                <Select value={movementReason} onValueChange={setMovementReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOVEMENT_REASONS[movementType].map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMovementDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddMovement} disabled={movementAmount <= 0}>
                Registrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={historyDialog} onOpenChange={setHistoryDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Histórico de Caixas</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Abertura</TableHead>
                      <TableHead>Fechamento</TableHead>
                      <TableHead>Abertura</TableHead>
                      <TableHead>Fechamento</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shifts.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell>
                          {format(new Date(shift.opened_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {shift.closed_at
                            ? format(new Date(shift.closed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          R$ {shift.opening_balance.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {shift.closing_balance
                            ? `R$ ${shift.closing_balance.toFixed(2)}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={shift.status === 'aberto' ? 'default' : 'secondary'}>
                            {shift.status === 'aberto' ? 'Aberto' : 'Fechado'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
