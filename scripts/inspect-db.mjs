import duckdb from "duckdb";

const db = new duckdb.Database("nbfc-erp.duckdb", { access_mode: "READ_ONLY" }, (err) => {
  if (err) {
    if (err.message.includes("used by another process") || err.message.includes("File is already open")) {
      console.warn("\n[Notice] nbfc-erp.duckdb is currently in use by your running dev server (npm run dev).");
      console.warn("DuckDB uses exclusive file locking on Windows while the server is active.");
      console.warn("Your data is actively being saved to nbfc-erp.duckdb inside http://localhost:5173/");
      console.warn("To run this offline inspection tool, stop the dev server first (Ctrl+C in its terminal), or query via the app.\n");
      process.exit(0);
    }
    console.error("Connection error:", err.message);
    process.exit(1);
  }
});

const arg = process.argv[2];

if (!arg) {
  // Show table summary and row counts
  db.all("SHOW TABLES", (err, tables) => {
    if (err) {
      console.error("Query error:", err.message);
      process.exit(1);
    }
    console.log("\n--- Tables in nbfc-erp.duckdb ---");
    console.table(tables);

    let pending = tables.length;
    if (pending === 0) {
      console.log("No tables found.");
      process.exit(0);
    }

    const counts = [];
    tables.forEach((t) => {
      const tableName = t.name;
      db.all(`SELECT COUNT(*) as count FROM "${tableName}"`, (err, rows) => {
        counts.push({ Table: tableName, Rows: rows ? Number(rows[0].count) : "Err" });
        pending--;
        if (pending === 0) {
          counts.sort((a, b) => a.Table.localeCompare(b.Table));
          console.log("\n--- Row Counts ---");
          console.table(counts);
          console.log("\nTip: To view data in a table, run:");
          console.log("  node scripts/inspect-db.mjs <table_name>");
          console.log("  npm run db:inspect -- <table_name>");
          console.log("Or run custom SQL:");
          console.log('  node scripts/inspect-db.mjs "SELECT * FROM users LIMIT 10"');
          process.exit(0);
        }
      });
    });
  });
} else {
  // Custom query or table view
  const sql = arg.trim().toUpperCase().startsWith("SELECT")
    ? arg
    : `SELECT * FROM "${arg}" LIMIT 50`;

  console.log(`\nExecuting: ${sql}\n`);
  db.all(sql, (err, rows) => {
    if (err) {
      console.error("Query error:", err.message);
      process.exit(1);
    }
    if (!rows || rows.length === 0) {
      console.log("Empty result (0 rows).");
    } else {
      console.table(rows);
      console.log(`\nTotal rows displayed: ${rows.length}`);
    }
    process.exit(0);
  });
}
