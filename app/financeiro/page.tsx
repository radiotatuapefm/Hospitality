'use client';

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { useFinancial } from '@/hooks/useCash';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, PiggyBank, DollarSign, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

export default function FinanceiroPage() {
  const { accounts, loading, fetchAccounts, createAccount, updateAccount, deleteAccount, markAsPaid, getTotalToPay, getTotalToReceive } = useFinancial();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'pagar' | 'receber'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendente' | 'pago'>('all');

  const [form, setForm] = useState({
    type: 'pagar' as 'pagar' | 'receber',
    description: '',
    amount: 0,
    due_date: '',
    category: '',
    notes: '',
  });

  const handleOpenDialog = (account?: any) => {
    if (account) {
      setEditingAccount(account);
      setForm({
        type: account.type,
        description: account.description,
        amount: account.amount,
        due_date: account.due_date || '',
        category: account.category || '',
        notes: account.notes || '',
      });
    } else {
      setEditingAccount(null);
      setForm({
        type: 'pagar',
        description: '',
        amount: 0,
        due_date: '',
        category: '',
        notes: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    try {
      if (editingAccount) {
        updateAccount(editingAccount.id, { ...form, status: editingAccount.status });
        toast.success('Atualizado com sucesso');
      } else {
        createAccount({ ...form, status: 'pendente' });
        toast.success('Conta criada com sucesso');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Erro ao salvar');
    }
  };

  const handleMarkPaid = (id: string) => {
    try {
      markAsPaid(id);
      toast.success('Marcado como pago');
    } catch {
      toast.error('Erro');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza?')) {
      try {
        deleteAccount(id);
        toast.success('Excluído');
      } catch {
        toast.error('Erro ao excluir');
      }
    }
  };

  const filtered = accounts.filter((a) => {
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <AppShell>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Financeiro</h1>
            <p className="text-muted-foreground">Controle de contas a pagar e receber</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">A Pagar</p>
                  <p className="text-2xl font-bold text-red-600">
                    R$ {getTotalToPay().toFixed(2)}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">A Receber</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {getTotalToReceive().toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">
                    R$ {accounts.reduce((s, a) => s + a.amount, 0).toFixed(2)}
                  </p>
                </div>
                <PiggyBank className="h-8 w-8 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Contas</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pagar">A Pagar</SelectItem>
                    <SelectItem value="receber">A Receber</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma conta encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <p className="font-medium">{account.description}</p>
                        <p className="text-xs text-muted-foreground">{account.category || '-'}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={account.type === 'pagar' ? 'border-red-500 text-red-500' : 'border-green-500 text-green-500'}>
                          {account.type === 'pagar' ? 'A Pagar' : 'A Receber'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {account.due_date ? new Date(account.due_date).toLocaleDateString('pt-BR') : '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {account.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            account.status === 'pago'
                              ? 'border-green-500 text-green-500'
                              : 'border-amber-500 text-amber-500'
                          }
                        >
                          {account.status === 'pago' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <AlertCircle className="h-3 w-3 mr-1" />
                          )}
                          {account.status === 'pago' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {account.status === 'pendente' && (
                            <Button size="sm" variant="ghost" onClick={() => handleMarkPaid(account.id)}>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(account)}>
                            <DollarSign className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(account.id)}>
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAccount ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as 'pagar' | 'receber' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pagar">A Pagar</SelectItem>
                    <SelectItem value="receber">A Receber</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Vencimento</Label>
                  <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Fornecedor, Aluguel..." />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
