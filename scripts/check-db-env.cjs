/**
 * Verifica che DATABASE_URL o le variabili MYSQL_* siano presenti (allineamento con Plesk).
 * Non si connette al DB: solo controllo configurazione.
 */
const { loadProjectEnv } = require("./load-env.cjs");

function main() {
  loadProjectEnv();

  const databaseUrl = process.env.DATABASE_URL?.trim();
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  const port = Number(process.env.MYSQL_PORT) || 3306;

  if (
    !databaseUrl &&
    (!host || !user || password === undefined || !database)
  ) {
    console.error(
      "[db:check] Manca la configurazione DB. Imposta DATABASE_URL oppure MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE in .env.production (o .env) sul server, allineata a Plesk."
    );
    process.exit(1);
  }

  console.log("[db:check] Configurazione DB OK (allineamento env):");
  if (databaseUrl) {
    try {
      const u = new URL(databaseUrl);
      const db = u.pathname.replace(/^\//, "") || "(n/d)";
      console.log(
        `  DATABASE_URL → ${u.protocol}//${u.hostname}:${u.port || 3306}/${db}`
      );
    } catch {
      console.log("  DATABASE_URL presente (formato non URL standard)");
    }
  } else {
    console.log(
      `  MYSQL → ${host}:${port} / ${database} (user: ${user})`
    );
  }
}

main();
