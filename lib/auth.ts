// Slice 1 auth: magic-link + session cookie stub. No secrets in repo.
import { randomBytes } from "crypto";
export function newToken() { return randomBytes(32).toString("hex"); }
export function sessionCookie(sessionId: string) {
  return `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`;
}
export function scopeByCompany<T extends { company_id: string }>(rows: T[], company_id: string): T[] {
  return rows.filter(r => r.company_id === company_id);
}
