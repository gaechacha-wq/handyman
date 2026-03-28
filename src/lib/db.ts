import mysql from "mysql2/promise";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return v;
}

const globalForDb = globalThis as unknown as {
  mysqlPool?: mysql.Pool;
};

export function getPool(): mysql.Pool {
  if (!globalForDb.mysqlPool) {
    globalForDb.mysqlPool = mysql.createPool({
      host: requireEnv("MYSQL_HOST"),
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: requireEnv("MYSQL_USER"),
      password: requireEnv("MYSQL_PASSWORD"),
      database: requireEnv("MYSQL_DATABASE"),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return globalForDb.mysqlPool;
}
