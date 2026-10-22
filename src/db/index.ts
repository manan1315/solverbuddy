import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const globalForDb = globalThis as typeof globalThis & {
  __dbInstance?: ReturnType<typeof drizzle>;
};

function getDb() {
  if (globalForDb.__dbInstance) return globalForDb.__dbInstance;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return {
      select: () => ({
        from: () => ({
          where: () => Promise.resolve([]),
        }),
      }),
      insert: () => ({
        values: () => Promise.resolve(),
      }),
      update: () => ({
        set: () => ({
          where: () => Promise.resolve(),
        }),
      }),
      delete: () => ({
        where: () => Promise.resolve(),
      }),
      query: {
        findFirst: () => Promise.resolve(null),
        findMany: () => Promise.resolve([]),
      },
    } as any;
  }
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
