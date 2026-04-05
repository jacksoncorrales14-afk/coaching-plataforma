"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Programa {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  imagenPos: string;
  precio: number;
  niveles: { id: string; titulo: string; _count: { videos: number } }[];
}

export default function ProgramasPage() {
  const router = useRouter();
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/programas", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setProgramas(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((e) => { if (e.name !== "AbortError") console.error(e); });

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-wine-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-wine-600 py-16">
        <div className="absolute inset-0 bg-gradient-to-br from-wine-700/50 via-transparent to-wine-800/30" />
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-wine-500/20 blur-[100px]" />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6">
          <h1 className="mb-3 text-3xl font-extrabold text-white sm:text-4xl">Programas</h1>
          <p className="mx-auto max-w-2xl text-wine-100">
            Programas de larga duracion con niveles progresivos. Completa cada nivel para desbloquear el siguiente.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {programas.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-gray-500">Proximamente se publicaran programas.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {programas.map((prog) => (
              <div key={prog.id} className="group overflow-hidden rounded-3xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                {/* Portada */}
                <div className="relative h-48 bg-gradient-to-br from-wine-600 to-wine-800">
                  {prog.imagen && (
                    <Image
                      src={prog.imagen}
                      alt={prog.titulo}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                      style={{ objectPosition: prog.imagenPos || "50% 50%" }}
                    />
                  )}
                </div>
                {/* Info */}
                <div className="p-5">
                  <h3 className="mb-4 line-clamp-2 text-center text-lg font-bold text-gray-900">
                    {prog.titulo}
                  </h3>
                  <Link
                    href={`/programas/${prog.id}`}
                    className="block w-full rounded-full bg-wine-600 px-5 py-2.5 text-center text-sm font-semibold text-white transition-all hover:bg-wine-700"
                  >
                    Ir al programa
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
