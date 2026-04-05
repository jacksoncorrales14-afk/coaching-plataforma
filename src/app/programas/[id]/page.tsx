"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ComunidadTab } from "@/components/dashboard/ComunidadTab";

interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  completada: boolean;
}

interface Video {
  id: string;
  titulo: string;
  url: string;
  duracion: number;
  visto: boolean;
  progreso: number;
  tareas: Tarea[];
}

interface Nivel {
  id: string;
  titulo: string;
  descripcion: string;
  desbloqueado: boolean;
  videos: Video[];
  videosVistos: number;
  totalVideos: number;
  porcentaje: number;
}

interface Programa {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  imagenPos: string;
  precio: number;
  tieneAcceso: boolean;
  foroNombre: string;
  niveles: Nivel[];
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

export default function ProgramaPage() {
  const params = useParams();
  const router = useRouter();
  const [programa, setPrograma] = useState<Programa | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [nivelActivo, setNivelActivo] = useState(0);
  const [videoActivo, setVideoActivo] = useState<string | null>(null);
  const [marcando, setMarcando] = useState(false);

  // Foro del programa
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [perfil, setPerfil] = useState({ email: "", nombre: "", avatar: "", bio: "" });
  const [nombreGuardado, setNombreGuardado] = useState(false);
  const [showForo, setShowForo] = useState(false);

  // Reuniones del programa
  const [reuniones, setReuniones] = useState<any[]>([]);
  const [showReuniones, setShowReuniones] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("coach_email");
    const savedAuth = localStorage.getItem("coach_auth");
    if (!savedEmail || savedAuth !== "true") {
      router.push("/mi-cuenta");
      return;
    }
    setEmail(savedEmail);

    const controller = new AbortController();
    const opts = { signal: controller.signal };

    cargarPrograma(savedEmail, controller.signal);

    // Cargar perfil, comentarios del foro y reuniones del programa
    Promise.all([
      fetch(`/api/perfil?email=${encodeURIComponent(savedEmail)}`, opts).then(r => r.json()),
      fetch(`/api/comunidad?tipo=programa&refId=${params.id}`, opts).then(r => r.json()).catch(() => []),
      fetch(`/api/programas/${params.id}/reuniones?email=${encodeURIComponent(savedEmail)}`, opts).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([perfilData, comData, reunData]) => {
      setPerfil(perfilData);
      setNombreGuardado(!!perfilData.nombre);
      setComentarios(Array.isArray(comData) ? comData : []);
      setReuniones(Array.isArray(reunData) ? reunData : []);
    }).catch(e => { if (e.name !== "AbortError") console.error(e); });

    return () => controller.abort();
  }, [params.id, router]);

  const cargarPrograma = async (correo: string, signal?: AbortSignal) => {
    try {
      const res = await fetch(`/api/programas/${params.id}?email=${encodeURIComponent(correo)}`, signal ? { signal } : {});
      if (!res.ok) { router.push("/mi-cuenta/dashboard"); return; }
      const data = await res.json();
      setPrograma(data);

      // Seleccionar primer video disponible
      for (const nivel of data.niveles) {
        if (nivel.desbloqueado && nivel.videos.length > 0) {
          const sinVer = nivel.videos.find((v: Video) => !v.visto);
          setVideoActivo(sinVer?.id || nivel.videos[0].id);
          setNivelActivo(data.niveles.indexOf(nivel));
          break;
        }
      }
      setLoading(false);
    } catch (e: any) {
      if (e.name !== "AbortError") console.error(e);
    }
  };

  const handleMarcarVisto = async (videoId: string) => {
    setMarcando(true);
    await fetch("/api/progreso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, videoId, visto: true, progreso: 100 }),
    });
    await cargarPrograma(email);
    setMarcando(false);
  };

  const handleGuardarPerfil = async () => {
    await fetch("/api/perfil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, nombre: perfil.nombre, bio: perfil.bio }),
    });
    localStorage.setItem("coach_nombre", perfil.nombre);
  };

  const handleToggleTarea = async (tareaId: string) => {
    await fetch("/api/tareas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, tareaId }),
    });
    await cargarPrograma(email);
  };

  if (loading || !programa) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-wine-600" />
      </div>
    );
  }

  const videoSeleccionado = programa.niveles
    .flatMap((n) => n.videos)
    .find((v) => v.id === videoActivo);

  const embedUrl = videoSeleccionado ? getEmbedUrl(videoSeleccionado.url) : null;

  const progresoTotal = programa.niveles.reduce((s, n) => s + n.videosVistos, 0);
  const totalVideos = programa.niveles.reduce((s, n) => s + n.totalVideos, 0);
  const porcentajeTotal = totalVideos > 0 ? Math.round((progresoTotal / totalVideos) * 100) : 0;

  // Si no tiene acceso, mostrar paywall
  if (!programa.tieneAcceso) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="relative overflow-hidden bg-wine-600 py-20">
          <div className="absolute inset-0 bg-gradient-to-br from-wine-700/50 via-transparent to-wine-800/30" />
          {programa.imagen && (
            <Image src={programa.imagen} alt="" fill sizes="100vw" className="object-cover opacity-20" style={{ objectPosition: programa.imagenPos }} />
          )}
          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
            <Link href="/programas" className="mb-4 inline-block text-sm text-wine-200 hover:text-white">
              &larr; Volver a programas
            </Link>
            <h1 className="mb-4 text-3xl font-bold text-white">{programa.titulo}</h1>
            <p className="mb-6 text-wine-100">{programa.descripcion}</p>
            <p className="mb-2 text-sm text-white/60">{programa.niveles.length} niveles · {totalVideos} videos</p>
          </div>
        </div>
        <div className="mx-auto -mt-8 max-w-lg px-4 sm:px-6">
          <div className="rounded-2xl bg-white p-8 text-center shadow-xl">
            <svg className="mx-auto mb-4 h-12 w-12 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="mb-2 text-xl font-bold text-gray-900">Acceso requerido</h2>
            <p className="mb-6 text-sm text-gray-500">
              Necesitas comprar este programa o tener una membresia activa para acceder al contenido.
            </p>
            {programa.precio > 0 && (
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-gray-900">${programa.precio.toFixed(2)}</span>
                <p className="text-xs text-gray-400">Acceso completo al programa</p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              {programa.precio > 0 && (
                <button
                  onClick={() => alert(`Proximamente: Pago con Stripe por $${programa.precio.toFixed(2)}`)}
                  className="btn-primary w-full py-3"
                >
                  Comprar programa
                </button>
              )}
              <Link href="/membresia" className="btn-secondary w-full py-3 text-center">
                Ver membresia (incluye todo)
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-wine-600">
        <div className="absolute inset-0 bg-gradient-to-br from-wine-700/50 via-transparent to-wine-800/30" />
        {programa.imagen && (
          <Image src={programa.imagen} alt="" fill sizes="100vw" className="object-cover opacity-20" style={{ objectPosition: programa.imagenPos }} />
        )}
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <Link href="/mi-cuenta/dashboard" className="mb-3 inline-block text-sm text-wine-200 hover:text-white">
            &larr; Volver al dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white">{programa.titulo}</h1>
          <p className="mt-1 text-sm text-wine-100">{programa.descripcion}</p>

          {/* Barra de progreso global */}
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-wine-800/50">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${porcentajeTotal}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-white">{porcentajeTotal}%</span>
          </div>
          <p className="mt-1 text-xs text-wine-200">{progresoTotal} de {totalVideos} videos completados</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar: niveles y videos */}
          <div className="w-full lg:w-80 lg:flex-shrink-0">
            <div className="space-y-3">
              {programa.niveles.map((nivel, i) => (
                <div key={nivel.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                  {/* Header del nivel */}
                  <button
                    onClick={() => nivel.desbloqueado && setNivelActivo(i)}
                    className={`flex w-full items-center justify-between p-4 text-left transition-all ${
                      nivel.desbloqueado ? "hover:bg-gray-50" : "cursor-not-allowed opacity-60"
                    } ${nivelActivo === i ? "bg-wine-50" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                        nivel.porcentaje === 100
                          ? "bg-green-500 text-white"
                          : nivel.desbloqueado
                          ? "bg-wine-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}>
                        {nivel.porcentaje === 100 ? (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : nivel.desbloqueado ? (
                          i + 1
                        ) : (
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{nivel.titulo}</p>
                        <p className="text-xs text-gray-400">{nivel.videosVistos}/{nivel.totalVideos} videos</p>
                      </div>
                    </div>
                    {nivel.desbloqueado && nivel.porcentaje < 100 && (
                      <span className="text-xs font-medium text-wine-600">{nivel.porcentaje}%</span>
                    )}
                  </button>

                  {/* Lista de videos (expandida si es el nivel activo) */}
                  {nivelActivo === i && nivel.desbloqueado && (
                    <div className="border-t border-gray-100 px-2 py-2">
                      {nivel.videos.map((video) => (
                        <button
                          key={video.id}
                          onClick={() => setVideoActivo(video.id)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
                            videoActivo === video.id
                              ? "bg-wine-50 text-wine-700"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {/* Estado del video */}
                          {video.visto ? (
                            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
                              <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : videoActivo === video.id ? (
                            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-wine-600">
                              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          ) : (
                            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300">
                              <svg className="h-3 w-3 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          )}
                          <span className={`truncate ${video.visto ? "text-gray-400 line-through" : ""}`}>
                            {video.titulo}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Mensaje de nivel bloqueado */}
                  {nivelActivo === i && !nivel.desbloqueado && (
                    <div className="border-t border-gray-100 p-4">
                      <p className="text-center text-xs text-gray-400">
                        Completa todos los videos del nivel anterior para desbloquear este nivel
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contenido principal: video player */}
          <div className="flex-1">
            {videoSeleccionado ? (
              <div>
                {/* Player */}
                <div className="overflow-hidden rounded-2xl bg-black shadow-lg">
                  {embedUrl ? (
                    <div className="aspect-video">
                      <iframe
                        src={embedUrl}
                        className="h-full w-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  ) : videoSeleccionado.url ? (
                    <div className="flex aspect-video items-center justify-center">
                      <a href={videoSeleccionado.url} target="_blank" rel="noopener noreferrer" className="text-white underline">
                        Abrir video en nueva pestaña
                      </a>
                    </div>
                  ) : (
                    <div className="flex aspect-video items-center justify-center">
                      <p className="text-gray-500">Video no disponible aun</p>
                    </div>
                  )}
                </div>

                {/* Info del video */}
                <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{videoSeleccionado.titulo}</h2>
                      <p className="text-sm text-gray-500">
                        {programa.niveles[nivelActivo]?.titulo}
                      </p>
                    </div>

                    {videoSeleccionado.visto ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Completado
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMarcarVisto(videoSeleccionado.id)}
                        disabled={marcando}
                        className="flex items-center gap-1.5 rounded-full bg-wine-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-wine-700 disabled:opacity-50"
                      >
                        {marcando ? (
                          "Guardando..."
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Marcar como visto
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Tareas del video */}
                {videoSeleccionado.tareas && videoSeleccionado.tareas.length > 0 && (
                  <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <svg className="h-5 w-5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <h3 className="font-bold text-gray-900">
                        Tareas ({videoSeleccionado.tareas.filter((t: Tarea) => t.completada).length}/{videoSeleccionado.tareas.length})
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {videoSeleccionado.tareas.map((tarea: Tarea) => (
                        <div
                          key={tarea.id}
                          className={`flex items-start gap-3 rounded-xl border p-4 transition-all ${
                            tarea.completada
                              ? "border-green-200 bg-green-50/50"
                              : "border-gray-100 bg-gray-50 hover:border-wine-200 hover:bg-wine-50/20"
                          }`}
                        >
                          <button
                            onClick={() => handleToggleTarea(tarea.id)}
                            className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                              tarea.completada
                                ? "border-green-500 bg-green-500"
                                : "border-gray-300 hover:border-wine-500"
                            }`}
                          >
                            {tarea.completada && (
                              <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              tarea.completada ? "text-gray-400 line-through" : "text-gray-900"
                            }`}>
                              {tarea.titulo}
                            </p>
                            {tarea.descripcion && (
                              <p className={`mt-1 text-xs ${
                                tarea.completada ? "text-gray-300" : "text-gray-500"
                              }`}>
                                {tarea.descripcion}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-96 items-center justify-center rounded-2xl bg-white shadow-sm">
                <div className="text-center">
                  <svg className="mx-auto mb-3 h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-gray-400">Selecciona un video para empezar</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reuniones del programa */}
        <div className="mt-8">
          <button
            onClick={() => setShowReuniones(!showReuniones)}
            className="flex w-full items-center justify-between rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wine-50">
                <svg className="h-5 w-5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900">Reuniones del programa</h3>
                <p className="text-sm text-gray-500">
                  {reuniones.length} {reuniones.length === 1 ? "reunion" : "reuniones"}
                  {reuniones.some((r) => new Date(r.fecha).getTime() > Date.now()) && " · Hay proximas reuniones"}
                </p>
              </div>
            </div>
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${showReuniones ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showReuniones && (
            <div className="mt-4 space-y-4">
              {reuniones.length === 0 ? (
                <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                  <p className="text-sm text-gray-400">Todavia no hay reuniones agendadas para este programa.</p>
                </div>
              ) : (
                reuniones.map((r) => {
                  const fechaObj = new Date(r.fecha);
                  const esPasada = fechaObj.getTime() < Date.now();
                  const tieneVideo = !!r.videoUrl;
                  const embed = tieneVideo ? getEmbedUrl(r.videoUrl) : null;
                  return (
                    <div key={r.id} className="rounded-2xl bg-white p-5 shadow-sm">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900">{r.titulo}</h3>
                        {!esPasada && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-700">
                            Proxima
                          </span>
                        )}
                        {esPasada && tieneVideo && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-green-700">
                            Grabacion disponible
                          </span>
                        )}
                        {esPasada && !tieneVideo && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                            Grabacion en preparacion
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {fechaObj.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        {" · "}
                        {fechaObj.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {r.descripcion && <p className="mt-2 text-sm text-gray-600">{r.descripcion}</p>}

                      {/* Pre-evento: enlace para unirse */}
                      {!esPasada && r.enlace && (
                        <a
                          href={r.enlace}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex items-center gap-2 rounded-full bg-wine-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-wine-700"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Unirme a la reunion
                        </a>
                      )}

                      {/* Post-evento: reproductor de video */}
                      {tieneVideo && (
                        <div className="mt-4 overflow-hidden rounded-xl bg-black">
                          {embed ? (
                            <div className="relative aspect-video">
                              <iframe
                                src={embed}
                                className="absolute inset-0 h-full w-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          ) : (
                            <a href={r.videoUrl} target="_blank" rel="noreferrer" className="block p-6 text-center text-sm text-white hover:bg-gray-900">
                              Ver grabacion ({r.videoUrl})
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Foro del programa */}
        <div className="mt-8">
          <button
            onClick={() => setShowForo(!showForo)}
            className="flex w-full items-center justify-between rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wine-50">
                <svg className="h-5 w-5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900">{programa?.foroNombre || "Foro del Programa"}</h3>
                <p className="text-sm text-gray-500">
                  {comentarios.length} {comentarios.length === 1 ? "comentario" : "comentarios"} · Preguntas y discusiones
                </p>
              </div>
            </div>
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${showForo ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showForo && (
            <div className="mt-4">
              <ComunidadTab
                email={email}
                perfil={perfil}
                comentarios={comentarios}
                setComentarios={setComentarios}
                nombreGuardado={nombreGuardado}
                setNombreGuardado={setNombreGuardado}
                setPerfil={setPerfil}
                onGuardarPerfil={handleGuardarPerfil}
                tipo="programa"
                refId={params.id as string}
                titulo={programa?.foroNombre || "Foro del Programa"}
                subtitulo="Comparte dudas, ideas y conecta con otras alumnas del programa"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
