/**
 * Database connection management and migration runner.
 *
 * Uses better-sqlite3 for Node.js environments.
 * For React Native, use op-sqlite or expo-sqlite with the same SQL.
 *
 * Install: pnpm add better-sqlite3 && pnpm add -D @types/better-sqlite3
 */

import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export type DB = Database.Database;

let _db: DB | null = null;

/**
 * Open (or return cached) the SQLite database.
 * @param dbPath - File path for the SQLite database. Use ":memory:" for tests.
 */
export function openDatabase(dbPath: string): DB {
  if (_db) return _db;

  _db = new Database(dbPath, { verbose: undefined });

  // Enable WAL mode and foreign keys
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  _db.pragma("synchronous = NORMAL");

  runMigrations(_db);
  return _db;
}

export function closeDatabase(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

function runMigrations(db: DB): void {
  // Create migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      filename  TEXT    NOT NULL UNIQUE,
      applied_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);

  const migrationDir = join(__dirname, "migrations");
  const migrationFiles = ["001_initial.sql"];

  for (const filename of migrationFiles) {
    const alreadyApplied = db
      .prepare("SELECT 1 FROM _migrations WHERE filename = ?")
      .get(filename);

    if (!alreadyApplied) {
      const sql = readFileSync(join(migrationDir, filename), "utf-8");
      db.exec(sql);
      db.prepare("INSERT INTO _migrations (filename) VALUES (?)").run(filename);
      console.log(`[db] Applied migration: ${filename}`);
    }
  }
}
