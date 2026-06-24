import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'administrador' | 'gerente' | 'caixa' | 'garcom' | 'recepcao';
export type TableStatus = 'livre' | 'ocupada' | 'reservada' | 'fechada';
export type RoomStatus = 'livre' | 'ocupado' | 'limpeza' | 'manutencao' | 'reservado';
export type RoomTimeType = '30min' | '1h' | '2h' | '3h' | '6h' | 'pernoite';
export type PaymentStatus = 'pendente' | 'pago' | 'cancelado';
export type EntryType = 'entrada' | 'saida';
export type ShiftStatus = 'aberto' | 'fechado';

export interface EstablishmentSettings {
  id: string;
  name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  cnpj: string | null;
  ie: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  category_id: string | null;
  code: string | null;
  barcode: string | null;
  sale_price: number;
  cost_price: number;
  stock: number;
  min_stock: number;
  unit: string;
  photo_url: string | null;
  active: boolean;
  description: string | null;
  category?: Category;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: string;
  number: number;
  name: string | null;
  capacity: number;
  status: TableStatus;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  number: string;
  name: string | null;
  type: string | null;
  price: number;
  photo_url: string | null;
  notes: string | null;
  status: RoomStatus;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoomTimeRate {
  id: string;
  room_type: string | null;
  time_type: RoomTimeType;
  price: number;
  minutes: number;
  created_at: string;
  updated_at: string;
}

export interface CashShift {
  id: string;
  user_id: string | null;
  opening_balance: number;
  closing_balance: number | null;
  status: ShiftStatus;
  opened_at: string;
  closed_at: string | null;
  notes: string | null;
  user?: UserProfile;
  created_at: string;
}

export interface CashMovement {
  id: string;
  cash_shift_id: string;
  type: EntryType;
  amount: number;
  reason: string | null;
  user_id: string | null;
  user?: UserProfile;
  created_at: string;
}

export interface Comanda {
  id: string;
  code: string;
  table_id: string | null;
  room_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  opened_at: string;
  closed_at: string | null;
  status: string;
  total: number;
  discount: number;
  payment_method: string | null;
  notes: string | null;
  user_id: string | null;
  table?: Table;
  room?: Room;
  items?: ComandaItem[];
  created_at: string;
  updated_at: string;
}

export interface ComandaItem {
  id: string;
  comanda_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total: number;
  notes: string | null;
  product?: Product;
  created_at: string;
}

export interface RoomOccupancy {
  id: string;
  room_id: string;
  comanda_id: string | null;
  guest_name: string | null;
  guest_document: string | null;
  guest_phone: string | null;
  time_type: RoomTimeType;
  entry_time: string;
  expected_exit_time: string | null;
  actual_exit_time: string | null;
  base_price: number;
  overtime_price: number;
  total_price: number;
  status: string;
  notes: string | null;
  user_id: string | null;
  room?: Room;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  room_id: string | null;
  table_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  reservation_date: string;
  reservation_time: string | null;
  guests: number;
  status: string;
  notes: string | null;
  user_id: string | null;
  room?: Room;
  table?: Table;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  type: EntryType;
  quantity: number;
  previous_stock: number | null;
  new_stock: number | null;
  reason: string | null;
  reference_id: string | null;
  user_id: string | null;
  product?: Product;
  user?: UserProfile;
  created_at: string;
}

export interface FinancialAccount {
  id: string;
  type: string;
  category: string | null;
  description: string;
  amount: number;
  due_date: string | null;
  payment_date: string | null;
  status: PaymentStatus;
  recipient: string | null;
  document: string | null;
  notes: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_data: Json | null;
  new_data: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface DailySales {
  id: string;
  date: string;
  total_sales: number;
  total_transactions: number;
  total_products_sold: number;
  rooms_revenue: number;
  products_revenue: number;
  total_cost: number;
  created_at: string;
  updated_at: string;
}

export interface ProductSale {
  id: string;
  product_id: string | null;
  date: string;
  quantity: number;
  revenue: number;
  cost: number;
  profit: number;
  product?: Product;
  created_at: string;
}
