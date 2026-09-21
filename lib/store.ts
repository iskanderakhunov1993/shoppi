import { randomUUID } from "crypto";
import { sql, nextSeq } from "./db.ts";
import type { Category } from "./categories.ts";

export type Role = "shopper" | "creator" | "brand";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  verified: boolean;
  verificationToken: string | null;
  role: Role;
  // Only set when role === "brand".
  brandDomain?: string;
  // Marketplace article ids this brand claims. Domain matching is useless
  // on marketplaces — every WB seller shares wildberries.ru — so a brand
  // is matched to links by article instead.
  brandArticles?: string[];
  // A CPA-network deep-link template, e.g. "https://ad.admitad.com/g/xxx/?ulp={url}".
  // When set, the redirect wraps the target URL in it instead of linking
  // straight to the marketplace, so the brand's network can attribute
  // the sale. Only meaningful for role === "brand".
  affiliateTemplate?: string;
  // Shopper-facing profile, used for the public wishlist page. Creators
  // have their own separate profile (see Creator) — these are only set
  // for shoppers, and lazily on first use rather than at signup, since
  // most existing accounts predate this feature.
  displayName?: string;
  avatarUrl?: string;
  slug?: string;
};

export type Creator = {
  id: string;
  userId: string;
  slug: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  instagramHandle?: string;
  tiktokHandle?: string;
  telegramHandle?: string;
  youtubeHandle?: string;
  // Optional public address for brand/collab enquiries, shown on the storefront.
  contactEmail?: string;
  // False until the creator finishes (or skips) the first-run wizard.
  onboarded: boolean;
  // What the creator says they mostly post about — set once during
  // onboarding, shown on the storefront as a light orientation cue.
  // Not a claim of expertise or a ranking signal, just a filter hint.
  categories?: Category[];
  // Lets a creator opt out of showing the "Популярное" (Most Popular)
  // auto-section publicly — same idea as ShopMy's hide toggle on it.
  hidePopular: boolean;
};

export type Link = {
  id: string;
  creatorId: string;
  title: string;
  imageUrl?: string;
  price?: number;
  category: Category;
  // Optional, creator-entered — power the secondary facet filters on
  // the storefront (e.g. "Обувь" within "Одежда", or "Alaïa"). Left
  // blank on most existing products, so filters only show values that
  // actually have at least one product behind them.
  brand?: string;
  subtype?: string;
  targetUrl: string;
  marketplace?: string;
  articleId?: string;
  // Not surfaced in any UI yet — see the note on the `promo_code` column
  // in the init migration.
  promoCode?: string;
  // Advertising marking ("Реклама"): set by the creator when the link is a
  // paid / partner placement. adInfo carries the advertiser and erid the
  // law asks to show next to the label; free text, entered by the creator.
  isAd: boolean;
  adInfo?: string;
  createdAt: string;
};

export type Click = {
  id: string;
  linkId: string;
  clickedAt: string;
  referrer?: string;
  userAgent?: string;
  isBot: boolean;
  fingerprint?: string;
};

type Row = Record<string, unknown>;

const str = (v: unknown): string => String(v);
const opt = (v: unknown): string | undefined => (v === null || v === undefined ? undefined : String(v));
const num = (v: unknown): number | undefined => (v === null || v === undefined ? undefined : Number(v));

function toUser(r: Row): User {
  return {
    id: str(r.id),
    email: str(r.email),
    passwordHash: str(r.password_hash),
    verified: Boolean(r.verified),
    verificationToken: r.verification_token === null ? null : str(r.verification_token),
    role: str(r.role) as Role,
    brandDomain: opt(r.brand_domain),
    brandArticles: r.brand_articles ? (JSON.parse(str(r.brand_articles)) as string[]) : undefined,
    affiliateTemplate: opt(r.affiliate_template),
    displayName: opt(r.display_name),
    avatarUrl: opt(r.avatar_url),
    slug: opt(r.slug),
  };
}

function toCreator(r: Row): Creator {
  return {
    id: str(r.id),
    userId: str(r.user_id),
    slug: str(r.slug),
    displayName: str(r.display_name),
    bio: opt(r.bio),
    avatarUrl: opt(r.avatar_url),
    instagramHandle: opt(r.instagram_handle),
    tiktokHandle: opt(r.tiktok_handle),
    telegramHandle: opt(r.telegram_handle),
    youtubeHandle: opt(r.youtube_handle),
    contactEmail: opt(r.contact_email),
    onboarded: Boolean(r.onboarded),
    categories: r.categories ? (JSON.parse(str(r.categories)) as Category[]) : undefined,
    hidePopular: Boolean(r.hide_popular),
  };
}

function toLink(r: Row): Link {
  return {
    id: str(r.id),
    creatorId: str(r.creator_id),
    title: str(r.title),
    imageUrl: opt(r.image_url),
    price: num(r.price),
    category: str(r.category) as Link["category"],
    brand: opt(r.brand),
    subtype: opt(r.subtype),
    targetUrl: str(r.target_url),
    marketplace: opt(r.marketplace),
    articleId: opt(r.article_id),
    promoCode: opt(r.promo_code),
    isAd: Boolean(r.is_ad),
    adInfo: opt(r.ad_info),
    createdAt: str(r.created_at),
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/* ---------------------------------------------------------------- users */

export async function createUser(
  email: string,
  passwordHash: string,
  role: Role,
  brandDomain?: string
): Promise<{ user: User; creator?: Creator }> {
  if (await getUserByEmail(email)) {
    throw new Error("Email already registered");
  }

  const id = randomUUID();
  const verificationToken = randomUUID();
  const now = new Date().toISOString();

  await sql`
    INSERT INTO users (id, email, password_hash, verified, verification_token, role, brand_domain, created_at)
    VALUES (${id}, ${email}, ${passwordHash}, false, ${verificationToken}, ${role}, ${role === "brand" ? (brandDomain ?? null) : null}, ${now})
  `;

  const user = (await getUserById(id))!;
  if (role !== "creator") return { user };

  const creatorId = randomUUID();
  const slug = `${slugify(email.split("@")[0])}-${id.slice(0, 6)}`;
  const initialName = email.split("@")[0];
  await sql`
    INSERT INTO creators (id, user_id, slug, display_name, display_name_lower, created_at)
    VALUES (${creatorId}, ${id}, ${slug}, ${initialName}, ${initialName.toLowerCase()}, ${now})
  `;

  return { user, creator: (await getCreatorById(creatorId))! };
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
  return rows[0] ? toUser(rows[0]) : undefined;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const rows = await sql`SELECT * FROM users WHERE id = ${id}`;
  return rows[0] ? toUser(rows[0]) : undefined;
}

export async function verifyUser(token: string): Promise<User | null> {
  const rows = await sql`SELECT * FROM users WHERE verification_token = ${token}`;
  if (!rows[0]) return null;
  const id = str(rows[0].id);
  await sql`UPDATE users SET verified = true, verification_token = NULL WHERE id = ${id}`;
  return (await getUserById(id))!;
}

/** Marks a user verified without a token — used by demo seeding. */
export async function markUserVerified(userId: string): Promise<void> {
  await sql`UPDATE users SET verified = true, verification_token = NULL WHERE id = ${userId}`;
}

export async function setBrandArticles(userId: string, articles: string[]): Promise<void> {
  await sql`UPDATE users SET brand_articles = ${JSON.stringify(articles)} WHERE id = ${userId}`;
}

export async function setAffiliateTemplate(userId: string, template: string | null): Promise<void> {
  await sql`UPDATE users SET affiliate_template = ${template} WHERE id = ${userId}`;
}

export async function updateUserPasswordHash(userId: string, passwordHash: string): Promise<void> {
  await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${userId}`;
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Issues a fresh password-reset token for an existing account and
 * returns it, or undefined if no account has that email — callers
 * must not reveal which case happened, to avoid leaking whether an
 * email is registered.
 */
export async function setResetToken(email: string): Promise<string | undefined> {
  const user = await getUserByEmail(email);
  if (!user) return undefined;
  const token = randomUUID();
  const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
  await sql`UPDATE users SET reset_token = ${token}, reset_token_expires_at = ${expires} WHERE id = ${user.id}`;
  return token;
}

export async function getUserByResetToken(token: string): Promise<User | undefined> {
  const rows = await sql`
    SELECT * FROM users WHERE reset_token = ${token} AND reset_token_expires_at > now()
  `;
  return rows[0] ? toUser(rows[0]) : undefined;
}

export async function clearResetToken(userId: string): Promise<void> {
  await sql`UPDATE users SET reset_token = NULL, reset_token_expires_at = NULL WHERE id = ${userId}`;
}

export async function getUserBySlug(slug: string): Promise<User | undefined> {
  const rows = await sql`SELECT * FROM users WHERE slug = ${slug}`;
  return rows[0] ? toUser(rows[0]) : undefined;
}

/**
 * Shopper accounts predate the public wishlist page, so most don't have
 * a slug yet. Assigns one lazily, the first time it's needed, instead
 * of a one-off backfill migration.
 */
export async function ensureUserSlug(userId: string): Promise<string> {
  const user = (await getUserById(userId))!;
  if (user.slug) return user.slug;

  const base = slugify(user.email.split("@")[0]);
  const slug = `${base}-${userId.slice(0, 6)}`;
  await sql`UPDATE users SET slug = ${slug} WHERE id = ${userId}`;
  return slug;
}

export async function updateUserProfile(
  userId: string,
  patch: { displayName?: string; avatarUrl?: string }
): Promise<User> {
  const current = (await getUserById(userId))!;
  await sql`
    UPDATE users
    SET display_name = ${patch.displayName ?? current.displayName ?? null},
        avatar_url = ${patch.avatarUrl ?? current.avatarUrl ?? null}
    WHERE id = ${userId}
  `;
  return (await getUserById(userId))!;
}

/** The affiliate template of whichever brand has claimed this article, if any. */
export async function getAffiliateTemplateForArticle(articleId: string): Promise<string | undefined> {
  const rows = await sql`
    SELECT affiliate_template FROM users
    WHERE role = 'brand' AND affiliate_template IS NOT NULL AND brand_articles LIKE ${`%"${articleId}"%`}
    LIMIT 1
  `;
  return rows[0] ? opt(rows[0].affiliate_template) : undefined;
}

/* ------------------------------------------------------------- creators */

export async function getCreatorByUserId(userId: string): Promise<Creator | undefined> {
  const rows = await sql`SELECT * FROM creators WHERE user_id = ${userId}`;
  return rows[0] ? toCreator(rows[0]) : undefined;
}

export async function getCreatorBySlug(slug: string): Promise<Creator | undefined> {
  const rows = await sql`SELECT * FROM creators WHERE slug = ${slug}`;
  return rows[0] ? toCreator(rows[0]) : undefined;
}

export async function getCreatorById(id: string): Promise<Creator | undefined> {
  const rows = await sql`SELECT * FROM creators WHERE id = ${id}`;
  return rows[0] ? toCreator(rows[0]) : undefined;
}

export async function updateCreator(
  creatorId: string,
  patch: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    slug?: string;
    instagramHandle?: string | null;
    tiktokHandle?: string | null;
    telegramHandle?: string | null;
    youtubeHandle?: string | null;
    contactEmail?: string | null;
    onboarded?: boolean;
    categories?: Category[] | null;
    hidePopular?: boolean;
  }
): Promise<Creator | undefined> {
  const current = await getCreatorById(creatorId);
  if (!current) return undefined;

  const nextName = patch.displayName ?? current.displayName;
  const nextCategories =
    patch.categories === undefined ? (current.categories ?? null) : patch.categories;
  await sql`
    UPDATE creators
    SET display_name = ${nextName},
        display_name_lower = ${nextName.toLowerCase()},
        bio = ${patch.bio ?? current.bio ?? null},
        avatar_url = ${patch.avatarUrl ?? current.avatarUrl ?? null},
        slug = ${patch.slug ?? current.slug},
        instagram_handle = ${patch.instagramHandle === undefined ? (current.instagramHandle ?? null) : patch.instagramHandle},
        tiktok_handle = ${patch.tiktokHandle === undefined ? (current.tiktokHandle ?? null) : patch.tiktokHandle},
        telegram_handle = ${patch.telegramHandle === undefined ? (current.telegramHandle ?? null) : patch.telegramHandle},
        youtube_handle = ${patch.youtubeHandle === undefined ? (current.youtubeHandle ?? null) : patch.youtubeHandle},
        contact_email = ${patch.contactEmail === undefined ? (current.contactEmail ?? null) : patch.contactEmail},
        onboarded = ${patch.onboarded ?? current.onboarded},
        categories = ${nextCategories ? JSON.stringify(nextCategories) : null},
        hide_popular = ${patch.hidePopular ?? current.hidePopular}
    WHERE id = ${creatorId}
  `;

  return getCreatorById(creatorId);
}

/** Uploaded profile photos live in their own table so creator listings
 * (which SELECT *) never drag image bytes along. */
export async function saveCreatorAvatar(creatorId: string, mime: string, base64: string): Promise<void> {
  await sql`
    INSERT INTO creator_avatars (creator_id, mime, data, updated_at)
    VALUES (${creatorId}, ${mime}, ${base64}, now())
    ON CONFLICT (creator_id) DO UPDATE SET mime = EXCLUDED.mime, data = EXCLUDED.data, updated_at = now()
  `;
}

export async function getCreatorAvatar(creatorId: string): Promise<{ mime: string; bytes: Buffer } | undefined> {
  const rows = await sql`SELECT mime, data FROM creator_avatars WHERE creator_id = ${creatorId}`;
  if (!rows[0]) return undefined;
  return { mime: str(rows[0].mime), bytes: Buffer.from(str(rows[0].data), "base64") };
}

/** Paginated creator directory — the landing and /curators must never load all 500. */
export async function listCreators(
  opts: { limit?: number; offset?: number; query?: string } = {}
): Promise<Creator[]> {
  const limit = Math.min(opts.limit ?? 24, 100);
  const offset = opts.offset ?? 0;

  if (opts.query?.trim()) {
    const q = `%${opts.query.trim().toLowerCase()}%`;
    const rows = await sql`
      SELECT * FROM creators
      WHERE display_name_lower LIKE ${q} OR slug LIKE ${q}
      ORDER BY display_name LIMIT ${limit} OFFSET ${offset}
    `;
    return rows.map(toCreator);
  }

  const rows = await sql`SELECT * FROM creators ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
  return rows.map(toCreator);
}

export async function countCreators(query?: string): Promise<number> {
  if (query?.trim()) {
    const q = `%${query.trim().toLowerCase()}%`;
    const rows = await sql`
      SELECT COUNT(*) AS c FROM creators WHERE display_name_lower LIKE ${q} OR slug LIKE ${q}
    `;
    return Number(rows[0].c);
  }
  const rows = await sql`SELECT COUNT(*) AS c FROM creators`;
  return Number(rows[0].c);
}

/* ---------------------------------------------------------------- links */

export async function addLink(
  input: Omit<Link, "id" | "createdAt" | "isAd"> & { isAd?: boolean }
): Promise<Link> {
  const id = randomUUID();
  const now = new Date().toISOString();
  const seq = await nextSeq();
  await sql`
    INSERT INTO links (id, creator_id, title, title_lower, image_url, price, category, brand, subtype, target_url, marketplace, article_id, promo_code, is_ad, ad_info, created_at, seq)
    VALUES (${id}, ${input.creatorId}, ${input.title}, ${input.title.toLowerCase()}, ${input.imageUrl ?? null}, ${input.price ?? null}, ${input.category}, ${input.brand ?? null}, ${input.subtype ?? null}, ${input.targetUrl}, ${input.marketplace ?? null}, ${input.articleId ?? null}, ${input.promoCode ?? null}, ${input.isAd ?? false}, ${input.adInfo ?? null}, ${now}, ${seq})
  `;
  return (await getLink(id))!;
}

export async function getLink(id: string): Promise<Link | undefined> {
  const rows = await sql`SELECT * FROM links WHERE id = ${id}`;
  return rows[0] ? toLink(rows[0]) : undefined;
}

export async function updateLink(
  id: string,
  patch: {
    title?: string;
    category?: Link["category"];
    price?: number | null;
    imageUrl?: string | null;
    promoCode?: string | null;
    brand?: string | null;
    subtype?: string | null;
    isAd?: boolean;
    adInfo?: string | null;
  }
): Promise<Link | undefined> {
  const current = await getLink(id);
  if (!current) return undefined;

  const title = patch.title ?? current.title;
  await sql`
    UPDATE links
    SET title = ${title},
        title_lower = ${title.toLowerCase()},
        category = ${patch.category ?? current.category},
        price = ${patch.price === undefined ? (current.price ?? null) : patch.price},
        image_url = ${patch.imageUrl === undefined ? (current.imageUrl ?? null) : patch.imageUrl},
        promo_code = ${patch.promoCode === undefined ? (current.promoCode ?? null) : patch.promoCode},
        brand = ${patch.brand === undefined ? (current.brand ?? null) : patch.brand},
        subtype = ${patch.subtype === undefined ? (current.subtype ?? null) : patch.subtype},
        is_ad = ${patch.isAd ?? current.isAd},
        ad_info = ${patch.adInfo === undefined ? (current.adInfo ?? null) : patch.adInfo}
    WHERE id = ${id}
  `;

  return getLink(id);
}

export async function deleteLink(id: string): Promise<boolean> {
  const rows = await sql`DELETE FROM links WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

export async function listLinksByCreator(
  creatorId: string,
  opts: { limit?: number; offset?: number } = {}
): Promise<Link[]> {
  const limit = Math.min(opts.limit ?? 200, 500);
  const offset = opts.offset ?? 0;
  const rows = await sql`
    SELECT * FROM links WHERE creator_id = ${creatorId} ORDER BY seq DESC LIMIT ${limit} OFFSET ${offset}
  `;
  return rows.map(toLink);
}

export async function countLinksByCreator(creatorId: string): Promise<number> {
  const rows = await sql`SELECT COUNT(*) AS c FROM links WHERE creator_id = ${creatorId}`;
  return Number(rows[0].c);
}

/* -------------------------------------------------------------- sections */

export type Section = {
  id: string;
  creatorId: string;
  name: string;
  // A single emoji, purely decorative — like ShopMy's per-section icon,
  // minus the layout/social-source machinery we have no content for.
  icon?: string;
  position: number;
  hidden: boolean;
  createdAt: string;
};

function toSection(r: Row): Section {
  return {
    id: str(r.id),
    creatorId: str(r.creator_id),
    name: str(r.name),
    icon: opt(r.icon),
    position: Number(r.position),
    hidden: Boolean(r.hidden),
    createdAt: str(r.created_at),
  };
}

export async function listSectionsByCreator(creatorId: string): Promise<Section[]> {
  const rows = await sql`SELECT * FROM sections WHERE creator_id = ${creatorId} ORDER BY position ASC`;
  return rows.map(toSection);
}

export async function createSection(creatorId: string, name: string): Promise<Section> {
  const id = randomUUID();
  const now = new Date().toISOString();
  const rows = await sql`SELECT COALESCE(MAX(position), -1) AS max_pos FROM sections WHERE creator_id = ${creatorId}`;
  const position = Number(rows[0].max_pos) + 1;
  await sql`
    INSERT INTO sections (id, creator_id, name, position, hidden, created_at)
    VALUES (${id}, ${creatorId}, ${name}, ${position}, false, ${now})
  `;
  return { id, creatorId, name, position, hidden: false, createdAt: now };
}

export async function getSectionById(id: string): Promise<Section | undefined> {
  const rows = await sql`SELECT * FROM sections WHERE id = ${id}`;
  return rows[0] ? toSection(rows[0]) : undefined;
}

export async function renameSection(id: string, name: string): Promise<void> {
  await sql`UPDATE sections SET name = ${name} WHERE id = ${id}`;
}

export async function setSectionIcon(id: string, icon: string | null): Promise<void> {
  await sql`UPDATE sections SET icon = ${icon} WHERE id = ${id}`;
}

export async function setSectionHidden(id: string, hidden: boolean): Promise<void> {
  await sql`UPDATE sections SET hidden = ${hidden} WHERE id = ${id}`;
}

export async function deleteSection(id: string): Promise<void> {
  await sql`DELETE FROM sections WHERE id = ${id}`;
}

/** Swaps this section's position with its immediate neighbor in that direction. */
export async function moveSection(creatorId: string, id: string, direction: "up" | "down"): Promise<void> {
  const sections = await listSectionsByCreator(creatorId);
  const idx = sections.findIndex((s) => s.id === id);
  if (idx === -1) return;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= sections.length) return;
  const a = sections[idx];
  const b = sections[swapIdx];
  await sql`UPDATE sections SET position = ${b.position} WHERE id = ${a.id}`;
  await sql`UPDATE sections SET position = ${a.position} WHERE id = ${b.id}`;
}

export async function listSectionLinkIds(sectionId: string): Promise<Set<string>> {
  const rows = await sql`SELECT link_id FROM section_links WHERE section_id = ${sectionId}`;
  return new Set(rows.map((r) => str(r.link_id)));
}

export async function setLinkInSection(sectionId: string, linkId: string, included: boolean): Promise<void> {
  if (included) {
    await sql`
      INSERT INTO section_links (section_id, link_id) VALUES (${sectionId}, ${linkId})
      ON CONFLICT DO NOTHING
    `;
  } else {
    await sql`DELETE FROM section_links WHERE section_id = ${sectionId} AND link_id = ${linkId}`;
  }
}

/** Every section for this creator that has at least one product, each with its links — for the public storefront. */
export async function listPublicSections(
  creatorId: string,
  opts: { includeEmpty?: boolean } = {}
): Promise<(Section & { links: Link[] })[]> {
  const sections = await listSectionsByCreator(creatorId);
  const withLinks = await Promise.all(
    sections
      .filter((s) => !s.hidden)
      .map(async (s) => {
        const rows = await sql`
          SELECT l.* FROM links l JOIN section_links sl ON sl.link_id = l.id
          WHERE sl.section_id = ${s.id} ORDER BY l.seq DESC
        `;
        return { ...s, links: rows.map(toLink) };
      })
  );
  return opts.includeEmpty ? withLinks : withLinks.filter((s) => s.links.length > 0);
}

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export async function listLinksByDomain(domain: string, opts: { limit?: number } = {}): Promise<Link[]> {
  const normalized = domain.replace(/^www\./, "").toLowerCase();
  const limit = Math.min(opts.limit ?? 200, 500);
  // Postgres has no URL parser either, so filter host in JS — but only
  // over rows whose target_url contains the domain, so this never scans
  // everything.
  const rows = await sql`
    SELECT * FROM links WHERE target_url LIKE ${`%${normalized}%`} ORDER BY seq DESC LIMIT ${limit}
  `;
  return rows.map(toLink).filter((l) => hostnameOf(l.targetUrl) === normalized);
}

export async function listLinksByArticles(articles: string[], opts: { limit?: number } = {}): Promise<Link[]> {
  if (articles.length === 0) return [];
  const limit = Math.min(opts.limit ?? 200, 500);
  const rows = await sql`
    SELECT * FROM links WHERE article_id IN ${sql(articles)} ORDER BY seq DESC LIMIT ${limit}
  `;
  return rows.map(toLink);
}

export async function listLinksByCategory(
  category: Link["category"],
  opts: { limit?: number; offset?: number } = {}
): Promise<Link[]> {
  const limit = Math.min(opts.limit ?? 48, 100);
  const offset = opts.offset ?? 0;
  const rows = await sql`
    SELECT * FROM links WHERE category = ${category} ORDER BY seq DESC LIMIT ${limit} OFFSET ${offset}
  `;
  return rows.map(toLink);
}

export async function countLinksByCategory(category: Link["category"]): Promise<number> {
  const rows = await sql`SELECT COUNT(*) AS c FROM links WHERE category = ${category}`;
  return Number(rows[0].c);
}

export type LinkSearchResult = Link & { creatorSlug: string; creatorName: string };

export async function searchLinks(query: string, opts: { limit?: number } = {}): Promise<LinkSearchResult[]> {
  const limit = Math.min(opts.limit ?? 24, 100);
  const q = `%${query.trim().toLowerCase()}%`;
  const rows = await sql`
    SELECT links.*, creators.slug AS creator_slug, creators.display_name AS creator_name
    FROM links JOIN creators ON creators.id = links.creator_id
    WHERE links.title_lower LIKE ${q}
    ORDER BY links.seq DESC LIMIT ${limit}
  `;
  return rows.map((r) => ({ ...toLink(r), creatorSlug: str(r.creator_slug), creatorName: str(r.creator_name) }));
}

export async function listDistinctBrandDomains(limit = 12): Promise<{ domain: string; linkCount: number }[]> {
  // Grouping happens in JS here (as it did over SQLite), since extracting
  // a hostname needs a real URL parser, not a SQL string function.
  const rows = await sql`SELECT target_url FROM links`;
  const counts = new Map<string, number>();
  for (const r of rows) {
    const host = hostnameOf(str(r.target_url));
    if (!host) continue;
    counts.set(host, (counts.get(host) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([domain, linkCount]) => ({ domain, linkCount }))
    .sort((a, b) => b.linkCount - a.linkCount)
    .slice(0, limit);
}

/* --------------------------------------------------------------- clicks */

export async function recordClick(
  linkId: string,
  meta: {
    referrer?: string;
    userAgent?: string;
    isBot?: boolean;
    fingerprint?: string;
    /** Only set by seeding, to spread demo history over past days. */
    clickedAt?: string;
  } = {}
): Promise<Click> {
  const id = randomUUID();
  const now = meta.clickedAt ?? new Date().toISOString();
  await sql`
    INSERT INTO clicks (id, link_id, clicked_at, referrer, user_agent, is_bot, fingerprint)
    VALUES (${id}, ${linkId}, ${now}, ${meta.referrer ?? null}, ${meta.userAgent ?? null}, ${Boolean(meta.isBot)}, ${meta.fingerprint ?? null})
  `;
  return {
    id,
    linkId,
    clickedAt: now,
    referrer: meta.referrer,
    userAgent: meta.userAgent,
    isBot: Boolean(meta.isBot),
    fingerprint: meta.fingerprint,
  };
}

/** Bulk-inserts clicks in one round trip per chunk — only used by the scale-seed script. */
export async function recordClicksBulk(
  rows: { linkId: string; clickedAt: string; userAgent?: string; isBot: boolean; fingerprint: string; referrer?: string }[]
): Promise<void> {
  if (rows.length === 0) return;
  const values = rows.map((r) => ({
    id: randomUUID(),
    link_id: r.linkId,
    clicked_at: r.clickedAt,
    referrer: r.referrer ?? null,
    user_agent: r.userAgent ?? null,
    is_bot: r.isBot,
    fingerprint: r.fingerprint,
  }));
  await sql`INSERT INTO clicks ${sql(values)}`;
}

export async function countClicksForLink(linkId: string, opts: { humanOnly?: boolean } = {}): Promise<number> {
  const rows = opts.humanOnly
    ? await sql`SELECT COUNT(*) AS c FROM clicks WHERE link_id = ${linkId} AND is_bot = false`
    : await sql`SELECT COUNT(*) AS c FROM clicks WHERE link_id = ${linkId}`;
  return Number(rows[0].c);
}

/**
 * Batched counts for many links at once. The per-link version inside a
 * loop is an N+1 query, which is what breaks first at a few hundred
 * creators.
 */
export async function countClicksForLinks(linkIds: string[]): Promise<Map<string, { total: number; human: number }>> {
  const result = new Map<string, { total: number; human: number }>();
  if (linkIds.length === 0) return result;

  const rows = await sql`
    SELECT link_id,
           COUNT(*) AS total,
           SUM(CASE WHEN is_bot = false THEN 1 ELSE 0 END) AS human
    FROM clicks WHERE link_id IN ${sql(linkIds)} GROUP BY link_id
  `;

  for (const id of linkIds) result.set(id, { total: 0, human: 0 });
  for (const r of rows) {
    result.set(str(r.link_id), { total: Number(r.total), human: Number(r.human ?? 0) });
  }
  return result;
}

/** True when this visitor already opened this link inside the window. */
export async function hasRecentClick(linkId: string, fingerprint: string, withinMinutes = 30): Promise<boolean> {
  const since = new Date(Date.now() - withinMinutes * 60_000).toISOString();
  const rows = await sql`
    SELECT 1 AS x FROM clicks WHERE link_id = ${linkId} AND fingerprint = ${fingerprint} AND clicked_at > ${since} LIMIT 1
  `;
  return rows.length > 0;
}

export async function creatorClickStats(
  creatorId: string,
  sinceISO?: string
): Promise<{ total: number; human: number; byDay: { day: string; human: number }[] }> {
  const since = sinceISO ?? new Date(Date.now() - 30 * 24 * 3600_000).toISOString();

  const totalsRows = await sql`
    SELECT COUNT(*) AS total, SUM(CASE WHEN c.is_bot = false THEN 1 ELSE 0 END) AS human
    FROM clicks c JOIN links l ON l.id = c.link_id
    WHERE l.creator_id = ${creatorId} AND c.clicked_at > ${since}
  `;
  const totals = totalsRows[0];

  const byDayRows = await sql`
    SELECT substr(c.clicked_at, 1, 10) AS day,
           SUM(CASE WHEN c.is_bot = false THEN 1 ELSE 0 END) AS human
    FROM clicks c JOIN links l ON l.id = c.link_id
    WHERE l.creator_id = ${creatorId} AND c.clicked_at > ${since}
    GROUP BY day ORDER BY day
  `;
  const byDay = byDayRows.map((r) => ({ day: str(r.day), human: Number(r.human ?? 0) }));

  return { total: Number(totals.total ?? 0), human: Number(totals.human ?? 0), byDay };
}

/* ------------------------------------------------------------ favorites */

export async function addFavorite(userId: string, linkId: string): Promise<void> {
  await sql`
    INSERT INTO favorites (user_id, link_id) VALUES (${userId}, ${linkId})
    ON CONFLICT DO NOTHING
  `;
}

export async function removeFavorite(userId: string, linkId: string): Promise<void> {
  await sql`DELETE FROM favorites WHERE user_id = ${userId} AND link_id = ${linkId}`;
}

export async function listFavoriteLinks(userId: string): Promise<Link[]> {
  const rows = await sql`
    SELECT l.* FROM links l JOIN favorites f ON f.link_id = l.id
    WHERE f.user_id = ${userId} ORDER BY l.seq DESC
  `;
  return rows.map(toLink);
}

export async function isFavorite(userId: string, linkId: string): Promise<boolean> {
  const rows = await sql`SELECT 1 AS x FROM favorites WHERE user_id = ${userId} AND link_id = ${linkId}`;
  return rows.length > 0;
}

export async function listFavoriteIds(userId: string, linkIds: string[]): Promise<Set<string>> {
  if (linkIds.length === 0) return new Set();
  const rows = await sql`
    SELECT link_id FROM favorites WHERE user_id = ${userId} AND link_id IN ${sql(linkIds)}
  `;
  return new Set(rows.map((r) => str(r.link_id)));
}

/** How many shoppers saved each link — real social proof for the storefront card. */
export async function countFavoritesForLinks(linkIds: string[]): Promise<Map<string, number>> {
  if (linkIds.length === 0) return new Map();
  const rows = await sql`
    SELECT link_id, COUNT(*) AS c FROM favorites WHERE link_id IN ${sql(linkIds)} GROUP BY link_id
  `;
  return new Map(rows.map((r) => [str(r.link_id), Number(r.c)]));
}

/* ---------------------------------------------------------------- follows */

export async function followCreator(userId: string, creatorId: string): Promise<void> {
  await sql`
    INSERT INTO follows (user_id, creator_id, created_at) VALUES (${userId}, ${creatorId}, ${new Date().toISOString()})
    ON CONFLICT DO NOTHING
  `;
}

export async function unfollowCreator(userId: string, creatorId: string): Promise<void> {
  await sql`DELETE FROM follows WHERE user_id = ${userId} AND creator_id = ${creatorId}`;
}

export async function isFollowing(userId: string, creatorId: string): Promise<boolean> {
  const rows = await sql`SELECT 1 AS x FROM follows WHERE user_id = ${userId} AND creator_id = ${creatorId}`;
  return rows.length > 0;
}

export async function countFollowers(creatorId: string): Promise<number> {
  const rows = await sql`SELECT COUNT(*) AS c FROM follows WHERE creator_id = ${creatorId}`;
  return Number(rows[0].c);
}

export async function listFollowedCreators(userId: string): Promise<Creator[]> {
  const rows = await sql`
    SELECT c.* FROM creators c JOIN follows f ON f.creator_id = c.id
    WHERE f.user_id = ${userId} ORDER BY f.created_at DESC
  `;
  return rows.map(toCreator);
}

export async function countFollowedCreators(userId: string): Promise<number> {
  const rows = await sql`SELECT COUNT(*) AS c FROM follows WHERE user_id = ${userId}`;
  return Number(rows[0].c);
}

/**
 * The shopper's "circle" feed: every link from every creator they follow,
 * newest first — the one blended stream Circles is actually for, instead
 * of checking each storefront in turn.
 */
export async function circleFeed(userId: string, opts: { limit?: number } = {}): Promise<Link[]> {
  const limit = Math.min(opts.limit ?? 60, 200);
  const rows = await sql`
    SELECT l.* FROM links l JOIN follows f ON f.creator_id = l.creator_id
    WHERE f.user_id = ${userId} ORDER BY l.seq DESC LIMIT ${limit}
  `;
  return rows.map(toLink);
}

export type RecentLink = Link & {
  creatorName: string;
  creatorSlug: string;
  creatorAvatarUrl?: string;
};

/**
 * Same shape as listRecentLinks, but scoped to creators this shopper
 * follows — the personalized half of "Находки" (the other half being
 * the platform-wide feed).
 */
export async function listFollowedLinks(
  userId: string,
  opts: { limit?: number } = {}
): Promise<RecentLink[]> {
  const limit = Math.min(opts.limit ?? 60, 200);
  const rows = await sql`
    SELECT l.*, c.display_name AS creator_display_name, c.slug AS creator_slug, c.avatar_url AS creator_avatar_url
    FROM links l
    JOIN creators c ON c.id = l.creator_id
    JOIN follows f ON f.creator_id = l.creator_id
    WHERE f.user_id = ${userId}
    ORDER BY l.seq DESC LIMIT ${limit}
  `;
  return rows.map((r) => ({
    ...toLink(r),
    creatorName: str(r.creator_display_name),
    creatorSlug: str(r.creator_slug),
    creatorAvatarUrl: r.creator_avatar_url === null ? undefined : str(r.creator_avatar_url),
  }));
}

/**
 * The platform-wide "Latest Finds" feed: every product from every
 * creator, newest first — plain chronological order, no ranking or
 * personalization. This is the only way to discover creators beyond
 * the static /curators list without pretending to have a real
 * recommendation algorithm.
 */
export async function listRecentLinks(opts: { limit?: number } = {}): Promise<RecentLink[]> {
  const limit = Math.min(opts.limit ?? 40, 100);
  const rows = await sql`
    SELECT l.*, c.display_name AS creator_display_name, c.slug AS creator_slug, c.avatar_url AS creator_avatar_url
    FROM links l JOIN creators c ON c.id = l.creator_id
    ORDER BY l.seq DESC LIMIT ${limit}
  `;
  return rows.map((r) => ({
    ...toLink(r),
    creatorName: str(r.creator_display_name),
    creatorSlug: str(r.creator_slug),
    creatorAvatarUrl: r.creator_avatar_url === null ? undefined : str(r.creator_avatar_url),
  }));
}

/**
 * Count of links from followed creators added after the shopper last
 * checked their "Мои кураторы" feed — powers the notification badge.
 * A never-visited feed (finds_seen_at is null) counts everything so
 * the badge doesn't silently start at 0 for new followers.
 */
export async function countNewFollowedLinks(userId: string): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*) AS c
    FROM links l
    JOIN follows f ON f.creator_id = l.creator_id
    JOIN users u ON u.id = ${userId}
    WHERE f.user_id = ${userId} AND (u.finds_seen_at IS NULL OR l.created_at::timestamptz > u.finds_seen_at)
  `;
  return Number(rows[0].c);
}

export async function markFindsSeen(userId: string): Promise<void> {
  await sql`UPDATE users SET finds_seen_at = ${new Date().toISOString()} WHERE id = ${userId}`;
}

/* -------------------------------------------------------------- circles */

export type Circle = {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
};

function toCircle(r: Row): Circle {
  return {
    id: str(r.id),
    userId: str(r.user_id),
    name: str(r.name),
    createdAt: str(r.created_at),
  };
}

export async function createCircle(userId: string, name: string): Promise<Circle> {
  const id = randomUUID();
  const now = new Date().toISOString();
  await sql`INSERT INTO circles (id, user_id, name, created_at) VALUES (${id}, ${userId}, ${name}, ${now})`;
  return { id, userId, name, createdAt: now };
}

export async function listCirclesByUser(userId: string): Promise<Circle[]> {
  const rows = await sql`SELECT * FROM circles WHERE user_id = ${userId} ORDER BY created_at ASC`;
  return rows.map(toCircle);
}

export async function getCircle(id: string): Promise<Circle | undefined> {
  const rows = await sql`SELECT * FROM circles WHERE id = ${id}`;
  return rows[0] ? toCircle(rows[0]) : undefined;
}

export async function deleteCircle(id: string, userId: string): Promise<boolean> {
  const rows = await sql`DELETE FROM circles WHERE id = ${id} AND user_id = ${userId} RETURNING id`;
  return rows.length > 0;
}

export async function addCircleMember(circleId: string, creatorId: string): Promise<void> {
  await sql`
    INSERT INTO circle_members (circle_id, creator_id, added_at)
    VALUES (${circleId}, ${creatorId}, ${new Date().toISOString()})
    ON CONFLICT (circle_id, creator_id) DO NOTHING
  `;
}

export async function removeCircleMember(circleId: string, creatorId: string): Promise<void> {
  await sql`DELETE FROM circle_members WHERE circle_id = ${circleId} AND creator_id = ${creatorId}`;
}

export async function listCircleMembers(circleId: string): Promise<Creator[]> {
  const rows = await sql`
    SELECT c.* FROM creators c JOIN circle_members cm ON cm.creator_id = c.id
    WHERE cm.circle_id = ${circleId} ORDER BY cm.added_at ASC
  `;
  return rows.map(toCreator);
}

/** Every link from every creator in this circle, newest first. */
export async function circleMembersFeed(circleId: string, opts: { limit?: number } = {}): Promise<Link[]> {
  const limit = Math.min(opts.limit ?? 60, 200);
  const rows = await sql`
    SELECT l.* FROM links l JOIN circle_members cm ON cm.creator_id = l.creator_id
    WHERE cm.circle_id = ${circleId} ORDER BY l.seq DESC LIMIT ${limit}
  `;
  return rows.map(toLink);
}

/* ---------------------------------------------------------- collections */

// A collection is a named, hand-picked group of a creator's products that
// lives inside a section (or on the main "Последние" tab when sectionId is
// null) — ShopMy's "Add Collection". Products stay in the section too;
// the collection is an extra way to group and browse them.
export type Collection = {
  id: string;
  creatorId: string;
  sectionId: string | null;
  name: string;
  position: number;
  linkIds: string[];
};

export async function listCollectionsByCreator(creatorId: string): Promise<Collection[]> {
  const cols = await sql`SELECT * FROM collections WHERE creator_id = ${creatorId} ORDER BY position ASC, created_at ASC`;
  if (cols.length === 0) return [];
  const ids = cols.map((c) => str(c.id));
  const rows = await sql`
    SELECT collection_id, link_id FROM collection_links
    WHERE collection_id IN ${sql(ids)} ORDER BY position ASC
  `;
  const byCollection = new Map<string, string[]>();
  for (const r of rows) {
    const key = str(r.collection_id);
    byCollection.set(key, [...(byCollection.get(key) ?? []), str(r.link_id)]);
  }
  return cols.map((c) => ({
    id: str(c.id),
    creatorId: str(c.creator_id),
    sectionId: c.section_id === null ? null : str(c.section_id),
    name: str(c.name),
    position: Number(c.position),
    linkIds: byCollection.get(str(c.id)) ?? [],
  }));
}

export async function getCollectionById(id: string): Promise<Collection | undefined> {
  const rows = await sql`SELECT creator_id FROM collections WHERE id = ${id}`;
  if (!rows[0]) return undefined;
  return (await listCollectionsByCreator(str(rows[0].creator_id))).find((c) => c.id === id);
}

async function replaceCollectionLinks(collectionId: string, creatorId: string, linkIds: string[]): Promise<void> {
  // Only the creator's own products can go in — never trust ids from the client.
  const own = linkIds.length
    ? await sql`SELECT id FROM links WHERE creator_id = ${creatorId} AND id IN ${sql(linkIds)}`
    : [];
  const valid = new Set(own.map((r) => str(r.id)));
  const ordered = linkIds.filter((id) => valid.has(id));
  await sql`DELETE FROM collection_links WHERE collection_id = ${collectionId}`;
  for (let i = 0; i < ordered.length; i++) {
    await sql`INSERT INTO collection_links (collection_id, link_id, position) VALUES (${collectionId}, ${ordered[i]}, ${i})`;
  }
}

export async function createCollection(
  creatorId: string,
  input: { name: string; sectionId: string | null; linkIds: string[] }
): Promise<Collection> {
  const id = randomUUID();
  const pos = await sql`SELECT COALESCE(MAX(position), -1) + 1 AS p FROM collections WHERE creator_id = ${creatorId}`;
  await sql`
    INSERT INTO collections (id, creator_id, section_id, name, position)
    VALUES (${id}, ${creatorId}, ${input.sectionId}, ${input.name}, ${Number(pos[0].p)})
  `;
  await replaceCollectionLinks(id, creatorId, input.linkIds);
  await addCollectionLinksToSection(id, input.sectionId);
  return (await getCollectionById(id))!;
}

export async function updateCollection(
  id: string,
  creatorId: string,
  patch: { name?: string; linkIds?: string[] }
): Promise<void> {
  if (patch.name) await sql`UPDATE collections SET name = ${patch.name} WHERE id = ${id}`;
  if (patch.linkIds) {
    await replaceCollectionLinks(id, creatorId, patch.linkIds);
    const row = await sql`SELECT section_id FROM collections WHERE id = ${id}`;
    await addCollectionLinksToSection(id, row[0]?.section_id ? str(row[0].section_id) : null);
  }
}

/** A collection inside a section means its products belong to that section too. */
async function addCollectionLinksToSection(collectionId: string, sectionId: string | null): Promise<void> {
  if (!sectionId) return;
  const rows = await sql`SELECT link_id FROM collection_links WHERE collection_id = ${collectionId}`;
  for (const r of rows) await setLinkInSection(sectionId, str(r.link_id), true);
}

export async function deleteCollection(id: string): Promise<void> {
  await sql`DELETE FROM collections WHERE id = ${id}`;
}

/* ------------------------------------------------------------- sessions */

export async function createSessionRow(token: string, userId: string): Promise<void> {
  await sql`INSERT INTO sessions (token, user_id, created_at) VALUES (${token}, ${userId}, ${new Date().toISOString()})`;
}

export async function getSessionUserId(token: string): Promise<string | null> {
  const rows = await sql`SELECT user_id FROM sessions WHERE token = ${token}`;
  return rows[0] ? str(rows[0].user_id) : null;
}

export async function deleteSessionRow(token: string): Promise<void> {
  await sql`DELETE FROM sessions WHERE token = ${token}`;
}

/* ----------------------------------------------------------- opportunities */

export type Opportunity = {
  id: string;
  brandUserId: string;
  title: string;
  description: string;
  compensation?: string;
  category?: Link["category"];
  status: "open" | "closed";
  createdAt: string;
};

export type OpportunityApplication = {
  id: string;
  opportunityId: string;
  creatorId: string;
  message?: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
};

function toOpportunity(r: Row): Opportunity {
  return {
    id: str(r.id),
    brandUserId: str(r.brand_user_id),
    title: str(r.title),
    description: str(r.description),
    compensation: opt(r.compensation),
    category: opt(r.category) as Opportunity["category"],
    status: str(r.status) as Opportunity["status"],
    createdAt: str(r.created_at),
  };
}

function toApplication(r: Row): OpportunityApplication {
  return {
    id: str(r.id),
    opportunityId: str(r.opportunity_id),
    creatorId: str(r.creator_id),
    message: opt(r.message),
    status: str(r.status) as OpportunityApplication["status"],
    createdAt: str(r.created_at),
  };
}

export async function createOpportunity(input: {
  brandUserId: string;
  title: string;
  description: string;
  compensation?: string;
  category?: Link["category"];
}): Promise<Opportunity> {
  const id = randomUUID();
  const now = new Date().toISOString();
  await sql`
    INSERT INTO opportunities (id, brand_user_id, title, description, compensation, category, status, created_at)
    VALUES (${id}, ${input.brandUserId}, ${input.title}, ${input.description}, ${input.compensation ?? null}, ${input.category ?? null}, 'open', ${now})
  `;
  return (await getOpportunity(id))!;
}

export async function getOpportunity(id: string): Promise<Opportunity | undefined> {
  const rows = await sql`SELECT * FROM opportunities WHERE id = ${id}`;
  return rows[0] ? toOpportunity(rows[0]) : undefined;
}

export async function listOpenOpportunities(opts: { limit?: number } = {}): Promise<Opportunity[]> {
  const limit = Math.min(opts.limit ?? 50, 100);
  const rows = await sql`
    SELECT * FROM opportunities WHERE status = 'open' ORDER BY created_at DESC LIMIT ${limit}
  `;
  return rows.map(toOpportunity);
}

export async function listOpportunitiesByBrand(brandUserId: string): Promise<Opportunity[]> {
  const rows = await sql`
    SELECT * FROM opportunities WHERE brand_user_id = ${brandUserId} ORDER BY created_at DESC
  `;
  return rows.map(toOpportunity);
}

export async function closeOpportunity(id: string, brandUserId: string): Promise<void> {
  await sql`UPDATE opportunities SET status = 'closed' WHERE id = ${id} AND brand_user_id = ${brandUserId}`;
}

export async function applyToOpportunity(
  opportunityId: string,
  creatorId: string,
  message?: string
): Promise<OpportunityApplication> {
  const id = randomUUID();
  const now = new Date().toISOString();
  await sql`
    INSERT INTO opportunity_applications (id, opportunity_id, creator_id, message, status, created_at)
    VALUES (${id}, ${opportunityId}, ${creatorId}, ${message ?? null}, 'pending', ${now})
    ON CONFLICT (opportunity_id, creator_id) DO NOTHING
  `;
  const rows = await sql`
    SELECT * FROM opportunity_applications WHERE opportunity_id = ${opportunityId} AND creator_id = ${creatorId}
  `;
  return toApplication(rows[0]);
}

export async function listApplicationsForOpportunity(opportunityId: string): Promise<OpportunityApplication[]> {
  const rows = await sql`
    SELECT * FROM opportunity_applications WHERE opportunity_id = ${opportunityId} ORDER BY created_at ASC
  `;
  return rows.map(toApplication);
}

export async function listApplicationsByCreator(creatorId: string): Promise<OpportunityApplication[]> {
  const rows = await sql`
    SELECT * FROM opportunity_applications WHERE creator_id = ${creatorId} ORDER BY created_at DESC
  `;
  return rows.map(toApplication);
}

export async function setApplicationStatus(
  id: string,
  status: "accepted" | "declined"
): Promise<OpportunityApplication | undefined> {
  await sql`UPDATE opportunity_applications SET status = ${status} WHERE id = ${id}`;
  const rows = await sql`SELECT * FROM opportunity_applications WHERE id = ${id}`;
  return rows[0] ? toApplication(rows[0]) : undefined;
}

/* ----------------------------------------------------------------- test */

export async function __resetStoreForTests(): Promise<void> {
  await sql`TRUNCATE sessions, favorites, follows, circle_members, circles, opportunity_applications, opportunities, section_links, sections, clicks, links, creators, users CASCADE`;
  await sql`ALTER SEQUENCE links_seq_counter RESTART WITH 1`;
}
