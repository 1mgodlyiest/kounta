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

-- Atomic reservation guard (oversell fix): locks the inventory row, then
-- refuses the reservation when free stock (on hand minus other reservations)
-- is short. Callers MUST reserve through this proc, not raw INSERTs.
CREATE OR REPLACE FUNCTION reserve_stock(
  p_business_id uuid, p_order_id uuid, p_item_id uuid, p_qty integer
) RETURNS void LANGUAGE plpgsql AS
$$
DECLARE
  on_hand   integer;
  held      integer;
BEGIN
  IF p_qty <= 0 THEN
    RAISE EXCEPTION 'reserve qty must be > 0' USING ERRCODE = 'check_violation';
  END IF;
  SELECT qty INTO on_hand FROM inventory_levels
   WHERE business_id = p_business_id AND item_id = p_item_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'no inventory row for item %', p_item_id USING ERRCODE = 'foreign_key_violation';
  END IF;
  SELECT COALESCE(SUM(qty), 0) INTO held FROM reservations
   WHERE business_id = p_business_id AND item_id = p_item_id
     AND order_id <> p_order_id;
  IF held + p_qty > on_hand THEN
    RAISE EXCEPTION 'oversell refused: on_hand=% held=% requested=%', on_hand, held, p_qty
      USING ERRCODE = 'check_violation';
  END IF;
  INSERT INTO reservations (business_id, order_id, item_id, qty)
  VALUES (p_business_id, p_order_id, p_item_id, p_qty)
  ON CONFLICT (business_id, order_id, item_id)
  DO UPDATE SET qty = reservations.qty + EXCLUDED.qty;
  -- Re-check after upsert against the fresh total (covers re-reserve path).
  SELECT COALESCE(SUM(qty), 0) INTO held FROM reservations
   WHERE business_id = p_business_id AND item_id = p_item_id;
  IF held > on_hand THEN
    RAISE EXCEPTION 'oversell refused: on_hand=% held=%', on_hand, held
      USING ERRCODE = 'check_violation';
  END IF;
END;
$$;

-- Ledger balance guard (T1/T2): scoped to the touched txn only.
-- Deferred constraint trigger: checked at COMMIT per touched row, so
-- multi-row balanced writes pass, unbalanced/1-cent-off txns fail, and
-- pre-existing (M1 seed) txns are never scanned. NOTE: if the live DB
-- still holds an unbalanced M1 seed txn, Janus must delete/rebalance it;
-- this trigger intentionally ignores rows it did not touch.
CREATE OR REPLACE FUNCTION ledger_txn_must_balance() RETURNS trigger
  LANGUAGE plpgsql AS
$$
DECLARE net integer;
BEGIN
  SELECT COALESCE(SUM(CASE WHEN side = 'debit' THEN amount_cents ELSE -amount_cents END), 0)
    INTO net FROM ledger_entries
   WHERE txn_id = NEW.txn_id AND business_id = NEW.business_id;
  IF net <> 0 THEN
    RAISE EXCEPTION 'ledger txn % does not balance (net=%)', NEW.txn_id, net USING ERRCODE = 'check_violation';
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
