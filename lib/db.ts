import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set — copy .env.example to .env.local and fill it in");
}

// `prepare: false` is required against Supabase's transaction pooler
// (pgbouncer in transaction mode does not support prepared statements
// across requests, which is otherwise postgres.js's default).
export const sql = postgres(connectionString, {
  prepare: false,
  ssl: "require",
  max: process.env.VITEST ? 3 : 10,
});

export async function nextSeq(): Promise<number> {
  const rows = await sql<{ nextval: string }[]>`SELECT nextval('links_seq_counter')`;
  return Number(rows[0].nextval);
}
