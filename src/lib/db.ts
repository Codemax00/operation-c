import { createClient, Client } from '@libsql/client';

const TURSO_URL = process.env.TURSO_DATABASE_URL || 'libsql://c-academy-codemax00.aws-ap-south-1.turso.io';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODkwNjA4MTIsImlkIjoiMDFhMDhjNTMtNjIwMS03MmVkLTg2YzYtZTM5NzZmNGY2NDAyIiwia2lkIjoiY0hFMUN1b3d0ZkRwUFF0QjR4MUZUQ2xVQ3VXV0tKWm1lU0RjekVock1GQSIsInJpZCI6ImIyNmMyZmNkLTFlNjYtNDU5My04ZGNjLWFhMzFiYzcwZTlkNSJ9.pCWklFpiXa64Dypau6kXLMV69FHUfs_CBwiIBrb3BYmdGuW3Da0HtbrXkhffi38UC1l-Q-a32R8C5JMFiOYSCQ';

let clientInstance: Client | null = null;

export function getClient(): Client {
  if (!clientInstance) {
    clientInstance = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN,
    });
  }
  return clientInstance;
}

export function getDb() {
  const client = getClient();
  return {
    async all<T = any>(sql: string, ...args: any[]): Promise<T[]> {
      const flatArgs = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
      const res = await client.execute({ sql, args: flatArgs });
      return res.rows as unknown as T[];
    },
    async get<T = any>(sql: string, ...args: any[]): Promise<T | null> {
      const flatArgs = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
      const res = await client.execute({ sql, args: flatArgs });
      return (res.rows[0] as unknown as T) || null;
    },
    async run(sql: string, ...args: any[]): Promise<{ rowsAffected: number; lastInsertRowid?: any }> {
      const flatArgs = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
      const res = await client.execute({ sql, args: flatArgs });
      return { rowsAffected: res.rowsAffected, lastInsertRowid: res.lastInsertRowid };
    },
    async exec(sql: string): Promise<void> {
      await client.executeMultiple(sql);
    },
    prepare(sql: string) {
      return {
        all: async <T = any>(...args: any[]): Promise<T[]> => {
          const flatArgs = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
          const res = await client.execute({ sql, args: flatArgs });
          return res.rows as unknown as T[];
        },
        get: async <T = any>(...args: any[]): Promise<T | null> => {
          const flatArgs = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
          const res = await client.execute({ sql, args: flatArgs });
          return (res.rows[0] as unknown as T) || null;
        },
        run: async (...args: any[]) => {
          const flatArgs = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
          const res = await client.execute({ sql, args: flatArgs });
          return { rowsAffected: res.rowsAffected, lastInsertRowid: res.lastInsertRowid };
        }
      };
    }
  };
}
