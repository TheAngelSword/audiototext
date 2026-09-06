export type BitacoraPhoto = {
  id: string;
  name: string;
  type: string;
  blob?: Blob;
  url?: string;
};

export type BitacoraPost = {
  id: string;
  authorName: string;
  authorInitials?: string;
  createdAt: string;
  subject: string;
  text: string;
  photos: BitacoraPhoto[];
};

export type NewBitacoraPost = {
  authorName: string;
  subject: string;
  text: string;
  photos: File[];
};
