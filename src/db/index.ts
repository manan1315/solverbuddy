import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const globalForDb = globalThis as typeof globalThis & {
  __dbInstance?: ReturnType<typeof drizzle>;
};

function getDb() {
  if (globalForDb.__dbInstance) return globalForDb.__dbInstance;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const sql = neon(databaseUrl);
  const db = drizzle(sql);
  globalForDb.__dbInstance = db;
  return db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
});
