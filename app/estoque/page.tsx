'use client';

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { useProducts, useStock } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Package, Search, ArrowDownRight, ArrowUpRight, AlertTriangle } from 'lucide-react';

export default function EstoquePage() {
  const { products, loading } = useProducts();
  const { movements, fetchMovements } = useStock();
  const [search, setSearch] = useState('');

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockProducts = products.filter(
    (p) => p.stock <= p.min_stock && p.min_stock > 0
  );

  return (
    <AppShell>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Estoque</h1>
            <p className="text-muted-foreground">Controle de movimentações e níveis</p>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              className="pl-8 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {lowStockProducts.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 text-sm">
                <AlertTriangle className="h-4 w-4" />
                Alertas de Estoque Baixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {lowStockProducts.map((p) => (
                  <Badge key={p.id} variant="outline">
                    {p.name}: {p.stock} {p.unit}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Produtos</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
                <Package className="h-8 w-8 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                  <p className="text-2xl font-bold text-red-600">{lowStockProducts.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Movimentações</p>
                  <p className="text-2xl font-bold">{movements.length}</p>
                </div>
                <ArrowDownRight className="h-8 w-8 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Estoque dos Produtos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum produto encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.category?.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">{product.code || '-'}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={product.stock <= product.min_stock ? 'text-red-500 font-medium' : ''}>
                          {product.stock} {product.unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {product.min_stock} {product.unit}
                      </TableCell>
                      <TableCell>
                        {product.stock <= product.min_stock ? (
                          <Badge variant="outline" className="border-red-500 text-red-500">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Baixo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-green-500 text-green-500">
                            OK
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas Movimentações</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead>Estoque Antes</TableHead>
                    <TableHead>Estoque Depois</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhuma movimentação registrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    movements.slice(0, 50).map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-sm">
                          {new Date(m.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>{m.product?.name || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              m.type === 'entrada'
                                ? 'border-green-500 text-green-500'
                                : 'border-red-500 text-red-500'
                            }
                          >
                            {m.type === 'entrada' ? (
                              <ArrowDownRight className="h-3 w-3 mr-1" />
                            ) : (
                              <ArrowUpRight className="h-3 w-3 mr-1" />
                            )}
                            {m.type === 'entrada' ? 'Entrada' : 'Saída'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{m.quantity}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {m.previous_stock}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {m.new_stock}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {m.reason || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
