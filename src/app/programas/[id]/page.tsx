"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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

  useEffect(() => {
    const savedEmail = localStorage.getItem("coach_email");
    const savedAuth = localStorage.getItem("coach_auth");
    if (!savedEmail || savedAuth !== "true") {
      router.push("/mi-cuenta");
      return;
    }
    setEmail(savedEmail);
    cargarPrograma(savedEmail);
  }, [params.id, router]);

  const cargarPrograma = async (correo: string) => {
    const res = await fetch(`/api/programas/${params.id}?email=${encodeURIComponent(correo)}`);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-wine-600">
        <div className="absolute inset-0 bg-gradient-to-br from-wine-700/50 via-transparent to-wine-800/30" />
        {programa.imagen && (
          <img src={programa.imagen} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" style={{ objectPosition: programa.imagenPos }} />
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
      </div>
    </div>
  );
}
