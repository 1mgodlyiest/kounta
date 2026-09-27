"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // TODO: replace with better-auth signIn.email()
      await new Promise((r) => setTimeout(r, 400));
      if (!email.includes("@")) throw new Error("Enter a valid email.");
      router.push("/what-to-do");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Log in to Kounta</h1>
      <Card>
        <form onSubmit={onSubmit} className="flex flex-col gap-3" aria-label="Login form">
          <label className="text-sm font-medium" htmlFor="email">Email
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="text-sm font-medium" htmlFor="password">Password
            <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading}>{loading ? "Signing in…" : "Log in"}</Button>
        </form>
      </Card>
      <p className="text-sm text-muted-foreground">No account? <a className="underline" href="/signup">Sign up</a></p>
    </main>
  );
}
