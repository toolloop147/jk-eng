import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { getPool } from "./pool";

dotenv.config();

const MIGRATION_TABLE = "schema_migrations";

function getInitDir(): string {
  return path.resolve(__dirname, "../../../docker/auth-db/init");
}

function listMigrationFiles(): string[] {
  const initDir = getInitDir();
  if (!fs.existsSync(initDir)) {
    throw new Error(`Migration directory not found: ${initDir}`);
  }

  return fs
    .readdirSync(initDir)
    .filter((file) => /^\d{3}_.+\.sql$/.test(file))
    .sort();
}

async function ensureMigrationTable(): Promise<void> {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function isApplied(filename: string): Promise<boolean> {
  const result = await getPool().query(
    `SELECT 1 FROM ${MIGRATION_TABLE} WHERE filename = $1`,
    [filename]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

export async function runMigrations(): Promise<void> {
  if (process.env.RUN_MIGRATIONS === "false") return;

  await ensureMigrationTable();

  const files = listMigrationFiles();
  const businessMigrations = files.filter((file) => file >= "003_");

  for (const filename of businessMigrations) {
    if (await isApplied(filename)) continue;

    const sqlPath = path.join(getInitDir(), filename);
    const sql = fs.readFileSync(sqlPath, "utf8");

    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        `INSERT INTO ${MIGRATION_TABLE} (filename) VALUES ($1)`,
        [filename]
      );
      await client.query("COMMIT");
      console.log(`Applied migration: ${filename}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log("Migrations complete.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}
