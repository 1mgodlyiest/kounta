import { NextResponse } from "next/server";
// Stub: record payments against invoices. Full handler in Phase 2.
export async function GET() {
  return NextResponse.json({ data: [], stub: true });
}
export async function POST() {
  return NextResponse.json({ error: "not implemented" }, { status: 501 });
}
