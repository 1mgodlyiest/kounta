"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PROVINCES, taxFor, type Province } from "@/lib/taxes";
import { convertQuoteToOrder, generateInvoice } from "@/lib/api";

export default function NewQuotePage() {
  const [subtotal, setSubtotal] = useState("1000");
  const [province, setProvince] = useState<Province>("ON");
  const [action, setAction] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const num = Number(subtotal) || 0;
  const tax = useMemo(() => taxFor(num, province), [num, province]);
  const quoteId = "Q-mock-1";

  async function run(fn: () => Promise<{ orderId?: string; invoiceId?: string }>, label: string) {
    setAction("loading");
    setError(null);
    setResult(null);
    try {
      const out = await fn();
      setResult(`${label} OK: ${out.orderId ?? out.invoiceId}`);
      setAction("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : `${label} failed.`);
      setAction("error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">New Quote</h1>
      <Card>
        <form className="flex flex-col gap-3" aria-label="Quote form" onSubmit={(e) => e.preventDefault()}>
          <label className="text-sm font-medium" htmlFor="subtotal">Subtotal ($)
            <Input id="subtotal" inputMode="decimal" value={subtotal} onChange={(e) => setSubtotal(e.target.value)} />
          </label>
          <label className="text-sm font-medium" htmlFor="prov">Province
            <select id="prov" className="mt-1 flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm" value={province} onChange={(e) => setProvince(e.target.value as Province)}>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <div aria-live="polite" className="rounded-md bg-muted p-3 text-sm">
            {tax.lines.map((l) => (
              <p key={l.label}>{l.label}: ${l.amount.toFixed(2)}</p>
            ))}
            <p className="font-semibold">Total: ${tax.total.toFixed(2)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={action === "loading"} onClick={() => run(() => convertQuoteToOrder(quoteId), "Convert to Order")}>
              {action === "loading" ? "Working…" : "Convert to Order"}
            </Button>
            <Button type="button" variant="secondary" disabled={action === "loading"} onClick={() => run(() => generateInvoice("ORD-mock-1001"), "Generate Invoice")}>
              Generate Invoice
            </Button>
          </div>
          {action === "error" && error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {action === "success" && result && <p role="status" className="text-sm">{result}</p>}
        </form>
      </Card>
      <Link href="/quotes" className="text-sm underline">Back to quotes</Link>
    </div>
  );
}
