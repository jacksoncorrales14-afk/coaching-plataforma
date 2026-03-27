"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Clase {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  precio: number;
  categoria: string;
}

interface AccesoInfo {
  claseId: string;
  expiraAt: string;
}

export default function ClasesPage() {
  const [clases, setClases] = useState<Clase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("Todas");
  const [busqueda, setBusqueda] = useState("");
  const [accesos, setAccesos] = useState<AccesoInfo[]>([]);

  // Modal de código post-pago
  const [modalCodigo, setModalCodigo] = useState<{
    codigo: string;
    titulo: string;
    expiraAt: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/clases")
      .then((r) => r.json())
      .then(setClases)
      .finally(() => setLoading(false));

    const email = localStorage.getItem("coach_email");
    if (email) {
      fetch(`/api/mis-clases?email=${encodeURIComponent(email)}`)
        .then((r) => r.json())
        .then((data: any[]) => {
          setAccesos(
            data.map((a) => ({ claseId: a.clase.id, expiraAt: a.expiraAt }))
          );
        });
    }
  }, []);

  const categorias = [
    "Todas",
    ...Array.from(new Set(clases.map((c) => c.categoria))),
  ];

  const clasesFiltradas = clases.filter((c) => {
    const matchCategoria = filtro === "Todas" || c.categoria === filtro;
    const matchBusqueda =
      busqueda === "" ||
      c.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    return matchCategoria && matchBusqueda;
  });

  const tieneAcceso = (claseId: string) => {
    const acc = accesos.find((a) => a.claseId === claseId);
    if (!acc) return false;
    return new Date(acc.expiraAt) > new Date();
  };

  const diasRestantes = (claseId: string) => {
    const acc = accesos.find((a) => a.claseId === claseId);
    if (!acc) return 0;
    const diff = new Date(acc.expiraAt).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Placeholder para cuando se integre Stripe
  const handleComprar = (clase: Clase) => {
    // TODO: Integrar Stripe aquí
    // Por ahora muestra un mensaje
    alert(
      `Proximamente: Pago con Stripe por $${clase.precio.toFixed(2)} para "${clase.titulo}"`
    );
    // Después del pago exitoso de Stripe, el backend generará un código
    // y se mostrará el modal con setModalCodigo({ codigo, titulo, expiraAt })
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-wine-600" />
          <p className="text-sm text-gray-400">Cargando cursos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="mb-2 text-center text-3xl font-bold text-gray-900">
            Nuestros Cursos
          </h1>
          <p className="mb-8 text-center text-gray-500">
            Elige el curso que necesitas para impulsar tu negocio
          </p>

          {/* Barra de búsqueda */}
          <div className="mx-auto max-w-lg">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Buscar cursos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-full border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-wine-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-wine-500/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Filtros */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setFiltro(cat)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                filtro === cat
                  ? "bg-wine-600 text-white shadow-md"
                  : "bg-white text-gray-600 shadow-sm hover:bg-gray-100 hover:shadow"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid de burbujas */}
        {clasesFiltradas.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            No hay cursos disponibles
            {busqueda && ` para "${busqueda}"`}
            {filtro !== "Todas" && ` en ${filtro}`}.
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {clasesFiltradas.map((clase) => {
              const activo = tieneAcceso(clase.id);
              const dias = diasRestantes(clase.id);

              return (
                <div
                  key={clase.id}
                  className="group overflow-hidden rounded-[2rem] bg-white shadow-sm transition-all hover:shadow-xl"
                >
                  {/* Imagen */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                    {clase.imagen ? (
                      <img
                        src={clase.imagen}
                        alt={clase.titulo}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <svg
                          className="h-16 w-16 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    )}
                    {/* Badge categoría */}
                    <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-700 backdrop-blur-sm">
                      {clase.categoria}
                    </span>
                    {/* Badge acceso activo */}
                    {activo && (
                      <span className="absolute right-4 top-4 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">
                        {dias} dias restantes
                      </span>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="p-6">
                    <h3 className="mb-2 text-lg font-bold text-gray-900">
                      {clase.titulo}
                    </h3>
                    <p className="mb-5 line-clamp-2 text-sm leading-relaxed text-gray-500">
                      {clase.descripcion}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900">
                        ${clase.precio.toFixed(2)}
                      </span>

                      {activo ? (
                        <Link
                          href={`/clases/${clase.id}`}
                          className="rounded-full bg-green-500 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-green-600 hover:shadow-md"
                        >
                          Ver Curso
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleComprar(clase)}
                          className="rounded-full bg-wine-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-wine-700 hover:shadow-md"
                        >
                          Comprar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal código post-pago */}
      {modalCodigo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              Pago exitoso!
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              Tu codigo de acceso para <strong>{modalCodigo.titulo}</strong> es:
            </p>
            <div className="mb-4 rounded-2xl bg-gray-50 p-4">
              <code className="text-3xl font-bold tracking-widest text-wine-600">
                {modalCodigo.codigo}
              </code>
            </div>
            <p className="mb-6 text-xs text-gray-400">
              Este codigo es valido por 30 dias (hasta{" "}
              {new Date(modalCodigo.expiraAt).toLocaleDateString("es")}).
              Usalo en la seccion &quot;Desbloquear&quot; para acceder al contenido.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/desbloquear"
                className="btn-primary w-full py-3 text-center"
              >
                Ir a Desbloquear
              </Link>
              <button
                onClick={() => setModalCodigo(null)}
                className="btn-secondary w-full py-3"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
