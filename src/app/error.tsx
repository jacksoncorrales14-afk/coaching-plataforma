"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Algo salio mal
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          Ocurrio un error inesperado. Por favor intenta de nuevo.
        </p>
        <button onClick={reset} className="btn-primary">
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
