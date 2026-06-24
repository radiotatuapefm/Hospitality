'use client';

import { useDashboard } from '@/hooks/useDashboard';
import { useCashShifts } from '@/hooks/useCash';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign,
  TrendingUp,
  BedDouble,
  UtensilsCrossed,
  Package,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function DashboardPage() {
  const { stats, loading } = useDashboard();
  const { currentShift } = useCashShifts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const occupancyRate = stats.roomsOccupied + stats.roomsFree > 0
    ? Math.round((stats.roomsOccupied / (stats.roomsOccupied + stats.roomsFree)) * 100)
    : 0;

  const tableOccupancyRate = stats.tablesOccupied + stats.tablesFree > 0
    ? Math.round((stats.tablesOccupied / (stats.tablesOccupied + stats.tablesFree)) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-stat">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendas Hoje
            </CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                R$ {stats.todaySales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ticket médio: R$ {stats.averageTicket.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="card-stat">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendas do Mês
            </CardTitle>
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.monthSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lucro estimado: R$ {stats.estimatedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card className="card-stat">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quartos Ocupados
            </CardTitle>
            <BedDouble className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.roomsOccupied} / {stats.roomsOccupied + stats.roomsFree}
            </div>
            <Progress value={occupancyRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="card-stat">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mesas Ocupadas
            </CardTitle>
            <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.tablesOccupied} / {stats.tablesOccupied + stats.tablesFree}
            </div>
            <Progress value={tableOccupancyRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Faturamento Diário</CardTitle>
            <CardDescription>Últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    className="text-xs"
                  />
                  <YAxis
                    tickFormatter={(value) => `R$ ${value}`}
                    className="text-xs"
                  />
                  <Tooltip
                    formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
            <CardDescription>Top 5 do dia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topProducts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma venda registrada hoje
                </p>
              ) : (
                stats.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.quantity} unidades
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        R$ {product.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Categoria</CardTitle>
            <CardDescription>Distribuição de receita</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryRevenue}
                    dataKey="value"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.categoryRevenue.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Status do Caixa</CardTitle>
              <CardDescription>Caixa atual</CardDescription>
            </div>
            {currentShift ? (
              <span className="status-badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Aberto
              </span>
            ) : (
              <span className="status-badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                Fechado
              </span>
            )}
          </CardHeader>
          <CardContent>
            {currentShift ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Saldo Inicial</span>
                  <span className="font-medium">
                    R$ {currentShift.opening_balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Aberto em</span>
                  <span className="font-medium">
                    {new Date(currentShift.opened_at).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    Aberto por {Math.floor((Date.now() - new Date(currentShift.opened_at).getTime()) / 3600000)} horas
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhum caixa aberto
                </p>
                <p className="text-sm text-muted-foreground">
                  Abra um caixa para começar a registrar vendas
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
