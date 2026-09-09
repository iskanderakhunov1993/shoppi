import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, derivedHex] = storedHash.split(":");
  if (!salt || !derivedHex) return false;
  const derived = scryptSync(password, salt, 64);
  const stored = Buffer.from(derivedHex, "hex");
  if (derived.length !== stored.length) return false;
  return timingSafeEqual(derived, stored);
}

// In-memory session store: token -> userId. Swap for a signed cookie or
// real session table when the app moves past the in-memory MVP store.
const sessions = new Map<string, string>();

export function createSession(userId: string): string {
  const token = randomUUID();
  sessions.set(token, userId);
  return token;
}

export function getUserIdForSession(token: string | undefined): string | null {
  if (!token) return null;
  return sessions.get(token) ?? null;
}

export function destroySession(token: string | undefined) {
  if (token) sessions.delete(token);
}

export const SESSION_COOKIE = "session";
