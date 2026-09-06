import { FormEvent, useEffect, useMemo, useState } from "react";
import { materias9114 } from "../data/horarios9114";
import {
  createBitacoraPost,
  deleteBitacoraPost,
  listBitacoraPosts,
} from "../services/bitacoraService";
import type { BitacoraPost } from "../types/bitacora";
import "../styles/atrio-ui.css";

type BitacoraPageProps = {
  currentUserName?: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function BitacoraPage({ currentUserName = "Angel" }: BitacoraPageProps) {
  const [posts, setPosts] = useState<BitacoraPost[]>([]);
  const [text, setText] = useState("");
  const [subject, setSubject] = useState(materias9114[0]);
  const [files, setFiles] = useState<File[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    listBitacoraPosts().then(setPosts).catch(console.error);
  }, []);

  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );

  useEffect(() => {
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [previews]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim() && files.length === 0) return;

    setIsPublishing(true);
    try {
      await createBitacoraPost({
        authorName: currentUserName,
        subject,
        text,
        photos: files,
      });
      setText("");
      setFiles([]);
      setPosts(await listBitacoraPosts());
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteBitacoraPost(id);
    setPosts((current) => current.filter((post) => post.id !== id));
  }

  return (
    <main className="atrio-page atrio-page-enter">
      <header className="atrio-page-header atrio-page-header--split">
        <div>
          <span className="atrio-kicker">GRUPO 9114</span>
          <h1>Bitácora</h1>
          <p>Fotos, apuntes y momentos relevantes de las clases.</p>
        </div>
        <div className="atrio-bitacora-count">
          <strong>{posts.length}</strong>
          <span>{posts.length === 1 ? "publicación" : "publicaciones"}</span>
        </div>
      </header>

      <form className="atrio-panel atrio-composer" onSubmit={handleSubmit}>
        <div className="atrio-composer__author">
          <div className="atrio-avatar">{currentUserName.charAt(0).toUpperCase()}</div>
          <div>
            <strong>Nueva publicación</strong>
            <span>Comparte algo útil para el grupo</span>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="¿Qué pasó en clase hoy? Añade un apunte, recordatorio o comentario…"
          rows={4}
        />

        <div className="atrio-composer__row">
          <label className="atrio-field">
            <span>Materia</span>
            <select value={subject} onChange={(event) => setSubject(event.target.value)}>
              {materias9114.map((materia) => (
                <option key={materia} value={materia}>{materia.replace(" (Primer ingreso)", "")}</option>
              ))}
            </select>
          </label>

          <label className="atrio-photo-button">
            <span>＋ Agregar fotos</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 8))}
            />
          </label>
        </div>

        {previews.length > 0 && (
          <div className="atrio-preview-grid">
            {previews.map(({ file, url }) => (
              <figure key={`${file.name}-${file.lastModified}`}>
                <img src={url} alt={file.name} />
              </figure>
            ))}
          </div>
        )}

        <div className="atrio-composer__actions">
          <small>Hasta 8 fotos por publicación.</small>
          <button
            className="atrio-primary-button"
            type="submit"
            disabled={isPublishing || (!text.trim() && files.length === 0)}
          >
            {isPublishing ? "Publicando…" : "Publicar"}
          </button>
        </div>
      </form>

      <section className="atrio-feed" aria-label="Publicaciones de la bitácora">
        {posts.length === 0 ? (
          <div className="atrio-empty-state">
            <div className="atrio-empty-state__icon">▧</div>
            <h2>Aún no hay publicaciones</h2>
            <p>La primera foto o apunte de clase aparecerá aquí.</p>
          </div>
        ) : (
          posts.map((post, postIndex) => (
            <article
              key={post.id}
              className="atrio-post"
              style={{ animationDelay: `${postIndex * 50}ms` }}
            >
              <header className="atrio-post__header">
                <div className="atrio-avatar">{post.authorInitials || post.authorName.charAt(0)}</div>
                <div>
                  <strong>{post.authorName}</strong>
                  <span>{formatDate(post.createdAt)}</span>
                </div>
                <button
                  className="atrio-post__delete"
                  type="button"
                  onClick={() => handleDelete(post.id)}
                  title="Eliminar publicación"
                >
                  ×
                </button>
              </header>

              <div className="atrio-post__subject">
                {post.subject.replace(" (Primer ingreso)", "")}
              </div>

              {post.text && <p className="atrio-post__text">{post.text}</p>}

              {post.photos.length > 0 && (
                <div className={`atrio-post__photos count-${Math.min(post.photos.length, 4)}`}>
                  {post.photos.map((photo) => (
                    <button
                      key={photo.id}
                      className="atrio-post__photo"
                      type="button"
                      onClick={() => photo.url && window.open(photo.url, "_blank", "noopener,noreferrer")}
                    >
                      <img src={photo.url} alt={photo.name} />
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </main>
  );
}
