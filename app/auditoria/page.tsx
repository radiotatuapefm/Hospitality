'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/contexts/AuthContext';
import { LS_KEYS, getAll } from '@/lib/local-db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Shield,
  Search,
  Calendar,
  User,
  Database,
  Activity,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const ACTION_TYPES = [
  { value: 'all', label: 'Todas' },
  { value: 'create', label: 'Criação' },
  { value: 'update', label: 'Atualização' },
  { value: 'delete', label: 'Exclusão' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
];

const ENTITY_TYPES = [
  { value: 'all', label: 'Todos' },
  { value: 'users', label: 'Usuários' },
  { value: 'products', label: 'Produtos' },
  { value: 'comandas', label: 'Comandas' },
  { value: 'rooms', label: 'Quartos' },
  { value: 'tables', label: 'Mesas' },
  { value: 'cash_shifts', label: 'Caixas' },
  { value: 'financial_accounts', label: 'Financeiro' },
];

interface AuditLogItem {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_data: unknown | null;
  new_data: unknown | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export default function AuditoriaPage() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; active: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');

  const fetchUsers = useCallback(() => {
    const data = getAll(LS_KEYS.REGISTERED_USERS);
    setUsers(data.map((u: any) => ({ id: u.id, name: u.name, active: u.active })));
  }, []);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    let data: AuditLogItem[] = getAll(LS_KEYS.AUDIT_LOGS);

    if (actionFilter !== 'all') {
      data = data.filter((log) => log.action.toLowerCase().includes(actionFilter.toLowerCase()));
    }
    if (entityFilter !== 'all') {
      data = data.filter((log) => log.entity_type === entityFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;
      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(0);
      }
      data = data.filter((log) => new Date(log.created_at) >= startDate);
    }

    data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setLogs(data);
    setLoading(false);
  }, [actionFilter, entityFilter, dateFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const user = users.find((u) => u.id === log.user_id);
    return (
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_type?.toLowerCase().includes(search.toLowerCase()) ||
      user?.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  const getUserName = (userId: string | null) => {
    if (!userId) return 'Sistema';
    const user = users.find((u) => u.id === userId);
    return user?.name || 'Usuário desconhecido';
  };

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'bg-green-100 text-green-700';
    if (action.includes('delete')) return 'bg-red-100 text-red-700';
    if (action.includes('update')) return 'bg-blue-100 text-blue-700';
    if (action.includes('login')) return 'bg-purple-100 text-purple-700';
    if (action.includes('logout')) return 'bg-gray-100 text-gray-700';
    return 'bg-secondary';
  };

  const stats = {
    total: logs.length,
    today: logs.filter((l) => new Date(l.created_at) >= new Date(new Date().setHours(0, 0, 0, 0))).length,
    activeUsers: users.filter((u) => u.active).length,
  };

  const exportLogs = () => {
    const data = filteredLogs.map((log) => ({
      Data: format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }),
      Ação: log.action,
      Entidade: log.entity_type || '-',
      'ID Entidade': log.entity_id || '-',
      Usuário: getUserName(log.user_id),
      'IP': log.ip_address || '-',
    }));

    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map((row) => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `auditoria-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <AppShell>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Auditoria</h1>
            <p className="text-muted-foreground">Log de atividades do sistema</p>
          </div>
          <Button variant="outline" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Registros</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Database className="h-8 w-8 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ações Hoje</p>
                  <p className="text-2xl font-bold">{stats.today}</p>
                </div>
                <Activity className="h-8 w-8 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                  <p className="text-2xl font-bold">{stats.activeUsers}</p>
                </div>
                <User className="h-8 w-8 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ações Registradas</p>
                  <p className="text-2xl font-bold">{logs.length}</p>
                </div>
                <Shield className="h-8 w-8 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Log de Atividades</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    className="pl-8 w-48"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Ação" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        {action.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Entidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPES.map((entity) => (
                      <SelectItem key={entity.value} value={entity.value}>
                        {entity.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">7 dias</SelectItem>
                    <SelectItem value="month">30 dias</SelectItem>
                    <SelectItem value="all">Todo período</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <table className="w-full">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Data/Hora</th>
                    <th className="text-left p-4 font-medium">Usuário</th>
                    <th className="text-left p-4 font-medium">Ação</th>
                    <th className="text-left p-4 font-medium">Entidade</th>
                    <th className="text-left p-4 font-medium">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center p-8">
                        Carregando...
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-muted-foreground">
                        Nenhum registro encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 text-sm">
                          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {getUserName(log.user_id)}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={getActionColor(log.action)}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-mono">{log.entity_type || '-'}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-mono text-muted-foreground">
                            {log.entity_id ? log.entity_id.substring(0, 8) + '...' : '-'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sobre a Auditoria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              O sistema de auditoria registra automaticamente todas as ações realizadas no sistema,
              incluindo criação, atualização e exclusão de registros, além de logins e logouts.
            </p>
            <p className="text-sm text-muted-foreground">
              Os logs são mantidos localmente (últimos 5000 registros) e podem ser exportados para análise externa.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
