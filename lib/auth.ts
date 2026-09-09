import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import { createSessionRow, deleteSessionRow, getSessionUserId } from "./store.ts";

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

// Sessions live in the database so a server restart no longer signs
// everyone out.
export function createSession(userId: string): string {
  const token = randomUUID();
  createSessionRow(token, userId);
  return token;
}

export function getUserIdForSession(token: string | undefined): string | null {
  if (!token) return null;
  return getSessionUserId(token);
}

export function destroySession(token: string | undefined) {
  if (token) deleteSessionRow(token);
}

export const SESSION_COOKIE = "session";

/**
 * Stable, non-reversible visitor fingerprint for click de-duplication.
 * The raw IP is never stored — under 152-ФЗ it counts as personal data,
 * and we only ever need equality, not the address itself.
 */
export function visitorFingerprint(ip: string, userAgent: string): string {
  const salt = process.env.CLICK_SALT ?? "shoppi-dev-salt";
  return createHash("sha256").update(`${salt}:${ip}:${userAgent}`).digest("hex").slice(0, 32);
}
