"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AccesoInfo {
  id: string;
  expiraAt: string;
  clase: {
    id: string;
    titulo: string;
    descripcion: string;
    imagen: string;
    categoria: string;
  };
}

interface MembresiaInfo {
  activa: boolean;
  plan?: string;
  expiraAt?: string;
}

export default function MiCuentaPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accesos, setAccesos] = useState<AccesoInfo[]>([]);
  const [membresia, setMembresia] = useState<MembresiaInfo | null>(null);

  // Verificar si ya tiene sesión guardada
  useEffect(() => {
    const savedEmail = localStorage.getItem("coach_email");
    const savedAuth = localStorage.getItem("coach_auth");
    if (savedEmail && savedAuth === "true") {
      setEmail(savedEmail);
      cargarDatos(savedEmail);
    }
  }, []);

  const cargarDatos = async (correo: string) => {
    const emailNorm = correo.trim().toLowerCase();

    const [accRes, memRes] = await Promise.all([
      fetch(`/api/mis-clases?email=${encodeURIComponent(emailNorm)}`),
      fetch(`/api/membresia?email=${encodeURIComponent(emailNorm)}`),
    ]);

    const accData = await accRes.json();
    const memData = await memRes.json();

    const vigentes = Array.isArray(accData)
      ? accData.filter((a: any) => new Date(a.expiraAt) > new Date())
      : [];

    setAccesos(vigentes);
    setMembresia(memData);
    setLoggedIn(true);

    // Si tiene membresía activa, redirigir al dashboard completo
    if (memData.activa) {
      router.push("/mi-cuenta/dashboard");
      return;
    }
  };

  const handleIngresar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !codigo.trim()) return;

    setError("");
    setLoading(true);

    const emailNorm = email.trim().toLowerCase();
    const codigoNorm = codigo.trim().toUpperCase();

    // Verificar código contra accesos de cursos
    const res = await fetch(`/api/verificar-codigo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailNorm, codigo: codigoNorm }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    // Guardar sesión
    localStorage.setItem("coach_email", emailNorm);
    localStorage.setItem("coach_auth", "true");
    await cargarDatos(emailNorm);
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem("coach_email");
    localStorage.removeItem("coach_auth");
    setLoggedIn(false);
    setEmail("");
    setCodigo("");
    setAccesos([]);
    setMembresia(null);
  };

  const diasRestantes = (fecha: string) => {
    const diff = new Date(fecha).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Pantalla de login con código
  if (!loggedIn) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-wine-50">
                <svg className="h-7 w-7 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Ingresar</h1>
              <p className="mt-1 text-sm text-gray-500">
                Usa tu correo y el codigo que recibiste al realizar tu pago
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleIngresar} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Correo electronico
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
                  Codigo de acceso
                </label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  className="input-field text-center text-lg font-bold tracking-widest"
                  placeholder="XXXX-XXXX"
                  maxLength={9}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn-primary w-full py-3"
                disabled={loading}
              >
                {loading ? "Verificando..." : "Ingresar"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                ¿Aun no tienes un codigo?{" "}
                <Link href="/clases" className="text-wine-600 hover:underline">
                  Compra un curso
                </Link>{" "}
                o{" "}
                <Link href="/membresia" className="text-wine-600 hover:underline">
                  adquiere la membresia
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard del estudiante
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mi cuenta</h1>
            <p className="text-sm text-gray-500">{email}</p>
          </div>
          <button
            onClick={handleCerrarSesion}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all hover:bg-gray-50"
          >
            Cerrar sesion
          </button>
        </div>

        {/* Membresía */}
        {membresia?.activa ? (
          <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-wine-600 to-wine-700 p-6 text-white shadow-lg sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold uppercase">
                    Membresia {membresia.plan}
                  </span>
                  <span className="rounded-full bg-green-400/20 px-3 py-0.5 text-xs font-semibold text-green-200">
                    Activa
                  </span>
                </div>
                <h2 className="text-xl font-bold">
                  Tu membresia esta activa
                </h2>
                <p className="mt-1 text-sm text-wine-100">
                  Vence en {diasRestantes(membresia.expiraAt!)} dias (
                  {new Date(membresia.expiraAt!).toLocaleDateString("es")})
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/clases"
                  className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-wine-600 transition-all hover:bg-nude-50"
                >
                  Ver Cursos
                </Link>
                <Link
                  href="/programas"
                  className="rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
                >
                  Programas
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  No tienes membresia activa
                </h2>
                <p className="text-sm text-gray-500">
                  Con la membresia accedes a todos los cursos y programas exclusivos
                </p>
              </div>
              <Link
                href="/membresia"
                className="btn-primary px-6 py-2.5 text-center"
              >
                Ver planes
              </Link>
            </div>
          </div>
        )}

        {/* Cursos activos */}
        <div>
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Mis cursos ({accesos.length})
          </h2>

          {accesos.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
              <svg className="mx-auto mb-4 h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="mb-1 text-gray-500">No tienes cursos individuales activos</p>
              <p className="mb-6 text-sm text-gray-400">
                Compra un curso para acceder a su contenido por 30 dias
              </p>
              <Link href="/clases" className="btn-primary px-6 py-2.5">
                Explorar cursos
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {accesos.map((acc) => (
                <div
                  key={acc.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200">
                    {acc.clase.imagen ? (
                      <img
                        src={acc.clase.imagen}
                        alt={acc.clase.titulo}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <svg className="h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                    <span className="absolute right-3 top-3 rounded-full bg-green-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                      {diasRestantes(acc.expiraAt)}d restantes
                    </span>
                  </div>
                  <div className="p-4">
                    <span className="mb-1 inline-block text-xs font-medium text-gray-400">
                      {acc.clase.categoria}
                    </span>
                    <h3 className="mb-3 font-bold text-gray-900">
                      {acc.clase.titulo}
                    </h3>
                    <Link
                      href={`/clases/${acc.clase.id}`}
                      className="inline-flex w-full items-center justify-center rounded-xl bg-wine-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-wine-700"
                    >
                      Continuar curso
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
