import { useState, useEffect, useCallback } from 'react';
import { Table, Comanda, ComandaItem, Product } from '@/lib/supabase';
import { LS_KEYS, getAll, insert, update, remove, generateId, addAuditLog } from '@/lib/local-db';
import { useAuth } from '@/contexts/AuthContext';

export function useTables() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTables = useCallback(() => {
    setLoading(true);
    const data = getAll<Table>(LS_KEYS.TABLES);
    data.sort((a, b) => a.number - b.number);
    setTables(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const createTable = (table: Partial<Table>) => {
    const newTable = insert<Table>(LS_KEYS.TABLES, {
      ...table,
      id: generateId(),
    } as Table);
    addAuditLog('create_table', 'tables', newTable.id, null, newTable);
    setTables((prev) => [...prev, newTable]);
    return newTable;
  };

  const updateTable = (id: string, updates: Partial<Table>) => {
    const updated = update<Table>(LS_KEYS.TABLES, id, updates);
    if (!updated) throw new Error('Table not found');
    addAuditLog('update_table', 'tables', id, null, updated);
    setTables((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  };

  const deleteTable = (id: string) => {
    const removed = remove<Table>(LS_KEYS.TABLES, id);
    if (!removed) throw new Error('Table not found');
    addAuditLog('delete_table', 'tables', id, null, null);
    setTables((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTablePositions = (positions: { id: string; position_x: number; position_y: number }[]) => {
    for (const pos of positions) {
      update<Table>(LS_KEYS.TABLES, pos.id, { position_x: pos.position_x, position_y: pos.position_y });
    }
    fetchTables();
  };

  return {
    tables,
    loading,
    fetchTables,
    createTable,
    updateTable,
    deleteTable,
    updateTablePositions,
  };
}

export function useComandas() {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchComandas = useCallback((filters?: { status?: string; tableId?: string; roomId?: string }) => {
    setLoading(true);
    let data = getAll<Comanda>(LS_KEYS.COMANDAS);
    const tables = getAll<Table>(LS_KEYS.TABLES);
    const rooms = getAll(LS_KEYS.ROOMS);

    if (filters?.status) {
      data = data.filter((c) => c.status === filters.status);
    }
    if (filters?.tableId) {
      data = data.filter((c) => c.table_id === filters.tableId);
    }
    if (filters?.roomId) {
      data = data.filter((c) => c.room_id === filters.roomId);
    }

    data = data.map((c) => ({
      ...c,
      table: tables.find((t) => t.id === c.table_id),
      room: rooms.find((r) => r.id === c.room_id),
    }));
    data.sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime());

    setComandas(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchComandas({ status: 'aberta' });
  }, [fetchComandas]);

  const openComanda = (data: {
    tableId?: string;
    roomId?: string;
    customerName?: string;
    customerPhone?: string;
  }) => {
    const code = `CMD-${Date.now().toString(36).toUpperCase()}`;

    const comanda = insert<Comanda>(LS_KEYS.COMANDAS, {
      id: generateId(),
      code,
      table_id: data.tableId || null,
      room_id: data.roomId || null,
      customer_name: data.customerName || null,
      customer_phone: data.customerPhone || null,
      user_id: user?.id || null,
      status: 'aberta',
      total: 0,
      discount: 0,
      payment_method: null,
      notes: null,
      opened_at: new Date().toISOString(),
      closed_at: null,
      updated_at: new Date().toISOString(),
    } as Comanda);

    if (data.tableId) {
      update<Table>(LS_KEYS.TABLES, data.tableId, { status: 'ocupada' });
    }

    const tables = getAll<Table>(LS_KEYS.TABLES);
    const rooms = getAll(LS_KEYS.ROOMS);
    const comandaWithRelations = {
      ...comanda,
      table: tables.find((t) => t.id === comanda.table_id),
      room: rooms.find((r) => r.id === comanda.room_id),
    };

    addAuditLog('open_comanda', 'comandas', comanda.id, null, comanda);
    setComandas((prev) => [comandaWithRelations, ...prev]);
    return comandaWithRelations;
  };

  const addItemToComanda = (comandaId: string, product: Product, quantity: number = 1, notes?: string) => {
    const total = product.sale_price * quantity;

    const item = insert<ComandaItem>(LS_KEYS.COMANDA_ITEMS, {
      id: generateId(),
      comanda_id: comandaId,
      product_id: product.id,
      quantity,
      unit_price: product.sale_price,
      total,
      notes: notes || null,
      created_at: new Date().toISOString(),
    } as ComandaItem);

    updateComandaTotal(comandaId);
    addAuditLog('add_item_comanda', 'comanda_items', item.id, null, item);

    const products = getAll<Product>(LS_KEYS.PRODUCTS);
    const itemWithProduct = {
      ...item,
      product: products.find((p) => p.id === product.id),
    };

    return itemWithProduct;
  };

  const removeItemFromComanda = (itemId: string, comandaId: string) => {
    remove<ComandaItem>(LS_KEYS.COMANDA_ITEMS, itemId);
    updateComandaTotal(comandaId);
    addAuditLog('remove_item_comanda', 'comanda_items', itemId, null, null);
  };

  const updateComandaTotal = (comandaId: string) => {
    const items = getAll<ComandaItem>(LS_KEYS.COMANDA_ITEMS).filter((i) => i.comanda_id === comandaId);
    const total = items.reduce((sum, item) => sum + item.total, 0);
    update<Comanda>(LS_KEYS.COMANDAS, comandaId, { total });
  };

  const closeComanda = (comandaId: string, paymentMethod: string, discount: number = 0) => {
    const items = getAll<ComandaItem>(LS_KEYS.COMANDA_ITEMS).filter((i) => i.comanda_id === comandaId);
    const products = getAll<Product>(LS_KEYS.PRODUCTS);

    for (const item of items) {
      const product = products.find((p) => p.id === item.product_id);
      if (product) {
        const newStock = product.stock - item.quantity;
        update<Product>(LS_KEYS.PRODUCTS, item.product_id, { stock: newStock });
      }
    }

    const comanda = getAll<Comanda>(LS_KEYS.COMANDAS).find((c) => c.id === comandaId);
    if (!comanda) throw new Error('Comanda not found');

    const finalTotal = (comanda.total || 0) - discount;

    const updatedComanda = update<Comanda>(LS_KEYS.COMANDAS, comandaId, {
      status: 'fechada',
      closed_at: new Date().toISOString(),
      payment_method: paymentMethod,
      discount,
      total: finalTotal,
    });

    if (!updatedComanda) throw new Error('Failed to close comanda');

    if (comanda.table_id) {
      update<Table>(LS_KEYS.TABLES, comanda.table_id, { status: 'livre' });
    }

    addAuditLog('close_comanda', 'comandas', comandaId, null, updatedComanda);
    setComandas((prev) => prev.filter((c) => c.id !== comandaId));

    return updatedComanda;
  };

  const transferItems = (fromComandaId: string, toComandaId: string, itemIds: string[]) => {
    for (const itemId of itemIds) {
      const item = getAll<ComandaItem>(LS_KEYS.COMANDA_ITEMS).find((i) => i.id === itemId);
      if (item) {
        insert<ComandaItem>(LS_KEYS.COMANDA_ITEMS, {
          ...item,
          id: generateId(),
          comanda_id: toComandaId,
          created_at: new Date().toISOString(),
        } as ComandaItem);
        remove<ComandaItem>(LS_KEYS.COMANDA_ITEMS, itemId);
      }
    }
    updateComandaTotal(fromComandaId);
    updateComandaTotal(toComandaId);
    addAuditLog('transfer_items', 'comanda_items', null, null, { fromComandaId, toComandaId, itemIds });
  };

  const mergeComandas = (comandaIds: string[]) => {
    const [firstId, ...restIds] = comandaIds;

    for (const id of restIds) {
      const items = getAll<ComandaItem>(LS_KEYS.COMANDA_ITEMS).filter((i) => i.comanda_id === id);
      for (const item of items) {
        insert<ComandaItem>(LS_KEYS.COMANDA_ITEMS, {
          ...item,
          id: generateId(),
          comanda_id: firstId,
          created_at: new Date().toISOString(),
        } as ComandaItem);
      }
      remove<Comanda>(LS_KEYS.COMANDAS, id);
    }

    updateComandaTotal(firstId);
    addAuditLog('merge_comandas', 'comandas', firstId, null, { comandaIds });
    fetchComandas({ status: 'aberta' });
  };

  return {
    comandas,
    loading,
    fetchComandas,
    openComanda,
    addItemToComanda,
    removeItemFromComanda,
    closeComanda,
    transferItems,
    mergeComandas,
  };
}

export function useComandaItems(comandaId: string | null) {
  const [items, setItems] = useState<ComandaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!comandaId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const data = getAll<ComandaItem>(LS_KEYS.COMANDA_ITEMS).filter((i) => i.comanda_id === comandaId);
    const products = getAll<Product>(LS_KEYS.PRODUCTS);
    const categories = getAll(LS_KEYS.CATEGORIES);

    const itemsWithProducts = data.map((item) => ({
      ...item,
      product: {
        ...products.find((p) => p.id === item.product_id),
        category: categories.find((c) => c.id === products.find((p) => p.id === item.product_id)?.category_id),
      },
    }));

    itemsWithProducts.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    setItems(itemsWithProducts);
    setLoading(false);
  }, [comandaId]);

  return { items, loading };
}
