"""Kounta perpetual inventory domain logic (M3).

Pure functions mirroring 004_inventory.sql so T3 expectations (sell drops
qty, reorder alert fires, avg cost correct) are unit-testable without a DB
driver. Integer cents, no floats.
"""


def receive(cur_qty, cur_avg_cents, qty, unit_cost_cents):
    """Moving-average receipt. Returns (new_qty, new_avg_cents)."""
    if qty <= 0 or unit_cost_cents < 0:
        raise ValueError("bad receipt qty/cost")
    if cur_qty < 0 or cur_avg_cents < 0:
        raise ValueError("bad current level")
    new_qty = cur_qty + qty
    new_avg = (cur_qty * cur_avg_cents + qty * unit_cost_cents) // new_qty
    return new_qty, new_avg


def issue(cur_qty, qty):
    """Perpetual decrement. Returns new qty; refuses oversell."""
    if qty <= 0:
        raise ValueError("issue qty must be > 0")
    if qty > cur_qty:
        raise ValueError(f"insufficient stock: on_hand={cur_qty} requested={qty}")
    return cur_qty - qty


def needs_reorder(qty, reorder_point):
    """Alert fires at or below the reorder point."""
    if reorder_point < 0:
        raise ValueError("negative reorder point")
    return qty <= reorder_point
