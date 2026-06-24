'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Package,
  CreditCard,
  ClipboardList,
  UtensilsCrossed,
  BedDouble,
  Receipt,
  PiggyBank,
  Warehouse,
  BarChart3,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
  Menu,
  Building2,
  Users,
  Shield,
  Palette,
  Database,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['administrador', 'gerente', 'caixa', 'garcom', 'recepcao'] },
  { name: 'Produtos', href: '/produtos', icon: Package, roles: ['administrador', 'gerente'] },
  { name: 'Mesas', href: '/mesas', icon: UtensilsCrossed, roles: ['administrador', 'gerente', 'garcom', 'caixa'] },
  { name: 'Comandas', href: '/comandas', icon: ClipboardList, roles: ['administrador', 'gerente', 'garcom', 'caixa'] },
  { name: 'Quartos', href: '/quartos', icon: BedDouble, roles: ['administrador', 'gerente', 'recepcao'] },
  { name: 'Recepção', href: '/recepcao', icon: Building2, roles: ['administrador', 'gerente', 'recepcao'] },
  { name: 'Caixa', href: '/caixa', icon: CreditCard, roles: ['administrador', 'gerente', 'caixa'] },
  { name: 'Financeiro', href: '/financeiro', icon: PiggyBank, roles: ['administrador', 'gerente'] },
  { name: 'Estoque', href: '/estoque', icon: Warehouse, roles: ['administrador', 'gerente'] },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3, roles: ['administrador', 'gerente'] },
  { name: 'Usuários', href: '/usuarios', icon: Users, roles: ['administrador'] },
  { name: 'Auditoria', href: '/auditoria', icon: Shield, roles: ['administrador'] },
  { name: 'Branding', href: '/branding', icon: Palette, roles: ['administrador'] },
  { name: 'Backup', href: '/backup', icon: Database, roles: ['administrador'] },
  { name: 'Configurações', href: '/configuracoes', icon: Settings, roles: ['administrador'] },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
}

function Sidebar({ className = '' }: { className?: string }) {
  const pathname = usePathname();
  const { profile } = useAuth();

  const filteredNav = navigation.filter(item =>
    item.roles.includes(profile?.role || 'caixa')
  );

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <Receipt className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg">Gestão Pro</span>
          <span className="text-xs text-muted-foreground">Sistema de Gestão</span>
        </div>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const { settings } = useEstablishment();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getRoleName = (role: string) => {
    const roleNames: Record<string, string> = {
      administrador: 'Administrador',
      gerente: 'Gerente',
      caixa: 'Caixa',
      garcom: 'Garçom',
      recepcao: 'Recepção',
    };
    return roleNames[role] || role;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card">
        <Sidebar />
      </aside>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">{settings?.name || 'Gestão Pro'}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback>
                      {profile?.name?.charAt(0) || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium">{profile?.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {getRoleName(profile?.role || '')}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/perfil">
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/configuracoes">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
