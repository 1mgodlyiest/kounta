"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTasks } from "@/lib/api";
import type { Task } from "@/lib/mocks";

export default function WhatToDoPage() {
  const [status, setStatus] = useState<"loading" | "error" | "empty" | "success">("loading");
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    getTasks()
      .then((t) => {
        setTasks(t);
        setStatus(t.length === 0 ? "empty" : "success");
      })
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") return <p role="status" aria-busy="true">Loading tasks…</p>;
  if (status === "error")
    return (
      <div role="alert" className="flex flex-col gap-2">
        <p>Could not load tasks.</p>
        <button className="underline" onClick={() => location.reload()}>Retry</button>
      </div>
    );
  if (status === "empty") return <p role="status">All clear — nothing needs attention.</p>;

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-bold">What-To-Do</h1>
      <ul className="flex flex-col gap-2" aria-label="Tasks ordered by severity">
        {tasks.map((t) => (
          <li key={t.id}>
            <Card>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>{t.title}</CardTitle>
                <Badge>{t.severity}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t.detail}</p>
              <Link href={t.link} className="mt-2 inline-block text-sm underline">Open →</Link>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
