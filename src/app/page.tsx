import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getStats() {
  const totalCursos = await prisma.clase.count({ where: { publicada: true } });
  return { totalCursos };
}

export default async function Home() {
  const { totalCursos } = await getStats();

  const comentarios = [
    {
      nombre: "Maria G.",
      texto: "La membresia cambio mi forma de ver el marketing. Los cursos son claros, practicos y puedo verlos cuando quiera.",
      avatar: "M",
    },
    {
      nombre: "Laura P.",
      texto: "Los cursos no solo me ayudaron a crecer profesionalmente, sino que tambien me impulsaron a crecer como persona de forma integral. Deby te transforma por completo.",
      avatar: "L",
    },
    {
      nombre: "Andrea R.",
      texto: "Deby explica de una forma que realmente entiendes. Mi negocio crecio un 40% desde que empece con sus cursos.",
      avatar: "A",
    },
  ];

  return (
    <div>
      {/* Hero — Rojo vino, impacto visual */}
      <section className="relative overflow-hidden bg-wine-600">
        {/* Textura sutil con gradientes */}
        <div className="absolute inset-0 bg-gradient-to-br from-wine-700/50 via-transparent to-wine-800/30" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-wine-500/20 blur-[120px]" />
        <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-wine-900/20 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="animate-fade-in-up">
              <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Invierte una vez.
                <br />
                <span className="text-nude-200">Aprende para siempre.</span>
              </h1>
              <p className="mx-auto mb-10 max-w-xl text-lg text-wine-100">
                Una membresia que te abre las puertas a todos nuestros cursos.
                Sin limites, sin sorpresas, hasta que asi lo decidas.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/membresia"
                  className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-base font-semibold text-wine-600 shadow-lg transition-all hover:bg-nude-50 hover:shadow-xl"
                >
                  Membresia
                </Link>
                <Link
                  href="/clases"
                  className="inline-flex items-center justify-center rounded-lg border-2 border-white/30 px-8 py-4 text-base font-semibold text-white transition-all hover:border-white hover:bg-white/10"
                >
                  Cursos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats — Blanco, respiro visual, números con acento vino */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-4xl font-extrabold text-wine-600">
                {totalCursos}+
              </p>
              <p className="mt-2 text-sm font-medium text-gray-500">
                Cursos dentro de la plataforma
              </p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-extrabold text-wine-600">24/7</p>
              <p className="mt-2 text-sm font-medium text-gray-500">
                Acceso ilimitado, cuando quieras
              </p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-extrabold text-wine-600">100%</p>
              <p className="mt-2 text-sm font-medium text-gray-500">
                Online, desde cualquier dispositivo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dos opciones — Gris muy claro, elegante y limpio */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">
            Dos formas de acceder
          </h2>
          <p className="mx-auto mb-14 max-w-xl text-center text-gray-500">
            Elige el camino que mejor se adapte a ti
          </p>
          <div className="grid gap-8 md:grid-cols-2">
            {/* Membresía */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-wine-600 bg-white p-8 shadow-sm transition-shadow hover:shadow-xl">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-wine-50" />
              <div className="relative">
                <div className="mb-4 inline-block rounded-full bg-wine-600 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
                  Recomendado
                </div>
                <h3 className="mb-3 text-2xl font-bold text-gray-900">
                  Membresia
                </h3>
                <p className="mb-6 text-gray-500">
                  Acceso total a todos los cursos actuales y futuros.
                  Paga mensual o anual y aprende sin limites.
                </p>
                <ul className="mb-8 space-y-3">
                  <li className="flex items-center gap-3 text-sm text-gray-700">
                    <svg className="h-5 w-5 flex-shrink-0 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Todos los cursos incluidos
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-700">
                    <svg className="h-5 w-5 flex-shrink-0 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Acceso al foro de la comunidad
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-700">
                    <svg className="h-5 w-5 flex-shrink-0 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Cursos nuevos cada mes
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-700">
                    <svg className="h-5 w-5 flex-shrink-0 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Cancela cuando quieras
                  </li>
                </ul>
                <Link href="/membresia" className="btn-primary w-full py-4 text-center">
                  Quiero la Membresia
                </Link>
              </div>
            </div>

            {/* Cursos individuales */}
            <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-xl">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gray-50" />
              <div className="relative">
                <div className="mb-4 inline-block rounded-full bg-gray-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                  Flexible
                </div>
                <h3 className="mb-3 text-2xl font-bold text-gray-900">
                  Cursos individuales
                </h3>
                <p className="mb-6 text-gray-500">
                  Compra solo los cursos que necesitas. Pago unico
                  y accede las veces que quieras durante un mes.
                </p>
                <ul className="mb-8 space-y-3">
                  <li className="flex items-center gap-3 text-sm text-gray-700">
                    <svg className="h-5 w-5 flex-shrink-0 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Elige el curso que quieras
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-700">
                    <svg className="h-5 w-5 flex-shrink-0 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Pago unico por curso
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-700">
                    <svg className="h-5 w-5 flex-shrink-0 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Accede las veces que quieras durante un mes
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-700">
                    <svg className="h-5 w-5 flex-shrink-0 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Ideal si buscas algo especifico
                  </li>
                </ul>
                <Link href="/clases" className="btn-secondary w-full py-4 text-center">
                  Ver Cursos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios — Blanco limpio, cards con sombra suave */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">
            Lo que dicen nuestras alumnas
          </h2>
          <p className="mx-auto mb-14 max-w-xl text-center text-gray-500">
            Comentarios reales del foro de la membresia
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {comentarios.map((c, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <svg
                      key={j}
                      className="h-4 w-4 text-wine-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-gray-600">
                  &ldquo;{c.texto}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-wine-600 text-sm font-bold text-white">
                    {c.avatar}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {c.nombre}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final — Rojo vino con textura */}
      <section className="relative overflow-hidden bg-wine-600 py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-wine-700/50 via-transparent to-wine-800/30" />
        <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-wine-500/20 blur-[120px]" />
        <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-wine-900/20 blur-[100px]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Tu siguiente paso empieza aqui
          </h2>
          <p className="mb-10 text-lg text-wine-100">
            Unete a cientos de emprendedoras que ya estan transformando su
            negocio con nuestros cursos.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/membresia"
              className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-base font-semibold text-wine-600 shadow-lg transition-all hover:bg-nude-50 hover:shadow-xl"
            >
              Obtener Membresia
            </Link>
            <Link
              href="/clases"
              className="inline-flex items-center justify-center rounded-lg border-2 border-white/30 px-8 py-4 text-base font-semibold text-white transition-all hover:border-white hover:bg-white/10"
            >
              Explorar Cursos
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
