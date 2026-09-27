import { cn } from "@/lib/ui";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium", className)}>
      {children}
    </span>
  );
}
