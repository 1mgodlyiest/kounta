import QuoteCard from "../../components/QuoteCard";
import BottomNav from "../../components/BottomNav";
export default function QuotesPage() {
  const quotes = [{ id: "q1", total_cents: 12345, status: "draft" }];
  return (
    <main style={{ padding: 16, paddingBottom: 80 }}>
      <h1>Quotes</h1>
      {quotes.map(q => <QuoteCard key={q.id} id={q.id} totalCents={q.total_cents} status={q.status} />)}
      <BottomNav active="quotes" />
    </main>
  );
}
