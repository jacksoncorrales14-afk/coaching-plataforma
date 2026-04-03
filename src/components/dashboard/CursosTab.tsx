import Link from "next/link";
import Image from "next/image";

interface Clase {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  precio: number;
  categoria: string;
}

export function CursosTab({ clases }: { clases: Clase[] }) {
  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-gray-900">
        Todos los cursos ({clases.length})
      </h2>
      {clases.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="text-gray-500">Aun no hay cursos publicados.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clases.map((clase) => (
            <Link
              key={clase.id}
              href={`/clases/${clase.id}`}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-lg"
            >
              <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200">
                {clase.imagen ? (
                  <Image
                    src={clase.imagen}
                    alt={clase.titulo}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <svg
                      className="h-12 w-12 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
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
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-700 backdrop-blur-sm">
                  {clase.categoria}
                </span>
                <span className="absolute right-3 top-3 rounded-full bg-green-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                  Incluido
                </span>
              </div>
              <div className="p-4">
                <h3 className="mb-1 font-bold text-gray-900 group-hover:text-wine-600">
                  {clase.titulo}
                </h3>
                <p className="line-clamp-2 text-sm text-gray-500">
                  {clase.descripcion}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
