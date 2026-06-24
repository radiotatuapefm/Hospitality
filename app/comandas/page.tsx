'use client';

import { useState, useMemo } from 'react';
import { AppShell } from '@/components/app-shell';
import { useComandas, useComandaItems } from '@/hooks/useTables';
import { useProducts } from '@/hooks/useProducts';
import { useTables } from '@/hooks/useTables';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Clock,
  ShoppingCart,
  Trash2,
  CreditCard,
  QrCode,
  Merge,
  ArrowRight,
  User,
  Phone,
  X,
  Check,
} from 'lucide-react';
import { Comanda, Product, Table as TableType } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import QRCode from 'qrcode';

const PAYMENT_METHODS = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'pix', label: 'PIX' },
];

export default function ComandasPage() {
  const { comandas, loading, openComanda, addItemToComanda, removeItemFromComanda, closeComanda, transferItems, mergeComandas } = useComandas();
  const { products } = useProducts();
  const { tables } = useTables();

  const [search, setSearch] = useState('');
  const [newComandaDialog, setNewComandaDialog] = useState(false);
  const [addItemDialog, setAddItemDialog] = useState(false);
  const [closeComandaDialog, setCloseComandaDialog] = useState(false);
  const [selectedComanda, setSelectedComanda] = useState<Comanda | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [discount, setDiscount] = useState(0);

  const [newComandaForm, setNewComandaForm] = useState({
    tableId: '',
    customerName: '',
    customerPhone: '',
  });

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => p.active)
      .filter((p) =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.barcode?.includes(productSearch)
      );
  }, [products, productSearch]);

  const formattedActiveComandas = useMemo(() => {
    return comandas.map((comanda) => ({
      ...comanda,
      duration: formatDistanceToNow(new Date(comanda.opened_at), { locale: ptBR, addSuffix: false }),
    }));
  }, [comandas]);

  const { items: comandaItems } = useComandaItems(selectedComanda?.id || null);

  const handleOpenComanda = async () => {
    try {
      await openComanda({
        tableId: newComandaForm.tableId || undefined,
        customerName: newComandaForm.customerName || undefined,
        customerPhone: newComandaForm.customerPhone || undefined,
      });
      toast.success('Comanda aberta com sucesso');
      setNewComandaDialog(false);
      setNewComandaForm({ tableId: '', customerName: '', customerPhone: '' });
    } catch (error) {
      toast.error('Erro ao abrir comanda');
    }
  };

  const handleAddItem = async () => {
    if (!selectedComanda || !selectedProduct) return;
    try {
      await addItemToComanda(selectedComanda.id, selectedProduct, quantity);
      toast.success('Item adicionado');
      setSelectedProduct(null);
      setProductSearch('');
      setQuantity(1);
    } catch (error) {
      toast.error('Erro ao adicionar item');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!selectedComanda) return;
    try {
      await removeItemFromComanda(itemId, selectedComanda.id);
      toast.success('Item removido');
    } catch (error) {
      toast.error('Erro ao remover item');
    }
  };

  const handleCloseComanda = async () => {
    if (!selectedComanda || !paymentMethod) return;
    try {
      await closeComanda(selectedComanda.id, paymentMethod, discount);
      toast.success('Comanda fechada com sucesso');
      setCloseComandaDialog(false);
      setSelectedComanda(null);
      setPaymentMethod('');
      setDiscount(0);
    } catch (error) {
      toast.error('Erro ao fechar comanda');
    }
  };

  const generateQRCode = async (comanda: Comanda) => {
    const url = `${window.location.origin}/comanda/${comanda.code}`;
    const qrDataUrl = await QRCode.toDataURL(url);
    const link = document.createElement('a');
    link.download = `comanda-${comanda.code}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <AppShell>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Comandas</h1>
            <p className="text-muted-foreground">Gerencie as comandas abertas</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar comanda..."
                className="pl-8 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={() => setNewComandaDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Comanda
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {formattedActiveComandas.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Nenhuma comanda aberta</p>
                <p className="text-sm text-muted-foreground">Clique em "Nova Comanda" para começar</p>
              </CardContent>
            </Card>
          ) : (
            formattedActiveComandas.map((comanda) => (
              <Card key={comanda.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{comanda.code}</CardTitle>
                    <Badge variant="outline">Aberta</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {comanda.duration}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {comanda.table && (
                      <div className="text-sm text-muted-foreground">
                        Mesa {comanda.table.number}
                      </div>
                    )}
                    {comanda.customer_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {comanda.customer_name}
                      </div>
                    )}
                    {comanda.customer_phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {comanda.customer_phone}
                      </div>
                    )}
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="text-xl font-bold">
                        R$ {comanda.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedComanda(comanda);
                          setAddItemDialog(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedComanda(comanda);
                          setCloseComandaDialog(true);
                        }}
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Fechar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Dialog open={newComandaDialog} onOpenChange={setNewComandaDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Comanda</DialogTitle>
              <DialogDescription>
                Abra uma nova comanda para o cliente
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Mesa (opcional)</Label>
                <Select
                  value={newComandaForm.tableId}
                  onValueChange={(value) => setNewComandaForm({ ...newComandaForm, tableId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma mesa livre" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables
                      .filter((t) => t.status === 'livre')
                      .map((table) => (
                        <SelectItem key={table.id} value={table.id}>
                          Mesa {table.number}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nome do Cliente (opcional)</Label>
                <Input
                  placeholder="Nome do cliente"
                  value={newComandaForm.customerName}
                  onChange={(e) => setNewComandaForm({ ...newComandaForm, customerName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone (opcional)</Label>
                <Input
                  placeholder="Telefone do cliente"
                  value={newComandaForm.customerPhone}
                  onChange={(e) => setNewComandaForm({ ...newComandaForm, customerPhone: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewComandaDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleOpenComanda}>
                Abrir Comanda
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={addItemDialog} onOpenChange={(open) => {
          setAddItemDialog(open);
          if (!open) {
            setSelectedProduct(null);
            setProductSearch('');
            setQuantity(1);
          }
        }}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Adicionar Item</DialogTitle>
              <DialogDescription>
                Comanda: {selectedComanda?.code}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Buscar Produto</Label>
                  <Input
                    placeholder="Nome ou código de barras..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-[300px] border rounded-lg">
                  <div className="p-2 space-y-2">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedProduct?.id === product.id
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                        onClick={() => setSelectedProduct(product)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm opacity-75">{product.category?.name}</p>
                          </div>
                          <p className="font-bold">
                            R$ {product.sale_price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Itens da Comanda</h4>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {comandaItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded bg-secondary">
                          <div>
                            <p className="text-sm font-medium">{item.product?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity}x R$ {item.unit_price.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">R$ {item.total.toFixed(2)}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>
                      R$ {comandaItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                {selectedProduct && (
                  <div className="space-y-4 border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{selectedProduct.name}</p>
                        <p className="text-sm text-muted-foreground">
                          R$ {selectedProduct.sale_price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                    </div>
                    <Button onClick={handleAddItem} className="w-full">
                      <Check className="h-4 w-4 mr-2" />
                      Adicionar Item
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={closeComandaDialog} onOpenChange={(open) => {
          setCloseComandaDialog(open);
          if (!open) {
            setPaymentMethod('');
            setDiscount(0);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Fechar Comanda</DialogTitle>
              <DialogDescription>
                {selectedComanda?.code}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="border rounded-lg p-4">
                <div className="space-y-2">
                  {comandaItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.product?.name}</span>
                      <span>R$ {item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Subtotal</span>
                  <span>R$ {comandaItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Desconto</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Forma de Pagamento *</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="bg-primary/10 rounded-lg p-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>
                    R$ {(comandaItems.reduce((sum, item) => sum + item.total, 0) - discount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCloseComandaDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCloseComanda} disabled={!paymentMethod}>
                <CreditCard className="h-4 w-4 mr-2" />
                Fechar Comanda
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
