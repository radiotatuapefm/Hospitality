import { useState, useEffect, useCallback } from 'react';
import { LS_KEYS, getAll } from '@/lib/local-db';

interface DashboardStats {
  todaySales: number;
  monthSales: number;
  roomsOccupied: number;
  roomsFree: number;
  tablesOccupied: number;
  tablesFree: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  averageTicket: number;
  estimatedProfit: number;
  dailyRevenue: { date: string; value: number }[];
  categoryRevenue: { category: string; value: number }[];
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    monthSales: 0,
    roomsOccupied: 0,
    roomsFree: 0,
    tablesOccupied: 0,
    tablesFree: 0,
    topProducts: [],
    averageTicket: 0,
    estimatedProfit: 0,
    dailyRevenue: [],
    categoryRevenue: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(() => {
    setLoading(true);

    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const rooms = getAll<{ status: string }>(LS_KEYS.ROOMS);
    const tables = getAll<{ status: string }>(LS_KEYS.TABLES);
    const comandas = getAll<{ total: number; status: string; opened_at: string; closed_at: string | null }>(LS_KEYS.COMANDAS);
    const comandaItems = getAll<{ product_id: string; quantity: number; total: number; created_at: string }>(LS_KEYS.COMANDA_ITEMS);
    const products = getAll<{ id: string; name: string; category_id: string; cost_price: number; sale_price: number }>(LS_KEYS.PRODUCTS);
    const categories = getAll<{ id: string; name: string }>(LS_KEYS.CATEGORIES);
    const roomOccupancies = getAll<{ status: string; base_price: number; created_at: string; closed_at: string | null }>(LS_KEYS.ROOM_OCCUPANCIES);
    const dailySales = getAll<{ date: string; total_sales: number; total_products_sold: number }>(LS_KEYS.DAILY_SALES);

    const todayComandas = comandas.filter((c) => c.status === 'fechada' && c.closed_at && c.closed_at.startsWith(today));
    const todaySalesTotal = todayComandas.reduce((sum, c) => sum + c.total, 0);
    const transactionCount = todayComandas.length;
    const averageTicket = transactionCount > 0 ? todaySalesTotal / transactionCount : 0;

    const monthComandas = comandas.filter((c) => c.status === 'fechada' && c.closed_at && c.closed_at >= monthStart);
    const monthSalesTotal = monthComandas.reduce((sum, c) => sum + c.total, 0);

    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    const categoryMap = new Map<string, number>();

    const todayItems = comandaItems.filter((i) => i.created_at && i.created_at.startsWith(today));
    todayItems.forEach((item) => {
      const product = products.find((p) => p.id === item.product_id);
      const name = product?.name || 'Unknown';
      const category = categories.find((c) => c.id === product?.category_id)?.name || 'Outros';

      const existing = productMap.get(item.product_id) || { name, quantity: 0, revenue: 0 };
      existing.quantity += Number(item.quantity);
      existing.revenue += Number(item.total);
      productMap.set(item.product_id, existing);

      const catValue = categoryMap.get(category) || 0;
      categoryMap.set(category, catValue + Number(item.total));
    });

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const categoryRevenue = Array.from(categoryMap.entries()).map(([category, value]) => ({
      category,
      value,
    }));

    const dailyRevenueMap = new Map<string, number>();
    monthComandas.forEach((c) => {
      const date = c.closed_at?.split('T')[0];
      if (date) {
        const current = dailyRevenueMap.get(date) || 0;
        dailyRevenueMap.set(date, current + c.total);
      }
    });

    const dailyRevenue = Array.from(dailyRevenueMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    const todayProductsCost = todayItems.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.product_id);
      return sum + (product?.cost_price || 0) * item.quantity;
    }, 0);

    setStats({
      todaySales: todaySalesTotal,
      monthSales: monthSalesTotal,
      roomsOccupied: rooms.filter((r) => r.status === 'ocupado').length,
      roomsFree: rooms.filter((r) => r.status === 'livre').length,
      tablesOccupied: tables.filter((t) => t.status === 'ocupada').length,
      tablesFree: tables.filter((t) => t.status === 'livre').length,
      topProducts,
      averageTicket,
      estimatedProfit: todaySalesTotal - todayProductsCost,
      dailyRevenue,
      categoryRevenue,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refresh: fetchStats };
}
