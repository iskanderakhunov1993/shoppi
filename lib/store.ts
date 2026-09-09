import { randomUUID } from "crypto";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  verified: boolean;
  verificationToken: string | null;
};

export type Creator = {
  id: string;
  userId: string;
  slug: string;
  displayName: string;
  bio?: string;
};

export type Link = {
  id: string;
  creatorId: string;
  title: string;
  imageUrl?: string;
  price?: number;
  category: "cosmetics" | "mens" | "clothing";
  targetUrl: string;
  createdAt: string;
};

export type Click = {
  id: string;
  linkId: string;
  clickedAt: string;
  referrer?: string;
  userAgent?: string;
};

// In-memory MVP store. Not persisted across process restarts — swap for
// a real database behind this same module's exported functions later.
const users = new Map<string, User>();
const usersByEmail = new Map<string, string>();
const creators = new Map<string, Creator>();
const creatorsByUserId = new Map<string, string>();
const creatorsBySlug = new Map<string, string>();
const links = new Map<string, Link>();
const clicks: Click[] = [];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function createUser(email: string, passwordHash: string) {
  if (usersByEmail.has(email)) {
    throw new Error("Email already registered");
  }
  const id = randomUUID();
  const verificationToken = randomUUID();
  const user: User = { id, email, passwordHash, verified: false, verificationToken };
  users.set(id, user);
  usersByEmail.set(email, id);

  const baseSlug = `${slugify(email.split("@")[0])}-${id.slice(0, 6)}`;
  const creator: Creator = { id: randomUUID(), userId: id, slug: baseSlug, displayName: email.split("@")[0] };
  creators.set(creator.id, creator);
  creatorsByUserId.set(id, creator.id);
  creatorsBySlug.set(creator.slug, creator.id);

  return { user, creator };
}

export function getUserByEmail(email: string): User | undefined {
  const id = usersByEmail.get(email);
  return id ? users.get(id) : undefined;
}

export function getUserById(id: string): User | undefined {
  return users.get(id);
}

export function verifyUser(token: string): User | null {
  for (const user of users.values()) {
    if (user.verificationToken === token) {
      user.verified = true;
      user.verificationToken = null;
      return user;
    }
  }
  return null;
}

export function getCreatorByUserId(userId: string): Creator | undefined {
  const id = creatorsByUserId.get(userId);
  return id ? creators.get(id) : undefined;
}

export function getCreatorBySlug(slug: string): Creator | undefined {
  const id = creatorsBySlug.get(slug);
  return id ? creators.get(id) : undefined;
}

export function addLink(input: Omit<Link, "id" | "createdAt">): Link {
  const link: Link = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
  links.set(link.id, link);
  return link;
}

export function getLink(id: string): Link | undefined {
  return links.get(id);
}

export function listLinksByCreator(creatorId: string): Link[] {
  return [...links.values()]
    .filter((l) => l.creatorId === creatorId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function recordClick(linkId: string, referrer?: string, userAgent?: string): Click {
  const click: Click = { id: randomUUID(), linkId, clickedAt: new Date().toISOString(), referrer, userAgent };
  clicks.push(click);
  return click;
}

export function countClicksForLink(linkId: string): number {
  return clicks.filter((c) => c.linkId === linkId).length;
}

// Test-only: clears all in-memory state between test runs.
export function __resetStoreForTests() {
  users.clear();
  usersByEmail.clear();
  creators.clear();
  creatorsByUserId.clear();
  creatorsBySlug.clear();
  links.clear();
  clicks.length = 0;
}
