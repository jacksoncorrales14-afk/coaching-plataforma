"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { ImagePositionEditor } from "@/components/ImagePositionEditor";

interface Video {
  id: string;
  titulo: string;
  url: string;
  orden: number;
}

interface Nivel {
  id: string;
  titulo: string;
  descripcion: string;
  orden: number;
  videos: Video[];
}

interface Reunion {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  enlace: string;
  videoUrl: string;
}

interface Programa {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  imagenPos: string;
  precio: number;
  publicado: boolean;
  foroNombre: string;
  niveles: Nivel[];
  reuniones: Reunion[];
}

export default function EditarProgramaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [programa, setPrograma] = useState<Programa | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagen, setImagen] = useState("");
  const [imagenPos, setImagenPos] = useState("50% 50%");
  const [precio, setPrecio] = useState(0);
  const [publicado, setPublicado] = useState(false);
  const [foroNombre, setForoNombre] = useState("Foro del Programa");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Nuevo nivel / video
  const [nuevoNivelTitulo, setNuevoNivelTitulo] = useState("");
  const [nuevoNivelDesc, setNuevoNivelDesc] = useState("");
  const [nuevoVideoNivelId, setNuevoVideoNivelId] = useState<string | null>(null);
  const [nuevoVideoTitulo, setNuevoVideoTitulo] = useState("");
  const [nuevoVideoUrl, setNuevoVideoUrl] = useState("");
  const [nuevaTareaVideoId, setNuevaTareaVideoId] = useState<string | null>(null);
  const [nuevaTareaTitulo, setNuevaTareaTitulo] = useState("");
  const [nuevaTareaDesc, setNuevaTareaDesc] = useState("");

  // Reuniones
  const [nuevaReunionTitulo, setNuevaReunionTitulo] = useState("");
  const [nuevaReunionDesc, setNuevaReunionDesc] = useState("");
  const [nuevaReunionFecha, setNuevaReunionFecha] = useState("");
  const [nuevaReunionEnlace, setNuevaReunionEnlace] = useState("");
  const [editandoReunionId, setEditandoReunionId] = useState<string | null>(null);
  const [editReunionTitulo, setEditReunionTitulo] = useState("");
  const [editReunionDesc, setEditReunionDesc] = useState("");
  const [editReunionFecha, setEditReunionFecha] = useState("");
  const [editReunionEnlace, setEditReunionEnlace] = useState("");
  const [editReunionVideoUrl, setEditReunionVideoUrl] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const cargarPrograma = async () => {
    const res = await fetch("/api/admin/programas");
    const progs = await res.json();
    const prog = progs.find((p: any) => p.id === params.id);
    if (prog) {
      setPrograma(prog);
      setTitulo(prog.titulo);
      setDescripcion(prog.descripcion);
      setImagen(prog.imagen);
      setImagenPos(prog.imagenPos || "50% 50%");
      setPrecio(prog.precio || 0);
      setPublicado(prog.publicado);
      setForoNombre(prog.foroNombre || "Foro del Programa");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (session?.user?.role === "admin" && params.id) {
      cargarPrograma();
    }
  }, [session, params.id]);

  if (session?.user?.role !== "admin") return null;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-wine-600" />
      </div>
    );
  }

  if (!programa) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Programa no encontrado</p>
      </div>
    );
  }

  const handleGuardar = async () => {
    setSaving(true);
    await fetch("/api/admin/programas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: programa.id, titulo, descripcion, imagen, imagenPos, precio, publicado, foroNombre }),
    });
    setSaving(false);
    await cargarPrograma();
  };

  const handleEliminar = async () => {
    if (!confirm("Eliminar este programa y todos sus niveles y videos?")) return;
    setDeleting(true);
    await fetch("/api/admin/programas", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: programa.id }),
    });
    router.push("/admin");
  };

  const handleAgregarNivel = async () => {
    if (!nuevoNivelTitulo.trim()) return;
    await fetch("/api/admin/niveles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ programaId: programa.id, titulo: nuevoNivelTitulo, descripcion: nuevoNivelDesc }),
    });
    setNuevoNivelTitulo("");
    setNuevoNivelDesc("");
    await cargarPrograma();
  };

  const handleEliminarNivel = async (nivelId: string) => {
    if (!confirm("Eliminar este nivel y todos sus videos?")) return;
    await fetch("/api/admin/niveles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: nivelId }),
    });
    await cargarPrograma();
  };

  const handleAgregarVideo = async (nivelId: string) => {
    if (!nuevoVideoTitulo.trim()) return;
    await fetch("/api/admin/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nivelId, titulo: nuevoVideoTitulo, url: nuevoVideoUrl }),
    });
    setNuevoVideoTitulo("");
    setNuevoVideoUrl("");
    setNuevoVideoNivelId(null);
    await cargarPrograma();
  };

  const handleEliminarVideo = async (videoId: string) => {
    await fetch("/api/admin/videos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: videoId }),
    });
    await cargarPrograma();
  };

  const handleAgregarTarea = async (videoId: string) => {
    if (!nuevaTareaTitulo.trim()) return;
    await fetch("/api/admin/tareas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, titulo: nuevaTareaTitulo, descripcion: nuevaTareaDesc }),
    });
    setNuevaTareaTitulo("");
    setNuevaTareaDesc("");
    setNuevaTareaVideoId(null);
    await cargarPrograma();
  };

  const handleCrearReunion = async () => {
    if (!nuevaReunionTitulo.trim() || !nuevaReunionFecha) return;
    await fetch("/api/admin/reuniones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        programaId: programa!.id,
        titulo: nuevaReunionTitulo.trim(),
        descripcion: nuevaReunionDesc.trim(),
        fecha: new Date(nuevaReunionFecha).toISOString(),
        enlace: nuevaReunionEnlace.trim(),
      }),
    });
    setNuevaReunionTitulo("");
    setNuevaReunionDesc("");
    setNuevaReunionFecha("");
    setNuevaReunionEnlace("");
    await cargarPrograma();
  };

  const iniciarEdicionReunion = (r: Reunion) => {
    setEditandoReunionId(r.id);
    setEditReunionTitulo(r.titulo);
    setEditReunionDesc(r.descripcion);
    // fecha en formato para input datetime-local
    const d = new Date(r.fecha);
    const pad = (n: number) => String(n).padStart(2, "0");
    setEditReunionFecha(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
    setEditReunionEnlace(r.enlace);
    setEditReunionVideoUrl(r.videoUrl);
  };

  const handleGuardarEdicionReunion = async () => {
    if (!editandoReunionId) return;
    await fetch("/api/admin/reuniones", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editandoReunionId,
        titulo: editReunionTitulo.trim(),
        descripcion: editReunionDesc.trim(),
        fecha: new Date(editReunionFecha).toISOString(),
        enlace: editReunionEnlace.trim(),
        videoUrl: editReunionVideoUrl.trim(),
      }),
    });
    setEditandoReunionId(null);
    await cargarPrograma();
  };

  const handleEliminarReunion = async (id: string) => {
    if (!confirm("Eliminar esta reunion?")) return;
    await fetch("/api/admin/reuniones", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await cargarPrograma();
  };

  const handleEliminarTarea = async (tareaId: string) => {
    await fetch("/api/admin/tareas", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: tareaId }),
    });
    await cargarPrograma();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-28 sm:px-6">
      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Atras
        </button>
        <button
          onClick={() => router.push("/admin")}
          className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Panel admin
        </button>
      </div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Editar Programa</h1>

      {/* Info del programa */}
      <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Informacion general</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Titulo *</label>
            <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Descripcion</label>
            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="input-field min-h-[80px]" />
          </div>
          <ImageUpload value={imagen} onChange={setImagen} />
          <ImagePositionEditor imageUrl={imagen} position={imagenPos} onChange={setImagenPos} />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Precio ($) — para compra individual</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={precio}
              onChange={(e) => setPrecio(parseFloat(e.target.value) || 0)}
              className="input-field w-48"
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-gray-400">Si es 0, solo estara disponible con membresia</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nombre del foro</label>
            <input
              type="text"
              value={foroNombre}
              onChange={(e) => setForoNombre(e.target.value)}
              placeholder="Foro del Programa"
              className="input-field"
            />
            <p className="mt-1 text-xs text-gray-400">Titulo que se muestra en la seccion de foro del programa</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="publicado"
              checked={publicado}
              onChange={(e) => setPublicado(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-wine-600 focus:ring-wine-500"
            />
            <label htmlFor="publicado" className="text-sm text-gray-700">
              Publicado (visible para miembros y compradores)
            </label>
          </div>
          <div className="flex items-center justify-end">
            <button onClick={handleEliminar} className="text-sm font-medium text-red-500 hover:text-red-700" disabled={deleting}>
              {deleting ? "Eliminando..." : "Eliminar programa"}
            </button>
          </div>
        </div>
      </div>

      {/* Niveles */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Niveles ({programa.niveles.length})</h2>

        <div className="space-y-4">
          {programa.niveles.map((nivel, i) => (
            <div key={nivel.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-wine-600 text-sm font-bold text-white">{i + 1}</span>
                  <div>
                    <h3 className="font-bold text-gray-900">{nivel.titulo}</h3>
                    {nivel.descripcion && <p className="text-xs text-gray-500">{nivel.descripcion}</p>}
                  </div>
                </div>
                <button onClick={() => handleEliminarNivel(nivel.id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Videos */}
              <div className="ml-11 space-y-3">
                {nivel.videos.map((video: any, j: number) => (
                  <div key={video.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">{video.titulo}</span>
                        {video.url && <span className="text-xs text-gray-400 truncate max-w-[150px]">{video.url}</span>}
                      </div>
                      <button onClick={() => handleEliminarVideo(video.id)} className="text-xs text-gray-400 hover:text-red-500">
                        Eliminar
                      </button>
                    </div>

                    {/* Tareas del video */}
                    {video.tareas && video.tareas.length > 0 && (
                      <div className="mt-2 ml-6 space-y-1">
                        {video.tareas.map((tarea: any) => (
                          <div key={tarea.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5">
                            <div className="flex items-center gap-2">
                              <svg className="h-3.5 w-3.5 text-wine-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              <span className="text-xs text-gray-600">{tarea.titulo}</span>
                              {tarea.descripcion && <span className="text-[10px] text-gray-400">— {tarea.descripcion.substring(0, 40)}{tarea.descripcion.length > 40 ? "..." : ""}</span>}
                            </div>
                            <button onClick={() => handleEliminarTarea(tarea.id)} className="text-[10px] text-gray-400 hover:text-red-500">
                              Eliminar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Agregar tarea */}
                    {nuevaTareaVideoId === video.id ? (
                      <div className="mt-2 ml-6 space-y-2 rounded-lg border border-wine-200 bg-wine-50/30 p-3">
                        <input
                          type="text"
                          value={nuevaTareaTitulo}
                          onChange={(e) => setNuevaTareaTitulo(e.target.value)}
                          placeholder="Titulo de la tarea"
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-wine-500 focus:outline-none"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={nuevaTareaDesc}
                          onChange={(e) => setNuevaTareaDesc(e.target.value)}
                          placeholder="Descripcion (opcional)"
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-wine-500 focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleAgregarTarea(video.id)} disabled={!nuevaTareaTitulo.trim()} className="rounded-lg bg-wine-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-wine-700 disabled:opacity-50">
                            Agregar
                          </button>
                          <button onClick={() => { setNuevaTareaVideoId(null); setNuevaTareaTitulo(""); setNuevaTareaDesc(""); }} className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setNuevaTareaVideoId(video.id)}
                        className="mt-2 ml-6 text-xs font-medium text-wine-600 hover:text-wine-700"
                      >
                        + Agregar tarea
                      </button>
                    )}
                  </div>
                ))}

                {/* Agregar video */}
                {nuevoVideoNivelId === nivel.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={nuevoVideoTitulo}
                      onChange={(e) => setNuevoVideoTitulo(e.target.value)}
                      placeholder="Titulo del video"
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-wine-500 focus:outline-none"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={nuevoVideoUrl}
                      onChange={(e) => setNuevoVideoUrl(e.target.value)}
                      placeholder="URL del video"
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-wine-500 focus:outline-none"
                    />
                    <button onClick={() => handleAgregarVideo(nivel.id)} className="rounded-lg bg-wine-600 px-3 py-2 text-xs font-medium text-white hover:bg-wine-700">
                      Agregar
                    </button>
                    <button onClick={() => { setNuevoVideoNivelId(null); setNuevoVideoTitulo(""); setNuevoVideoUrl(""); }} className="rounded-lg px-3 py-2 text-xs text-gray-500 hover:bg-gray-100">
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setNuevoVideoNivelId(nivel.id)}
                    className="text-sm font-medium text-wine-600 hover:text-wine-700"
                  >
                    + Agregar video
                  </button>
                )}
              </div>

              {/* Indicador de desbloqueo */}
              {i < programa.niveles.length - 1 && (
                <div className="ml-11 mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  El nivel {i + 2} se desbloquea al completar todos los videos de este nivel
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Agregar nivel */}
        <div className="mt-4 rounded-2xl border-2 border-dashed border-gray-200 p-5">
          <p className="mb-3 text-sm font-semibold text-gray-700">Agregar nuevo nivel</p>
          <div className="space-y-2">
            <input
              type="text"
              value={nuevoNivelTitulo}
              onChange={(e) => setNuevoNivelTitulo(e.target.value)}
              placeholder="Titulo del nivel"
              className="input-field"
            />
            <textarea
              value={nuevoNivelDesc}
              onChange={(e) => setNuevoNivelDesc(e.target.value)}
              placeholder="Descripcion del nivel (opcional)"
              className="input-field min-h-[60px] resize-none"
            />
            <button
              onClick={handleAgregarNivel}
              disabled={!nuevoNivelTitulo.trim()}
              className="btn-primary px-4 py-2"
            >
              + Agregar Nivel
            </button>
          </div>
        </div>
      </div>

      {/* Reuniones del programa */}
      <div className="mb-8">
        <h2 className="mb-2 text-lg font-bold text-gray-900">Reuniones del programa ({programa.reuniones?.length || 0})</h2>
        <p className="mb-4 text-sm text-gray-500">
          Agenda reuniones grupales. Todas las alumnas con acceso al programa podran verlas, sin importar cuando compraron.
        </p>

        <div className="space-y-3">
          {(programa.reuniones || []).map((r) => {
            const fechaObj = new Date(r.fecha);
            const esPasada = fechaObj.getTime() < Date.now();
            const tieneVideo = !!r.videoUrl;
            return (
              <div key={r.id} className="rounded-2xl bg-white p-5 shadow-sm">
                {editandoReunionId === r.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editReunionTitulo}
                      onChange={(e) => setEditReunionTitulo(e.target.value)}
                      placeholder="Titulo"
                      className="input-field"
                    />
                    <textarea
                      value={editReunionDesc}
                      onChange={(e) => setEditReunionDesc(e.target.value)}
                      placeholder="Descripcion (opcional)"
                      className="input-field min-h-[60px]"
                    />
                    <input
                      type="datetime-local"
                      value={editReunionFecha}
                      onChange={(e) => setEditReunionFecha(e.target.value)}
                      className="input-field"
                    />
                    <input
                      type="text"
                      value={editReunionEnlace}
                      onChange={(e) => setEditReunionEnlace(e.target.value)}
                      placeholder="Enlace de Zoom/Meet (pre-evento)"
                      className="input-field"
                    />
                    <input
                      type="text"
                      value={editReunionVideoUrl}
                      onChange={(e) => setEditReunionVideoUrl(e.target.value)}
                      placeholder="URL de YouTube/Vimeo (grabacion post-evento)"
                      className="input-field"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleGuardarEdicionReunion} className="btn-primary px-4 py-2">Guardar</button>
                      <button onClick={() => setEditandoReunionId(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-gray-900">{r.titulo}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          tieneVideo
                            ? "bg-green-100 text-green-700"
                            : esPasada
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {tieneVideo ? "Grabacion lista" : esPasada ? "Sin grabacion" : "Proxima"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {fechaObj.toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })} · {fechaObj.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {r.descripcion && <p className="mt-2 text-sm text-gray-600">{r.descripcion}</p>}
                      {r.enlace && (
                        <p className="mt-1 text-xs text-gray-400 truncate">
                          Enlace: <span className="text-wine-600">{r.enlace}</span>
                        </p>
                      )}
                      {r.videoUrl && (
                        <p className="mt-1 text-xs text-gray-400 truncate">
                          Video: <span className="text-wine-600">{r.videoUrl}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => iniciarEdicionReunion(r)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminarReunion(r.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Agregar nueva reunion */}
        <div className="mt-4 rounded-2xl border-2 border-dashed border-gray-200 p-5">
          <p className="mb-3 text-sm font-semibold text-gray-700">Agendar nueva reunion</p>
          <div className="space-y-2">
            <input
              type="text"
              value={nuevaReunionTitulo}
              onChange={(e) => setNuevaReunionTitulo(e.target.value)}
              placeholder="Titulo de la reunion"
              className="input-field"
            />
            <textarea
              value={nuevaReunionDesc}
              onChange={(e) => setNuevaReunionDesc(e.target.value)}
              placeholder="Descripcion (opcional)"
              className="input-field min-h-[60px]"
            />
            <input
              type="datetime-local"
              value={nuevaReunionFecha}
              onChange={(e) => setNuevaReunionFecha(e.target.value)}
              className="input-field"
            />
            <input
              type="text"
              value={nuevaReunionEnlace}
              onChange={(e) => setNuevaReunionEnlace(e.target.value)}
              placeholder="Enlace de Zoom/Meet (opcional)"
              className="input-field"
            />
            <button
              onClick={handleCrearReunion}
              disabled={!nuevaReunionTitulo.trim() || !nuevaReunionFecha}
              className="btn-primary px-4 py-2"
            >
              + Agendar reunion
            </button>
            <p className="text-xs text-gray-400">Despues de la reunion, edita la entrada y agrega el URL de YouTube/Vimeo con la grabacion.</p>
          </div>
        </div>
      </div>

      {/* Barra fija con guardar al final */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-end">
          <button
            onClick={handleGuardar}
            disabled={saving}
            className="btn-primary px-8 py-2.5"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
