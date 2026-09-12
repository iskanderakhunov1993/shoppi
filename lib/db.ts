import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set — copy .env.example to .env.local and fill it in");
}

const isTest = Boolean(process.env.VITEST);

// Tests run against a separate `test` schema in the same database
// rather than a different DATABASE_URL — not a stylistic choice, a
// fix for a real incident: __resetStoreForTests() truncates every
// table, and this project's dev/test setup previously pointed at the
// same schema as production, so every test run silently wiped real
// signups. `search_path` makes every unqualified table/sequence name
// in this file resolve inside `test` instead, so TRUNCATE can no
// longer reach `public` no matter what runs the suite.
export const sql = postgres(connectionString, {
  prepare: false,
  ssl: "require",
  max: isTest ? 3 : 10,
  connection: isTest ? { search_path: "test" } : undefined,
});

export async function nextSeq(): Promise<number> {
  const rows = await sql<{ nextval: string }[]>`SELECT nextval('links_seq_counter')`;
  return Number(rows[0].nextval);
}
