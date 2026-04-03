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

  const handleComprar = (prog: Programa) => {
    // TODO: Integrar Stripe
    alert(`Proximamente: Pago con Stripe por $${prog.precio.toFixed(2)} para "${prog.titulo}"`);
  };

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
          <div className="grid gap-8 md:grid-cols-2">
            {programas.map((prog) => {
              const totalNiveles = prog.niveles.length;
              const totalVideos = prog.niveles.reduce((s, n) => s + n._count.videos, 0);

              return (
                <div key={prog.id} className="overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-xl">
                  {/* Portada */}
                  <div className="relative h-52 bg-gradient-to-br from-wine-600 to-wine-800">
                    {prog.imagen && (
                      <Image
                        src={prog.imagen}
                        alt={prog.titulo}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover opacity-40"
                        style={{ objectPosition: prog.imagenPos || "50% 50%" }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h2 className="text-2xl font-bold text-white">{prog.titulo}</h2>
                      <div className="mt-2 flex gap-3 text-xs text-white/70">
                        <span>{totalNiveles} niveles</span>
                        <span>{totalVideos} videos</span>
                      </div>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-6">
                    <p className="mb-4 text-sm leading-relaxed text-gray-500">
                      {prog.descripcion}
                    </p>

                    {/* Niveles preview */}
                    <div className="mb-6 space-y-2">
                      {prog.niveles.slice(0, 4).map((nivel, i) => (
                        <div key={nivel.id} className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2">
                          <span className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${
                            i === 0 ? "bg-wine-600 text-white" : "bg-gray-200 text-gray-500"
                          }`}>
                            {i + 1}
                          </span>
                          <span className="text-sm text-gray-700">{nivel.titulo}</span>
                          <span className="ml-auto text-xs text-gray-400">{nivel._count.videos} videos</span>
                        </div>
                      ))}
                      {prog.niveles.length > 4 && (
                        <p className="text-center text-xs text-gray-400">
                          +{prog.niveles.length - 4} niveles mas
                        </p>
                      )}
                    </div>

                    {/* Precio y acciones */}
                    <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                      <div>
                        {prog.precio > 0 ? (
                          <span className="text-2xl font-bold text-gray-900">${prog.precio.toFixed(2)}</span>
                        ) : (
                          <span className="text-sm font-medium text-wine-600">Incluido en membresia</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {prog.precio > 0 && (
                          <button
                            onClick={() => handleComprar(prog)}
                            className="rounded-full bg-wine-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-wine-700"
                          >
                            Comprar
                          </button>
                        )}
                        <Link
                          href="/membresia"
                          className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
                        >
                          Ver membresia
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
