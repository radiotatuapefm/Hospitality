'use client';

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Building2,
  Image,
  Save,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  Shield,
} from 'lucide-react';

export default function ConfiguracoesPage() {
  const { settings, updateSettings } = useEstablishment();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: settings?.name || '',
    logo_url: settings?.logo_url || '',
    address: settings?.address || '',
    phone: settings?.phone || '',
    email: settings?.email || '',
    website: settings?.website || '',
    cnpj: settings?.cnpj || '',
    ie: settings?.ie || '',
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await updateSettings(form);
      if (result.error) throw result.error;
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    }
    setLoading(false);
  };

  const isEditable = profile?.role === 'administrador' || profile?.role === 'gerente';

  return (
    <AppShell>
      <div className="space-y-6 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
        </div>

        <Tabs defaultValue="estabelecimento">
          <TabsList>
            <TabsTrigger value="estabelecimento">Estabelecimento</TabsTrigger>
            <TabsTrigger value="sistema">Sistema</TabsTrigger>
          </TabsList>

          <TabsContent value="estabelecimento" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informações do Estabelecimento
                </CardTitle>
                <CardDescription>
                  Configure os dados do seu estabelecimento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isEditable && (
                  <Alert variant="destructive">
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Você não tem permissão para editar estas configurações.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Estabelecimento</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      disabled={!isEditable || loading}
                      placeholder="Nome do estabelecimento"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logo_url">URL do Logotipo</Label>
                    <div className="relative">
                      <Image className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="logo_url"
                        value={form.logo_url}
                        onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                        disabled={!isEditable || loading}
                        placeholder="https://exemplo.com/logo.png"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      disabled={!isEditable || loading}
                      placeholder="Rua, número, bairro, cidade - UF"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        disabled={!isEditable || loading}
                        placeholder="(00) 00000-0000"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        disabled={!isEditable || loading}
                        placeholder="contato@estabelecimento.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="website"
                        value={form.website}
                        onChange={(e) => setForm({ ...form, website: e.target.value })}
                        disabled={!isEditable || loading}
                        placeholder="https://www.seusite.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="cnpj"
                        value={form.cnpj}
                        onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                        disabled={!isEditable || loading}
                        placeholder="00.000.000/0000-00"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ie">Inscrição Estadual</Label>
                  <Input
                    id="ie"
                    value={form.ie}
                    onChange={(e) => setForm({ ...form, ie: e.target.value })}
                    disabled={!isEditable || loading}
                    placeholder="00000000000"
                  />
                </div>

                {isEditable && (
                  <Button onClick={handleSave} disabled={loading} className="w-full md:w-auto">
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Prévia do Logotipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(form.logo_url || settings?.logo_url) ? (
                  <img
                    src={form.logo_url || settings?.logo_url || ''}
                    alt="Logotipo"
                    className="max-h-32 object-contain rounded-lg border p-4"
                  />
                ) : (
                  <div className="flex items-center justify-center h-32 border rounded-lg bg-muted/30">
                    <p className="text-muted-foreground">Nenhum logotipo configurado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sistema" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Sistema</CardTitle>
                <CardDescription>
                  Detalhes sobre a versão e configurações do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">Versão do Sistema</Label>
                    <p className="text-lg font-medium">1.0.0</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Usuário Logado</Label>
                    <p className="text-lg font-medium">{profile?.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Perfil</Label>
                    <p className="text-lg font-medium capitalize">{profile?.role}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">ID do Estabelecimento</Label>
                    <p className="text-sm font-mono">{settings?.id?.substring(0, 8)}...</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ajuda e Suporte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Para suporte técnico, entre em contato com a equipe de desenvolvimento.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Documentação
                  </Button>
                  <Button variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Contato
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
