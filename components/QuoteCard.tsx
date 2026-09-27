export function formatCents(cents: number) { return `$${(cents / 100).toFixed(2)}`; }
export default function QuoteCard({ id, totalCents, status }: { id: string; totalCents: number; status: string }) {
  return (
    <article data-testid={`quote-card-${id}`} style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12, marginBottom: 12 }}>
      <div data-testid="quote-total" style={{ fontSize: 20, fontWeight: 700 }}>{formatCents(totalCents)}</div>
      <div data-testid="quote-status">{status}</div>
      <button data-testid="quote-open" style={{ minHeight: 48, minWidth: 48, fontSize: 17 }}>Open</button>
    </article>
  );
}
