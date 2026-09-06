import { create } from "zustand";
import type { ClassNotes, ClassSession, PodcastDraft } from "./types";
import {
  deleteSession,
  getSession,
  listSessions,
  putSession,
} from "./idb";
import { SAMPLE_SESSION } from "./sample-session";

type LibraryState = {
  ready: boolean;
  sessions: ClassSession[];
  load: () => Promise<void>;
  upsert: (session: ClassSession) => Promise<void>;
  remove: (id: string) => Promise<void>;
  patch: (
    id: string,
    patch: Partial<ClassSession>,
  ) => Promise<ClassSession | undefined>;
  setNotes: (id: string, notes: ClassNotes) => Promise<void>;
  setPodcast: (id: string, podcast: PodcastDraft, hasAudio: boolean) => Promise<void>;
};

export const useLibrary = create<LibraryState>((set, get) => ({
  ready: false,
  sessions: [],
  load: async () => {
    try {
      let rows = await listSessions();
      if (rows.length === 0) {
        await putSession(SAMPLE_SESSION);
        rows = [SAMPLE_SESSION];
      }
      set({ sessions: rows, ready: true });
    } catch {
      set({ sessions: [SAMPLE_SESSION], ready: true });
    }
  },
  upsert: async (session) => {
    await putSession(session);
    const sessions = [session, ...get().sessions.filter((s) => s.id !== session.id)];
    sessions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    set({ sessions });
  },
  remove: async (id) => {
    await deleteSession(id);
    set({ sessions: get().sessions.filter((s) => s.id !== id) });
  },
  patch: async (id, patch) => {
    const current =
      get().sessions.find((s) => s.id === id) ?? (await getSession(id));
    if (!current) return undefined;
    const next = { ...current, ...patch };
    await putSession(next);
    set({
      sessions: get().sessions.map((s) => (s.id === id ? next : s)),
    });
    return next;
  },
  setNotes: async (id, notes) => {
    await get().patch(id, { notes });
  },
  setPodcast: async (id, podcast, hasAudio) => {
    await get().patch(id, { podcast, hasPodcastAudio: hasAudio });
  },
}));
