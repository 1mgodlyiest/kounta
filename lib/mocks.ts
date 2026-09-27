export type Task = {
  id: string;
  title: string;
  detail: string;
  severity: "critical" | "warning" | "info";
  link: string;
};

// Mock tasks for UI verification. TODO: delete once GET /api/tasks is live.
export const MOCK_TASKS: Task[] = [
  { id: "t1", title: "3 invoices overdue", detail: "$4,210 outstanding over 30 days", severity: "critical", link: "/financials" },
  { id: "t2", title: "Low stock: 5 SKUs below reorder", detail: "Inventory needs purchase orders", severity: "warning", link: "/inventory" },
  { id: "t3", title: "2 quotes expiring this week", detail: "Follow up before Friday", severity: "warning", link: "/quotes" },
  { id: "t4", title: "Shipment arriving tomorrow", detail: "PO-1042 · 120 units", severity: "info", link: "/logistics" },
];

export const MOCK_SESSION = { shopName: "Demo Shop", province: "ON", taskCount: 4 };
