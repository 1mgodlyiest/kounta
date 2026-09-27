import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function QuotesPage() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-bold">Quotes</h1>
      <Card><p className="text-sm text-muted-foreground">No quotes yet — create your first one.</p></Card>
      <Link href="/quotes/new" className="text-sm underline">New quote →</Link>
    </div>
  );
}
