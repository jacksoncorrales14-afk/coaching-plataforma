"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MembresiaInfo {
  activa: boolean;
  plan?: string;
  expiraAt?: string;
  inicioAt?: string;
}

export default function MembresiaPage() {
  const [planSeleccionado, setPlanSeleccionado] = useState<"mensual" | "trimestral">("trimestral");
  const [membresia, setMembresia] = useState<MembresiaInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = localStorage.getItem("coach_email");
    if (email) {
      fetch(`/api/membresia?email=${encodeURIComponent(email)}`)
        .then((r) => r.json())
        .then(setMembresia)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const planes = {
    mensual: {
      nombre: "Mensual",
      precio: 195,
      periodo: "/mes",
      ahorro: null,
      duracion: "Acceso por 30 dias",
    },
    trimestral: {
      nombre: "Trimestral",
      precio: 395,
      periodo: "/3 meses",
      ahorro: "Ahorra $190",
      duracion: "Acceso por 90 dias",
    },
  };

  const plan = planes[planSeleccionado];

  const handleSuscribirse = () => {
    // TODO: Integrar Stripe Checkout aquí
    alert(
      `Proximamente: Pago con Stripe por $${plan.precio} (plan ${planSeleccionado})`
    );
  };

  // Si ya tiene membresía activa
  if (!loading && membresia?.activa) {
    const expira = new Date(membresia.expiraAt!);
    const dias = Math.ceil(
      (expira.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Tu membresia esta activa
            </h1>
            <p className="mb-1 text-sm text-gray-500">
              Plan: <strong className="text-gray-900 capitalize">{membresia.plan}</strong>
            </p>
            <p className="mb-8 text-sm text-gray-500">
              Vence en <strong className="text-wine-600">{dias} dias</strong>{" "}
              ({expira.toLocaleDateString("es")})
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/clases" className="btn-primary px-8 py-3">
                Ver Cursos
              </Link>
              <Link href="/programas" className="btn-secondary px-8 py-3">
                Ver Programas
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-wine-600 py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-wine-700/50 via-transparent to-wine-800/30" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-wine-500/20 blur-[120px]" />
        <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-wine-900/20 blur-[100px]" />

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h1 className="mb-4 text-4xl font-extrabold text-white sm:text-5xl">
            Membresia
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-wine-100">
            Accede a todos los cursos, programas exclusivos por niveles y
            se parte de una comunidad que crece contigo.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        {/* Toggle de plan */}
        <div className="mb-12 flex justify-center">
          <div className="inline-flex rounded-full bg-white p-1 shadow-sm">
            <button
              onClick={() => setPlanSeleccionado("mensual")}
              className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                planSeleccionado === "mensual"
                  ? "bg-wine-600 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setPlanSeleccionado("trimestral")}
              className={`relative rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                planSeleccionado === "trimestral"
                  ? "bg-wine-600 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Trimestral
              <span className="absolute -right-2 -top-2 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">
                -33%
              </span>
            </button>
          </div>
        </div>

        <div className="grid items-start gap-10 lg:grid-cols-2">
          {/* Card de precio */}
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="mb-6">
              {plan.ahorro && (
                <span className="mb-3 inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  {plan.ahorro}
                </span>
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-extrabold text-gray-900">
                  ${plan.precio}
                </span>
                <span className="text-lg text-gray-400">{plan.periodo}</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">{plan.duracion}</p>
            </div>

            <button
              onClick={handleSuscribirse}
              className="mb-6 w-full rounded-xl bg-wine-600 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-wine-700 hover:shadow-xl"
            >
              Suscribirme ahora
            </button>

            {/* Aviso de cancelación */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3">
                <svg className="h-5 w-5 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Cancelacion manual
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    Tu membresia se renueva automaticamente. Si deseas cancelar,
                    debes hacerlo manualmente desde tu perfil antes de la fecha
                    de renovacion. No se realizan reembolsos por periodos parciales.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Qué incluye */}
          <div>
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Todo lo que incluye
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-wine-50">
                  <svg className="h-5 w-5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Todos los cursos</h3>
                  <p className="text-sm text-gray-500">
                    Acceso ilimitado a todos los cursos actuales y futuros de la plataforma.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-wine-50">
                  <svg className="h-5 w-5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Programas por niveles</h3>
                  <p className="text-sm text-gray-500">
                    Programas exclusivos de larga duracion con niveles progresivos.
                    Desbloquea el siguiente nivel al completar el anterior.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-wine-50">
                  <svg className="h-5 w-5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Foro en programas</h3>
                  <p className="text-sm text-gray-500">
                    Participa en el foro exclusivo de cada programa. Comparte,
                    pregunta y aprende junto a otras alumnas.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-wine-50">
                  <svg className="h-5 w-5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Comunidad</h3>
                  <p className="text-sm text-gray-500">
                    Accede a la seccion de comunidad donde puedes comentar, aportar
                    y conectar con otras emprendedoras.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-wine-50">
                  <svg className="h-5 w-5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Contenido nuevo cada mes</h3>
                  <p className="text-sm text-gray-500">
                    Se agregan cursos y contenido nuevo constantemente.
                    Tu membresia te da acceso automatico a todo lo nuevo.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-wine-50">
                  <svg className="h-5 w-5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Acceso 24/7</h3>
                  <p className="text-sm text-gray-500">
                    Estudia a tu ritmo, cuando quieras y desde cualquier dispositivo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comparación */}
        <div className="mt-20">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
            Membresia vs Curso individual
          </h2>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Caracteristica</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-wine-600">Membresia</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">Curso individual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  ["Acceso a todos los cursos", true, false],
                  ["Programas por niveles", true, false],
                  ["Foro de programas", true, false],
                  ["Comunidad", true, true],
                  ["Contenido nuevo automatico", true, false],
                  ["Acceso 24/7", true, true],
                  ["Duracion del acceso", "Mientras pagues", "30 dias"],
                ].map(([feat, mem, ind], i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-700">{feat as string}</td>
                    <td className="px-6 py-3 text-center">
                      {typeof mem === "boolean" ? (
                        mem ? (
                          <svg className="mx-auto h-5 w-5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="mx-auto h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )
                      ) : (
                        <span className="text-sm font-medium text-wine-600">{mem as string}</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {typeof ind === "boolean" ? (
                        ind ? (
                          <svg className="mx-auto h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="mx-auto h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )
                      ) : (
                        <span className="text-sm text-gray-500">{ind as string}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
            Preguntas frecuentes
          </h2>
          <div className="mx-auto max-w-3xl space-y-4">
            {[
              {
                q: "¿Puedo cancelar en cualquier momento?",
                a: "Si, puedes cancelar tu membresia manualmente desde tu perfil. La cancelacion sera efectiva al final de tu periodo actual. No se realizan reembolsos por periodos parciales.",
              },
              {
                q: "¿Que pasa con los programas si cancelo?",
                a: "Tu progreso se guarda, pero perderas acceso a los programas y niveles hasta que reactives tu membresia.",
              },
              {
                q: "¿Los cursos individuales estan incluidos en la membresia?",
                a: "Si, con la membresia tienes acceso a todos los cursos de la plataforma sin costo adicional, ademas de los programas exclusivos por niveles.",
              },
              {
                q: "¿Como funcionan los programas por niveles?",
                a: "Los programas estan divididos en niveles. Debes ver todos los videos de un nivel para desbloquear el siguiente. Esto garantiza un aprendizaje progresivo y solido.",
              },
            ].map((faq, i) => (
              <div key={i} className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-2 font-semibold text-gray-900">{faq.q}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
