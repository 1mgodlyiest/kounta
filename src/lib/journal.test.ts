import { describe, expect, it } from "vitest";
import { assertBalancedJournal, postJournalEntry } from "@/src/lib/journal";

const balanced = {
  tenantId: "t1",
  lines: [
    { accountCode: "1000", debitCents: 1000, creditCents: 0 },
    { accountCode: "4000", debitCents: 0, creditCents: 1000 },
  ],
};

describe("journal balance", () => {
  it("accepts balanced entry", () => {
    expect(assertBalancedJournal(balanced)).toEqual({ totalDebit: 1000, totalCredit: 1000 });
  });
  it("rejects unbalanced by 1 cent (rollback signal)", () => {
    expect(() =>
      assertBalancedJournal({
        tenantId: "t1",
        lines: [
          { accountCode: "1000", debitCents: 1000, creditCents: 0 },
          { accountCode: "4000", debitCents: 0, creditCents: 999 },
        ],
      }),
    ).toThrow(/unbalanced/);
  });
  it("rejects debit+credit on one line and empty lines", () => {
    expect(() =>
      assertBalancedJournal({ tenantId: "t1", lines: [{ accountCode: "1000", debitCents: 5, creditCents: 5 }] }),
    ).toThrow();
    expect(() => assertBalancedJournal({ tenantId: "t1", lines: [] })).toThrow();
  });
  it("postJournalEntry mints txn id", () => {
    expect(postJournalEntry(balanced).txnId).toMatch(/-/);
  });
});
