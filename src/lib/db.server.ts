/**
 * Server-only PostgreSQL pool.
 * Import only from *.server.ts or createServerFn handlers — never from client code.
 */
import { Pool } from "pg";

let _pool: Pool | null = null;

export function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
    });
  }
  return _pool;
}
