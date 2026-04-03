"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Seccion = "dashboard" | "cursos" | "programas" | "membresias" | "comunidad";

interface ClaseStats {
  id: string;
  titulo: string;
  publicada: boolean;
  precio: number;
  categoria: string;
  _count: { codigos: number; accesos: number };
}

interface MembresiaAdmin {
  id: string;
  email: string;
  nombre: string;
  plan: string;
  estado: string;
  precioMensual: number;
  expiraAt: string;
  canceladaAt: string | null;
  createdAt: string;
}

interface ComentarioAdmin {
  id: string;
  email: string;
  nombre: string;
  contenido: string;
  tipo: string;
  refId: string;
  createdAt: string;
}

interface ProgramaAdmin {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  publicado: boolean;
  niveles: { id: string; titulo: string; videos: { id: string; titulo: string }[] }[];
}

interface Stats {
  totalCursos: number;
  cursosPublicados: number;
  totalCodigos: number;
  codigosUsados: number;
  totalAccesos: number;
  membresiasActivas: number;
  membresiasTotales: number;
  totalComentarios: number;
  totalProgramas: number;
  ingresoMembresias: number;
  ingresoCursos: number;
  ingresoTotal: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [seccion, setSeccion] = useState<Seccion>("dashboard");
  const [clases, setClases] = useState<ClaseStats[]>([]);
  const [membresias, setMembresias] = useState<MembresiaAdmin[]>([]);
  const [comentarios, setComentarios] = useState<ComentarioAdmin[]>([]);
  const [programas, setProgramas] = useState<ProgramaAdmin[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      Promise.all([
        fetch("/api/clases").then(r => r.json()),
        fetch("/api/admin/membresias").then(r => r.json()),
        fetch("/api/admin/stats").then(r => r.json()),
        fetch("/api/admin/comentarios").then(r => r.json()),
        fetch("/api/admin/programas").then(r => r.json()),
      ]).then(([clasesData, memData, statsData, comData, progData]) => {
        setClases(clasesData);
        setMembresias(Array.isArray(memData) ? memData : []);
        setStats(statsData);
        setComentarios(Array.isArray(comData) ? comData : []);
        setProgramas(Array.isArray(progData) ? progData : []);
        setLoading(false);
      });
    }
  }, [session]);

  const handleCancelarMembresia = async (id: string, accion: string) => {
    await fetch("/api/admin/membresias", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, accion }),
    });
    const res = await fetch("/api/admin/membresias");
    setMembresias(await res.json());
  };

  const handleEliminarComentario = async (id: string) => {
    if (!confirm("Eliminar este comentario?")) return;
    await fetch("/api/admin/comentarios", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setComentarios(comentarios.filter(c => c.id !== id));
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-wine-600" />
      </div>
    );
  }

  if (session?.user?.role !== "admin") return null;

  const diasRestantes = (fecha: string) => {
    const diff = new Date(fecha).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  };

  const menu: { key: Seccion; label: string; icon: string }[] = [
    { key: "dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { key: "cursos", label: "Cursos", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
    { key: "programas", label: "Programas", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
    { key: "membresias", label: "Membresias", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { key: "comunidad", label: "Comunidad", icon: "M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" },
  ];

  const totalCodigos = clases.reduce((s, c) => s + c._count.codigos, 0);
  const totalAccesos = clases.reduce((s, c) => s + c._count.accesos, 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-5">
          <h2 className="text-lg font-bold text-gray-900">Panel Admin</h2>
          <p className="text-xs text-gray-500">{session.user.name}</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {menu.map(m => (
            <button
              key={m.key}
              onClick={() => setSeccion(m.key)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                seccion === m.key
                  ? "bg-wine-50 text-wine-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={m.icon} />
              </svg>
              {m.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-gray-100 p-3">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-red-500 transition-all hover:bg-red-50"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 p-8">
        {/* DASHBOARD */}
        {seccion === "dashboard" && stats && (
          <div>
            <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Cursos publicados", value: stats.cursosPublicados, color: "text-wine-600", bg: "bg-wine-50" },
                { label: "Membresias activas", value: stats.membresiasActivas, color: "text-green-600", bg: "bg-green-50" },
                { label: "Codigos usados", value: stats.codigosUsados, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Comentarios", value: stats.totalComentarios, color: "text-purple-600", bg: "bg-purple-50" },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className={`mb-2 inline-flex rounded-xl ${s.bg} p-2`}>
                    <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
                  </div>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Ingresos */}
            <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Ingresos estimados</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-green-50 p-4 text-center">
                  <p className="text-2xl font-bold text-green-700">${stats.ingresoTotal.toFixed(2)}</p>
                  <p className="text-xs text-green-600">Total</p>
                </div>
                <div className="rounded-xl bg-wine-50 p-4 text-center">
                  <p className="text-2xl font-bold text-wine-600">${stats.ingresoMembresias.toFixed(2)}</p>
                  <p className="text-xs text-wine-500">Membresias</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">${stats.ingresoCursos.toFixed(2)}</p>
                  <p className="text-xs text-blue-500">Cursos individuales</p>
                </div>
              </div>
            </div>

            {/* Accesos rápidos */}
            <div className="grid gap-4 sm:grid-cols-3">
              <button onClick={() => setSeccion("cursos")} className="rounded-2xl bg-white p-5 text-left shadow-sm transition-all hover:shadow-md">
                <p className="mb-1 text-sm font-semibold text-gray-900">Gestionar cursos</p>
                <p className="text-xs text-gray-500">{stats.totalCursos} cursos creados</p>
              </button>
              <button onClick={() => setSeccion("membresias")} className="rounded-2xl bg-white p-5 text-left shadow-sm transition-all hover:shadow-md">
                <p className="mb-1 text-sm font-semibold text-gray-900">Ver membresias</p>
                <p className="text-xs text-gray-500">{stats.membresiasActivas} activas</p>
              </button>
              <button onClick={() => setSeccion("comunidad")} className="rounded-2xl bg-white p-5 text-left shadow-sm transition-all hover:shadow-md">
                <p className="mb-1 text-sm font-semibold text-gray-900">Moderar comunidad</p>
                <p className="text-xs text-gray-500">{stats.totalComentarios} comentarios</p>
              </button>
            </div>
          </div>
        )}

        {/* CURSOS */}
        {seccion === "cursos" && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Cursos</h1>
              <Link href="/admin/clases/nueva" className="btn-primary">+ Nuevo Curso</Link>
            </div>
            <div className="rounded-2xl bg-white shadow-sm">
              {clases.length === 0 ? (
                <div className="p-10 text-center text-gray-400">No hay cursos. Crea el primero.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-5 py-3">Titulo</th>
                        <th className="px-5 py-3">Categoria</th>
                        <th className="px-5 py-3">Precio</th>
                        <th className="px-5 py-3">Estado</th>
                        <th className="px-5 py-3">Codigos</th>
                        <th className="px-5 py-3">Accesos</th>
                        <th className="px-5 py-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {clases.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3 text-sm font-medium text-gray-900">{c.titulo}</td>
                          <td className="px-5 py-3 text-sm text-gray-500">{c.categoria}</td>
                          <td className="px-5 py-3 text-sm text-gray-500">${c.precio.toFixed(2)}</td>
                          <td className="px-5 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.publicada ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                              {c.publicada ? "Publicada" : "Borrador"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-500">{c._count.codigos}</td>
                          <td className="px-5 py-3 text-sm text-gray-500">{c._count.accesos}</td>
                          <td className="px-5 py-3">
                            <div className="flex gap-3">
                              <Link href={`/admin/clases/${c.id}`} className="text-sm font-medium text-wine-600 hover:text-wine-700">Editar</Link>
                              <Link href={`/admin/codigos/${c.id}`} className="text-sm font-medium text-gray-500 hover:text-black">Codigos</Link>
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
        )}

        {/* PROGRAMAS */}
        {seccion === "programas" && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Programas por niveles</h1>
              <Link href="/admin/programas/nuevo" className="btn-primary">+ Nuevo Programa</Link>
            </div>
            {programas.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-wine-50">
                  <svg className="h-8 w-8 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">Crear tu primer programa</h3>
                <p className="mb-6 text-sm text-gray-500">
                  Los programas se dividen en niveles. Cada nivel contiene videos que los miembros deben completar para avanzar.
                </p>
                <Link href="/admin/programas/nuevo" className="btn-primary px-6 py-2.5">
                  Crear Programa
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                {programas.map(prog => {
                  const totalVideos = prog.niveles.reduce((s, n) => s + n.videos.length, 0);
                  return (
                    <div key={prog.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                      {/* Header con portada */}
                      <div className="relative h-48 bg-gradient-to-br from-wine-600 to-wine-800">
                        {prog.imagen && (
                          <Image
                            src={prog.imagen}
                            alt={prog.titulo}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover opacity-40"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <div className="mb-2 flex items-center gap-2">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              prog.publicado
                                ? "bg-green-500/20 text-green-200"
                                : "bg-white/20 text-white"
                            }`}>
                              {prog.publicado ? "Publicado" : "Borrador"}
                            </span>
                            <span className="text-xs text-white/60">
                              {prog.niveles.length} niveles · {totalVideos} videos
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold text-white">{prog.titulo}</h3>
                          <p className="mt-1 text-sm text-white/70">{prog.descripcion}</p>
                        </div>
                        <Link
                          href={`/admin/programas/${prog.id}`}
                          className="absolute right-4 top-4 rounded-xl bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/30"
                        >
                          Editar
                        </Link>
                      </div>

                      {/* Timeline de niveles */}
                      <div className="p-6">
                        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                          Progreso del programa
                        </p>

                        {/* Barra de progreso visual */}
                        <div className="mb-6 flex items-center gap-1">
                          {prog.niveles.map((_, i) => (
                            <div key={i} className="flex flex-1 items-center">
                              <div className="h-1.5 w-full rounded-full bg-wine-100" />
                              {i < prog.niveles.length - 1 && (
                                <div className="mx-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-wine-200" />
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Cards de niveles */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {prog.niveles.map((nivel, i) => (
                            <div
                              key={nivel.id}
                              className="group relative overflow-hidden rounded-xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-wine-200 hover:bg-white hover:shadow-md"
                            >
                              {/* Número del nivel */}
                              <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-wine-600 text-sm font-bold text-white shadow-sm">
                                    {i + 1}
                                  </span>
                                  <div>
                                    <h4 className="text-sm font-bold text-gray-900">{nivel.titulo}</h4>
                                    <p className="text-[11px] text-gray-400">
                                      {nivel.videos.length} {nivel.videos.length === 1 ? "video" : "videos"}
                                    </p>
                                  </div>
                                </div>
                                {/* Icono de candado para niveles > 1 */}
                                {i > 0 && (
                                  <svg className="h-4 w-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                )}
                              </div>

                              {/* Lista de videos */}
                              {nivel.videos.length > 0 ? (
                                <div className="space-y-1.5">
                                  {nivel.videos.map((v, j) => (
                                    <div key={v.id} className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 text-xs text-gray-600">
                                      <svg className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span className="truncate">{v.titulo || `Video ${j + 1}`}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 italic">Sin videos aun</p>
                              )}

                              {/* Conector visual entre niveles */}
                              {i < prog.niveles.length - 1 && (
                                <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
                                  <svg className="h-6 w-6 text-wine-300" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M10 6l6 6-6 6V6z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MEMBRESIAS */}
        {seccion === "membresias" && (
          <div>
            <h1 className="mb-6 text-2xl font-bold text-gray-900">Membresias</h1>
            {membresias.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                <p className="text-gray-400">No hay membresias registradas.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {membresias.map(m => {
                  const dias = diasRestantes(m.expiraAt);
                  const activa = m.estado === "activa" && dias > 0;
                  return (
                    <div key={m.id} className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${activa ? "bg-green-100" : "bg-gray-100"}`}>
                          <span className={`text-sm font-bold ${activa ? "text-green-600" : "text-gray-400"}`}>
                            {m.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{m.nombre}</p>
                          <p className="text-xs text-gray-500">{m.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            activa ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                          }`}>
                            {activa ? `Activa — ${dias}d` : m.estado === "cancelada" ? "Cancelada" : "Expirada"}
                          </span>
                          <p className="mt-1 text-xs text-gray-400">
                            Plan {m.plan} · ${m.precioMensual}
                          </p>
                        </div>
                        {activa ? (
                          <button
                            onClick={() => handleCancelarMembresia(m.id, "cancelar")}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition-all hover:bg-red-50"
                          >
                            Cancelar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCancelarMembresia(m.id, "reactivar")}
                            className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-medium text-green-600 transition-all hover:bg-green-50"
                          >
                            Reactivar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* COMUNIDAD */}
        {seccion === "comunidad" && (
          <div>
            <h1 className="mb-6 text-2xl font-bold text-gray-900">
              Moderar Comunidad ({comentarios.length})
            </h1>
            {comentarios.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                <p className="text-gray-400">No hay comentarios aun.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comentarios.map(c => (
                  <div key={c.id} className="flex items-start justify-between rounded-2xl bg-white p-5 shadow-sm">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{c.nombre}</span>
                        <span className="text-xs text-gray-400">{c.email}</span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">{c.tipo}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(c.createdAt).toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{c.contenido}</p>
                    </div>
                    <button
                      onClick={() => handleEliminarComentario(c.id)}
                      className="ml-4 flex-shrink-0 rounded-lg p-2 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
                      title="Eliminar"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
