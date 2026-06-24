import { useState, useEffect, useCallback } from 'react';
import { Product, Category, StockMovement } from '@/lib/supabase';
import { LS_KEYS, getAll, insert, update, remove, generateId, addAuditLog } from '@/lib/local-db';
import { useAuth } from '@/contexts/AuthContext';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback((filters?: { category?: string; active?: boolean; search?: string }) => {
    setLoading(true);
    setError(null);

    let data = getAll<Product>(LS_KEYS.PRODUCTS);
    const categories = getAll<Category>(LS_KEYS.CATEGORIES);

    if (filters?.category) {
      data = data.filter((p) => p.category_id === filters.category);
    }
    if (filters?.active !== undefined) {
      data = data.filter((p) => p.active === filters.active);
    }
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      data = data.filter((p) => p.name.toLowerCase().includes(searchLower));
    }

    data = data.map((p) => ({
      ...p,
      category: categories.find((c) => c.id === p.category_id),
    }));
    data.sort((a, b) => a.name.localeCompare(b.name));

    setProducts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = (product: Partial<Product>) => {
    const newProduct = insert<Product>(LS_KEYS.PRODUCTS, {
      ...product,
      id: generateId(),
    } as Product);
    addAuditLog('create_product', 'products', newProduct.id, null, newProduct);
    setProducts((prev) => [...prev, newProduct]);
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const oldProduct = getAll<Product>(LS_KEYS.PRODUCTS).find((p) => p.id === id);
    const updated = update<Product>(LS_KEYS.PRODUCTS, id, updates);
    if (!updated) throw new Error('Product not found');
    addAuditLog('update_product', 'products', id, oldProduct, updated);
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const deleteProduct = (id: string) => {
    const removed = remove<Product>(LS_KEYS.PRODUCTS, id);
    if (!removed) throw new Error('Product not found');
    addAuditLog('delete_product', 'products', id, null, null);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(() => {
    setLoading(true);
    const data = getAll<Category>(LS_KEYS.CATEGORIES);
    data.sort((a, b) => a.sort_order - b.sort_order);
    setCategories(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = (category: Partial<Category>) => {
    const newCategory = insert<Category>(LS_KEYS.CATEGORIES, {
      ...category,
      id: generateId(),
    } as Category);
    addAuditLog('create_category', 'categories', newCategory.id, null, newCategory);
    setCategories((prev) => [...prev, newCategory]);
    return newCategory;
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    const updated = update<Category>(LS_KEYS.CATEGORIES, id, updates);
    if (!updated) throw new Error('Category not found');
    addAuditLog('update_category', 'categories', id, null, updated);
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const deleteCategory = (id: string) => {
    const removed = remove<Category>(LS_KEYS.CATEGORIES, id);
    if (!removed) throw new Error('Category not found');
    addAuditLog('delete_category', 'categories', id, null, null);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

export function useStock() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMovements = useCallback((productId?: string, limit?: number) => {
    setLoading(true);
    let data = getAll<StockMovement>(LS_KEYS.STOCK_MOVEMENTS);
    const products = getAll<Product>(LS_KEYS.PRODUCTS);
    const users = getAll(LS_KEYS.REGISTERED_USERS);

    if (productId) {
      data = data.filter((m) => m.product_id === productId);
    }

    data = data.map((m) => ({
      ...m,
      product: products.find((p) => p.id === m.product_id),
      user: users.find((u) => u.id === m.user_id),
    }));
    data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (limit) {
      data = data.slice(0, limit);
    }

    setMovements(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const addStockMovement = (
    productId: string,
    type: 'entrada' | 'saida',
    quantity: number,
    reason?: string,
    referenceId?: string
  ) => {
    const products = getAll<Product>(LS_KEYS.PRODUCTS);
    const product = products.find((p) => p.id === productId);
    if (!product) throw new Error('Product not found');

    const previousStock = product.stock;
    const newStock = type === 'entrada' ? previousStock + quantity : previousStock - quantity;

    const movement = insert<StockMovement>(LS_KEYS.STOCK_MOVEMENTS, {
      id: generateId(),
      product_id: productId,
      type,
      quantity,
      previous_stock: previousStock,
      new_stock: newStock,
      reason,
      reference_id: referenceId,
      user_id: user?.id || null,
    } as StockMovement);

    update<Product>(LS_KEYS.PRODUCTS, productId, { stock: newStock });
    addAuditLog('stock_movement', 'stock_movements', movement.id, null, movement);

    setMovements((prev) => [movement, ...prev]);
    return movement;
  };

  return {
    movements,
    loading,
    fetchMovements,
    addStockMovement,
  };
}
