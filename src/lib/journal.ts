export interface JournalLineInput {
  accountCode: string;
  debitCents: number;
  creditCents: number;
  memo?: string;
}

export interface JournalEntryInput {
  tenantId: string;
  memo?: string;
  lines: JournalLineInput[];
}

function assertCents(n: number, field: string) {
  if (!Number.isInteger(n) || n < 0) throw new Error(`${field} must be a non-negative integer`);
}

/**
 * Validate a balanced double-entry journal. Throws (caller rolls back)
 * unless sum(debits) == sum(credits) > 0 and every line is debit-xor-credit.
 * Pure function so vitest covers it without a DB; the SQL trigger in
 * drizzle/0001_foundation.sql enforces the same invariant per txn at COMMIT.
 */
export function assertBalancedJournal(entry: JournalEntryInput): {
  totalDebit: number;
  totalCredit: number;
} {
  if (!entry.tenantId) throw new Error("tenantId required");
  if (!entry.lines || entry.lines.length < 2) throw new Error("journal needs >= 2 lines");
  let totalDebit = 0;
  let totalCredit = 0;
  for (const l of entry.lines) {
    if (!l.accountCode) throw new Error("accountCode required");
    assertCents(l.debitCents, "debitCents");
    assertCents(l.creditCents, "creditCents");
    if ((l.debitCents > 0 && l.creditCents > 0) || (l.debitCents === 0 && l.creditCents === 0))
      throw new Error(`line ${l.accountCode}: exactly one of debit/credit must be > 0`);
    totalDebit += l.debitCents;
    totalCredit += l.creditCents;
  }
  if (totalDebit === 0) throw new Error("journal total must be > 0");
  if (totalDebit !== totalCredit)
    throw new Error(`unbalanced journal: debits=${totalDebit} credits=${totalCredit}`);
  return { totalDebit, totalCredit };
}

/** Shape the caller inserts inside a transaction after assertBalancedJournal passes. */
export function postJournalEntry(entry: JournalEntryInput) {
  const { totalDebit, totalCredit } = assertBalancedJournal(entry);
  const txnId = crypto.randomUUID();
  return { txnId, tenantId: entry.tenantId, memo: entry.memo ?? null, totalDebit, totalCredit, lines: entry.lines };
}
