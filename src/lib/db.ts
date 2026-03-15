import { createClient, Client as LibsqlClient } from '@libsql/client';
import type { InArgs } from '@libsql/client';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';

// ---------------------------------------------------------------------------
// Runtime detection: Postgres if DATABASE_URL starts with "postgres://",
// otherwise SQLite (file at ./data/gametrack.db relative to project root).
// ---------------------------------------------------------------------------

const DATABASE_URL = process.env.DATABASE_URL || '';
const isPostgres = DATABASE_URL.startsWith('postgres://') || DATABASE_URL.startsWith('postgresql://');

// ---------------------------------------------------------------------------
// Unified DB interface
// ---------------------------------------------------------------------------

interface QueryResult {
  rows: Record<string, unknown>[];
}

let pgPool: Pool | null = null;
let sqliteClient: LibsqlClient | null = null;

function getSqlite(): LibsqlClient {
  if (!sqliteClient) {
    const dbDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const dbPath = path.join(dbDir, 'gametrack.db');
    sqliteClient = createClient({
      url: `file:${dbPath}`
    });
  }
  return sqliteClient;
}

function getPgPool(): Pool {
  if (!pgPool) {
    pgPool = new Pool({ connectionString: DATABASE_URL });
  }
  return pgPool;
}

// ---------------------------------------------------------------------------
// Generic query helpers
// ---------------------------------------------------------------------------

async function query(sql: string, params: unknown[] = []): Promise<QueryResult> {
  if (isPostgres) {
    let idx = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++idx}`);
    const result = await getPgPool().query(pgSql, params);
    return { rows: result.rows };
  } else {
    const db = getSqlite();
    const result = await db.execute({ sql, args: params as InArgs });
    return { rows: result.rows as unknown as Record<string, unknown>[] };
  }
}

async function run(sql: string, params: unknown[] = []): Promise<void> {
  if (isPostgres) {
    let idx = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++idx}`);
    await getPgPool().query(pgSql, params);
  } else {
    const db = getSqlite();
    await db.execute({ sql, args: params as InArgs });
  }
}

// ---------------------------------------------------------------------------
// Schema initialization — auto-creates tables on first call
// ---------------------------------------------------------------------------

let initialized = false;

export async function initDb(): Promise<void> {
  if (initialized) return;

  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      created_at ${isPostgres ? 'TIMESTAMP DEFAULT NOW()' : 'TEXT DEFAULT (datetime(\'now\'))'}
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS library (
      ${isPostgres ? 'id SERIAL PRIMARY KEY' : 'id INTEGER PRIMARY KEY AUTOINCREMENT'},
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      game_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      thumbnail TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Plan to Play',
      playtime REAL NOT NULL DEFAULT 0,
      added_at BIGINT NOT NULL,
      UNIQUE(user_id, game_id)
    )
  `);

  initialized = true;
}

// ---------------------------------------------------------------------------
// User operations
// ---------------------------------------------------------------------------

export async function createUser(id: string, passwordHash: string): Promise<void> {
  await initDb();
  await run('INSERT INTO users (id, password_hash) VALUES (?, ?)', [id, passwordHash]);
}

export async function getUser(id: string): Promise<{ id: string; password_hash: string; created_at: string } | null> {
  await initDb();
  const result = await query('SELECT id, password_hash, created_at FROM users WHERE id = ?', [id]);
  return (result.rows[0] as { id: string; password_hash: string; created_at: string }) || null;
}

// ---------------------------------------------------------------------------
// Library operations
// ---------------------------------------------------------------------------

export interface DbLibraryEntry {
  game_id: number;
  title: string;
  thumbnail: string;
  status: string;
  playtime: number;
  added_at: number;
}

export async function getUserLibrary(userId: string): Promise<DbLibraryEntry[]> {
  await initDb();
  const result = await query(
    'SELECT game_id, title, thumbnail, status, playtime, added_at FROM library WHERE user_id = ? ORDER BY added_at DESC',
    [userId]
  );
  return result.rows.map(row => ({
    game_id: Number(row.game_id),
    title: String(row.title),
    thumbnail: String(row.thumbnail),
    status: String(row.status),
    playtime: Number(row.playtime),
    added_at: Number(row.added_at),
  }));
}

export async function upsertGame(userId: string, game: DbLibraryEntry): Promise<void> {
  await initDb();
  if (isPostgres) {
    await run(
      `INSERT INTO library (user_id, game_id, title, thumbnail, status, playtime, added_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (user_id, game_id) DO UPDATE SET
         title = EXCLUDED.title,
         thumbnail = EXCLUDED.thumbnail,
         status = EXCLUDED.status,
         playtime = EXCLUDED.playtime,
         added_at = EXCLUDED.added_at`,
      [userId, game.game_id, game.title, game.thumbnail, game.status, game.playtime, game.added_at]
    );
  } else {
    await run(
      `INSERT INTO library (user_id, game_id, title, thumbnail, status, playtime, added_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (user_id, game_id) DO UPDATE SET
         title = excluded.title,
         thumbnail = excluded.thumbnail,
         status = excluded.status,
         playtime = excluded.playtime,
         added_at = excluded.added_at`,
      [userId, game.game_id, game.title, game.thumbnail, game.status, game.playtime, game.added_at]
    );
  }
}

export async function deleteGame(userId: string, gameId: number): Promise<void> {
  await initDb();
  await run('DELETE FROM library WHERE user_id = ? AND game_id = ?', [userId, gameId]);
}

export async function syncFullLibrary(userId: string, games: DbLibraryEntry[]): Promise<void> {
  await initDb();
  // Delete all existing entries for the user and re-insert
  await run('DELETE FROM library WHERE user_id = ?', [userId]);
  for (const game of games) {
    await run(
      'INSERT INTO library (user_id, game_id, title, thumbnail, status, playtime, added_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, game.game_id, game.title, game.thumbnail, game.status, game.playtime, game.added_at]
    );
  }
}
