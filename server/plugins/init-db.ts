import { initDb } from "../../app/server/db.ts";

/**
 * Nitro plugin to automatically initialize Cassmart DuckDB schema on server start.
 */
export default function () {
  initDb().catch((err) => {
    console.error("[Cassmart DB] Failed to initialize database in Nitro plugin:", err);
  });
}
