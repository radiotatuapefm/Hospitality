'use client';

import { useState, useMemo } from 'react';
import { AppShell } from '@/components/app-shell';
import { useProducts, useCategories, useStock } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Package,
  Filter,
  Download,
  Upload,
  Barcode,
  DollarSign,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { Product, Category } from '@/lib/supabase';

export default function ProdutosPage() {
  const { products, loading, createProduct, updateProduct, deleteProduct } = useProducts();
  const { categories, createCategory, updateCategory, deleteCategory } = useCategories();
  const { addStockMovement } = useStock();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);

  const [productForm, setProductForm] = useState({
    name: '',
    category_id: '',
    code: '',
    barcode: '',
    sale_price: 0,
    cost_price: 0,
    stock: 0,
    min_stock: 0,
    unit: 'UN',
    active: true,
    description: '',
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    active: true,
  });

  const [stockForm, setStockForm] = useState({
    type: 'entrada' as 'entrada' | 'saida',
    quantity: 0,
    reason: '',
  });

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(search.toLowerCase()) ||
        product.code?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
      const matchesActive = activeFilter === 'all' ||
        (activeFilter === 'active' && product.active) ||
        (activeFilter === 'inactive' && !product.active);
      return matchesSearch && matchesCategory && matchesActive;
    });
  }, [products, search, categoryFilter, activeFilter]);

  const handleOpenProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        category_id: product.category_id || '',
        code: product.code || '',
        barcode: product.barcode || '',
        sale_price: product.sale_price,
        cost_price: product.cost_price,
        stock: product.stock,
        min_stock: product.min_stock,
        unit: product.unit,
        active: product.active,
        description: product.description || '',
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        category_id: '',
        code: '',
        barcode: '',
        sale_price: 0,
        cost_price: 0,
        stock: 0,
        min_stock: 0,
        unit: 'UN',
        active: true,
        description: '',
      });
    }
    setProductDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productForm);
        toast.success('Produto atualizado com sucesso');
      } else {
        await createProduct(productForm);
        toast.success('Produto criado com sucesso');
      }
      setProductDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar produto');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deleteProduct(id);
        toast.success('Produto excluído com sucesso');
      } catch (error) {
        toast.error('Erro ao excluir produto');
      }
    }
  };

  const handleOpenCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        color: category.color,
        active: category.active,
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        description: '',
        color: '#6366f1',
        active: true,
      });
    }
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryForm);
        toast.success('Categoria atualizada com sucesso');
      } else {
        await createCategory(categoryForm);
        toast.success('Categoria criada com sucesso');
      }
      setCategoryDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await deleteCategory(id);
        toast.success('Categoria excluída com sucesso');
      } catch (error) {
        toast.error('Erro ao excluir categoria');
      }
    }
  };

  const handleStockAdjust = async () => {
    if (!stockProduct) return;
    try {
      await addStockMovement(
        stockProduct.id,
        stockForm.type,
        stockForm.quantity,
        stockForm.reason
      );
      toast.success('Estoque ajustado com sucesso');
      setStockDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao ajustar estoque');
    }
  };

  const lowStockProducts = products.filter((p) => p.stock <= p.min_stock && p.min_stock > 0);

  return (
    <AppShell>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Produtos</h1>
            <p className="text-muted-foreground">Gerencie seu catálogo de produtos</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {lowStockProducts.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-900">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                <AlertTriangle className="h-5 w-5" />
                Produtos com Estoque Baixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <Badge key={product.id} variant="outline" className="bg-white dark:bg-slate-900">
                    {product.name} ({product.stock} {product.unit})
                  </Badge>
                ))}
                {lowStockProducts.length > 5 && (
                  <Badge variant="outline">+{lowStockProducts.length - 5} mais</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="ativos" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="ativos">Produtos Ativos</TabsTrigger>
              <TabsTrigger value="categorias">Categorias</TabsTrigger>
              <TabsTrigger value="inativos">Inativos</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  className="pl-8 w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => handleOpenProductDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </div>
          </div>

          <TabsContent value="ativos">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead className="text-right">Preço Venda</TableHead>
                      <TableHead className="text-right">Preço Custo</TableHead>
                      <TableHead className="text-right">Estoque</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : filteredProducts.filter((p) => p.active).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Nenhum produto encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts
                        .filter((p) => p.active)
                        .map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                  <Package className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{product.name}</p>
                                  {product.barcode && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Barcode className="h-3 w-3" />
                                      {product.barcode}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {product.category?.name || 'Sem categoria'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-mono">{product.code || '-'}</span>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              R$ {product.sale_price.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              R$ {product.cost_price.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={product.stock <= product.min_stock ? 'text-red-500 font-medium' : ''}>
                                {product.stock} {product.unit}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={product.stock <= product.min_stock ? 'border-red-500 text-red-500' : 'border-green-500 text-green-500'}
                              >
                                {product.stock <= product.min_stock ? 'Baixo' : 'OK'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleOpenProductDialog(product)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setStockProduct(product);
                                    setStockForm({ type: 'entrada', quantity: 0, reason: '' });
                                    setStockDialogOpen(true);
                                  }}>
                                    <Package className="h-4 w-4 mr-2" />
                                    Ajustar Estoque
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)} className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categorias">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Card key={category.id}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenCategoryDialog(category)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteCategory(category.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {category.description || 'Sem descrição'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {products.filter((p) => p.category_id === category.id).length} produtos
                    </p>
                  </CardContent>
                </Card>
              ))}
              <Card
                className="flex items-center justify-center p-6 border-dashed cursor-pointer hover:bg-accent/50"
                onClick={() => handleOpenCategoryDialog()}
              >
                <div className="text-center">
                  <Plus className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Nova Categoria</p>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inativos">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.filter((p) => !p.active).map((product) => (
                      <TableRow key={product.id} className="opacity-60">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-muted-foreground" />
                            <span>{product.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {product.category?.name || 'Sem categoria'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {product.sale_price.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => updateProduct(product.id, { active: true })}>
                                Reativar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)} className="text-destructive">
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
              <DialogDescription>
                Preencha os dados do produto
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={productForm.category_id}
                    onValueChange={(value) => setProductForm({ ...productForm, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    value={productForm.code}
                    onChange={(e) => setProductForm({ ...productForm, code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Código de Barras</Label>
                  <Input
                    id="barcode"
                    value={productForm.barcode}
                    onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sale_price">Preço Venda *</Label>
                  <Input
                    id="sale_price"
                    type="number"
                    step="0.01"
                    value={productForm.sale_price}
                    onChange={(e) => setProductForm({ ...productForm, sale_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost_price">Preço Custo</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    value={productForm.cost_price}
                    onChange={(e) => setProductForm({ ...productForm, cost_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Estoque</Label>
                  <Input
                    id="stock"
                    type="number"
                    step="0.001"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_stock">Estoque Mín.</Label>
                  <Input
                    id="min_stock"
                    type="number"
                    step="0.001"
                    value={productForm.min_stock}
                    onChange={(e) => setProductForm({ ...productForm, min_stock: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">Unidade</Label>
                  <Select
                    value={productForm.unit}
                    onValueChange={(value) => setProductForm({ ...productForm, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UN">Unidade (UN)</SelectItem>
                      <SelectItem value="L">Litro (L)</SelectItem>
                      <SelectItem value="ML">Mililitro (ML)</SelectItem>
                      <SelectItem value="KG">Quilograma (KG)</SelectItem>
                      <SelectItem value="G">Grama (G)</SelectItem>
                      <SelectItem value="CX">Caixa (CX)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="active"
                    checked={productForm.active}
                    onCheckedChange={(checked) => setProductForm({ ...productForm, active: checked })}
                  />
                  <Label htmlFor="active">Produto Ativo</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProductDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveProduct}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cat_name">Nome *</Label>
                <Input
                  id="cat_name"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat_description">Descrição</Label>
                <Textarea
                  id="cat_description"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cat_color">Cor</Label>
                  <Input
                    id="cat_color"
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="cat_active"
                    checked={categoryForm.active}
                    onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, active: checked })}
                  />
                  <Label htmlFor="cat_active">Ativo</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveCategory}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajustar Estoque</DialogTitle>
              <DialogDescription>
                {stockProduct?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                <span className="text-sm text-muted-foreground">Estoque Atual</span>
                <span className="text-xl font-bold">{stockProduct?.stock} {stockProduct?.unit}</span>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Movimentação</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={stockForm.type === 'entrada' ? 'default' : 'outline'}
                    onClick={() => setStockForm({ ...stockForm, type: 'entrada' })}
                  >
                    <ArrowDownRight className="h-4 w-4 mr-2 text-green-500" />
                    Entrada
                  </Button>
                  <Button
                    variant={stockForm.type === 'saida' ? 'destructive' : 'outline'}
                    onClick={() => setStockForm({ ...stockForm, type: 'saida' })}
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2 text-red-500" />
                    Saída
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade *</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.001"
                  value={stockForm.quantity}
                  onChange={(e) => setStockForm({ ...stockForm, quantity: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo</Label>
                <Input
                  id="reason"
                  placeholder="Ex: Compra de fornecedor, Devolução..."
                  value={stockForm.reason}
                  onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStockDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleStockAdjust}>
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
