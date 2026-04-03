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
        <div className="space-y-6">
          {programas.map((prog: any) => (
            <div
              key={prog.id}
              className="overflow-hidden rounded-2xl bg-white shadow-sm"
            >
              {/* Portada */}
              <div className="relative h-44 bg-gradient-to-br from-wine-600 to-wine-800">
                {prog.imagen && (
                  <Image
                    src={prog.imagen}
                    alt={prog.titulo}
                    fill
                    sizes="100vw"
                    className="object-cover opacity-40"
                    style={{
                      objectPosition: prog.imagenPos || "50% 50%",
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {prog.titulo}
                    </h3>
                    <p className="mt-1 text-sm text-white/70">
                      {prog.descripcion}
                    </p>
                  </div>
                  <Link
                    href={`/programas/${prog.id}`}
                    className="flex-shrink-0 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-wine-600 shadow-lg transition-all hover:bg-nude-50"
                  >
                    Ir al programa
                  </Link>
                </div>
              </div>

              {/* Niveles como timeline */}
              <div className="p-6">
                <div className="relative">
                  <div className="absolute bottom-0 left-4 top-0 w-0.5 bg-gray-200" />
                  <div className="space-y-6">
                    {(prog.niveles || []).length === 0 ? (
                      <p className="ml-12 text-sm text-gray-400">
                        Este programa aun no tiene niveles.
                      </p>
                    ) : (
                      (prog.niveles || []).map(
                        (nivel: any, i: number) => {
                          const desbloqueado = i === 0;
                          return (
                            <div
                              key={nivel.id || i}
                              className="relative flex gap-4"
                            >
                              <div
                                className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                                  desbloqueado
                                    ? "bg-wine-600 text-white"
                                    : "bg-gray-200 text-gray-500"
                                }`}
                              >
                                {desbloqueado ? (
                                  <span className="text-xs font-bold">
                                    {i + 1}
                                  </span>
                                ) : (
                                  <svg
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                  </svg>
                                )}
                              </div>
                              <div
                                className={`flex-1 rounded-xl border p-4 transition-all ${
                                  desbloqueado
                                    ? "border-wine-100 bg-wine-50/30 hover:shadow-md"
                                    : "border-gray-100 bg-gray-50 opacity-60"
                                }`}
                              >
                                <div className="mb-1 flex items-center justify-between">
                                  <h4 className="font-bold text-gray-900">
                                    {nivel.titulo}
                                  </h4>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                      desbloqueado
                                        ? "bg-wine-100 text-wine-600"
                                        : "bg-gray-200 text-gray-500"
                                    }`}
                                  >
                                    {desbloqueado
                                      ? "Disponible"
                                      : "Bloqueado"}
                                  </span>
                                </div>
                                {nivel.descripcion && (
                                  <p className="mb-2 text-xs text-gray-500">
                                    {nivel.descripcion}
                                  </p>
                                )}
                                <p className="text-xs text-gray-400">
                                  {nivel.videos?.length ||
                                    nivel._count?.videos ||
                                    0}{" "}
                                  videos
                                </p>
                              </div>
                            </div>
                          );
                        }
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
