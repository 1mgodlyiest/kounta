"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function SignupPage() {
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
      // TODO: replace with better-auth signUp.email()
      await new Promise((r) => setTimeout(r, 400));
      if (password.length < 8) throw new Error("Password must be at least 8 characters.");
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <Card>
        <form onSubmit={onSubmit} className="flex flex-col gap-3" aria-label="Signup form">
          <label className="text-sm font-medium" htmlFor="email">Email
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="text-sm font-medium" htmlFor="password">Password
            <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading}>{loading ? "Creating…" : "Sign up"}</Button>
        </form>
      </Card>
      <p className="text-sm text-muted-foreground">Have an account? <a className="underline" href="/login">Log in</a></p>
    </main>
  );
}
