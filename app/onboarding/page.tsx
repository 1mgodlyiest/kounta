"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PROVINCES, type Province } from "@/lib/taxes";
import { createShop } from "@/lib/api";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [province, setProvince] = useState<Province>("ON");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      await createShop({ name, province }); // TODO: POST /api/tenants
      setStatus("success");
      router.push("/what-to-do");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not create shop.");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Create your shop</h1>
      <Card>
        <form onSubmit={onSubmit} className="flex flex-col gap-3" aria-label="Create shop form">
          <label className="text-sm font-medium" htmlFor="shop">Shop name
            <Input id="shop" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Auto" />
          </label>
          <label className="text-sm font-medium" htmlFor="province">Province
            <select id="province" className="mt-1 flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm" value={province} onChange={(e) => setProvince(e.target.value as Province)}>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          {status === "error" && error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {status === "success" && <p role="status" className="text-sm">Shop created!</p>}
          <Button type="submit" disabled={status === "loading" || !name.trim()}>
            {status === "loading" ? "Creating…" : "Create shop"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
