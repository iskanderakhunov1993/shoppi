import { defineConfig } from 'vitest/config'
import path from 'path'

try {
  process.loadEnvFile(path.resolve(__dirname, '.env.local'))
} catch {
  // no .env.local (e.g. CI with DATABASE_URL already in the environment)
}

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    // Tests share one real Postgres database (Supabase) rather than a
    // fresh in-memory SQLite per process, so two test files truncating
    // tables at the same time would stomp on each other's fixtures.
    fileParallelism: false,
  },
})
