"use client";
// Frontend API client. TODO: wire to real endpoints (better-auth session,
// Lin's DB/auth on `ada/lin-foundation`). Uses mock fallback when fetch 404s
// in dev so UI is verifiable without a backend.

import { MOCK_TASKS, type Task } from "./mocks";

async function tryFetch<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getTasks(): Promise<Task[]> {
  // TODO: GET /api/tasks (expects better-auth session cookie)
  const live = await tryFetch<Task[]>("/api/tasks");
  const tasks = live ?? MOCK_TASKS;
  const rank = (s: string) => ({ critical: 0, warning: 1, info: 2 }[s] ?? 3);
  return [...tasks].sort((a, b) => rank(a.severity) - rank(b.severity));
}

export async function createShop(input: { name: string; province: string }): Promise<{ id: string }> {
  // TODO: POST /api/tenants
  const live = await tryFetch<{ id: string }>("/api/tenants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (live) return live;
  await new Promise((r) => setTimeout(r, 400)); // mock latency
  return { id: "mock-shop-1" };
}

export async function convertQuoteToOrder(quoteId: string): Promise<{ orderId: string }> {
  // TODO: POST /api/quotes/:id/convert
  const live = await tryFetch<{ orderId: string }>(`/api/quotes/${quoteId}/convert`, { method: "POST" });
  if (live) return live;
  await new Promise((r) => setTimeout(r, 500));
  return { orderId: "ORD-mock-1001" };
}

export async function generateInvoice(orderId: string): Promise<{ invoiceId: string }> {
  // TODO: POST /api/orders/:id/invoice
  const live = await tryFetch<{ invoiceId: string }>(`/api/orders/${orderId}/invoice`, { method: "POST" });
  if (live) return live;
  await new Promise((r) => setTimeout(r, 500));
  return { invoiceId: "INV-mock-2001" };
}
