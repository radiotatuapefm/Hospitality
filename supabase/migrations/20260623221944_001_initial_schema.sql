-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE user_role AS ENUM ('administrador', 'gerente', 'caixa', 'garcom', 'recepcao');
CREATE TYPE table_status AS ENUM ('livre', 'ocupada', 'reservada', 'fechada');
CREATE TYPE room_status AS ENUM ('livre', 'ocupado', 'limpeza', 'manutencao', 'reservado');
CREATE TYPE room_time_type AS ENUM ('30min', '1h', '2h', '3h', '6h', 'pernoite');
CREATE TYPE payment_status AS ENUM ('pendente', 'pago', 'cancelado');
CREATE TYPE entry_type AS ENUM ('entrada', 'saida');
CREATE TYPE shift_status AS ENUM ('aberto', 'fechado');

-- ESTABLISHMENT SETTINGS
CREATE TABLE establishment_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'Meu Estabelecimento',
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  cnpj TEXT,
  ie TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO establishment_settings (id, name) VALUES (uuid_generate_v4(), 'Meu Estabelecimento');

-- USER PROFILES (extends auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'caixa',
  active BOOLEAN DEFAULT TRUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CATEGORIES
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT,
  active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categories (name, sort_order) VALUES
('Cervejas', 1),
('Destilados', 2),
('Energéticos', 3),
('Refrigerantes', 4),
('Água', 5),
('Água de Coco', 6),
('Tabacaria', 7),
('Doces', 8),
('Quartos', 9),
('Serviços', 10),
('Sinuca', 11),
('Música', 12),
('Outros', 13);

-- PRODUCTS
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  code TEXT UNIQUE,
  barcode TEXT,
  sale_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(10,2) DEFAULT 0,
  stock DECIMAL(10,3) DEFAULT 0,
  min_stock DECIMAL(10,3) DEFAULT 0,
  unit TEXT DEFAULT 'UN',
  photo_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLES (Mesas)
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number INTEGER NOT NULL,
  name TEXT,
  capacity INTEGER DEFAULT 4,
  status table_status DEFAULT 'livre',
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  width INTEGER DEFAULT 80,
  height INTEGER DEFAULT 80,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROOMS (Quartos)
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number TEXT NOT NULL,
  name TEXT,
  type TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  photo_url TEXT,
  notes TEXT,
  status room_status DEFAULT 'livre',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROOM TIME RATES
CREATE TABLE room_time_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_type TEXT,
  time_type room_time_type NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  minutes INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO room_time_rates (time_type, price, minutes) VALUES
('30min', 30.00, 30),
('1h', 50.00, 60),
('2h', 80.00, 120),
('3h', 110.00, 180),
('6h', 180.00, 360),
('pernoite', 250.00, 720);

-- CASH SHIFTS (Caixas)
CREATE TABLE cash_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  opening_balance DECIMAL(10,2) DEFAULT 0,
  closing_balance DECIMAL(10,2),
  status shift_status DEFAULT 'aberto',
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CASH MOVEMENTS (Sangria, Suprimento)
CREATE TABLE cash_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cash_shift_id UUID REFERENCES cash_shifts(id) NOT NULL,
  type entry_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMANDAS (Tabs)
CREATE TABLE comandas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  table_id UUID REFERENCES tables(id),
  room_id UUID REFERENCES rooms(id),
  customer_name TEXT,
  customer_phone TEXT,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'aberta',
  total DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  payment_method TEXT,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMANDA ITEMS
CREATE TABLE comanda_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comanda_id UUID REFERENCES comandas(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROOM OCCUPANCIES (Controle de Quartos)
CREATE TABLE room_occupancies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) NOT NULL,
  comanda_id UUID REFERENCES comandas(id),
  guest_name TEXT,
  guest_document TEXT,
  guest_phone TEXT,
  time_type room_time_type NOT NULL,
  entry_time TIMESTAMPTZ DEFAULT NOW(),
  expected_exit_time TIMESTAMPTZ,
  actual_exit_time TIMESTAMPTZ,
  base_price DECIMAL(10,2) NOT NULL,
  overtime_price DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'ativo',
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RESERVATIONS
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id),
  table_id UUID REFERENCES tables(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  reservation_date DATE NOT NULL,
  reservation_time TIME,
  guests INTEGER DEFAULT 1,
  status TEXT DEFAULT 'confirmada',
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STOCK MOVEMENTS
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) NOT NULL,
  type entry_type NOT NULL,
  quantity DECIMAL(10,3) NOT NULL,
  previous_stock DECIMAL(10,3),
  new_stock DECIMAL(10,3),
  reason TEXT,
  reference_id UUID,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FINANCIAL ACCOUNTS
CREATE TABLE financial_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  category TEXT,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE,
  payment_date DATE,
  status payment_status DEFAULT 'pendente',
  recipient TEXT,
  document TEXT,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOG
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SALES SUMMARY (for dashboard)
CREATE TABLE daily_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  total_sales DECIMAL(10,2) DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  total_products_sold DECIMAL(10,3) DEFAULT 0,
  rooms_revenue DECIMAL(10,2) DEFAULT 0,
  products_revenue DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTS SOLD (for reports)
CREATE TABLE product_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  date DATE NOT NULL,
  quantity DECIMAL(10,3) DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0,
  profit DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE establishment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_time_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comanda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_occupancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_occupancies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "select_user_profiles" ON user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_user_profiles" ON user_profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_user_profiles" ON user_profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_user_profiles" ON user_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'administrador'));

-- RLS Policies for establishment_settings
CREATE POLICY "select_establishment_settings" ON establishment_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_establishment_settings" ON establishment_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_establishment_settings" ON establishment_settings FOR UPDATE TO authenticated USING (true);

-- RLS Policies for categories
CREATE POLICY "select_categories" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_categories" ON categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_categories" ON categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_categories" ON categories FOR DELETE TO authenticated USING (true);

-- RLS Policies for products
CREATE POLICY "select_products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_products" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_products" ON products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_products" ON products FOR DELETE TO authenticated USING (true);

-- RLS Policies for tables
CREATE POLICY "select_tables" ON tables FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_tables" ON tables FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_tables" ON tables FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_tables" ON tables FOR DELETE TO authenticated USING (true);

-- RLS Policies for rooms
CREATE POLICY "select_rooms" ON rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_rooms" ON rooms FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_rooms" ON rooms FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_rooms" ON rooms FOR DELETE TO authenticated USING (true);

-- RLS Policies for room_time_rates
CREATE POLICY "select_room_time_rates" ON room_time_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_room_time_rates" ON room_time_rates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_room_time_rates" ON room_time_rates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_room_time_rates" ON room_time_rates FOR DELETE TO authenticated USING (true);

-- RLS Policies for cash_shifts
CREATE POLICY "select_cash_shifts" ON cash_shifts FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_cash_shifts" ON cash_shifts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_cash_shifts" ON cash_shifts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_cash_shifts" ON cash_shifts FOR DELETE TO authenticated USING (true);

-- RLS Policies for cash_movements
CREATE POLICY "select_cash_movements" ON cash_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_cash_movements" ON cash_movements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_cash_movements" ON cash_movements FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_cash_movements" ON cash_movements FOR DELETE TO authenticated USING (true);

-- RLS Policies for comandas
CREATE POLICY "select_comandas" ON comandas FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_comandas" ON comandas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_comandas" ON comandas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_comandas" ON comandas FOR DELETE TO authenticated USING (true);

-- RLS Policies for comanda_items
CREATE POLICY "select_comanda_items" ON comanda_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_comanda_items" ON comanda_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_comanda_items" ON comanda_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_comanda_items" ON comanda_items FOR DELETE TO authenticated USING (true);

-- RLS Policies for room_occupancies
CREATE POLICY "select_room_occupancies" ON room_occupancies FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_room_occupancies" ON room_occupancies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_room_occupancies" ON room_occupancies FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_room_occupancies" ON room_occupancies FOR DELETE TO authenticated USING (true);

-- RLS Policies for reservations
CREATE POLICY "select_reservations" ON reservations FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_reservations" ON reservations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_reservations" ON reservations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_reservations" ON reservations FOR DELETE TO authenticated USING (true);

-- RLS Policies for stock_movements
CREATE POLICY "select_stock_movements" ON stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_stock_movements" ON stock_movements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_stock_movements" ON stock_movements FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_stock_movements" ON stock_movements FOR DELETE TO authenticated USING (true);

-- RLS Policies for financial_accounts
CREATE POLICY "select_financial_accounts" ON financial_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_financial_accounts" ON financial_accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_financial_accounts" ON financial_accounts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_financial_accounts" ON financial_accounts FOR DELETE TO authenticated USING (true);

-- RLS Policies for audit_logs
CREATE POLICY "select_audit_logs" ON audit_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('administrador', 'gerente')));
CREATE POLICY "insert_audit_logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for daily_sales
CREATE POLICY "select_daily_sales" ON daily_sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_daily_sales" ON daily_sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_daily_sales" ON daily_sales FOR UPDATE TO authenticated USING (true);

-- RLS Policies for product_sales
CREATE POLICY "select_product_sales" ON product_sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_product_sales" ON product_sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_product_sales" ON product_sales FOR UPDATE TO authenticated USING (true);

-- Indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_comandas_status ON comandas(status);
CREATE INDEX idx_comandas_opened ON comandas(opened_at DESC);
CREATE INDEX idx_room_occupancies_room ON room_occupancies(room_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_financial_accounts_status ON financial_accounts(status);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);