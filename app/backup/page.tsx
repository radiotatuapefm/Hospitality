'use client';

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Download,
  Upload,
  Shield,
  Clock,
  HardDrive,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { exportAllData, importAllData, clearAll } from '@/lib/local-db';
import { useAuth } from '@/contexts/AuthContext';

export default function BackupPage() {
  const { profile } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(
    localStorage.getItem('last_backup_date')
  );

  const handleExportBackup = async () => {
    setExporting(true);
    try {
      const data = exportAllData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-bar-hotel-manager-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const now = new Date().toISOString();
      localStorage.setItem('last_backup_date', now);
      setLastBackup(now);

      toast.success('Backup exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar backup');
    }
    setExporting(false);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = event.target?.result as string;
        importAllData(jsonData);
        toast.success('Backup importado com sucesso! Recarregue a página para ver as alterações.');
      } catch (error) {
        toast.error('Erro ao importar backup. Verifique se o arquivo e valido.');
      }
      setImporting(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearLocalData = () => {
    setConfirmDialog(false);
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('bh_')) {
          localStorage.removeItem(key);
        }
      }
      localStorage.removeItem('last_backup_date');
      toast.success('Dados locais limpos com sucesso!');
      window.location.reload();
    } catch (error) {
      toast.error('Erro ao limpar dados');
    }
  };

  const isEditable = profile?.role === 'administrador';

  return (
    <AppShell>
      <div className="space-y-6 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-bold">Backup e Restauracao</h1>
          <p className="text-muted-foreground">Gerencie os dados do sistema</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Armazenamento</p>
                  <p className="text-2xl font-bold">LocalStorage</p>
                </div>
                <HardDrive className="h-8 w-8 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ultimo Backup</p>
                  <p className="text-lg font-bold">
                    {lastBackup
                      ? new Date(lastBackup).toLocaleDateString('pt-BR')
                      : 'Nunca'}
                  </p>
                </div>
                <Clock className="h-8 w-8 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Modo</p>
                  <p className="text-lg font-bold">100% Offline</p>
                </div>
                <Shield className="h-8 w-8 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Backup de Dados
            </CardTitle>
            <CardDescription>
              Exporte todos os dados do sistema em formato JSON
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                O backup inclui todos os dados armazenados localmente. Recomendamos
                fazer backups regulares para evitar perda de informacoes.
              </AlertDescription>
            </Alert>

            <div className="flex flex-wrap gap-4">
              <Button onClick={handleExportBackup} disabled={exporting}>
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exportando...' : 'Exportar Backup'}
              </Button>

              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                  id="import-backup"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('import-backup')?.click()}
                  disabled={importing}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {importing ? 'Importando...' : 'Restaurar Backup'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Zona de Perigo
            </CardTitle>
            <CardDescription>
              Acoes irreversiveis - use com cuidado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Esta acao limpara todos os dados armazenados localmente. Faca um backup
                antes de prosseguir.
              </AlertDescription>
            </Alert>

            <Button
              variant="destructive"
              onClick={() => setConfirmDialog(true)}
              disabled={!isEditable}
            >
              Limpar Dados Locais
            </Button>
          </CardContent>
        </Card>

        <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Acao</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja limpar todos os dados locais? Esta acao nao pode
                ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialog(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleClearLocalData}>
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
