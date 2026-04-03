import Link from "next/link";
import Image from "next/image";

interface ClaseCardProps {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  precio: number;
  categoria: string;
  desbloqueada?: boolean;
}

export function ClaseCard({
  id,
  titulo,
  descripcion,
  imagen,
  precio,
  categoria,
  desbloqueada,
}: ClaseCardProps) {
  return (
    <div className="card group overflow-hidden p-0">
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-nude-100 to-nude-200">
        {imagen ? (
          <Image
            src={imagen}
            alt={titulo}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg
              className="h-16 w-16 text-nude-400"
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
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-700 backdrop-blur-sm">
          {categoria}
        </span>
        {desbloqueada && (
          <span className="absolute right-3 top-3 rounded-full bg-green-500 px-3 py-1 text-xs font-medium text-white">
            Desbloqueada
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="mb-2 text-lg font-bold text-gray-900">{titulo}</h3>
        <p className="mb-4 line-clamp-2 text-sm text-gray-500">
          {descripcion}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-black">
            ${precio.toFixed(2)}
          </span>
          {desbloqueada ? (
            <Link href={`/clases/${id}`} className="btn-primary text-xs">
              Ver Curso
            </Link>
          ) : (
            <Link href="/desbloquear" className="btn-accent text-xs">
              Desbloquear
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
