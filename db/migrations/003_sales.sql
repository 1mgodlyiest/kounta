-- Kounta M2: sales support — order lines, stock reservation, ledger balance guard.
-- Requires Janus to apply (app cannot CREATE). All tenant rows carry business_id.

-- Order lines: the thing being sold, reserved, taxed.
CREATE TABLE IF NOT EXISTS order_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  order_id         uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id          uuid NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
  qty              integer NOT NULL CHECK (qty > 0),
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0),
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_items_business_id_idx ON order_items (business_id);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (business_id, order_id);

-- Reservation: stock held for open/reserved orders; released on ship/cancel.
CREATE TABLE IF NOT EXISTS reservations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  order_id    uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id     uuid NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
  qty         integer NOT NULL CHECK (qty > 0),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, order_id, item_id)
);
CREATE INDEX IF NOT EXISTS reservations_business_id_idx ON reservations (business_id);
CREATE INDEX IF NOT EXISTS reservations_item_idx ON reservations (business_id, item_id);

-- Ledger balance guard (T1/T2): every txn must net to zero per business.
-- Deferred constraint trigger: checked at COMMIT, so multi-row balanced writes pass,
-- unbalanced or 1-cent-off txns fail the commit.
CREATE OR REPLACE FUNCTION ledger_txn_must_balance() RETURNS trigger
  LANGUAGE plpgsql AS
$$
DECLARE bad uuid;
BEGIN
  SELECT t.txn_id INTO bad FROM (
    SELECT txn_id, business_id,
           SUM(CASE WHEN side = 'debit' THEN amount_cents ELSE -amount_cents END) AS net
      FROM ledger_entries
     WHERE (pg_trigger_depth() = 0 OR true)
     GROUP BY txn_id, business_id
  ) t WHERE t.net <> 0 LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'ledger txn % does not balance', bad USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS ledger_balance_check ON ledger_entries;
CREATE CONSTRAINT TRIGGER ledger_balance_check
  AFTER INSERT OR UPDATE ON ledger_entries
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION ledger_txn_must_balance();

-- RLS on new tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['order_items','reservations'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_tenant_isolation', t);
    EXECUTE format('CREATE POLICY %I ON %I USING (business_id = current_business_id()) WITH CHECK (business_id = current_business_id())', t || '_tenant_isolation', t);
  END LOOP;
END $$;
