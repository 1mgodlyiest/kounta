import BottomNav from "../../components/BottomNav";
import QuoteCard from "../../components/QuoteCard";
export default function PipelinePage() {
  return (
    <main style={{ padding: 16, paddingBottom: 80 }}>
      <h1>Pipeline</h1>
      <div data-testid="pipeline-lanes">
        {["draft", "sent", "won"].map((s) => (
          <section key={s} data-testid={`lane-${s}`}>
            <h2>{s}</h2>
            <QuoteCard id={`${s}-1`} totalCents={10000} status={s} />
          </section>
        ))}
      </div>
      <BottomNav active="pipeline" />
    </main>
  );
}
