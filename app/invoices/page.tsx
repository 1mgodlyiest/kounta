import BottomNav from "../../components/BottomNav";
export function invoiceTotalWithTax(subtotalCents: number, rateBps: number) {
  return subtotalCents + Math.round((subtotalCents * rateBps) / 10000);
}
export default function InvoicesPage() {
  const total = invoiceTotalWithTax(10000, 1300);
  return (
    <main style={{ padding: 16, paddingBottom: 80 }}>
      <h1>Invoices</h1>
      <div data-testid="invoice-total">${(total / 100).toFixed(2)}</div>
      <div data-testid="invoice-tax-note">Tax included, cents-exact</div>
      <button data-testid="invoice-pay" style={{ minHeight: 48, minWidth: 48, fontSize: 17 }}>Mark paid</button>
      <BottomNav active="invoices" />
    </main>
  );
}
