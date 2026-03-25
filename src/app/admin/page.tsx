"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface ClaseStats {
  id: string;
  titulo: string;
  publicada: boolean;
  precio: number;
  categoria: string;
  _count: { codigos: number; accesos: number };
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clases, setClases] = useState<ClaseStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      fetch("/api/clases")
        .then((r) => r.json())
        .then(setClases)
        .finally(() => setLoading(false));
    }
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  if (session?.user?.role !== "admin") return null;

  const totalClases = clases.length;
  const totalCodigos = clases.reduce((s, c) => s + c._count.codigos, 0);
  const totalAccesos = clases.reduce((s, c) => s + c._count.accesos, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Admin</h1>
          <p className="text-sm text-gray-500">
            Bienvenida, {session.user.name}
          </p>
        </div>
        <Link href="/admin/clases/nueva" className="btn-primary">
          + Nueva Clase
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary-600">{totalClases}</p>
          <p className="text-sm text-gray-500">Clases</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-accent-600">{totalCodigos}</p>
          <p className="text-sm text-gray-500">Codigos Generados</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{totalAccesos}</p>
          <p className="text-sm text-gray-500">Accesos Otorgados</p>
        </div>
      </div>

      {/* Tabla de clases */}
      <div className="card overflow-hidden p-0">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">Mis Clases</h2>
        </div>
        {clases.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No tienes clases aun. Crea tu primera clase!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3">Titulo</th>
                  <th className="px-6 py-3">Categoria</th>
                  <th className="px-6 py-3">Precio</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3">Codigos</th>
                  <th className="px-6 py-3">Accesos</th>
                  <th className="px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clases.map((clase) => (
                  <tr key={clase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {clase.titulo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {clase.categoria}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      ${clase.precio.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          clase.publicada
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {clase.publicada ? "Publicada" : "Borrador"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {clase._count.codigos}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {clase._count.accesos}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/clases/${clase.id}`}
                          className="text-sm font-medium text-primary-600 hover:text-primary-800"
                        >
                          Editar
                        </Link>
                        <Link
                          href={`/admin/codigos/${clase.id}`}
                          className="text-sm font-medium text-accent-600 hover:text-accent-800"
                        >
                          Codigos
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
