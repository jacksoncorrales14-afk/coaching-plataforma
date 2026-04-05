import Link from "next/link";
import Image from "next/image";

export function ProgramasTab({ programas }: { programas: any[] }) {
  return (
    <div>
      <h2 className="mb-2 text-xl font-bold text-gray-900">
        Programas por niveles
      </h2>
      <p className="mb-6 text-sm text-gray-500">
        Completa cada nivel para desbloquear el siguiente
      </p>

      {programas.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-wine-50">
            <svg
              className="h-8 w-8 text-wine-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <h3 className="mb-1 text-lg font-bold text-gray-900">
            Proximamente
          </h3>
          <p className="text-sm text-gray-500">
            Los programas exclusivos por niveles estaran disponibles muy pronto.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {programas.map((prog: any) => (
            <div
              key={prog.id}
              className="group overflow-hidden rounded-3xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Portada */}
              <div className="relative h-36 bg-gradient-to-br from-wine-600 to-wine-800">
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
              <div className="p-4">
                <h3 className="mb-3 line-clamp-2 text-center text-base font-bold text-gray-900">
                  {prog.titulo}
                </h3>
                <Link
                  href={`/programas/${prog.id}`}
                  className="block w-full rounded-full bg-wine-600 px-4 py-2 text-center text-sm font-semibold text-white transition-all hover:bg-wine-700"
                >
                  Ir al programa
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
