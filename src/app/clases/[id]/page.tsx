"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Clase {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  precio: number;
  categoria: string;
}

export default function ClaseDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [clase, setClase] = useState<Clase | null>(null);
  const [contenido, setContenido] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener datos de la clase (ya no incluye contenido para usuarios públicos)
    fetch(`/api/clases/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setClase(data);
        setLoading(false);
      });

    // Verificar acceso y obtener contenido desde endpoint protegido
    const email =
      searchParams.get("email") || localStorage.getItem("coach_email");
    if (email) {
      fetch(`/api/clases/${params.id}/contenido?email=${encodeURIComponent(email)}`)
        .then((r) => {
          if (r.ok) {
            setHasAccess(true);
            return r.json();
          }
          return null;
        })
        .then((data) => {
          if (data) setContenido(data.contenido);
        });
    }
  }, [params.id, searchParams]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  if (!clase) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Clase no encontrada</p>
      </div>
    );
  }

  // Detectar si el contenido es un enlace de YouTube para mostrar embed
  const getEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    // YouTube
    const ytMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/
    );
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return null;
  };

  const embedUrl = contenido ? getEmbedUrl(contenido) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/clases"
        className="mb-6 inline-block text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Volver a clases
      </Link>

      <div className="card">
        <span className="mb-4 inline-block rounded-full bg-nude-100 px-3 py-1 text-xs font-medium text-gray-700">
          {clase.categoria}
        </span>
        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          {clase.titulo}
        </h1>
        <p className="mb-6 text-gray-600">{clase.descripcion}</p>

        {hasAccess ? (
          <div>
            <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700">
              Tienes acceso a esta clase
            </div>

            {embedUrl ? (
              <div className="aspect-video overflow-hidden rounded-xl">
                <iframe
                  src={embedUrl}
                  className="h-full w-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            ) : contenido ? (
              <div className="rounded-xl bg-gray-50 p-6">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Enlace al contenido:
                </p>
                <a
                  href={contenido}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-wine-600 underline hover:text-wine-700"
                >
                  {contenido}
                </a>
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-400">
                El contenido estara disponible pronto.
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="mb-6 rounded-xl bg-gray-50 p-12">
              <svg
                className="mx-auto mb-4 h-16 w-16 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <h3 className="mb-2 text-lg font-bold text-gray-600">
                Contenido Bloqueado
              </h3>
              <p className="mb-4 text-sm text-gray-400">
                Necesitas un codigo de acceso para ver esta clase.
              </p>
              <p className="mb-6 text-2xl font-bold text-black">
                ${clase.precio.toFixed(2)}
              </p>
              <Link href="/desbloquear" className="btn-primary">
                Tengo un Codigo
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
