import { randomUUID } from "crypto";
import { sql } from "./db.ts";

export type Feedback = {
  id: string;
  createdAt: string;
  userId?: string;
  email?: string;
  page?: string;
  message: string;
  userAgent?: string;
  status: "new" | "triaged";
  issueUrl?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validates widget input; returns an error message for the user, or null. */
export function validateFeedback(input: { message?: unknown; email?: unknown }): string | null {
  const message = typeof input.message === "string" ? input.message.trim() : "";
  if (message.length < 5) return "Опишите проблему хотя бы парой слов.";
  if (message.length > 2000) return "Слишком длинно: до 2000 символов.";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  if (email && !EMAIL_RE.test(email)) return "Проверьте email или оставьте поле пустым.";
  return null;
}

export async function addFeedback(f: { userId?: string; email?: string; page?: string; message: string; userAgent?: string }) {
  await sql`
    INSERT INTO feedback (id, user_id, email, page, message, user_agent)
    VALUES (${randomUUID()}, ${f.userId ?? null}, ${f.email || null}, ${f.page?.slice(0, 300) ?? null},
            ${f.message.trim()}, ${f.userAgent?.slice(0, 300) ?? null})
  `;
}

export async function listNewFeedback(limit = 50): Promise<Feedback[]> {
  const rows = await sql`SELECT * FROM feedback WHERE status = 'new' ORDER BY created_at LIMIT ${limit}`;
  return rows.map((r) => ({
    id: String(r.id),
    createdAt: new Date(r.created_at as string).toISOString(),
    userId: (r.user_id as string) ?? undefined,
    email: (r.email as string) ?? undefined,
    page: (r.page as string) ?? undefined,
    message: String(r.message),
    userAgent: (r.user_agent as string) ?? undefined,
    status: "new",
  }));
}

export async function markFeedbackTriaged(id: string, issueUrl?: string) {
  await sql`UPDATE feedback SET status = 'triaged', issue_url = ${issueUrl ?? null} WHERE id = ${id}`;
}
