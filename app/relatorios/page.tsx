'use client';

import { useState, useMemo } from 'react';
import { AppShell } from '@/components/app-shell';
import { useDashboard } from '@/hooks/useDashboard';
import { useCashShifts } from '@/hooks/useCash';
import { useProducts } from '@/hooks/useProducts';
import { LS_KEYS, getAll } from '@/lib/local-db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  BarChart3,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  BedDouble,
  CreditCard,
  Users,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function RelatoriosPage() {
  const { stats } = useDashboard();
  const { shifts } = useCashShifts();
  const { products } = useProducts();

  const dailySales = useMemo(() => {
    const sales = getAll(LS_KEYS.DAILY_SALES);
    return sales.sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, []);

  const productSales = useMemo(() => {
    const sales = getAll(LS_KEYS.PRODUCT_SALES);
    return sales.sort((a: any, b: any) => b.revenue - a.revenue);
  }, []);

  const exportCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error('Sem dados para exportar');
      return;
    }
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map((row) => Object.values(row).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
    <AppShell>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Relatórios</h1>
            <p className="text-muted-foreground">Análise completa do negócio</p>
          </div>
          <Button variant="outline" onClick={() => exportCSV(dailySales, 'vendas-diarias.csv')}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vendas Hoje</p>
                  <p className="text-2xl font-bold">R$ {stats.todaySales.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                  <p className="text-2xl font-bold">R$ {stats.averageTicket.toFixed(2)}</p>
                </div>
                <TrendingUp className="h-8 w-8 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lucro Estimado</p>
                  <p className="text-2xl font-bold text-green-600">R$ {stats.estimatedProfit.toFixed(2)}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vendas do Mês</p>
                  <p className="text-2xl font-bold">R$ {stats.monthSales.toFixed(2)}</p>
                </div>
                <BarChart3 className="h-8 w-8 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="vendas">
          <TabsList>
            <TabsTrigger value="vendas">Vendas</TabsTrigger>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="caixa">Caixa</TabsTrigger>
          </TabsList>

          <TabsContent value="vendas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Faturamento Diário</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailySales}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} />
                      <YAxis />
                      <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                      <Bar dataKey="total_sales" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="produtos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vendas por Produto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={productSales.slice(0, 10)} dataKey="revenue" nameKey="product_id" cx="50%" cy="50%" outerRadius={100} label>
                        {productSales.slice(0, 10).map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {productSales.slice(0, 10).map((sale: any, i: number) => {
                    const product = products.find((p) => p.id === sale.product_id);
                    return (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-sm">{product?.name || sale.product_id}</span>
                        </div>
                        <span className="text-sm font-medium">R$ {sale.revenue.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="caixa" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Caixas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shifts.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Nenhum caixa registrado</p>
                  ) : (
                    shifts.map((shift) => (
                      <div key={shift.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{shift.status === 'aberto' ? 'Aberto' : 'Fechado'}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(shift.opened_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Saldo Inicial</p>
                          <p className="font-medium">R$ {shift.opening_balance.toFixed(2)}</p>
                        </div>
                        {shift.closing_balance && (
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Saldo Final</p>
                            <p className="font-medium">R$ {shift.closing_balance.toFixed(2)}</p>
                          </div>
                        )}
                        <Badge variant="outline" className={shift.status === 'aberto' ? 'border-green-500 text-green-500' : ''}>
                          {shift.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
