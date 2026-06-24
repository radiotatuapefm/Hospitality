-- Security fixes for Supabase security advisor warnings
-- 1. Fix function search_path mutable for decrement_stock and log_audit
-- 2. Fix RLS policies that are "always true"
-- 3. Revoke EXECUTE from anon/authenticated on SECURITY DEFINER functions

-- ============================================================================
-- PART 1: Fix decrement_stock function (change to SECURITY INVOKER)
-- ============================================================================
DROP FUNCTION IF EXISTS public.decrement_stock(uuid, integer);

CREATE OR REPLACE FUNCTION public.decrement_stock(
  p_product_id uuid,
  p_quantity integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  UPDATE products
  SET stock = stock - p_quantity,
      updated_at = now()
  WHERE id = p_product_id;
END;
$$;

-- Revoke execute from anon role
REVOKE EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) FROM anon;

-- ============================================================================
-- PART 2: Fix log_audit function (change to SECURITY INVOKER)
-- Use CASCADE to drop dependent triggers, then recreate them
-- ============================================================================
DROP FUNCTION IF EXISTS public.log_audit() CASCADE;

CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (
      auth.uid(),
      'INSERT',
      TG_TABLE_NAME,
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (
      auth.uid(),
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (
      auth.uid(),
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Revoke execute from anon role
REVOKE EXECUTE ON FUNCTION public.log_audit() FROM anon;

-- Recreate the audit triggers that were dropped with CASCADE
CREATE TRIGGER products_audit
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER comandas_audit
  AFTER INSERT OR UPDATE OR DELETE ON comandas
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER room_occupancies_audit
  AFTER INSERT OR UPDATE OR DELETE ON room_occupancies
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER cash_shifts_audit
  AFTER INSERT OR UPDATE OR DELETE ON cash_shifts
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER financial_accounts_audit
  AFTER INSERT OR UPDATE OR DELETE ON financial_accounts
  FOR EACH ROW EXECUTE FUNCTION log_audit();

-- ============================================================================
-- PART 3: Fix RLS policies - replace "always true" policies
-- ============================================================================

-- user_profiles: Users can only manage their own profile
DROP POLICY IF EXISTS "Enable all for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable all for all users" ON user_profiles;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all profiles" ON user_profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'administrador'
    )
  );

-- categories: Authenticated users can read, admins can manage
DROP POLICY IF EXISTS "Enable all for authenticated users" ON categories;

CREATE POLICY "Authenticated can view categories" ON categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage categories" ON categories
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('administrador', 'gerente')
    )
  );

-- products: Authenticated users can read, admins/managers can manage
DROP POLICY IF EXISTS "Enable all for authenticated users" ON products;

CREATE POLICY "Authenticated can view products" ON products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins managers manage products" ON products
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('administrador', 'gerente')
    )
  );

-- tables: Authenticated users can read, admins/managers can manage
DROP POLICY IF EXISTS "Enable all for authenticated users" ON tables;

CREATE POLICY "Authenticated can view tables" ON tables
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins managers manage tables" ON tables
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('administrador', 'gerente')
    )
  );

-- rooms: Authenticated users can read, admins/managers can manage
DROP POLICY IF EXISTS "Enable all for authenticated users" ON rooms;

CREATE POLICY "Authenticated can view rooms" ON rooms
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins managers manage rooms" ON rooms
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('administrador', 'gerente')
    )
  );

-- room_time_rates: Authenticated users can read, admins/managers can manage
DROP POLICY IF EXISTS "Enable all for authenticated users" ON room_time_rates;

CREATE POLICY "Authenticated can view rates" ON room_time_rates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins managers manage rates" ON room_time_rates
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('administrador', 'gerente')
    )
  );

-- cash_shifts: Authenticated users can read, admins/managers/caixa can manage
DROP POLICY IF EXISTS "Enable all for authenticated users" ON cash_shifts;

CREATE POLICY "Authenticated can view shifts" ON cash_shifts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Cash staff manage shifts" ON cash_shifts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('administrador', 'gerente', 'caixa')
    )
  );

-- cash_movements: Authenticated users can read, admins/managers/caixa can manage
DROP POLICY IF EXISTS "Enable all for authenticated users" ON cash_movements;

CREATE POLICY "Authenticated can view movements" ON cash_movements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Cash staff manage movements" ON cash_movements
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('administrador', 'gerente', 'caixa')
    )
  );

-- comandas: All staff can manage
DROP POLICY IF EXISTS "Enable all for authenticated users" ON comandas;

CREATE POLICY "Authenticated can view comandas" ON comandas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff manage comandas" ON comandas
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('administrador', 'gerente', 'caixa', 'garcom', 'recepcao')
    )
  );

-- comanda_items: All staff can manage
DROP POLICY IF EXISTS "Enable all for authenticated users" ON comanda_items;

CREATE POLICY "Authenticated can view items" ON comanda_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff manage items" ON comanda_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('administrador', 'gerente', 'caixa', 'garcom', 'recepcao')
    )
  );

-- room_occupancies: All staff can manage
DROP POLICY IF EXISTS "Enable all for authenticated users" ON room_occupancies;

CREATE POLICY "Authenticated can view occupancies" ON room_occupancies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff manage occupancies" ON room_occupancies
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('administrador', 'gerente', 'caixa', 'recepcao')
    )
  );

-- reservations: All staff can manage
DROP POLICY IF EXISTS "Enable all for authenticated users" ON reservations;

CREATE POLICY "Authenticated can view reservations" ON reservations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff manage reservations" ON reservations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('administrador', 'gerente', 'caixa', 'recepcao')
    )
  );

-- stock_movements: Authenticated users can read, admins/managers can manage
DROP POLICY IF EXISTS "Enable all for authenticated users" ON stock_movements;

CREATE POLICY "Authenticated can view stock" ON stock_movements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins managers manage stock" ON stock_movements
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('administrador', 'gerente')
    )
  );

-- financial_accounts: Authenticated users can read, admins/managers can manage
DROP POLICY IF EXISTS "Enable all for authenticated users" ON financial_accounts;

CREATE POLICY "Authenticated can view financial" ON financial_accounts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins managers manage financial" ON financial_accounts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('administrador', 'gerente')
    )
  );

-- daily_sales: Authenticated users can read, admins/managers can manage
DROP POLICY IF EXISTS "Enable all for authenticated users" ON daily_sales;

CREATE POLICY "Authenticated can view sales" ON daily_sales
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins managers manage sales" ON daily_sales
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('administrador', 'gerente')
    )
  );

-- product_sales: Authenticated users can read, admins/managers can manage
DROP POLICY IF EXISTS "Enable all for authenticated users" ON product_sales;

CREATE POLICY "Authenticated can view product sales" ON product_sales
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins managers manage product sales" ON product_sales
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('administrador', 'gerente')
    )
  );

-- audit_logs: Only admins can view, no one can modify
DROP POLICY IF EXISTS "Enable all for authenticated users" ON audit_logs;

CREATE POLICY "Admins view audit logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'administrador'
    )
  );

-- No INSERT/UPDATE/DELETE policies for audit_logs - only triggers can write

-- establishment_settings: All authenticated can view, admins can manage
DROP POLICY IF EXISTS "Enable all for all users" ON establishment_settings;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON establishment_settings;

CREATE POLICY "Authenticated can view settings" ON establishment_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage settings" ON establishment_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'administrador'
    )
  );
