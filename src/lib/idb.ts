import type { ClassSession } from "./types";

const DB_NAME = "aulavoz";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("sessions")) {
        db.createObjectStore("sessions", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("audio")) {
        db.createObjectStore("audio");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function listSessions(): Promise<ClassSession[]> {
  const db = await openDb();
  const tx = db.transaction("sessions", "readonly");
  const rows = await reqToPromise(tx.objectStore("sessions").getAll());
  return (rows as ClassSession[]).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export async function getSession(id: string): Promise<ClassSession | undefined> {
  const db = await openDb();
  const tx = db.transaction("sessions", "readonly");
  return reqToPromise(tx.objectStore("sessions").get(id));
}

export async function putSession(session: ClassSession): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("sessions", "readwrite");
  await reqToPromise(tx.objectStore("sessions").put(session));
}

export async function deleteSession(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(["sessions", "audio"], "readwrite");
  await reqToPromise(tx.objectStore("sessions").delete(id));
  await reqToPromise(tx.objectStore("audio").delete(`${id}:original`));
  await reqToPromise(tx.objectStore("audio").delete(`${id}:podcast`));
}

export async function putAudio(
  sessionId: string,
  kind: "original" | "podcast",
  blob: Blob,
): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("audio", "readwrite");
  await reqToPromise(tx.objectStore("audio").put(blob, `${sessionId}:${kind}`));
}

export async function getAudio(
  sessionId: string,
  kind: "original" | "podcast",
): Promise<Blob | undefined> {
  const db = await openDb();
  const tx = db.transaction("audio", "readonly");
  return reqToPromise(tx.objectStore("audio").get(`${sessionId}:${kind}`));
}
