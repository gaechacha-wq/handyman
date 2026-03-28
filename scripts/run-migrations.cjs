/**
 * Applica in ordine i file .sql in db/migrations/.
 * Traccia le migrazioni già eseguite nella tabella schema_migrations.
 *
 * Legge variabili da .env.local, .env.production, .env (senza dipendenze extra).
 */
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

function sqlBodyEffective(sql) {
  return sql
    .replace(/--[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();
}

async function main() {
  const root = process.cwd();
  loadEnvFile(path.join(root, ".env.local"));
  loadEnvFile(path.join(root, ".env.production"));
  loadEnvFile(path.join(root, ".env"));

  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  const port = Number(process.env.MYSQL_PORT) || 3306;

  if (!host || !user || password === undefined || !database) {
    console.error(
      "Mancano MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD o MYSQL_DATABASE nell'ambiente o nei file .env*."
    );
    process.exit(1);
  }

  const migrationsDir = path.join(root, "db", "migrations");
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true,
  });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) NOT NULL PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("Nessun file .sql in db/migrations — nulla da applicare.");
    await conn.end();
    return;
  }

  for (const file of files) {
    const [applied] = await conn.query(
      "SELECT 1 AS ok FROM schema_migrations WHERE filename = ? LIMIT 1",
      [file]
    );
    if (applied.length > 0) {
      console.log(`Già applicata: ${file}`);
      continue;
    }

    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, "utf8");
    const body = sqlBodyEffective(sql);

    if (!body) {
      console.warn(
        `Migrazione vuota (solo commenti): ${file} — segnata come applicata.`
      );
      await conn.query("INSERT INTO schema_migrations (filename) VALUES (?)", [
        file,
      ]);
      continue;
    }

    console.log(`Applico: ${file}`);
    await conn.query(sql);
    await conn.query("INSERT INTO schema_migrations (filename) VALUES (?)", [
      file,
    ]);
  }

  await conn.end();
  console.log("Migrazioni completate.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
