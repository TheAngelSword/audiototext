import type { BitacoraPost, NewBitacoraPost } from "../types/bitacora";

const DB_NAME = "atrio-bitacora";
const DB_VERSION = 1;
const STORE = "posts";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listBitacoraPosts(): Promise<BitacoraPost[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => {
      const posts = (request.result as BitacoraPost[])
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((post) => ({
          ...post,
          photos: post.photos.map((photo) => ({
            ...photo,
            url: photo.blob ? URL.createObjectURL(photo.blob) : photo.url,
          })),
        }));
      resolve(posts);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function createBitacoraPost(input: NewBitacoraPost): Promise<BitacoraPost> {
  const post: BitacoraPost = {
    id: crypto.randomUUID(),
    authorName: input.authorName,
    authorInitials: input.authorName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join(""),
    createdAt: new Date().toISOString(),
    subject: input.subject,
    text: input.text.trim(),
    photos: input.photos.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      blob: file,
    })),
  };

  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(post);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return post;
}

export async function deleteBitacoraPost(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
