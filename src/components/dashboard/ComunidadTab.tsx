"use client";

import { useState } from "react";
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
}: ComunidadTabProps) {
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [respondiendo, setRespondiendo] = useState<string | null>(null);
  const [textoRespuesta, setTextoRespuesta] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleEnviarComentario = async () => {
    if (!nuevoComentario.trim() || !perfil.nombre.trim()) return;
    setEnviando(true);
    const res = await fetch("/api/comunidad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        nombre: perfil.nombre,
        avatar: perfil.avatar,
        contenido: nuevoComentario.trim(),
        tipo,
        refId,
      }),
    });
    if (res.ok) {
      const nuevo = await res.json();
      setComentarios((prev) => [nuevo, ...prev]);
      setNuevoComentario("");
    }
    setEnviando(false);
  };

  const handleResponder = async (parentId: string) => {
    if (!textoRespuesta.trim()) return;
    setEnviando(true);
    const res = await fetch("/api/comunidad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        nombre: perfil.nombre,
        avatar: perfil.avatar,
        contenido: textoRespuesta.trim(),
        tipo,
        refId,
        parentId,
      }),
    });
    if (res.ok) {
      const resp = await res.json();
      setComentarios((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? { ...c, respuestas: [...c.respuestas, resp] }
            : c
        )
      );
      setTextoRespuesta("");
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
              : [
                  ...com.reacciones,
                  { id: "temp", email, tipo: "corazon" },
                ],
          };
        };
        const updated = toggle(c);
        return { ...updated, respuestas: updated.respuestas.map(toggle) };
      })
    );
  };

  const renderComentario = (c: ComentarioInfo, esRespuesta = false) => {
    const yaReaccione = c.reacciones.some((r) => r.email === email);
    return (
      <div key={c.id} className={`${esRespuesta ? "ml-12 mt-3" : ""}`}>
        <div
          className={`rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
            esRespuesta ? "border-l-2 border-wine-200" : ""
          }`}
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar src={c.avatar} name={c.nombre} />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {c.nombre}
                </p>
                <p className="text-xs text-gray-400">
                  {tiempoRelativo(c.createdAt)}
                </p>
              </div>
            </div>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-gray-600">
            {c.contenido}
          </p>
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
                onClick={() =>
                  setRespondiendo(respondiendo === c.id ? null : c.id)
                }
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
          <div className="ml-12 mt-3 flex gap-2">
            <Avatar src={perfil.avatar} name={perfil.nombre} size="sm" />
            <div className="flex-1">
              <input
                type="text"
                value={textoRespuesta}
                onChange={(e) => setTextoRespuesta(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleResponder(c.id)
                }
                placeholder="Escribe una respuesta..."
                className="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm transition-all focus:border-wine-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-wine-500/20"
              />
            </div>
            <button
              onClick={() => handleResponder(c.id)}
              disabled={enviando || !textoRespuesta.trim()}
              className="rounded-full bg-wine-600 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-wine-700 disabled:opacity-50"
            >
              Enviar
            </button>
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
            {!nombreGuardado && (
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
              placeholder="Que estas pensando? Comparte una idea, pregunta o experiencia..."
              rows={3}
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={handleEnviarComentario}
                disabled={
                  enviando ||
                  !nuevoComentario.trim() ||
                  !perfil.nombre.trim()
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
