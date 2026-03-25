import Link from "next/link";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <div className="text-center">
            <span className="mb-4 inline-block rounded-full bg-primary-100 px-4 py-1.5 text-sm font-medium text-primary-700">
              Transforma tu negocio
            </span>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
              Aprende{" "}
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                Marketing Digital
              </span>
              <br />
              con una experta
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600">
              Accede a clases y capacitaciones exclusivas diseñadas para
              emprendedoras que quieren llevar su negocio al siguiente nivel.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/clases" className="btn-primary px-8 py-4 text-base">
                Ver Clases Disponibles
              </Link>
              <Link
                href="/desbloquear"
                className="btn-secondary px-8 py-4 text-base"
              >
                Tengo un Codigo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            Como funciona
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">
                Elige tu clase
              </h3>
              <p className="text-sm text-gray-500">
                Explora nuestro catalogo de clases y capacitaciones de marketing
                digital.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-100">
                <span className="text-2xl font-bold text-accent-600">2</span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">
                Realiza tu pago
              </h3>
              <p className="text-sm text-gray-500">
                Contacta a tu coach para realizar el pago y recibir tu codigo de
                acceso unico.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">
                Desbloquea y aprende
              </h3>
              <p className="text-sm text-gray-500">
                Ingresa tu codigo para desbloquear la clase y accede al
                contenido de inmediato.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Lista para empezar?
          </h2>
          <p className="mb-8 text-lg text-primary-100">
            Invierte en tu educacion y transforma los resultados de tu negocio.
          </p>
          <Link
            href="/clases"
            className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-base font-semibold text-primary-700 shadow-sm transition-all hover:bg-primary-50"
          >
            Explorar Clases
          </Link>
        </div>
      </section>
    </div>
  );
}
