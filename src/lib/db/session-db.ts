import type { SessionMode } from "@/lib/profile/student-profile";
import {
  ACCOUNT_SWITCH_EVENT,
  DEFAULT_USER,
  getActiveUser,
} from "@/lib/profile/accounts";

/**
 * Session log database — browser IndexedDB.
 *
 * Persists completed (and abandoned) practice sessions beyond the storage
 * quota of localStorage, indexed by start time so the log can be rendered
 * newest-first. Every account gets its own database so progress never mixes.
 * Sessions saved before accounts existed live once (and only once) in the
 * default account's database after a one-time migration.
 */

export interface SessionResultItem {
  correct: boolean;
  marksAwarded: number;
  marksAvailable: number;
  timeSeconds: number;
  chapter: string;
  title: string;
}

export interface SessionRecord {
  id: string;
  user: string;
  startedAt: number;
  finishedAt: number;
  abandoned: boolean;
  mode: SessionMode;
  conditions: "gentle" | "realistic" | "strict" | null;
  count: number;
  attempts: number;
  correct: number;
  marksAwarded: number;
  marksAvailable: number;
  pace: number;
  slowCount: number;
  strongest: string | null;
  results: SessionResultItem[];
}

/** The account that owns the current browser session. */
export function sessionUser(): string {
  return getActiveUser();
}

const DB_NAME_LEGACY = "maths-app";
const DB_VERSION = 1;
const STORE = "sessions";
const MIGRATED_KEY = "edexcel-sessions-migrated";

let dbPromise: Promise<IDBDatabase> | null = null;

function isSupported(): boolean {
  return typeof indexedDB !== "undefined";
}

function dbNameFor(user: string): string {
  return `maths-app:${user}`;
}

function openDbNamed(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("startedAt", "startedAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Failed to open session database"));
  });
}

/**
 * One-time step: sessions recorded before accounts existed lived in the
 * shared `maths-app` database. Adopt them into the default account's own
 * database the first time that account opens it.
 */
async function migrateLegacySessions(target: IDBDatabase): Promise<void> {
  if (getActiveUser() !== DEFAULT_USER) return;
  try {
    if (window.localStorage.getItem(MIGRATED_KEY)) return;
  } catch {
    return;
  }
  try {
    const legacy = await openDbNamed(DB_NAME_LEGACY);
    const rows: unknown[] = await (async () => {
      const tx = legacy.transaction(STORE, "readonly");
      try {
        const all = await requestToPromise(tx.objectStore(STORE).getAll());
        await txDone(tx);
        return all;
      } catch {
        return [];
      }
    })();
    if (legacy.objectStoreNames.contains(STORE) && rows.length > 0) {
      const tx = target.transaction(STORE, "readwrite");
      for (const row of rows) {
        tx.objectStore(STORE).put({ ...(row as SessionRecord), user: DEFAULT_USER });
      }
      await txDone(tx);
    }
    legacy.close();
    try {
      window.localStorage.setItem(MIGRATED_KEY, "1");
    } catch {
      // flag best-effort — migration is idempotent anyway
    }
  } catch {
    // non-fatal: the legacy log stays put and the flag stays unset
  }
}

async function openDb(): Promise<IDBDatabase> {
  if (!isSupported()) return Promise.reject(new Error("IndexedDB unavailable"));
  if (!dbPromise) {
    dbPromise = openDbNamed(dbNameFor(getActiveUser())).then(async (db) => {
      await migrateLegacySessions(db);
      return db;
    });
  }
  return dbPromise;
}

// Each account has its own database — drop the cached handle on switch.
if (typeof window !== "undefined") {
  window.addEventListener(ACCOUNT_SWITCH_EVENT, () => {
    dbPromise = null;
  });
}

function requestToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB request failed"));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Transaction failed"));
    tx.onabort = () => reject(tx.error ?? new Error("Transaction aborted"));
  });
}

export function isSessionDbSupported(): boolean {
  return isSupported();
}

export async function saveSessionRecord(record: SessionRecord): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ ...record, user: record.user || getActiveUser() });
    await txDone(tx);
  } catch {
    // IndexedDB is a bonus — losing a session log must never break practice.
  }
}

export async function listSessionRecords(
  limit = 100,
  user: string | null = null
): Promise<SessionRecord[]> {
  try {
    const active = user ?? getActiveUser();
    const db = await openDb();
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const all = (await requestToPromise(store.index("startedAt").getAll())).slice(
      0,
      limit
    );
    await txDone(tx);
    return all
      .filter((r) => (r.user ?? DEFAULT_USER) === active)
      .sort((a, b) => b.startedAt - a.startedAt);
  } catch {
    return [];
  }
}

export async function countSessionRecords(): Promise<number> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, "readonly");
    const n = await requestToPromise(tx.objectStore(STORE).count());
    await txDone(tx);
    return n;
  } catch {
    return 0;
  }
}

export async function clearSessionRecords(): Promise<void> {
  try {
    const active = getActiveUser();
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    await new Promise<void>((resolve, reject) => {
      const req = store.openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          if ((cursor.value.user ?? DEFAULT_USER) === active) cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => reject(req.error ?? new Error("Failed to clear sessions"));
    });
    await txDone(tx);
  } catch {
    // ignore
  }
}