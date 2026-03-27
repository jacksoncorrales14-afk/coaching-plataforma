"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { ImagePositionEditor } from "@/components/ImagePositionEditor";

interface VideoForm {
  titulo: string;
  url: string;
}

interface NivelForm {
  titulo: string;
  descripcion: string;
  videos: VideoForm[];
}

export default function NuevoProgramaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagen, setImagen] = useState("");
  const [imagenPos, setImagenPos] = useState("50% 50%");
  const [niveles, setNiveles] = useState<NivelForm[]>([
    { titulo: "Nivel 1", descripcion: "", videos: [{ titulo: "", url: "" }] },
  ]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (session?.user?.role !== "admin") return null;

  const agregarNivel = () => {
    setNiveles([
      ...niveles,
      { titulo: `Nivel ${niveles.length + 1}`, descripcion: "", videos: [{ titulo: "", url: "" }] },
    ]);
  };

  const eliminarNivel = (i: number) => {
    if (niveles.length <= 1) return;
    setNiveles(niveles.filter((_, idx) => idx !== i));
  };

  const actualizarNivel = (i: number, field: string, value: string) => {
    setNiveles(niveles.map((n, idx) => idx === i ? { ...n, [field]: value } : n));
  };

  const agregarVideo = (nivelIdx: number) => {
    setNiveles(niveles.map((n, i) =>
      i === nivelIdx ? { ...n, videos: [...n.videos, { titulo: "", url: "" }] } : n
    ));
  };

  const eliminarVideo = (nivelIdx: number, videoIdx: number) => {
    setNiveles(niveles.map((n, i) =>
      i === nivelIdx ? { ...n, videos: n.videos.filter((_, j) => j !== videoIdx) } : n
    ));
  };

  const actualizarVideo = (nivelIdx: number, videoIdx: number, field: string, value: string) => {
    setNiveles(niveles.map((n, i) =>
      i === nivelIdx
        ? { ...n, videos: n.videos.map((v, j) => j === videoIdx ? { ...v, [field]: value } : v) }
        : n
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    setLoading(true);

    const res = await fetch("/api/admin/programas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo,
        descripcion,
        imagen,
        imagenPos,
        niveles: niveles.filter(n => n.titulo.trim()).map(n => ({
          ...n,
          videos: n.videos.filter(v => v.titulo.trim()),
        })),
      }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/admin");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <button onClick={() => router.push("/admin")} className="mb-6 text-sm text-gray-500 hover:text-gray-700">
        &larr; Volver al panel
      </button>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Nuevo Programa</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Info del programa */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Informacion del programa</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Titulo *</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="input-field"
                placeholder="Ej: Programa de Marketing Avanzado"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Descripcion</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="input-field min-h-[100px]"
                placeholder="Describe de que trata este programa..."
              />
            </div>
            <ImageUpload value={imagen} onChange={setImagen} />
            <ImagePositionEditor
              imageUrl={imagen}
              position={imagenPos}
              onChange={setImagenPos}
            />
          </div>
        </div>

        {/* Niveles */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Niveles ({niveles.length})</h2>
            <button
              type="button"
              onClick={agregarNivel}
              className="rounded-lg bg-wine-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-wine-700"
            >
              + Agregar Nivel
            </button>
          </div>

          <div className="space-y-4">
            {niveles.map((nivel, i) => (
              <div key={i} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-wine-600 text-sm font-bold text-white">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <label className="mb-1 block text-xs font-medium text-gray-500">Titulo del nivel</label>
                        <input
                          type="text"
                          value={nivel.titulo}
                          onChange={(e) => actualizarNivel(i, "titulo", e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-lg font-bold text-gray-900 placeholder:font-normal placeholder:text-gray-400 focus:border-wine-500 focus:outline-none"
                          placeholder="Ej: Fundamentos de Marketing"
                        />
                      </div>
                    </div>
                  </div>
                  {niveles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminarNivel(i)}
                      className="rounded-lg p-2 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="mb-4">
                  <label className="mb-1 block text-xs font-medium text-gray-500">Descripcion del nivel</label>
                  <textarea
                    value={nivel.descripcion}
                    onChange={(e) => actualizarNivel(i, "descripcion", e.target.value)}
                    className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 placeholder:text-gray-400 focus:border-wine-500 focus:bg-white focus:outline-none"
                    placeholder="Describe que aprendera la alumna en este nivel..."
                    rows={2}
                  />
                </div>

                {/* Videos del nivel */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-gray-400">Videos</p>
                  {nivel.videos.map((video, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-gray-100 text-xs font-medium text-gray-500">
                        {j + 1}
                      </span>
                      <input
                        type="text"
                        value={video.titulo}
                        onChange={(e) => actualizarVideo(i, j, "titulo", e.target.value)}
                        className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-wine-500 focus:outline-none"
                        placeholder="Titulo del video"
                      />
                      <input
                        type="text"
                        value={video.url}
                        onChange={(e) => actualizarVideo(i, j, "url", e.target.value)}
                        className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-wine-500 focus:outline-none"
                        placeholder="URL del video (YouTube, Vimeo...)"
                      />
                      {nivel.videos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarVideo(i, j)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => agregarVideo(i)}
                    className="mt-1 text-sm font-medium text-wine-600 hover:text-wine-700"
                  >
                    + Agregar video
                  </button>
                </div>

                {/* Indicador de desbloqueo */}
                {i < niveles.length - 1 && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    El nivel {i + 2} se desbloquea al completar todos los videos de este nivel
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="btn-primary px-8 py-3"
            disabled={loading || !titulo.trim()}
          >
            {loading ? "Creando..." : "Crear Programa"}
          </button>
          <button
            type="button"
            className="btn-secondary px-8 py-3"
            onClick={() => router.push("/admin")}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
