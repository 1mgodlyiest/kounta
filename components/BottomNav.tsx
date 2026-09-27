export default function BottomNav({ active }: { active: string }) {
  const link = (href: string, label: string, key: string) => (
    <a href={href} data-testid={`nav-${key}`} aria-current={active === key ? "page" : undefined}
      style={{ padding: "16px 12px", fontSize: 17, minHeight: 48 }}>{label}</a>
  );
  return (
    <nav data-testid="bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-around", background: "#fff", borderTop: "1px solid #ddd" }}>
      {link("/today", "Today", "today")}
      {link("/quotes", "Quotes", "quotes")}
    </nav>
  );
}
