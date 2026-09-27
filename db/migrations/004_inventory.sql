-- Kounta M3: perpetual inventory — receive/issue procs, moving-average cost, reorder alerts.
-- Requires Janus to apply (app cannot CREATE). All logic locks the inventory row.

-- Receive: moving-average cost. Creates the level row on first receipt.
CREATE OR REPLACE FUNCTION receive_stock(
  p_business_id uuid, p_item_id uuid, p_qty integer, p_unit_cost_cents integer
) RETURNS void LANGUAGE plpgsql AS
$$
DECLARE
  cur_qty integer;
  cur_avg integer;
BEGIN
  IF p_qty <= 0 OR p_unit_cost_cents < 0 THEN
    RAISE EXCEPTION 'bad receipt qty=% cost=%', p_qty, p_unit_cost_cents
      USING ERRCODE = 'check_violation';
  END IF;
  SELECT qty, avg_cost_cents INTO cur_qty, cur_avg FROM inventory_levels
   WHERE business_id = p_business_id AND item_id = p_item_id
   FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO inventory_levels (business_id, item_id, qty, avg_cost_cents)
    VALUES (p_business_id, p_item_id, p_qty, p_unit_cost_cents);
  ELSE
    UPDATE inventory_levels
       SET qty = cur_qty + p_qty,
           avg_cost_cents = (cur_qty * cur_avg + p_qty * p_unit_cost_cents) / (cur_qty + p_qty)
     WHERE business_id = p_business_id AND item_id = p_item_id;
  END IF;
END;
$$;

-- Issue (sell): perpetual decrement, never below zero.
CREATE OR REPLACE FUNCTION issue_stock(
  p_business_id uuid, p_item_id uuid, p_qty integer
) RETURNS void LANGUAGE plpgsql AS
$$
DECLARE cur_qty integer;
BEGIN
  IF p_qty <= 0 THEN
    RAISE EXCEPTION 'issue qty must be > 0' USING ERRCODE = 'check_violation';
  END IF;
  SELECT qty INTO cur_qty FROM inventory_levels
   WHERE business_id = p_business_id AND item_id = p_item_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'no inventory row for item %', p_item_id USING ERRCODE = 'foreign_key_violation';
  END IF;
  IF p_qty > cur_qty THEN
    RAISE EXCEPTION 'insufficient stock: on_hand=% requested=%', cur_qty, p_qty
      USING ERRCODE = 'check_violation';
  END IF;
  UPDATE inventory_levels SET qty = cur_qty - p_qty
   WHERE business_id = p_business_id AND item_id = p_item_id;
END;
$$;

-- Reorder alerts: rows at or below their reorder point (T3 feed source).
CREATE OR REPLACE VIEW inventory_reorder_alerts AS
SELECT business_id, item_id, qty, reorder_point, avg_cost_cents
  FROM inventory_levels
 WHERE qty <= reorder_point;

-- RLS leak fix: run the view as the invoker so callers see only their own
-- business rows (default security_definer would bypass caller RLS).
ALTER VIEW inventory_reorder_alerts SET (security_invoker = true);
