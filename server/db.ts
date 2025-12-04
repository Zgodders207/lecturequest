import * as schema from "@shared/schema";

// Export a flag indicating whether a real database is available.
export const hasDatabase = !!process.env.DATABASE_URL;

// Export `db` at top-level and initialize it below. Using a top-level
// mutable export avoids conditional `export` statements which are not
// valid syntax.
export let db: any = null;

if (hasDatabase) {
  // If a DATABASE_URL is provided, wire up the Neon driver.
  const { Pool, neonConfig } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-serverless");
  const ws = (await import("ws")).default;

  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
} else {
  // No remote DB configured — leave `db` as null. The storage module will
  // detect this and fall back to an in-memory implementation.
  console.warn("No DATABASE_URL configured — running with in-memory storage (no DB)");
  db = null;
}
