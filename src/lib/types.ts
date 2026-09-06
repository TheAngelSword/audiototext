export type SourceKind = "record" | "upload" | "sample";

export type TranscriptWord = {
  text: string;
  start: number;
  end: number;
  speaker?: string;
};

export type ClassNotes = {
  summary: string;
  outline: string[];
  keyPoints: string[];
  questions: { q: string; a: string }[];
  glossary: { term: string; meaning: string }[];
};

export type PodcastDraft = {
  title: string;
  script: string;
  voiceId: string;
  createdAt: string;
  durationSec?: number;
};

export type ClassSession = {
  id: string;
  title: string;
  subject: string;
  createdAt: string;
  durationSec: number;
  language: string;
  sourceName: string;
  sourceKind: SourceKind;
  transcript: string;
  words: TranscriptWord[];
  notes: ClassNotes | null;
  podcast: PodcastDraft | null;
  hasOriginalAudio: boolean;
  hasPodcastAudio: boolean;
};

export const MAX_AUDIO_BYTES = 3_400_000;
export const ACCEPTED_AUDIO =
  "audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.webm,.mp4,.opus";
