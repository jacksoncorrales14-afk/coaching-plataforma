"use client";

import { useState } from "react";
import Link from "next/link";

export default function DesbloquearPage() {
  const [codigo, setCodigo] = useState("");
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    claseId: string;
    claseTitulo: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(null);
    setLoading(true);

    const res = await fetch("/api/desbloquear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo, email, nombre }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
    } else {
      // Guardar email en localStorage para recordar accesos
      localStorage.setItem("coach_email", email.trim().toLowerCase());
      setSuccess({
        claseId: data.acceso.clase.id,
        claseTitulo: data.acceso.clase.titulo,
      });
      setCodigo("");
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        {success ? (
          <div className="card text-center">
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
              Clase Desbloqueada!
            </h2>
            <p className="mb-6 text-gray-500">
              Ya tienes acceso a: <strong>{success.claseTitulo}</strong>
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href={`/clases/${success.claseId}?email=${encodeURIComponent(email)}`}
                className="btn-primary"
              >
                Ver Clase Ahora
              </Link>
              <button
                onClick={() => setSuccess(null)}
                className="btn-secondary"
              >
                Desbloquear Otra Clase
              </button>
            </div>
          </div>
        ) : (
          <div className="card">
            <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
              Desbloquear Clase
            </h1>
            <p className="mb-8 text-center text-sm text-gray-500">
              Ingresa el codigo que recibiste despues de tu pago
            </p>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tu Nombre
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="input-field"
                  placeholder="Tu nombre completo"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tu Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="tu@email.com"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Codigo de Acceso
                </label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  className="input-field text-center text-xl font-bold tracking-widest"
                  placeholder="XXXX-XXXX"
                  maxLength={9}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
              >
                {loading ? "Verificando..." : "Desbloquear Clase"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
