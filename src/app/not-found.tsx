import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center">
        <h2 className="mb-2 text-4xl font-bold text-gray-900">404</h2>
        <p className="mb-6 text-sm text-gray-500">
          La pagina que buscas no existe.
        </p>
        <Link href="/" className="btn-primary">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
