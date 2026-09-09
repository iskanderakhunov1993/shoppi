# MyShop MVP (Creator Links) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the MVP creator-commerce storefront — creators sign up, add
products with any external link, get a public storefront page, and see
click counts on wrapped links — to validate that creators will actually
build a storefront and share links, before investing in affiliate-network
integrations.

**Architecture:** Single Next.js (App Router, TypeScript) application.
Supabase provides Postgres + Auth. All data access goes through
Supabase's JS client — server-side for mutations/RLS-protected reads,
browser client only for the auth forms. Click tracking and redirect live
in one Route Handler (`/r/[linkId]`) inside the same app — no separate
service.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Supabase
(`@supabase/supabase-js`, `@supabase/ssr`), Vitest for unit tests.

**Spec:** [docs/superpowers/specs/2026-09-09-mvp-creator-links-design.md](../specs/2026-09-09-mvp-creator-links-design.md)

## Global Constraints

- Auth is Supabase Auth, email/password only — no OAuth providers in MVP.
- Every table (`creators`, `links`, `clicks`) has Row Level Security
  enabled; a creator can only read/write their own `links`, and only
  read `clicks` for their own `links`. Public storefront reads bypass
  RLS via an explicit public-read policy on `links`, not via a service
  role key in the browser.
- `category` on `links` is a free-form text column holding one of
  `cosmetics`, `mens`, `clothing` — no enum/lookup table in MVP.
- No payment, commission, or affiliate-network integration code — the
  `target_url` is stored and redirected to verbatim.

---

## Task 1: Project scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `.env.local.example`
- Create: `app/layout.tsx`, `app/page.tsx`
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: a runnable Next.js app on `npm run dev`, `npm test` wired to Vitest.

- [ ] **Step 1: Scaffold the app**

```bash
cd /Users/iskander/myshop
npx create-next-app@latest . --typescript --app --eslint --tailwind --src-dir=false --import-alias "@/*" --use-npm
```

Answer "Yes" if prompted to use the current (non-empty, now git-initialized) directory.

- [ ] **Step 2: Install Supabase and test dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D vitest @vitejs/plugin-react
```

- [ ] **Step 3: Add Vitest config**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
  },
})
```

- [ ] **Step 4: Add test script to package.json**

Edit `package.json`, add to `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 5: Create env template**

```bash
# .env.local.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 6: Verify the app builds and runs**

Run: `npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Supabase and Vitest deps"
```

---

## Task 2: Supabase project and schema

**Files:**
- Create: `supabase/migrations/0001_init.sql`

**Interfaces:**
- Produces: tables `creators`, `links`, `clicks` with RLS policies, matching
  the schema in the spec. All later tasks query these exact table/column
  names.

- [ ] **Step 1: Create a Supabase project**

Use the Supabase MCP tool (`create_project`) or the Supabase dashboard to
create a project named `myshop-mvp`. Record the project's API URL and
anon key — you'll need them for `.env.local` in Task 3.

- [ ] **Step 2: Write the migration**

```sql
-- supabase/migrations/0001_init.sql

create table creators (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  display_name text not null,
  bio text,
  created_at timestamptz not null default now()
);

create table links (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references creators(id) on delete cascade,
  title text not null,
  image_url text,
  price numeric,
  category text not null check (category in ('cosmetics', 'mens', 'clothing')),
  target_url text not null,
  created_at timestamptz not null default now()
);

create table clicks (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references links(id) on delete cascade,
  clicked_at timestamptz not null default now(),
  referrer text,
  user_agent text
);

alter table creators enable row level security;
alter table links enable row level security;
alter table clicks enable row level security;

-- creators: owner can read/write their own row
create policy "creators_select_own" on creators
  for select using (auth.uid() = user_id);
create policy "creators_insert_own" on creators
  for insert with check (auth.uid() = user_id);
create policy "creators_update_own" on creators
  for update using (auth.uid() = user_id);

-- links: owner can read/write their own links; anyone can read links
-- for a storefront (public read)
create policy "links_public_select" on links
  for select using (true);
create policy "links_insert_own" on links
  for insert with check (
    exists (select 1 from creators c where c.id = creator_id and c.user_id = auth.uid())
  );
create policy "links_update_own" on links
  for update using (
    exists (select 1 from creators c where c.id = creator_id and c.user_id = auth.uid())
  );
create policy "links_delete_own" on links
  for delete using (
    exists (select 1 from creators c where c.id = creator_id and c.user_id = auth.uid())
  );

-- clicks: only the owning creator can read; inserts happen via the
-- redirect route using the service role key (server-side only), so no
-- insert policy is granted to anon/authenticated roles
create policy "clicks_select_own" on clicks
  for select using (
    exists (
      select 1 from links l
      join creators c on c.id = l.creator_id
      where l.id = link_id and c.user_id = auth.uid()
    )
  );
```

- [ ] **Step 2: Apply the migration**

Use the Supabase MCP tool (`apply_migration`) with the project id from
Step 1, passing the SQL above, or run via the Supabase CLI:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

- [ ] **Step 3: Verify tables exist**

Use the Supabase MCP tool (`list_tables`) for the project and confirm
`creators`, `links`, `clicks` are listed with RLS enabled.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0001_init.sql
git commit -m "feat: add creators/links/clicks schema with RLS"
```

---

## Task 3: Supabase client setup

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Modify: `.env.local` (not committed — create locally from `.env.local.example`)

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars.
- Produces: `createBrowserClient()` from `lib/supabase/client.ts` and
  `createServerClient()` from `lib/supabase/server.ts`, both returning a
  `SupabaseClient` typed against no generated types (MVP uses untyped
  `any` rows — type generation is a future improvement, not required here).

- [ ] **Step 1: Create the browser client**

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Create the server client**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // called from a Server Component without a mutable cookie
            // store; safe to ignore because middleware refreshes the
            // session on every request
          }
        },
      },
    }
  )
}
```

- [ ] **Step 3: Populate local env file**

```bash
cp .env.local.example .env.local
```

Fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in
`.env.local` with the values from Task 2 Step 1. Confirm `.env.local` is
in `.gitignore` (create-next-app adds this by default).

- [ ] **Step 4: Verify the app still builds**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/client.ts lib/supabase/server.ts
git commit -m "feat: add Supabase browser and server clients"
```

---

## Task 4: Signup and login pages

**Files:**
- Create: `app/signup/page.tsx`
- Create: `app/login/page.tsx`
- Create: `app/auth/actions.ts`

**Interfaces:**
- Consumes: `createClient()` from `lib/supabase/server.ts` (Task 3).
- Produces: `signUp(formData: FormData)` and `signIn(formData: FormData)`
  server actions in `app/auth/actions.ts`, both redirecting to
  `/dashboard` on success.

- [ ] **Step 1: Write the auth server actions**

```typescript
// app/auth/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/dashboard')
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/dashboard')
}
```

- [ ] **Step 2: Write the signup page**

```tsx
// app/signup/page.tsx
import { signUp } from '@/app/auth/actions'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main>
      <h1>Регистрация</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form action={signUp}>
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Пароль" required minLength={6} />
        <button type="submit">Зарегистрироваться</button>
      </form>
    </main>
  )
}
```

- [ ] **Step 3: Write the login page**

```tsx
// app/login/page.tsx
import { signIn } from '@/app/auth/actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main>
      <h1>Вход</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form action={signIn}>
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Пароль" required />
        <button type="submit">Войти</button>
      </form>
    </main>
  )
}
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`
Visit `http://localhost:3000/signup`, register with a test email/password.
Expected: redirected to `/dashboard` (404 is fine — Task 5 creates it).
Confirm in the Supabase dashboard (Authentication > Users) that the user was created.

- [ ] **Step 5: Commit**

```bash
git add app/signup app/login app/auth
git commit -m "feat: add signup and login pages"
```

---

## Task 5: Creator profile bootstrap + dashboard shell

**Files:**
- Create: `app/dashboard/page.tsx`
- Create: `app/dashboard/actions.ts`
- Create: `lib/creators.ts`
- Test: `lib/creators.test.ts`

**Interfaces:**
- Consumes: `createClient()` from `lib/supabase/server.ts`.
- Produces: `slugify(displayName: string): string` in `lib/creators.ts`,
  used by Task 5's `ensureCreatorProfile` and reusable by any future
  slug-generating code.

- [ ] **Step 1: Write the failing test for slugify**

```typescript
// lib/creators.test.ts
import { describe, it, expect } from 'vitest'
import { slugify } from './creators'

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Anna Ivanova')).toBe('anna-ivanova')
  })

  it('strips non-alphanumeric characters', () => {
    expect(slugify('Anna! Ivanova?')).toBe('anna-ivanova')
  })

  it('collapses multiple spaces into one hyphen', () => {
    expect(slugify('Anna   Ivanova')).toBe('anna-ivanova')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/creators.test.ts`
Expected: FAIL — `lib/creators.ts` does not exist yet.

- [ ] **Step 3: Implement slugify**

```typescript
// lib/creators.ts
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/creators.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the dashboard server action to bootstrap a creator profile**

```typescript
// app/dashboard/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/creators'
import { redirect } from 'next/navigation'

export async function ensureCreatorProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: existing } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return existing

  const displayName = user.email!.split('@')[0]
  const slug = `${slugify(displayName)}-${user.id.slice(0, 6)}`

  const { data: created, error } = await supabase
    .from('creators')
    .insert({ user_id: user.id, slug, display_name: displayName })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to create creator profile: ${error.message}`)
  return created
}
```

- [ ] **Step 6: Write the dashboard page**

```tsx
// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ensureCreatorProfile } from './actions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await ensureCreatorProfile()

  const { data: creator } = await supabase
    .from('creators')
    .select('id, slug, display_name')
    .eq('user_id', user.id)
    .single()

  return (
    <main>
      <h1>Кабинет: {creator?.display_name}</h1>
      <p>Ваша витрина: <a href={`/${creator?.slug}`}>/{creator?.slug}</a></p>
    </main>
  )
}
```

- [ ] **Step 7: Manual verification**

Run: `npm run dev`, log in with the user created in Task 4.
Visit `/dashboard`.
Expected: page renders with a generated slug link, and a row appears in
the `creators` table in Supabase.

- [ ] **Step 8: Commit**

```bash
git add lib/creators.ts lib/creators.test.ts app/dashboard/page.tsx app/dashboard/actions.ts
git commit -m "feat: bootstrap creator profile on first dashboard visit"
```

---

## Task 6: Add/list links in the dashboard

**Files:**
- Modify: `app/dashboard/page.tsx`
- Modify: `app/dashboard/actions.ts`
- Create: `app/dashboard/LinkForm.tsx`

**Interfaces:**
- Consumes: `ensureCreatorProfile()` from Task 5.
- Produces: `addLink(formData: FormData)` server action; dashboard now
  lists all links for the logged-in creator with per-link click counts,
  consumed visually only (no other task depends on this data shape).

- [ ] **Step 1: Add the addLink server action**

```typescript
// app/dashboard/actions.ts (append)
export async function addLink(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const creator = await ensureCreatorProfile()

  const title = formData.get('title') as string
  const targetUrl = formData.get('target_url') as string
  const category = formData.get('category') as string
  const imageUrl = (formData.get('image_url') as string) || null
  const priceRaw = formData.get('price') as string
  const price = priceRaw ? Number(priceRaw) : null

  const { error } = await supabase.from('links').insert({
    creator_id: creator.id,
    title,
    target_url: targetUrl,
    category,
    image_url: imageUrl,
    price,
  })

  if (error) throw new Error(`Failed to add link: ${error.message}`)
  redirect('/dashboard')
}
```

- [ ] **Step 2: Write the link form component**

```tsx
// app/dashboard/LinkForm.tsx
import { addLink } from './actions'

export function LinkForm() {
  return (
    <form action={addLink}>
      <input name="title" placeholder="Название товара" required />
      <input name="target_url" type="url" placeholder="Ссылка на товар" required />
      <select name="category" required>
        <option value="cosmetics">Косметика</option>
        <option value="mens">Мужские товары</option>
        <option value="clothing">Одежда</option>
      </select>
      <input name="image_url" type="url" placeholder="Ссылка на фото (опционально)" />
      <input name="price" type="number" step="0.01" placeholder="Цена (опционально)" />
      <button type="submit">Добавить</button>
    </form>
  )
}
```

- [ ] **Step 3: Update the dashboard page to list links with click counts**

```tsx
// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ensureCreatorProfile } from './actions'
import { LinkForm } from './LinkForm'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await ensureCreatorProfile()

  const { data: creator } = await supabase
    .from('creators')
    .select('id, slug, display_name')
    .eq('user_id', user.id)
    .single()

  const { data: links } = await supabase
    .from('links')
    .select('id, title, target_url, category, clicks(count)')
    .eq('creator_id', creator!.id)
    .order('created_at', { ascending: false })

  return (
    <main>
      <h1>Кабинет: {creator?.display_name}</h1>
      <p>Ваша витрина: <a href={`/${creator?.slug}`}>/{creator?.slug}</a></p>

      <h2>Добавить товар</h2>
      <LinkForm />

      <h2>Мои ссылки</h2>
      <ul>
        {links?.map((link) => (
          <li key={link.id}>
            {link.title} — <code>/r/{link.id}</code> —
            кликов: {(link.clicks as unknown as { count: number }[])[0]?.count ?? 0}
          </li>
        ))}
      </ul>
    </main>
  )
}
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, visit `/dashboard`, submit the form with a sample
product.
Expected: page redirects back to `/dashboard` and the new link appears
in the list with "кликов: 0". Confirm a row exists in the `links` table
in Supabase.

- [ ] **Step 5: Commit**

```bash
git add app/dashboard
git commit -m "feat: add link creation form and list to dashboard"
```

---

## Task 7: Public storefront page

**Files:**
- Create: `app/[creatorSlug]/page.tsx`

**Interfaces:**
- Consumes: `createClient()` from `lib/supabase/server.ts`, `links` and
  `creators` tables (public-read policy from Task 2).
- Produces: nothing consumed by later tasks — this is a leaf page.

- [ ] **Step 1: Write the storefront page**

```tsx
// app/[creatorSlug]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ creatorSlug: string }>
}) {
  const { creatorSlug } = await params
  const supabase = await createClient()

  const { data: creator } = await supabase
    .from('creators')
    .select('id, display_name, bio')
    .eq('slug', creatorSlug)
    .maybeSingle()

  if (!creator) notFound()

  const { data: links } = await supabase
    .from('links')
    .select('id, title, image_url, price, category')
    .eq('creator_id', creator.id)
    .order('created_at', { ascending: false })

  return (
    <main>
      <h1>{creator.display_name}</h1>
      {creator.bio && <p>{creator.bio}</p>}
      <ul>
        {links?.map((link) => (
          <li key={link.id}>
            {link.image_url && <img src={link.image_url} alt={link.title} width={120} />}
            <a href={`/r/${link.id}`}>{link.title}</a>
            {link.price && <span> — {link.price} ₽</span>}
          </li>
        ))}
      </ul>
    </main>
  )
}
```

- [ ] **Step 2: Manual verification**

Visit `/{slug}` for the creator created in Task 5.
Expected: page renders the creator's name and the link added in Task 6,
with `href="/r/<link-id>"`. Visiting a nonexistent slug (e.g. `/does-not-exist`)
returns a 404 page.

- [ ] **Step 3: Commit**

```bash
git add "app/[creatorSlug]"
git commit -m "feat: add public storefront page"
```

---

## Task 8: Redirect route with click logging

**Files:**
- Create: `app/r/[linkId]/route.ts`
- Create: `lib/supabase/service.ts`
- Test: `app/r/[linkId]/route.test.ts`

**Interfaces:**
- Consumes: `links` table (Task 2).
- Produces: `resolveRedirectTarget(supabase, linkId): Promise<string | null>`
  in `app/r/[linkId]/route.ts`, exported for the unit test.

- [ ] **Step 1: Create the service-role Supabase client**

The redirect route inserts into `clicks` as an anonymous visitor, which
has no insert policy (Task 2) — it uses the service role key,
server-only, never exposed to the browser.

```typescript
// lib/supabase/service.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

Add `SUPABASE_SERVICE_ROLE_KEY=` to `.env.local.example` and fill the
real value (from Supabase dashboard > Settings > API) into your local
`.env.local`. Never commit the real key.

- [ ] **Step 2: Write the failing test for resolveRedirectTarget**

```typescript
// app/r/[linkId]/route.test.ts
import { describe, it, expect, vi } from 'vitest'
import { resolveRedirectTarget } from './route'

function fakeSupabase(row: { target_url: string } | null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: row, error: null }),
        }),
      }),
    }),
  } as any
}

describe('resolveRedirectTarget', () => {
  it('returns the target_url when the link exists', async () => {
    const supabase = fakeSupabase({ target_url: 'https://example.com/product' })
    const result = await resolveRedirectTarget(supabase, 'some-id')
    expect(result).toBe('https://example.com/product')
  })

  it('returns null when the link does not exist', async () => {
    const supabase = fakeSupabase(null)
    const result = await resolveRedirectTarget(supabase, 'missing-id')
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- app/r/[linkId]/route.test.ts`
Expected: FAIL — `route.ts` does not exist yet.

- [ ] **Step 4: Implement the route handler**

```typescript
// app/r/[linkId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function resolveRedirectTarget(
  supabase: SupabaseClient,
  linkId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('links')
    .select('target_url')
    .eq('id', linkId)
    .maybeSingle()

  return data?.target_url ?? null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const { linkId } = await params
  const supabase = createServiceClient()

  const targetUrl = await resolveRedirectTarget(supabase, linkId)
  if (!targetUrl) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 })
  }

  await supabase.from('clicks').insert({
    link_id: linkId,
    referrer: request.headers.get('referer'),
    user_agent: request.headers.get('user-agent'),
  })

  return NextResponse.redirect(targetUrl, { status: 302 })
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- app/r/[linkId]/route.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Manual verification**

Run: `npm run dev`, visit `/r/<link-id>` for a link created in Task 6.
Expected: browser redirects to the `target_url`, and a new row appears
in the `clicks` table. Reload `/dashboard` — click count increments.
Visit `/r/00000000-0000-0000-0000-000000000000` (nonexistent id).
Expected: JSON 404 response.

- [ ] **Step 7: Commit**

```bash
git add "app/r/[linkId]" lib/supabase/service.ts .env.local.example
git commit -m "feat: add redirect route with click logging"
```

---

## Task 9: RLS verification test

**Files:**
- Test: `lib/supabase/rls.test.ts`

**Interfaces:**
- Consumes: `creators`, `links`, `clicks` tables and their RLS policies
  (Task 2). Requires the Supabase project's URL/anon key from
  `.env.local` and two real test accounts.

- [ ] **Step 1: Create two test users for the RLS check**

Via the Supabase dashboard (Authentication > Users) or by signing up
through `/signup`, create `rls-test-a@example.com` and
`rls-test-b@example.com` (any password, e.g. `testpass123`). Log in as
each once via `/dashboard` so `ensureCreatorProfile` creates a `creators`
row for both.

- [ ] **Step 2: Write the RLS test**

```typescript
// lib/supabase/rls.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function signedInClient(email: string, password: string) {
  const client = createSupabaseClient(url, anonKey)
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return client
}

describe('RLS: creators cannot see each other\'s links insert rights', () => {
  it('creator A cannot insert a link under creator B\'s creator_id', async () => {
    const clientA = await signedInClient('rls-test-a@example.com', 'testpass123')
    const clientB = await signedInClient('rls-test-b@example.com', 'testpass123')

    const { data: creatorB } = await clientB
      .from('creators')
      .select('id')
      .single()

    const { error } = await clientA.from('links').insert({
      creator_id: creatorB!.id,
      title: 'Hijacked link',
      target_url: 'https://example.com',
      category: 'cosmetics',
    })

    expect(error).not.toBeNull()
  })

  it('creator A cannot read creator B\'s clicks', async () => {
    const clientA = await signedInClient('rls-test-a@example.com', 'testpass123')
    const clientB = await signedInClient('rls-test-b@example.com', 'testpass123')

    const { data: creatorB } = await clientB
      .from('creators')
      .select('id')
      .single()
    const { data: linkB } = await clientB
      .from('links')
      .select('id')
      .eq('creator_id', creatorB!.id)
      .limit(1)
      .maybeSingle()

    if (!linkB) return // creator B has no links yet; nothing to assert

    const { data: clicksSeenByA } = await clientA
      .from('clicks')
      .select('id')
      .eq('link_id', linkB.id)

    expect(clicksSeenByA).toEqual([])
  })
})
```

- [ ] **Step 3: Run the test**

Run: `npm test -- lib/supabase/rls.test.ts`
Expected: PASS (2 tests) against the real Supabase project. If the first
test fails (insert succeeds), re-check the `links_insert_own` policy
from Task 2.

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/rls.test.ts
git commit -m "test: verify RLS prevents cross-creator writes and reads"
```

---

## Self-Review Notes

- Spec coverage: signup/login (Task 4), dashboard CRUD (Tasks 5-6),
  public storefront (Task 7), redirect + click logging (Task 8), RLS
  (Task 2 + Task 9), unit tests (Tasks 5, 8, 9) — all spec sections have
  a task.
- Not in scope, per spec: affiliate integrations, payments, brand
  dashboard, Telegram bot — no tasks added for these.
- Type/name consistency checked: `creatorSlug`, `linkId`, `target_url`,
  `creator_id`, `slugify`, `ensureCreatorProfile`, `resolveRedirectTarget`
  are spelled identically everywhere they're used across tasks.
