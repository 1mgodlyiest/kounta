"""Kounta sales flow: quote -> order -> ship -> invoice -> pay.

Pure domain logic (no DB driver): validates state transitions, computes
totals/tax in integer cents, checks stock availability including reservations.
DB writes are parameterized SQL in sql_* helpers, executed by the caller.
Every row written carries business_id. Money: integer cents only.
"""

QUOTE_FLOW = ("draft", "sent", "accepted", "expired")
ORDER_FLOW = ("open", "reserved", "shipped", "cancelled")
SHIP_FLOW = ("pending", "shipped", "delivered")
INVOICE_FLOW = ("unpaid", "paid", "overdue")

# 2026 combined rates in basis points, used when the taxes table has no row.
# Values are placeholders the caller overrides with taxes-table rows.
FALLBACK_TAX_BPS = {"ON": 1300, "QC": 1498, "BC": 1200, "AB": 500}


def _check_flow(value, allowed, name):
    if value not in allowed:
        raise ValueError(f"bad {name} status: {value!r}")
    return value


def quote_total(lines):
    """lines: iterable of (qty, unit_price_cents). Returns subtotal cents."""
    total = 0
    for qty, price in lines:
        if qty <= 0 or price < 0:
            raise ValueError("qty must be > 0 and price >= 0")
        total += qty * price
    return total


def tax_for(subtotal_cents, province, rate_bps):
    """Integer-cent tax, truncated (floor). No floats anywhere."""
    if subtotal_cents < 0 or rate_bps < 0:
        raise ValueError("negative subtotal/rate")
    return (subtotal_cents * rate_bps) // 10_000


def transition_quote(status, to):
    _check_flow(status, QUOTE_FLOW, "quote")
    _check_flow(to, QUOTE_FLOW, "quote")
    allowed = {
        "draft": ("sent",),
        "sent": ("accepted", "expired"),
    }
    if to not in allowed.get(status, ()):
        raise ValueError(f"quote cannot move {status!r} -> {to!r}")
    return to


def transition_order(status, to):
    _check_flow(status, ORDER_FLOW, "order")
    _check_flow(to, ORDER_FLOW, "order")
    allowed = {
        "open": ("reserved", "cancelled"),
        "reserved": ("shipped", "cancelled"),
    }
    if to not in allowed.get(status, ()):
        raise ValueError(f"order cannot move {status!r} -> {to!r}")
    return to


def available_qty(on_hand, reserved):
    return on_hand - reserved


def check_reservation(on_hand, already_reserved, requested):
    """Double-sell guard: raise if requested exceeds free stock."""
    if requested <= 0:
        raise ValueError("requested qty must be > 0")
    free = available_qty(on_hand, already_reserved)
    if requested > free:
        raise ValueError(f"insufficient stock: free={free} requested={requested}")
    return True


def invoice_total(subtotal_cents, tax_cents):
    if subtotal_cents < 0 or tax_cents < 0:
        raise ValueError("negative invoice component")
    return subtotal_cents + tax_cents


def apply_payment(balance_cents, amount_cents):
    if amount_cents <= 0:
        raise ValueError("payment must be > 0")
    if amount_cents > balance_cents:
        raise ValueError("overpayment refused")
    return balance_cents - amount_cents
