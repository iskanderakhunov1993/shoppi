// Client-only: remembers what a signed-out visitor tried to do, so after
// login they land back on the same page and the action completes itself.

type Pending = { kind: "follow" | "favorite"; id: string; at: number };
const KEY = "shoppi:pending-action";
const TTL_MS = 30 * 60 * 1000;

export function loginUrlFor(kind: Pending["kind"], id: string): string {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ kind, id, at: Date.now() } satisfies Pending));
  } catch {}
  const here = window.location.pathname + window.location.search;
  return `/login?next=${encodeURIComponent(here)}`;
}

/** Returns true (and clears it) when this exact action is pending. */
export function takePendingAction(kind: Pending["kind"], id: string): boolean {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return false;
    const p = JSON.parse(raw) as Pending;
    if (Date.now() - p.at > TTL_MS) {
      sessionStorage.removeItem(KEY);
      return false;
    }
    if (p.kind !== kind || p.id !== id) return false;
    sessionStorage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}

/** Only same-site relative paths are allowed as a post-login target. */
export function safeNextPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  return raw;
}
