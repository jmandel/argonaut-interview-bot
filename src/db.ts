import { Database } from "bun:sqlite";
import { randomBytes } from "crypto";
import { getDefaultSystemPrompt, getDefaultFormConfig, EXTRACTION_PROMPT, SYNTHESIS_PROMPT } from "./prompts";

const db = new Database("data.db", { create: true });

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    created_at TEXT DEFAULT (datetime('now')),
    status TEXT DEFAULT 'active' CHECK(status IN ('active','closed'))
  );

  CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id),
    name TEXT NOT NULL,
    organization TEXT DEFAULT '',
    archetype TEXT NOT NULL,
    custom_role TEXT DEFAULT '',
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'joined' CHECK(status IN ('joined','interviewing','completed')),
    archived INTEGER DEFAULT 0 CHECK(archived IN (0,1)),
    archived_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_id TEXT NOT NULL REFERENCES participants(id),
    role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS extractions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_id TEXT NOT NULL REFERENCES participants(id),
    message_id INTEGER REFERENCES messages(id),
    extraction_type TEXT NOT NULL CHECK(extraction_type IN ('incremental','full')),
    data TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL REFERENCES sessions(id),
    analysis_type TEXT NOT NULL CHECK(analysis_type IN ('per_conversation','synthesis')),
    participant_id TEXT REFERENCES participants(id),
    data TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Add new columns to sessions table (SQLite doesn't support IF NOT EXISTS for ALTER TABLE)
for (const col of [
  "system_prompt TEXT DEFAULT ''",
  "form_config TEXT DEFAULT '{}'",
  "extraction_prompt TEXT DEFAULT ''",
  "synthesis_prompt TEXT DEFAULT ''",
]) {
  try {
    db.exec(`ALTER TABLE sessions ADD COLUMN ${col}`);
  } catch {
    // Column already exists — ignore
  }
}

for (const col of [
  "archived INTEGER DEFAULT 0",
  "archived_at TEXT",
]) {
  try {
    db.exec(`ALTER TABLE participants ADD COLUMN ${col}`);
  } catch {
    // Column already exists — ignore
  }
}

db.exec("UPDATE participants SET archived = 0 WHERE archived IS NULL");

// Backfill any sessions with empty config
const emptySessions = db.query("SELECT id FROM sessions WHERE system_prompt = '' OR form_config = '{}'").all() as { id: string }[];
if (emptySessions.length > 0) {
  const stmt = db.prepare("UPDATE sessions SET system_prompt = ?, form_config = ?, extraction_prompt = ?, synthesis_prompt = ? WHERE id = ?");
  const defaults = {
    system_prompt: getDefaultSystemPrompt(),
    form_config: JSON.stringify(getDefaultFormConfig()),
    extraction_prompt: EXTRACTION_PROMPT,
    synthesis_prompt: SYNTHESIS_PROMPT,
  };
  for (const s of emptySessions) {
    stmt.run(defaults.system_prompt, defaults.form_config, defaults.extraction_prompt, defaults.synthesis_prompt, s.id);
  }
  console.log(`Backfilled ${emptySessions.length} session(s) with default prompts`);
}

export function generateId(): string {
  return randomBytes(12).toString("hex");
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function generateToken(): string {
  return randomBytes(24).toString("hex");
}

export default db;
