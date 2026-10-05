// Client-only: remembers what a signed-out visitor tried to do, so after
// login — or after signup and email confirmation, possibly in another
// tab — they land back on the same page and the action completes itself.

type Pending = { kind: "follow" | "favorite"; id: string; path: string; at: number };
const KEY = "shoppi:pending-action";
// Long enough to sign up, find the confirmation email and come back.
const TTL_MS = 24 * 60 * 60 * 1000;

function read(): Pending | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Pending;
    if (Date.now() - p.at > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

export function loginUrlFor(kind: Pending["kind"], id: string): string {
  const path = window.location.pathname + window.location.search;
  try {
    localStorage.setItem(KEY, JSON.stringify({ kind, id, path, at: Date.now() } satisfies Pending));
  } catch {}
  return `/login?next=${encodeURIComponent(path)}`;
}

/** Returns true (and clears it) when this exact action is pending. */
export function takePendingAction(kind: Pending["kind"], id: string): boolean {
  const p = read();
  if (!p || p.kind !== kind || p.id !== id) return false;
  try {
    localStorage.removeItem(KEY);
  } catch {}
  return true;
}

/** Where to go after login when the URL has no ?next (e.g. after signup). */
export function pendingReturnPath(): string | null {
  return safeNextPath(read()?.path ?? null);
}

/** Only same-site relative paths are allowed as a post-login target. */
export function safeNextPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  return raw;
}
