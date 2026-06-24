'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Palette,
  Image,
  Save,
  RotateCcw,
  Download,
  Upload,
  Smartphone,
  Monitor,
  Fingerprint,
  CheckCircle,
} from 'lucide-react';

interface BrandingConfig {
  app_name: string;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  splash_app_name: string;
  splash_logo_url: string;
}

const DEFAULT_COLORS = {
  primary_color: '#3b82f6',
  secondary_color: '#1e40af',
  accent_color: '#06b6d4',
  background_color: '#0f172a',
};

export default function BrandingPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<BrandingConfig>({
    app_name: 'BAR HOTEL MANAGER PRO',
    logo_url: '',
    favicon_url: '',
    primary_color: DEFAULT_COLORS.primary_color,
    secondary_color: DEFAULT_COLORS.secondary_color,
    accent_color: DEFAULT_COLORS.accent_color,
    background_color: DEFAULT_COLORS.background_color,
    splash_app_name: 'BAR HOTEL MANAGER PRO',
    splash_logo_url: '',
  });

  useEffect(() => {
    // Load saved branding config
    const savedConfig = localStorage.getItem('branding_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig((prev) => ({ ...prev, ...parsed }));
        applyColors(parsed);
      } catch (e) {
        console.error('Failed to load branding config');
      }
    }
  }, []);

  const applyColors = (colors: Partial<BrandingConfig>) => {
    const root = document.documentElement;
    if (colors.primary_color) {
      root.style.setProperty('--primary', hexToHSL(colors.primary_color));
    }
    if (colors.secondary_color) {
      root.style.setProperty('--secondary', hexToHSL(colors.secondary_color));
    }
    if (colors.accent_color) {
      root.style.setProperty('--accent', hexToHSL(colors.accent_color));
    }
  };

  const hexToHSL = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '221 83% 53%';

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const handleSave = () => {
    setLoading(true);
    try {
      localStorage.setItem('branding_config', JSON.stringify(config));
      applyColors(config);

      // Update meta theme color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', config.primary_color);
      }

      toast.success('Configurações de marca salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    }
    setLoading(false);
  };

  const handleReset = () => {
    setConfig({
      app_name: 'BAR HOTEL MANAGER PRO',
      logo_url: '',
      favicon_url: '',
      primary_color: DEFAULT_COLORS.primary_color,
      secondary_color: DEFAULT_COLORS.secondary_color,
      accent_color: DEFAULT_COLORS.accent_color,
      background_color: DEFAULT_COLORS.background_color,
      splash_app_name: 'BAR HOTEL MANAGER PRO',
      splash_logo_url: '',
    });
    applyColors(DEFAULT_COLORS);
    localStorage.removeItem('branding_config');
    toast.success('Configurações restauradas para o padrão');
  };

  const handleExportBranding = () => {
    const data = JSON.stringify(config, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'branding-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBranding = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        setConfig((prev) => ({ ...prev, ...imported }));
        toast.success('Configurações importadas com sucesso!');
      } catch (error) {
        toast.error('Erro ao importar configurações');
      }
    };
    reader.readAsText(file);
  };

  const isEditable = profile?.role === 'administrador' || profile?.role === 'gerente';

  const updateFavicon = (url: string) => {
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon && url) {
      favicon.setAttribute('href', url);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Branding</h1>
            <p className="text-muted-foreground">Personalize a aparência do sistema</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportBranding}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <div>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBranding}
                className="hidden"
                id="import-branding"
              />
              <Button variant="outline" onClick={() => document.getElementById('import-branding')?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
            </div>
          </div>
        </div>

        {!isEditable && (
          <Alert variant="destructive">
            <AlertDescription>
              Você não tem permissão para editar estas configurações.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="identidade">
          <TabsList>
            <TabsTrigger value="identidade">Identidade Visual</TabsTrigger>
            <TabsTrigger value="cores">Cores do Sistema</TabsTrigger>
            <TabsTrigger value="splash">Splash Screen</TabsTrigger>
            <TabsTrigger value="pwa">Aplicativo</TabsTrigger>
          </TabsList>

          <TabsContent value="identidade" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5" />
                  Identidade do Sistema
                </CardTitle>
                <CardDescription>
                  Configure o nome e logotipo exibidos no sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="app_name">Nome do Aplicativo</Label>
                    <Input
                      id="app_name"
                      value={config.app_name}
                      onChange={(e) => setConfig({ ...config, app_name: e.target.value })}
                      disabled={!isEditable || loading}
                      placeholder="Nome exibido no sistema"
                    />
                    <p className="text-xs text-muted-foreground">
                      Este nome aparece no título da janela e menus
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logo_url">URL do Logotipo</Label>
                    <div className="relative">
                      <Image className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="logo_url"
                        value={config.logo_url}
                        onChange={(e) => setConfig({ ...config, logo_url: e.target.value })}
                        disabled={!isEditable || loading}
                        placeholder="https://exemplo.com/logo.png"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="favicon_url">URL do Favicon</Label>
                  <Input
                    id="favicon_url"
                    value={config.favicon_url}
                    onChange={(e) => {
                      setConfig({ ...config, favicon_url: e.target.value });
                      updateFavicon(e.target.value);
                    }}
                    disabled={!isEditable || loading}
                    placeholder="https://exemplo.com/favicon.ico"
                  />
                </div>

                {config.logo_url && (
                  <div className="border rounded-lg p-4">
                    <Label className="text-muted-foreground text-sm mb-2 block">Preview do Logotipo</Label>
                    <img
                      src={config.logo_url}
                      alt="Logo preview"
                      className="max-h-24 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <Button onClick={handleSave} disabled={!isEditable || loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cores" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Paleta de Cores
                </CardTitle>
                <CardDescription>
                  Personalize as cores do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Cor Primária</Label>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: config.primary_color }}
                        />
                        <Input
                          type="color"
                          value={config.primary_color}
                          onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                          disabled={!isEditable}
                          className="w-12 h-8 p-0 cursor-pointer"
                        />
                      </div>
                    </div>
                    <Input
                      value={config.primary_color}
                      onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                      disabled={!isEditable}
                      placeholder="#3b82f6"
                    />
                    <p className="text-xs text-muted-foreground">
                      Cor principal para botões, links e destaques
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Cor Secundária</Label>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: config.secondary_color }}
                        />
                        <Input
                          type="color"
                          value={config.secondary_color}
                          onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                          disabled={!isEditable}
                          className="w-12 h-8 p-0 cursor-pointer"
                        />
                      </div>
                    </div>
                    <Input
                      value={config.secondary_color}
                      onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                      disabled={!isEditable}
                      placeholder="#1e40af"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Cor de Destaque</Label>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: config.accent_color }}
                        />
                        <Input
                          type="color"
                          value={config.accent_color}
                          onChange={(e) => setConfig({ ...config, accent_color: e.target.value })}
                          disabled={!isEditable}
                          className="w-12 h-8 p-0 cursor-pointer"
                        />
                      </div>
                    </div>
                    <Input
                      value={config.accent_color}
                      onChange={(e) => setConfig({ ...config, accent_color: e.target.value })}
                      disabled={!isEditable}
                      placeholder="#06b6d4"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Cor de Fundo (Splash)</Label>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: config.background_color }}
                        />
                        <Input
                          type="color"
                          value={config.background_color}
                          onChange={(e) => setConfig({ ...config, background_color: e.target.value })}
                          disabled={!isEditable}
                          className="w-12 h-8 p-0 cursor-pointer"
                        />
                      </div>
                    </div>
                    <Input
                      value={config.background_color}
                      onChange={(e) => setConfig({ ...config, background_color: e.target.value })}
                      disabled={!isEditable}
                      placeholder="#0f172a"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Button onClick={handleSave} disabled={!isEditable || loading}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Cores
                  </Button>
                  <Button variant="outline" onClick={handleReset} disabled={!isEditable}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restaurar Padrão
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="splash" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Splash Screen</CardTitle>
                <CardDescription>
                  Configure a tela de carregamento do aplicativo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome na Splash Screen</Label>
                    <Input
                      value={config.splash_app_name}
                      onChange={(e) => setConfig({ ...config, splash_app_name: e.target.value })}
                      disabled={!isEditable || loading}
                      placeholder="BAR HOTEL MANAGER PRO"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Logo na Splash Screen</Label>
                    <Input
                      value={config.splash_logo_url}
                      onChange={(e) => setConfig({ ...config, splash_logo_url: e.target.value })}
                      disabled={!isEditable || loading}
                      placeholder="https://exemplo.com/splash-logo.png"
                    />
                  </div>
                </div>

                <div
                  className="border rounded-lg p-6 relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${config.background_color} 0%, #1e293b 50%, ${config.background_color} 100%)`,
                    minHeight: '250px',
                  }}
                >
                  <div className="flex flex-col items-center justify-center h-full relative z-10">
                    <div
                      className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${config.primary_color} 0%, ${config.secondary_color} 100%)`,
                      }}
                    >
                      {config.splash_logo_url ? (
                        <img
                          src={config.splash_logo_url}
                          alt="Splash logo"
                          className="w-12 h-12 object-contain"
                        />
                      ) : (
                        <span className="text-white text-2xl font-bold">
                          {config.splash_app_name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <h2
                      className="text-xl font-bold mb-2"
                      style={{ color: 'white', textShadow: `0 4px 20px ${config.primary_color}50` }}
                    >
                      {config.splash_app_name}
                    </h2>
                    <p className="text-blue-300/80 text-sm mb-4">
                      Sistema de Gestão Inteligente
                    </p>
                    <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: '60%',
                          background: `linear-gradient(90deg, ${config.primary_color} 0%, ${config.accent_color} 50%, ${config.primary_color} 100%)`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="absolute inset-0 pointer-events-none">
                    <div
                      className="absolute top-1/4 left-1/4 w-24 h-24 rounded-full blur-2xl opacity-30 animate-pulse"
                      style={{ backgroundColor: config.primary_color }}
                    />
                    <div
                      className="absolute bottom-1/4 right-1/4 w-32 h-32 rounded-full blur-2xl opacity-20 animate-pulse"
                      style={{ backgroundColor: config.secondary_color, animationDelay: '1s' }}
                    />
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>A splash screen é exibida por 2-4 segundos ao abrir o aplicativo.</p>
                  <p>Se nenhuma logo for definida, será exibido o nome do aplicativo.</p>
                </div>

                <Button onClick={handleSave} disabled={!isEditable || loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Splash Screen
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pwa" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Instalar Aplicativo
                </CardTitle>
                <CardDescription>
                  Instale o sistema como aplicativo nativo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Este sistema funciona como um Progressive Web App (PWA), permitindo instalação
                    em computadores, tablets e smartphones.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-dashed">
                    <CardContent className="pt-6 text-center">
                      <Monitor className="h-12 w-12 mx-auto mb-3 text-blue-500" />
                      <h3 className="font-semibold mb-2">Desktop</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Instale no navegador do computador
                      </p>
                      <ul className="text-sm text-muted-foreground text-left space-y-1">
                        <li>Chrome: Menu → Instalar App</li>
                        <li>Edge: Menu → Apps → Instalar</li>
                        <li>Firefox: Abrir como app</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardContent className="pt-6 text-center">
                      <Smartphone className="h-12 w-12 mx-auto mb-3 text-green-500" />
                      <h3 className="font-semibold mb-2">Android</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Instale no celular ou tablet Android
                      </p>
                      <ul className="text-sm text-muted-foreground text-left space-y-1">
                        <li>Chrome: Menu → Adicionar à tela inicial</li>
                        <li>O app funcionará offline</li>
                        <li>Ícone na tela inicial</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="font-medium mb-2">Funcionalidades Offline</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Todos os dados são salvos localmente</li>
                    <li>• Funciona sem conexão com a internet</li>
                    <li>• Sincronização automática quando online</li>
                    <li>• Exportação e backup completos</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
