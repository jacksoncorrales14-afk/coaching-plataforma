export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-wine-600" />
        <p className="text-sm text-gray-400">Cargando...</p>
      </div>
    </div>
  );
}
