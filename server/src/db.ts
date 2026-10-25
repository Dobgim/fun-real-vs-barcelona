import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const defaultPath = fileURLToPath(new URL('../data/clasico.db', import.meta.url));
const dbPath = process.env.DB_PATH ? resolve(process.env.DB_PATH) : defaultPath;
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS kv (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS visitors (
    visitor_id TEXT PRIMARY KEY,
    side TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS predictions (
    visitor_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    home INTEGER NOT NULL,
    away INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS poll (
    visitor_id TEXT PRIMARY KEY,
    choice TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS ratings (
    visitor_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    value INTEGER NOT NULL,
    PRIMARY KEY (visitor_id, player_id)
  );
  CREATE TABLE IF NOT EXISTS nerves (
    visitor_id TEXT PRIMARY KEY,
    value INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reactions (
    type TEXT PRIMARY KEY,
    count INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS bingo_winners (
    visitor_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    at INTEGER NOT NULL
  );
`);

export function kvGet<T>(key: string): T | null {
  const row = db.prepare('SELECT value FROM kv WHERE key = ?').get(key) as { value: string } | undefined;
  return row ? (JSON.parse(row.value) as T) : null;
}

export function kvSet(key: string, value: unknown) {
  db.prepare('INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(
    key,
    JSON.stringify(value),
  );
}
