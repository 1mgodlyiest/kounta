"""Kounta balanced ledger writer (T1/T2).

Builds debit=credit entry pairs in integer cents; rejects penny-off and
unbalanced batches in Python BEFORE hitting the DB, where the deferred
003_sales.sql trigger re-checks at COMMIT. Returns (sql, params) rows the
caller executes inside one transaction with SET LOCAL app.current_business_id.
"""

import uuid


def balanced_entries(business_id, legs):
    """legs: [(side, amount_cents), ...]. Returns validated leg list.

    Raises ValueError on: empty batch, bad side, non-positive cents,
    or debit total != credit total (incl. 1-cent-off).
    """
    if not legs:
        raise ValueError("empty ledger batch")
    debit = sum(a for s, a in legs if s == "debit")
    credit = sum(a for s, a in legs if s == "credit")
    for side, amount in legs:
        if side not in ("debit", "credit"):
            raise ValueError(f"bad side: {side!r}")
        if amount <= 0:
            raise ValueError(f"non-positive cents: {amount!r}")
    if debit != credit:
        raise ValueError(f"unbalanced: debit={debit} credit={credit}")
    txn_id = str(uuid.uuid4())
    return [(txn_id, business_id, side, amount) for side, amount in legs]


LEDGER_INSERT_SQL = (
    "INSERT INTO ledger_entries (txn_id, business_id, side, amount_cents)"
    " VALUES (%s, %s, %s, %s)"
)


def sale_legs(business_id, total_cents, tax_cents):
    """Standard sale: debit receivables total, credit revenue subtotal + tax."""
    subtotal = total_cents - tax_cents
    if subtotal < 0:
        raise ValueError("tax exceeds total")
    return balanced_entries(business_id, [
        ("debit", total_cents),
        ("credit", subtotal),
        ("credit", tax_cents),
    ]) if tax_cents else balanced_entries(business_id, [
        ("debit", total_cents),
        ("credit", total_cents),
    ])
