import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type { DemoAppState } from "@/backend/types";

type SqliteDatabase = {
  exec(sql: string): void;
  prepare(sql: string): {
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown;
    run(...params: unknown[]): unknown;
  };
  close?(): void;
};

function loadSqlite() {
  const require = createRequire(import.meta.url);
  const { DatabaseSync } = require("node:sqlite") as typeof import("node:sqlite");
  return DatabaseSync;
}

function schemaPath() {
  return join(process.cwd(), "database", "schema", "schema.sql");
}

export function createInMemoryDemoDatabase() {
  const DatabaseSync = loadSqlite();
  const database = new DatabaseSync(":memory:");
  database.exec(readFileSync(schemaPath(), "utf8"));
  return database;
}

export function verifyWorkspaceColumns(database = createInMemoryDemoDatabase()) {
  const tables = [
    "workspace_members",
    "brand_profiles",
    "style_examples",
    "drafts",
    "draft_versions",
    "media_assets",
    "prompt_versions",
    "publish_jobs",
    "schedule_jobs",
    "analytics_snapshots",
    "integration_settings",
    "integration_logs",
    "audit_events",
    "content_ideas",
    "onboarding_checklist_items"
  ];

  return tables.map((table) => {
    const columns = database.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    return { table, hasWorkspaceId: columns.some((column) => column.name === "workspaceId") };
  });
}

export type DemoStateStore = {
  load(): DemoAppState | null;
  save(state: DemoAppState): void;
  reset(state: DemoAppState): void;
  close(): void;
};

export function defaultDemoDatabasePath() {
  return process.env.FYF_DEMO_DB_PATH ?? join(process.cwd(), "database", "local", "demo-state.sqlite");
}

function openDemoDatabase(dbPath: string): SqliteDatabase {
  if (dbPath !== ":memory:") {
    mkdirSync(dirname(dbPath), { recursive: true });
  }

  const DatabaseSync = loadSqlite();
  const database = new DatabaseSync(dbPath) as SqliteDatabase;
  const existingSchema = database
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get("workspaces");
  if (!existingSchema) {
    database.exec(readFileSync(schemaPath(), "utf8"));
  }
  database.exec(`
    CREATE TABLE IF NOT EXISTS demo_state_snapshots (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
  return database;
}

function isDemoAppStateLike(value: unknown): value is Partial<DemoAppState> {
  if (!value || typeof value !== "object") return false;
  const state = value as Record<string, unknown>;
  return Object.values(state).every((value) => value === undefined || Array.isArray(value));
}

export function createSqliteDemoStateStore(dbPath = defaultDemoDatabasePath()): DemoStateStore {
  const database = openDemoDatabase(dbPath);

  return {
    load() {
      const row = database.prepare("SELECT payload FROM demo_state_snapshots WHERE id = ?").get("active") as
        | { payload: string }
        | undefined;
      if (!row) return null;

      try {
        const parsed = JSON.parse(row.payload) as unknown;
        if (!isDemoAppStateLike(parsed)) return null;
        return parsed as DemoAppState;
      } catch {
        return null;
      }
    },
    save(state) {
      database
        .prepare(
          `INSERT INTO demo_state_snapshots (id, payload, updatedAt)
           VALUES (?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updatedAt = excluded.updatedAt`
        )
        .run("active", JSON.stringify(state), new Date().toISOString());
    },
    reset(state) {
      this.save(state);
    },
    close() {
      database.close?.();
    }
  };
}

export function hasLocalDemoDatabase(dbPath = defaultDemoDatabasePath()) {
  return dbPath !== ":memory:" && existsSync(dbPath);
}
