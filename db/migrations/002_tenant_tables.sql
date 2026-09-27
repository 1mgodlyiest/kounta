-- Kounta M1: core tenant tables following 001_tenancy.sql pattern.
-- Every table: business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
-- RLS enabled + FORCED, tenant-isolation policy USING/WITH CHECK business_id = current_business_id().
-- Money in integer cents; qty integer.

-- Customers / vendors
CREATE TABLE IF NOT EXISTS customers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name        text NOT NULL,
  email       citext,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS vendors (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name        text NOT NULL,
  email       citext,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Items + inventory levels
CREATE TABLE IF NOT EXISTS items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  sku         text NOT NULL,
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, sku)
);
CREATE TABLE IF NOT EXISTS inventory_levels (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  item_id         uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  qty             integer NOT NULL DEFAULT 0 CHECK (qty >= 0),
  reorder_point   integer NOT NULL DEFAULT 0 CHECK (reorder_point >= 0),
  avg_cost_cents  integer NOT NULL DEFAULT 0 CHECK (avg_cost_cents >= 0),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, item_id)
);

-- Ledger: double-entry, cents only. Balance CHECK per txn enforced in job 2 writer + job 1 constraint migration.
CREATE TABLE IF NOT EXISTS ledger_entries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  txn_id       uuid NOT NULL,
  side         text NOT NULL CHECK (side IN ('debit', 'credit')),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ledger_entries_txn_idx ON ledger_entries (business_id, txn_id);

-- Sales flow: quote -> order -> shipment -> invoice -> payment
CREATE TABLE IF NOT EXISTS quotes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  status      text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','expired')),
  total_cents integer NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS orders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  quote_id    uuid REFERENCES quotes(id) ON DELETE SET NULL,
  status      text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reserved','shipped','cancelled')),
  total_cents integer NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS shipments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  order_id    uuid REFERENCES orders(id) ON DELETE SET NULL,
  tracking    text,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','shipped','delivered')),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS invoices (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  order_id    uuid REFERENCES orders(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  total_cents integer NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  tax_cents   integer NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  status      text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid','overdue')),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS payments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  invoice_id  uuid REFERENCES invoices(id) ON DELETE SET NULL,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Tax: rate map + ITC records
CREATE TABLE IF NOT EXISTS taxes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  province    text NOT NULL,
  kind        text NOT NULL CHECK (kind IN ('GST','PST','HST','QST')),
  rate_bps    integer NOT NULL CHECK (rate_bps >= 0),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, province, kind)
);
CREATE TABLE IF NOT EXISTS itc_records (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  invoice_id   uuid REFERENCES invoices(id) ON DELETE SET NULL,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Indexes on business_id for all tenant tables
CREATE INDEX IF NOT EXISTS customers_business_id_idx ON customers (business_id);
CREATE INDEX IF NOT EXISTS vendors_business_id_idx ON vendors (business_id);
CREATE INDEX IF NOT EXISTS items_business_id_idx ON items (business_id);
CREATE INDEX IF NOT EXISTS inventory_levels_business_id_idx ON inventory_levels (business_id);
CREATE INDEX IF NOT EXISTS ledger_entries_business_id_idx ON ledger_entries (business_id);
CREATE INDEX IF NOT EXISTS quotes_business_id_idx ON quotes (business_id);
CREATE INDEX IF NOT EXISTS orders_business_id_idx ON orders (business_id);
CREATE INDEX IF NOT EXISTS shipments_business_id_idx ON shipments (business_id);
CREATE INDEX IF NOT EXISTS invoices_business_id_idx ON invoices (business_id);
CREATE INDEX IF NOT EXISTS payments_business_id_idx ON payments (business_id);
CREATE INDEX IF NOT EXISTS taxes_business_id_idx ON taxes (business_id);
CREATE INDEX IF NOT EXISTS itc_records_business_id_idx ON itc_records (business_id);

-- RLS: enable + force + isolate on every tenant table
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['customers','vendors','items','inventory_levels','ledger_entries','quotes','orders','shipments','invoices','payments','taxes','itc_records'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_tenant_isolation', t);
    EXECUTE format('CREATE POLICY %I ON %I USING (business_id = current_business_id()) WITH CHECK (business_id = current_business_id())', t || '_tenant_isolation', t);
  END LOOP;
END $$;
