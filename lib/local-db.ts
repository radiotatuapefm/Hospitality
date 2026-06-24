import { v4 as uuidv4 } from 'uuid';

// ==================== LOCAL STORAGE DB ====================
// Complete offline-first database using localStorage
// All data persists across page reloads

export const LS_KEYS = {
  PRODUCTS: 'bh_products',
  CATEGORIES: 'bh_categories',
  TABLES: 'bh_tables',
  ROOMS: 'bh_rooms',
  ROOM_TIME_RATES: 'bh_room_time_rates',
  COMANDAS: 'bh_comandas',
  COMANDA_ITEMS: 'bh_comanda_items',
  ROOM_OCCUPANCIES: 'bh_room_occupancies',
  RESERVATIONS: 'bh_reservations',
  CASH_SHIFTS: 'bh_cash_shifts',
  CASH_MOVEMENTS: 'bh_cash_movements',
  FINANCIAL_ACCOUNTS: 'bh_financial_accounts',
  STOCK_MOVEMENTS: 'bh_stock_movements',
  USERS: 'bh_users',
  SETTINGS: 'bh_settings',
  BRANDING: 'bh_branding',
  AUDIT_LOGS: 'bh_audit_logs',
  DAILY_SALES: 'bh_daily_sales',
  PRODUCT_SALES: 'bh_product_sales',
  SESSION: 'bh_session',
  SESSION_PROFILE: 'bh_session_profile',
  REGISTERED_USERS: 'bh_registered_users',
};

// ==================== UUID GENERATOR ====================
export function generateId(): string {
  // Simple UUID-like generator without external dependency
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ==================== GENERIC CRUD ====================
function getItem<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setItem<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

export function getAll<T>(key: string): T[] {
  return getItem<T>(key);
}

export function getById<T extends { id: string }>(key: string, id: string): T | null {
  const items = getItem<T>(key);
  return items.find((item) => (item as unknown as { id: string }).id === id) || null;
}

export function insert<T extends { id: string }>(key: string, data: T): T {
  const items = getItem<T>(key);
  const now = new Date().toISOString();
  const itemWithTimestamps = {
    ...data,
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
  };
  items.push(itemWithTimestamps);
  setItem(key, items);
  return itemWithTimestamps as T;
}

export function update<T extends { id: string }>(key: string, id: string, updates: Partial<T>): T | null {
  const items = getItem<T>(key);
  const index = items.findIndex((item) => (item as unknown as { id: string }).id === id);
  if (index === -1) return null;

  const now = new Date().toISOString();
  items[index] = {
    ...items[index],
    ...updates,
    updated_at: now,
  };
  setItem(key, items);
  return items[index];
}

export function remove<T extends { id: string }>(key: string, id: string): boolean {
  const items = getItem<T>(key);
  const filtered = items.filter((item) => (item as unknown as { id: string }).id !== id);
  if (filtered.length === items.length) return false;
  setItem(key, filtered);
  return true;
}

export function clearAll(key: string): void {
  setItem(key, []);
}

export function exportAllData(): string {
  const data: Record<string, unknown[]> = {};
  for (const [key, value] of Object.entries(LS_KEYS)) {
    data[key] = getItem(value);
  }
  return JSON.stringify(
    {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data,
    },
    null,
    2
  );
}

export function importAllData(jsonData: string): void {
  const parsed = JSON.parse(jsonData);
  if (!parsed.data) throw new Error('Invalid backup format');

  for (const [key, value] of Object.entries(LS_KEYS)) {
    const data = parsed.data[key];
    if (Array.isArray(data)) {
      setItem(value, data);
    }
  }
}

// ==================== INITIALIZATION ====================
export function initDatabase() {
  if (typeof window === 'undefined') return;

  // Seed default data if empty
  const products = getItem(LS_KEYS.PRODUCTS);
  if (products.length === 0) {
    // Seed default categories
    const categories = [
      { id: generateId(), name: 'Bebidas', description: 'Bebidas em geral', color: '#3B82F6', icon: 'wine', active: true, sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), name: 'Comidas', description: 'Porções e lanches', color: '#EF4444', icon: 'utensils', active: true, sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), name: 'Cigarros', description: 'Cigarros e derivados', color: '#6B7280', icon: 'cigarette', active: true, sort_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), name: 'Diversos', description: 'Produtos diversos', color: '#10B981', icon: 'box', active: true, sort_order: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];
    setItem(LS_KEYS.CATEGORIES, categories);

    // Seed default products
    const prods = [
      { id: generateId(), name: 'Cerveja Lata', category_id: categories[0].id, code: 'CERV001', barcode: null, sale_price: 7.00, cost_price: 4.50, stock: 100, min_stock: 20, unit: 'un', photo_url: null, active: true, description: 'Cerveja lata 350ml', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), name: 'Cerveja Garrafa', category_id: categories[0].id, code: 'CERV002', barcode: null, sale_price: 10.00, cost_price: 6.50, stock: 80, min_stock: 15, unit: 'un', photo_url: null, active: true, description: 'Cerveja garrafa 600ml', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), name: 'Refrigerante Lata', category_id: categories[0].id, code: 'REF001', barcode: null, sale_price: 5.00, cost_price: 3.00, stock: 50, min_stock: 10, unit: 'un', photo_url: null, active: true, description: 'Refrigerante lata 350ml', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), name: 'Água', category_id: categories[0].id, code: 'AGUA001', barcode: null, sale_price: 3.00, cost_price: 1.50, stock: 100, min_stock: 20, unit: 'un', photo_url: null, active: true, description: 'Água mineral 500ml', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), name: 'Porção de Batata', category_id: categories[1].id, code: 'PORC001', barcode: null, sale_price: 25.00, cost_price: 12.00, stock: 30, min_stock: 5, unit: 'un', photo_url: null, active: true, description: 'Porção de batata frita', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), name: 'Porção de Calabresa', category_id: categories[1].id, code: 'PORC002', barcode: null, sale_price: 35.00, cost_price: 18.00, stock: 20, min_stock: 5, unit: 'un', photo_url: null, active: true, description: 'Porção de calabresa acebolada', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), name: 'Cigarro Marlboro', category_id: categories[2].id, code: 'CIG001', barcode: null, sale_price: 15.00, cost_price: 10.00, stock: 40, min_stock: 10, unit: 'maço', photo_url: null, active: true, description: 'Cigarro Marlboro', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];
    setItem(LS_KEYS.PRODUCTS, prods);

    // Seed default tables
    const tables = [
      { id: generateId(), number: 1, name: 'Mesa 1', capacity: 4, status: 'livre', position_x: 50, position_y: 50, width: 100, height: 80, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), number: 2, name: 'Mesa 2', capacity: 4, status: 'livre', position_x: 200, position_y: 50, width: 100, height: 80, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), number: 3, name: 'Mesa 3', capacity: 6, status: 'livre', position_x: 350, position_y: 50, width: 120, height: 80, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), number: 4, name: 'Mesa 4', capacity: 2, status: 'livre', position_x: 50, position_y: 200, width: 80, height: 80, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), number: 5, name: 'Mesa 5', capacity: 4, status: 'livre', position_x: 200, position_y: 200, width: 100, height: 80, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), number: 6, name: 'Mesa 6', capacity: 8, status: 'livre', position_x: 350, position_y: 200, width: 140, height: 80, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];
    setItem(LS_KEYS.TABLES, tables);

    // Seed default rooms
    const rooms = [
      { id: generateId(), number: '101', name: 'Quarto 101', type: 'Standard', price: 60.00, photo_url: null, notes: null, status: 'livre', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), number: '102', name: 'Quarto 102', type: 'Standard', price: 60.00, photo_url: null, notes: null, status: 'livre', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), number: '103', name: 'Quarto 103', type: 'Luxo', price: 100.00, photo_url: null, notes: null, status: 'livre', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), number: '104', name: 'Quarto 104', type: 'Luxo', price: 100.00, photo_url: null, notes: null, status: 'livre', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), number: '105', name: 'Quarto 105', type: 'Suite', price: 150.00, photo_url: null, notes: null, status: 'livre', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];
    setItem(LS_KEYS.ROOMS, rooms);

    // Seed default room time rates
    const rates = [
      { id: generateId(), room_type: 'Standard', time_type: '30min', price: 30.00, minutes: 30, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), room_type: 'Standard', time_type: '1h', price: 60.00, minutes: 60, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), room_type: 'Standard', time_type: '2h', price: 100.00, minutes: 120, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), room_type: 'Standard', time_type: '3h', price: 140.00, minutes: 180, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), room_type: 'Standard', time_type: '6h', price: 200.00, minutes: 360, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), room_type: 'Standard', time_type: 'pernoite', price: 250.00, minutes: 720, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), room_type: 'Luxo', time_type: '30min', price: 50.00, minutes: 30, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), room_type: 'Luxo', time_type: '1h', price: 100.00, minutes: 60, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), room_type: 'Luxo', time_type: '2h', price: 180.00, minutes: 120, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), room_type: 'Luxo', time_type: '3h', price: 250.00, minutes: 180, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), room_type: 'Luxo', time_type: '6h', price: 350.00, minutes: 360, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), room_type: 'Luxo', time_type: 'pernoite', price: 400.00, minutes: 720, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), room_type: 'Suite', time_type: '30min', price: 75.00, minutes: 30, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), room_type: 'Suite', time_type: '1h', price: 150.00, minutes: 60, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), room_type: 'Suite', time_type: '2h', price: 280.00, minutes: 120, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), room_type: 'Suite', time_type: '3h', price: 400.00, minutes: 180, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), room_type: 'Suite', time_type: '6h', price: 500.00, minutes: 360, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: generateId(), room_type: 'Suite', time_type: 'pernoite', price: 600.00, minutes: 720, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];
    setItem(LS_KEYS.ROOM_TIME_RATES, rates);

    // Seed default settings
    const settings = {
      id: generateId(),
      name: 'Bar & Hotel Manager',
      logo_url: null,
      address: 'Rua Exemplo, 123 - Centro',
      phone: '(11) 99999-9999',
      email: 'contato@barhotel.com',
      website: null,
      cnpj: '00.000.000/0000-00',
      ie: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setItem(LS_KEYS.SETTINGS, [settings]);

    // Seed default admin user
    const adminUser = {
      id: generateId(),
      email: 'admin@admin.com',
      password: 'admin123',
      name: 'Administrador',
      role: 'administrador' as const,
      active: true,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setItem(LS_KEYS.REGISTERED_USERS, [adminUser]);
  }
}

// ==================== SESSION MANAGEMENT ====================
export interface LocalSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token: string;
  expiresAt: number;
}

export function getSession(): LocalSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(LS_KEYS.SESSION);
    if (!data) return null;
    const session = JSON.parse(data) as LocalSession;
    if (session.expiresAt < Date.now()) {
      localStorage.removeItem(LS_KEYS.SESSION);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function setSession(session: LocalSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEYS.SESSION, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LS_KEYS.SESSION);
  localStorage.removeItem(LS_KEYS.SESSION_PROFILE);
}

// ==================== USER MANAGEMENT ====================
export interface LocalUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  active: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export function getAllUsers(): LocalUser[] {
  return getItem<LocalUser>(LS_KEYS.REGISTERED_USERS);
}

export function getUserByEmail(email: string): LocalUser | null {
  const users = getAllUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export function getUserById(id: string): LocalUser | null {
  const users = getAllUsers();
  return users.find((u) => u.id === id) || null;
}

export function createUser(user: Omit<LocalUser, 'id' | 'created_at' | 'updated_at'>): LocalUser {
  const newUser: LocalUser = {
    ...user,
    id: generateId(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const users = getAllUsers();
  users.push(newUser);
  setItem(LS_KEYS.REGISTERED_USERS, users);
  return newUser;
}

export function updateUser(id: string, updates: Partial<LocalUser>): LocalUser | null {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;
  users[index] = { ...users[index], ...updates, updated_at: new Date().toISOString() };
  setItem(LS_KEYS.REGISTERED_USERS, users);
  return users[index];
}

export function deleteUser(id: string): boolean {
  const users = getAllUsers();
  const filtered = users.filter((u) => u.id !== id);
  if (filtered.length === users.length) return false;
  setItem(LS_KEYS.REGISTERED_USERS, filtered);
  return true;
}

// ==================== AUDIT LOG ====================
export function addAuditLog(
  action: string,
  entityType: string | null,
  entityId: string | null,
  oldData: unknown | null,
  newData: unknown | null
): void {
  const session = getSession();
  const log = {
    id: generateId(),
    user_id: session?.user?.id || null,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_data: oldData,
    new_data: newData,
    ip_address: '127.0.0.1',
    user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
    created_at: new Date().toISOString(),
  };
  const logs = getItem(LS_KEYS.AUDIT_LOGS);
  logs.push(log);
  // Keep only last 5000 logs
  if (logs.length > 5000) {
    setItem(LS_KEYS.AUDIT_LOGS, logs.slice(-5000));
  } else {
    setItem(LS_KEYS.AUDIT_LOGS, logs);
  }
}

// ==================== DAILY SALES ====================
export function updateDailySales(date: string, total: number, productsSold: number, roomsRevenue: number, productsRevenue: number, totalCost: number): void {
  const sales = getItem(LS_KEYS.DAILY_SALES);
  const existingIndex = sales.findIndex((s) => s.date === date);

  if (existingIndex >= 0) {
    sales[existingIndex].total_sales += total;
    sales[existingIndex].total_transactions += 1;
    sales[existingIndex].total_products_sold += productsSold;
    sales[existingIndex].rooms_revenue += roomsRevenue;
    sales[existingIndex].products_revenue += productsRevenue;
    sales[existingIndex].total_cost += totalCost;
    sales[existingIndex].updated_at = new Date().toISOString();
  } else {
    sales.push({
      id: generateId(),
      date,
      total_sales: total,
      total_transactions: 1,
      total_products_sold: productsSold,
      rooms_revenue: roomsRevenue,
      products_revenue: productsRevenue,
      total_cost: totalCost,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  setItem(LS_KEYS.DAILY_SALES, sales);
}

// ==================== PRODUCT SALES ====================
export function recordProductSale(productId: string, date: string, quantity: number, revenue: number, cost: number, profit: number): void {
  const sales = getItem(LS_KEYS.PRODUCT_SALES);
  const key = `${productId}-${date}`;
  const existingIndex = sales.findIndex((s) => s.product_id === productId && s.date === date);

  if (existingIndex >= 0) {
    sales[existingIndex].quantity += quantity;
    sales[existingIndex].revenue += revenue;
    sales[existingIndex].cost += cost;
    sales[existingIndex].profit += profit;
    sales[existingIndex].created_at = new Date().toISOString();
  } else {
    sales.push({
      id: generateId(),
      product_id: productId,
      date,
      quantity,
      revenue,
      cost,
      profit,
      created_at: new Date().toISOString(),
    });
  }

  setItem(LS_KEYS.PRODUCT_SALES, sales);
}
