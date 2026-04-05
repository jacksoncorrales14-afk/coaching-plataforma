"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";

interface ReaccionInfo {
  id: string;
  email: string;
  tipo: string;
}

interface ComentarioInfo {
  id: string;
  email: string;
  nombre: string;
  avatar: string;
  contenido: string;
  mediaUrl?: string;
  mediaTipo?: string;
  esAdmin?: boolean;
  createdAt: string;
  reacciones: ReaccionInfo[];
  respuestas: ComentarioInfo[];
}

interface PerfilInfo {
  email: string;
  nombre: string;
  avatar: string;
  bio: string;
}

interface ComunidadTabProps {
  email: string;
  perfil: PerfilInfo;
  comentarios: ComentarioInfo[];
  setComentarios: React.Dispatch<React.SetStateAction<ComentarioInfo[]>>;
  nombreGuardado: boolean;
  setNombreGuardado: (v: boolean) => void;
  setPerfil: React.Dispatch<React.SetStateAction<PerfilInfo>>;
  onGuardarPerfil: () => void;
  tipo?: string;
  refId?: string;
  titulo?: string;
  subtitulo?: string;
  adminMode?: boolean; // Si true, postea a /api/admin/comentarios y puede eliminar
  onEliminar?: (id: string) => void;
}

function tiempoRelativo(fecha: string) {
  const diff = Date.now() - new Date(fecha).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora mismo";
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  const dias = Math.floor(hrs / 24);
  if (dias < 7) return `Hace ${dias}d`;
  return new Date(fecha).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
  });
}

interface AdjuntoPendiente {
  url: string;
  tipo: "imagen" | "video";
  nombre: string;
}

export function ComunidadTab({
  email,
  perfil,
  comentarios,
  setComentarios,
  nombreGuardado,
  setNombreGuardado,
  setPerfil,
  onGuardarPerfil,
  tipo = "comunidad",
  refId = "general",
  titulo = "Comunidad",
  subtitulo = "Comparte, pregunta y conecta con otras alumnas",
  adminMode = false,
  onEliminar,
}: ComunidadTabProps) {
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [respondiendo, setRespondiendo] = useState<string | null>(null);
  const [textoRespuesta, setTextoRespuesta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [adjunto, setAdjunto] = useState<AdjuntoPendiente | null>(null);
  const [adjuntoRespuesta, setAdjuntoRespuesta] = useState<AdjuntoPendiente | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorUpload, setErrorUpload] = useState("");
  const inputFileRef = useRef<HTMLInputElement>(null);
  const inputFileRespRef = useRef<HTMLInputElement>(null);

  const subirArchivo = async (file: File): Promise<AdjuntoPendiente | null> => {
    setErrorUpload("");
    setSubiendo(true);
    const form = new FormData();
    form.append("file", file);
    form.append("email", email);
    try {
      const res = await fetch("/api/upload-comentario", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setErrorUpload(data.error || "Error al subir archivo");
        return null;
      }
      return { url: data.url, tipo: data.tipo, nombre: file.name };
    } catch {
      setErrorUpload("Error al subir archivo");
      return null;
    } finally {
      setSubiendo(false);
    }
  };

  const handleSelectFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "principal" | "respuesta"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await subirArchivo(file);
    if (res) {
      if (target === "principal") setAdjunto(res);
      else setAdjuntoRespuesta(res);
    }
    e.target.value = "";
  };

  const postearComentario = async (body: any) => {
    const endpoint = adminMode ? "/api/admin/comentarios" : "/api/comunidad";
    const payload = adminMode
      ? {
          contenido: body.contenido,
          mediaUrl: body.mediaUrl,
          mediaTipo: body.mediaTipo,
          tipo: body.tipo,
          refId: body.refId,
          parentId: body.parentId ?? null,
        }
      : body;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res;
  };

  const handleEnviarComentario = async () => {
    if ((!nuevoComentario.trim() && !adjunto) || (!adminMode && !perfil.nombre.trim())) return;
    setEnviando(true);
    const res = await postearComentario({
      email,
      nombre: perfil.nombre,
      avatar: perfil.avatar,
      contenido: nuevoComentario.trim(),
      mediaUrl: adjunto?.url || "",
      mediaTipo: adjunto?.tipo || "",
      tipo,
      refId,
    });
    if (res.ok) {
      const nuevo = await res.json();
      setComentarios((prev) => [nuevo, ...prev]);
      setNuevoComentario("");
      setAdjunto(null);
    }
    setEnviando(false);
  };

  const handleResponder = async (parentId: string) => {
    if (!textoRespuesta.trim() && !adjuntoRespuesta) return;
    setEnviando(true);
    const res = await postearComentario({
      email,
      nombre: perfil.nombre,
      avatar: perfil.avatar,
      contenido: textoRespuesta.trim(),
      mediaUrl: adjuntoRespuesta?.url || "",
      mediaTipo: adjuntoRespuesta?.tipo || "",
      tipo,
      refId,
      parentId,
    });
    if (res.ok) {
      const resp = await res.json();
      setComentarios((prev) =>
        prev.map((c) =>
          c.id === parentId ? { ...c, respuestas: [...c.respuestas, resp] } : c
        )
      );
      setTextoRespuesta("");
      setAdjuntoRespuesta(null);
      setRespondiendo(null);
    }
    setEnviando(false);
  };

  const handleReaccion = async (comentarioId: string) => {
    await fetch("/api/reacciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, comentarioId, tipo: "corazon" }),
    });
    setComentarios((prev) =>
      prev.map((c) => {
        const toggle = (com: ComentarioInfo) => {
          if (com.id !== comentarioId) return com;
          const yaReacciono = com.reacciones.some((r) => r.email === email);
          return {
            ...com,
            reacciones: yaReacciono
              ? com.reacciones.filter((r) => r.email !== email)
              : [...com.reacciones, { id: "temp", email, tipo: "corazon" }],
          };
        };
        const updated = toggle(c);
        return { ...updated, respuestas: updated.respuestas.map(toggle) };
      })
    );
  };

  const handleEliminarLocal = async (id: string) => {
    if (!confirm("Eliminar este comentario?")) return;
    await fetch("/api/admin/comentarios", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setComentarios((prev) =>
      prev
        .filter((c) => c.id !== id)
        .map((c) => ({ ...c, respuestas: c.respuestas.filter((r) => r.id !== id) }))
    );
    if (onEliminar) onEliminar(id);
  };

  const renderMedia = (c: ComentarioInfo) => {
    if (!c.mediaUrl) return null;
    if (c.mediaTipo === "imagen") {
      return (
        <a href={c.mediaUrl} target="_blank" rel="noreferrer" className="mb-3 block">
          <img
            src={c.mediaUrl}
            alt="Adjunto"
            className="max-h-80 w-auto rounded-xl border border-gray-100"
          />
        </a>
      );
    }
    if (c.mediaTipo === "video") {
      return (
        <video
          src={c.mediaUrl}
          controls
          className="mb-3 max-h-80 w-full rounded-xl border border-gray-100 bg-black"
        />
      );
    }
    return null;
  };

  const renderComentario = (c: ComentarioInfo, esRespuesta = false) => {
    const yaReaccione = c.reacciones.some((r) => r.email === email);
    return (
      <div key={c.id} className={`${esRespuesta ? "ml-12 mt-3" : ""}`}>
        <div
          className={`rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
            esRespuesta ? "border-l-2 border-wine-200" : ""
          } ${c.esAdmin ? "ring-1 ring-wine-200" : ""}`}
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar src={c.avatar} name={c.nombre} />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{c.nombre}</p>
                  {c.esAdmin && (
                    <span className="rounded-full bg-wine-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Coach
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{tiempoRelativo(c.createdAt)}</p>
              </div>
            </div>
            {adminMode && (
              <button
                onClick={() => handleEliminarLocal(c.id)}
                className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500"
                title="Eliminar"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
          {c.contenido && (
            <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
              {c.contenido}
            </p>
          )}
          {renderMedia(c)}
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleReaccion(c.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                yaReaccione
                  ? "bg-red-50 text-red-500"
                  : "bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-400"
              }`}
            >
              <svg
                className="h-4 w-4"
                fill={yaReaccione ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              {c.reacciones.length > 0 && c.reacciones.length}
            </button>
            {!esRespuesta && (
              <button
                onClick={() => setRespondiendo(respondiendo === c.id ? null : c.id)}
                className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
                Responder
                {c.respuestas.length > 0 && ` (${c.respuestas.length})`}
              </button>
            )}
          </div>
        </div>
        {!esRespuesta && c.respuestas.map((r) => renderComentario(r, true))}
        {respondiendo === c.id && (
          <div className="ml-12 mt-3">
            <div className="flex gap-2">
              <Avatar src={perfil.avatar} name={perfil.nombre} size="sm" />
              <div className="flex-1">
                <input
                  type="text"
                  value={textoRespuesta}
                  onChange={(e) => setTextoRespuesta(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleResponder(c.id)}
                  placeholder="Escribe una respuesta..."
                  className="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm transition-all focus:border-wine-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-wine-500/20"
                />
                {adjuntoRespuesta && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs">
                    <span className="font-medium text-gray-700">
                      {adjuntoRespuesta.tipo === "imagen" ? "📷" : "🎬"} {adjuntoRespuesta.nombre}
                    </span>
                    <button
                      onClick={() => setAdjuntoRespuesta(null)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      Quitar
                    </button>
                  </div>
                )}
              </div>
              <input
                ref={inputFileRespRef}
                type="file"
                accept="image/*,video/mp4,video/quicktime,video/webm"
                onChange={(e) => handleSelectFile(e, "respuesta")}
                className="hidden"
              />
              <button
                onClick={() => inputFileRespRef.current?.click()}
                disabled={subiendo}
                className="rounded-full bg-gray-100 px-3 py-2 text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                title="Adjuntar imagen o video"
              >
                📎
              </button>
              <button
                onClick={() => handleResponder(c.id)}
                disabled={enviando || (!textoRespuesta.trim() && !adjuntoRespuesta)}
                className="rounded-full bg-wine-600 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-wine-700 disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h2 className="mb-2 text-xl font-bold text-gray-900">{titulo}</h2>
      <p className="mb-6 text-sm text-gray-500">{subtitulo}</p>

      {/* Nuevo comentario */}
      <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex gap-3">
          <Avatar src={perfil.avatar} name={perfil.nombre || "U"} />
          <div className="flex-1">
            {!adminMode && !nombreGuardado && (
              <div className="mb-2 flex gap-2">
                <input
                  type="text"
                  value={perfil.nombre}
                  onChange={(e) =>
                    setPerfil((p) => ({ ...p, nombre: e.target.value }))
                  }
                  placeholder="Escribe tu nombre..."
                  className="flex-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-gray-900 placeholder:text-amber-400 focus:border-wine-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-wine-500/20"
                />
                <button
                  onClick={() => {
                    if (perfil.nombre.trim()) {
                      onGuardarPerfil();
                      setNombreGuardado(true);
                    }
                  }}
                  disabled={!perfil.nombre.trim()}
                  className="rounded-lg bg-wine-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-wine-700 disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            )}
            <textarea
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm transition-all placeholder:text-gray-400 focus:border-wine-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-wine-500/20"
              placeholder={
                adminMode
                  ? "Responde como Coach..."
                  : "Que estas pensando? Comparte una idea, pregunta o experiencia..."
              }
              rows={3}
            />
            {adjunto && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs">
                <span className="font-medium text-gray-700">
                  {adjunto.tipo === "imagen" ? "📷" : "🎬"} {adjunto.nombre}
                </span>
                <button
                  onClick={() => setAdjunto(null)}
                  className="text-gray-400 hover:text-red-500"
                >
                  Quitar
                </button>
              </div>
            )}
            {errorUpload && (
              <p className="mt-2 text-xs text-red-500">{errorUpload}</p>
            )}
            <div className="mt-2 flex items-center justify-between">
              <input
                ref={inputFileRef}
                type="file"
                accept="image/*,video/mp4,video/quicktime,video/webm"
                onChange={(e) => handleSelectFile(e, "principal")}
                className="hidden"
              />
              <button
                onClick={() => inputFileRef.current?.click()}
                disabled={subiendo}
                className="flex items-center gap-1.5 rounded-full bg-gray-100 px-4 py-2 text-xs font-medium text-gray-600 transition-all hover:bg-gray-200 disabled:opacity-50"
              >
                📎 {subiendo ? "Subiendo..." : "Adjuntar"}
              </button>
              <button
                onClick={handleEnviarComentario}
                disabled={
                  enviando ||
                  (!nuevoComentario.trim() && !adjunto) ||
                  (!adminMode && !perfil.nombre.trim())
                }
                className="rounded-full bg-wine-600 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-wine-700 disabled:opacity-50"
              >
                {enviando ? "Publicando..." : "Publicar"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de comentarios */}
      {comentarios.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="mb-1 text-lg font-bold text-gray-900">
            Se la primera en comentar
          </h3>
          <p className="text-sm text-gray-500">
            Inicia la conversacion compartiendo tu experiencia.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comentarios.map((c) => renderComentario(c))}
        </div>
      )}
    </div>
  );
}
