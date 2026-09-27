import BottomNav from "../../components/BottomNav";
export default function TodayPage() {
  return (
    <main style={{ padding: 16, paddingBottom: 80 }}>
      <h1>Today</h1>
      <p data-testid="today-greeting">Jobs due today, big tap targets.</p>
      <a data-testid="cta-new-quote" href="/quotes" style={{ display: "block", padding: 16, fontSize: 18 }}>New Quote</a>
      <BottomNav active="today" />
    </main>
  );
}
