"use client";

import { useEffect, useState } from "react";
import { ClaseCard } from "@/components/ClaseCard";

interface Clase {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  precio: number;
  categoria: string;
}

export default function ClasesPage() {
  const [clases, setClases] = useState<Clase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("Todas");
  const [accesosIds, setAccesosIds] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/clases")
      .then((r) => r.json())
      .then(setClases)
      .finally(() => setLoading(false));

    // Cargar accesos del localStorage
    const email = localStorage.getItem("coach_email");
    if (email) {
      fetch(`/api/mis-clases?email=${encodeURIComponent(email)}`)
        .then((r) => r.json())
        .then((accesos: any[]) => {
          setAccesosIds(accesos.map((a) => a.clase.id));
        });
    }
  }, []);

  const categorias = [
    "Todas",
    ...Array.from(new Set(clases.map((c) => c.categoria))),
  ];

  const clasesFiltradas =
    filtro === "Todas" ? clases : clases.filter((c) => c.categoria === filtro);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Cargando clases...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Clases y Capacitaciones
        </h1>
        <p className="text-gray-500">
          Elige la clase que necesitas para impulsar tu negocio
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {categorias.map((cat) => (
          <button
            key={cat}
            onClick={() => setFiltro(cat)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filtro === cat
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de clases */}
      {clasesFiltradas.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          No hay clases disponibles en esta categoria.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clasesFiltradas.map((clase) => (
            <ClaseCard
              key={clase.id}
              {...clase}
              desbloqueada={accesosIds.includes(clase.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
