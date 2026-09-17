import { initDb, closeDb, DB_FILE_PATH } from "../app/server/db.ts";

async function main() {
  console.log("------------------------------------------------------------");
  console.log("Cassmart Micro Foundations — DuckDB Database Setup");
  console.log(`Target: ${DB_FILE_PATH}`);
  console.log("------------------------------------------------------------");

  try {
    await initDb();
    console.log("✓ Empty database tables and ENUM types ready for real data.");
  } catch (error) {
    console.error("✗ Database initialization failed:", error);
    process.exitCode = 1;
  } finally {
    await closeDb();
  }
}

main();
