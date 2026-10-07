import type { SessionMode } from "@/lib/profile/student-profile";

/**
 * Session log database — browser IndexedDB.
 *
 * Persists completed (and abandoned) practice sessions beyond the storage
 * quota of localStorage, indexed by start time so the log can be rendered
 * newest-first. Every function degrades silently when IndexedDB is
 * unavailable (old browsers, private mode) so the app keeps working.
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

const DB_NAME = "maths-app";
const DB_VERSION = 1;
const STORE = "sessions";

let dbPromise: Promise<IDBDatabase> | null = null;

function isSupported(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  if (!isSupported()) return Promise.reject(new Error("IndexedDB unavailable"));
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
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
  return dbPromise;
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
    tx.objectStore(STORE).put(record);
    await txDone(tx);
  } catch {
    // IndexedDB is a bonus — losing a session log must never break practice.
  }
}

export async function listSessionRecords(limit = 100): Promise<SessionRecord[]> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const all = (await requestToPromise(store.index("startedAt").getAll())).slice(
      0,
      limit
    );
    await txDone(tx);
    return all.sort((a, b) => b.startedAt - a.startedAt);
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
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    await txDone(tx);
  } catch {
    // ignore
  }
}