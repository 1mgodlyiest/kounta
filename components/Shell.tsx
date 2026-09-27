"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/ui";
import { MOCK_SESSION } from "@/lib/mocks";

const NAV = [
  { href: "/what-to-do", label: "What-To-Do" },
  { href: "/orders", label: "Orders" },
  { href: "/quotes", label: "Quotes" },
  { href: "/inventory", label: "Inventory" },
  { href: "/logistics", label: "Logistics" },
  { href: "/financials", label: "Financials" },
  { href: "/settings", label: "Settings" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-2 focus:bg-background">Skip to content</a>
      <nav aria-label="Primary" className="hidden w-52 shrink-0 flex-col gap-1 border-r border-border p-4 sm:flex">
        <p className="mb-2 text-lg font-bold">Kounta</p>
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            aria-current={pathname === n.href || pathname?.startsWith(n.href + "/") ? "page" : undefined}
            className={cn("rounded-md px-3 py-2 text-sm hover:bg-muted", (pathname === n.href || pathname?.startsWith(n.href + "/")) && "bg-muted font-medium")}
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 border-b border-border p-4">
          <nav aria-label="Primary mobile" className="flex gap-1 overflow-x-auto sm:hidden">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={cn("whitespace-nowrap rounded-md px-2 py-1 text-xs hover:bg-muted", pathname === n.href && "bg-muted font-medium")}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Badge aria-label={`Province ${MOCK_SESSION.province}`}>{MOCK_SESSION.province}</Badge>
            <Badge aria-label={`${MOCK_SESSION.taskCount} open tasks`}>Tasks: {MOCK_SESSION.taskCount}</Badge>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-3xl flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
