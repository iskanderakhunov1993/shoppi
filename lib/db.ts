import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set — copy .env.example to .env.local and fill it in");
}

const isTest = Boolean(process.env.VITEST);

// One database, three schemas, picked per process — every unqualified
// table/sequence name in this file resolves inside the chosen schema.
//
// - `test` for vitest: __resetStoreForTests() truncates every table, and
//   when tests once shared the production schema every run silently
//   wiped real signups.
// - `public` only for production builds (Vercel, `next start`).
// - `dev` for everything else — `next dev`, seed/simulation scripts. The
//   local dev server used to write straight into production: the demo
//   seed that runs on public pages kept re-creating fake creators on the
//   live site.
//
// DB_SCHEMA overrides the choice, e.g. to point a one-off script at prod
// on purpose. New migrations have to be applied to all three schemas.
const schema =
  process.env.DB_SCHEMA ?? (isTest ? "test" : process.env.NODE_ENV === "production" ? "public" : "dev");

export const sql = postgres(connectionString, {
  prepare: false,
  ssl: "require",
  max: isTest ? 3 : 10,
  connection: schema === "public" ? undefined : { search_path: schema },
});

export async function nextSeq(): Promise<number> {
  const rows = await sql<{ nextval: string }[]>`SELECT nextval('links_seq_counter')`;
  return Number(rows[0].nextval);
}
