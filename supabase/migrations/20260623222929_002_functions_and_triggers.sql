-- Function to decrement stock when selling a product
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET stock = stock - p_quantity,
      updated_at = NOW()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to log changes to audit_logs
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (action, entity_type, entity_id, old_data, new_data, created_at)
  VALUES (
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    NOW()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for key tables
DROP TRIGGER IF EXISTS products_audit ON products;
CREATE TRIGGER products_audit
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION log_audit();

DROP TRIGGER IF EXISTS comandas_audit ON comandas;
CREATE TRIGGER comandas_audit
AFTER INSERT OR UPDATE OR DELETE ON comandas
FOR EACH ROW EXECUTE FUNCTION log_audit();

DROP TRIGGER IF EXISTS room_occupancies_audit ON room_occupancies;
CREATE TRIGGER room_occupancies_audit
AFTER INSERT OR UPDATE OR DELETE ON room_occupancies
FOR EACH ROW EXECUTE FUNCTION log_audit();

DROP TRIGGER IF EXISTS cash_shifts_audit ON cash_shifts;
CREATE TRIGGER cash_shifts_audit
AFTER INSERT OR UPDATE OR DELETE ON cash_shifts
FOR EACH ROW EXECUTE FUNCTION log_audit();

DROP TRIGGER IF EXISTS financial_accounts_audit ON financial_accounts;
CREATE TRIGGER financial_accounts_audit
AFTER INSERT OR UPDATE OR DELETE ON financial_accounts
FOR EACH ROW EXECUTE FUNCTION log_audit();