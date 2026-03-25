"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface CodigoItem {
  id: string;
  codigo: string;
  usado: boolean;
  usadoPor: string | null;
  usadoAt: string | null;
  createdAt: string;
}

export default function CodigosClasePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [codigos, setCodigos] = useState<CodigoItem[]>([]);
  const [claseTitle, setClaseTitle] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const fetchCodigos = () => {
    fetch(`/api/codigos?claseId=${params.claseId}`)
      .then((r) => r.json())
      .then(setCodigos);
  };

  useEffect(() => {
    if (params.claseId && session?.user?.role === "admin") {
      fetchCodigos();
      fetch(`/api/clases/${params.claseId}`)
        .then((r) => r.json())
        .then((data) => setClaseTitle(data.titulo));
    }
  }, [params.claseId, session]);

  if (session?.user?.role !== "admin") return null;

  const handleGenerar = async () => {
    setGenerating(true);
    const res = await fetch("/api/codigos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claseId: params.claseId, cantidad }),
    });
    if (res.ok) {
      fetchCodigos();
    }
    setGenerating(false);
  };

  const copiarCodigo = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    setCopied(codigo);
    setTimeout(() => setCopied(null), 2000);
  };

  const disponibles = codigos.filter((c) => !c.usado);
  const usados = codigos.filter((c) => c.usado);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <button
          onClick={() => router.push("/admin")}
          className="mb-4 text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Volver al panel
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          Codigos de Acceso
        </h1>
        <p className="text-sm text-gray-500">Clase: {claseTitle}</p>
      </div>

      {/* Generar códigos */}
      <div className="card mb-8">
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          Generar Nuevos Codigos
        </h2>
        <div className="flex items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Cantidad
            </label>
            <input
              type="number"
              min="1"
              max="50"
              className="input-field w-24"
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
            />
          </div>
          <button
            onClick={handleGenerar}
            className="btn-primary"
            disabled={generating}
          >
            {generating ? "Generando..." : "Generar Codigos"}
          </button>
        </div>
      </div>

      {/* Códigos disponibles */}
      <div className="card mb-6">
        <h2 className="mb-4 text-lg font-bold text-green-700">
          Disponibles ({disponibles.length})
        </h2>
        {disponibles.length === 0 ? (
          <p className="text-sm text-gray-400">
            No hay codigos disponibles. Genera nuevos codigos arriba.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {disponibles.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-green-100 bg-green-50 px-4 py-3"
              >
                <code className="text-lg font-bold tracking-wider text-green-800">
                  {c.codigo}
                </code>
                <button
                  onClick={() => copiarCodigo(c.codigo)}
                  className="text-xs font-medium text-green-600 hover:text-green-800"
                >
                  {copied === c.codigo ? "Copiado!" : "Copiar"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Códigos usados */}
      {usados.length > 0 && (
        <div className="card">
          <h2 className="mb-4 text-lg font-bold text-gray-500">
            Usados ({usados.length})
          </h2>
          <div className="space-y-2">
            {usados.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <div>
                  <code className="text-sm font-medium text-gray-400 line-through">
                    {c.codigo}
                  </code>
                  <p className="text-xs text-gray-400">
                    Usado por: {c.usadoPor} -{" "}
                    {c.usadoAt
                      ? new Date(c.usadoAt).toLocaleDateString("es")
                      : ""}
                  </p>
                </div>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-500">
                  Usado
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
