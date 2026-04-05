"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ComunidadTab } from "@/components/dashboard/ComunidadTab";

type Seccion = "dashboard" | "cursos" | "programas" | "membresias" | "comunidad" | "videollamadas";

interface ForoSeleccionado {
  tipo: "comunidad" | "programa";
  refId: string;
  titulo: string;
}

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
  const [videollamadas, setVideollamadas] = useState<any[]>([]);
  const [bloques, setBloques] = useState<any[]>([]);
  const [configPrecio, setConfigPrecio] = useState(50);
  const [configActiva, setConfigActiva] = useState(true);
  const [editandoPrecio, setEditandoPrecio] = useState(false);
  const [loading, setLoading] = useState(true);
  // horarioSemanal removed — base schedule is fixed 12-7PM, admin only blocks
  const [fechaBloqueo, setFechaBloqueo] = useState("");
  const [fechaBloqueoFin, setFechaBloqueoFin] = useState("");
  const [horaBloqueoInicio, setHoraBloqueoInicio] = useState("");
  const [horaBloqueoFin, setHoraBloqueoFin] = useState("");
  const [bloqueoDiaCompleto, setBloqueoDiaCompleto] = useState(true);
  const [foroSeleccionado, setForoSeleccionado] = useState<ForoSeleccionado | null>(null);
  const [foroComentarios, setForoComentarios] = useState<any[]>([]);
  const [foroLoading, setForoLoading] = useState(false);
  const [adminAvatar, setAdminAvatar] = useState<string>("");
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);

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
        fetch("/api/admin/videollamadas").then(r => r.ok ? r.json() : []),
        fetch("/api/admin/config").then(r => r.ok ? r.json() : { precioVideollamada: 50, videollamadaActiva: true }),
        fetch("/api/admin/disponibilidad").then(r => r.ok ? r.json() : []),
        fetch("/api/admin/profile").then(r => r.ok ? r.json() : null),
      ]).then(([clasesData, memData, statsData, comData, progData, videoData, configData, bloquesData, profileData]) => {
        setClases(clasesData);
        setMembresias(Array.isArray(memData) ? memData : []);
        setStats(statsData);
        setComentarios(Array.isArray(comData) ? comData : []);
        setProgramas(Array.isArray(progData) ? progData : []);
        setVideollamadas(Array.isArray(videoData) ? videoData : []);
        setBloques(Array.isArray(bloquesData) ? bloquesData : []);
        setConfigPrecio(configData.precioVideollamada ?? 50);
        setConfigActiva(configData.videollamadaActiva ?? true);
        if (profileData?.avatar) setAdminAvatar(profileData.avatar);
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

  const handleAccionVideollamada = async (id: string, accion: string, extras?: Record<string, any>) => {
    const res = await fetch("/api/admin/videollamadas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, accion, ...extras }),
    });
    if (res.ok) {
      const updated = await res.json();
      setVideollamadas(prev => prev.map(v => v.id === id ? updated : v));
    }
  };

  const handleEliminarVideollamada = async (id: string) => {
    if (!confirm("¿Eliminar esta solicitud de videollamada?")) return;
    const res = await fetch("/api/admin/videollamadas", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setVideollamadas(prev => prev.filter(v => v.id !== id));
    }
  };

  const handleGuardarConfig = async (campo: string, valor: any) => {
    await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [campo]: valor }),
    });
  };

  const handleSubirAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoAvatar(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const up = await fetch("/api/upload", { method: "POST", body: form });
      const upData = await up.json();
      if (!up.ok) {
        alert(upData.error || "Error al subir imagen");
        return;
      }
      const save = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: upData.url }),
      });
      if (save.ok) {
        setAdminAvatar(upData.url);
      }
    } catch (err) {
      console.error(err);
      alert("Error al actualizar avatar");
    } finally {
      setSubiendoAvatar(false);
      e.target.value = "";
    }
  };

  const handleAbrirForo = async (f: ForoSeleccionado) => {
    setForoSeleccionado(f);
    setForoLoading(true);
    const res = await fetch(`/api/comunidad?tipo=${f.tipo}&refId=${f.refId}`);
    const data = await res.json();
    setForoComentarios(Array.isArray(data) ? data : []);
    setForoLoading(false);
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
    { key: "comunidad", label: "Foros", icon: "M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" },
    { key: "videollamadas", label: "Videollamadas", icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
  ];

  const totalCodigos = clases.reduce((s, c) => s + c._count.codigos, 0);
  const totalAccesos = clases.reduce((s, c) => s + c._count.accesos, 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <label className="group relative h-12 w-12 flex-shrink-0 cursor-pointer overflow-hidden rounded-full bg-wine-100">
              {adminAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={adminAvatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-bold text-wine-600">
                  {(session.user.name || "C").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <input type="file" accept="image/*" onChange={handleSubirAvatar} disabled={subiendoAvatar} className="hidden" />
            </label>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-bold text-gray-900">Panel Admin</h2>
              <p className="truncate text-xs text-gray-500">{session.user.name}</p>
              {subiendoAvatar && <p className="text-[10px] text-wine-600">Subiendo...</p>}
            </div>
          </div>
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
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {programas.map(prog => (
                  <div key={prog.id} className="overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-md">
                    {/* Portada */}
                    <div className="relative h-40 bg-gradient-to-br from-wine-600 to-wine-800">
                      {prog.imagen && (
                        <Image
                          src={prog.imagen}
                          alt={prog.titulo}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover"
                        />
                      )}
                      {!prog.publicado && (
                        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-gray-700 backdrop-blur-sm">
                          Borrador
                        </span>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-5">
                      <h3 className="mb-4 line-clamp-2 text-lg font-bold text-gray-900">{prog.titulo}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSeccion("comunidad");
                            handleAbrirForo({ tipo: "programa", refId: prog.id, titulo: `Foro: ${prog.titulo}` });
                          }}
                          className="flex-1 rounded-full border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition-all hover:bg-gray-50"
                        >
                          Ver foro
                        </button>
                        <Link
                          href={`/admin/programas/${prog.id}`}
                          className="flex-1 rounded-full bg-wine-600 px-3 py-2 text-center text-xs font-medium text-white transition-all hover:bg-wine-700"
                        >
                          Editar
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
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
            {!foroSeleccionado ? (
              <>
                <h1 className="mb-2 text-2xl font-bold text-gray-900">Foros</h1>
                <p className="mb-6 text-sm text-gray-500">
                  Selecciona un foro para ver los comentarios y responder como Coach
                </p>

                {/* Contadores por foro */}
                {(() => {
                  const contarPorForo = (tipo: string, refId: string) =>
                    comentarios.filter((c) => c.tipo === tipo && c.refId === refId).length;

                  const comunidadCount = contarPorForo("comunidad", "general");

                  return (
                    <div className="space-y-3">
                      {/* Comunidad general */}
                      <button
                        onClick={() => handleAbrirForo({ tipo: "comunidad", refId: "general", titulo: "Comunidad general" })}
                        className="flex w-full items-center justify-between rounded-2xl bg-white p-5 text-left shadow-sm transition-all hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wine-50">
                            <svg className="h-5 w-5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">Comunidad general</h3>
                            <p className="text-xs text-gray-500">{comunidadCount} {comunidadCount === 1 ? "comentario" : "comentarios"}</p>
                          </div>
                        </div>
                        <svg className="h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      {/* Foros por programa */}
                      {programas.map((p) => {
                        const count = contarPorForo("programa", p.id);
                        return (
                          <button
                            key={p.id}
                            onClick={() => handleAbrirForo({ tipo: "programa", refId: p.id, titulo: `Foro: ${p.titulo}` })}
                            className="flex w-full items-center justify-between rounded-2xl bg-white p-5 text-left shadow-sm transition-all hover:shadow-md"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wine-50">
                                <svg className="h-5 w-5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900">{p.titulo}</h3>
                                <p className="text-xs text-gray-500">
                                  {count} {count === 1 ? "comentario" : "comentarios"}
                                  {!p.publicado && " · No publicado"}
                                </p>
                              </div>
                            </div>
                            <svg className="h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        );
                      })}

                      {programas.length === 0 && (
                        <p className="py-4 text-center text-sm text-gray-400">No tienes programas creados todavia.</p>
                      )}
                    </div>
                  );
                })()}
              </>
            ) : (
              <>
                <button
                  onClick={() => { setForoSeleccionado(null); setForoComentarios([]); }}
                  className="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Volver a foros
                </button>
                {foroLoading ? (
                  <div className="flex min-h-[30vh] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-wine-600" />
                  </div>
                ) : (
                  <ComunidadTab
                    email={session?.user?.email || ""}
                    perfil={{
                      email: session?.user?.email || "",
                      nombre: session?.user?.name || "Coach",
                      avatar: adminAvatar,
                      bio: "",
                    }}
                    comentarios={foroComentarios}
                    setComentarios={setForoComentarios}
                    nombreGuardado={true}
                    setNombreGuardado={() => {}}
                    setPerfil={() => {}}
                    onGuardarPerfil={() => {}}
                    tipo={foroSeleccionado.tipo}
                    refId={foroSeleccionado.refId}
                    titulo={foroSeleccionado.titulo}
                    subtitulo="Responde como Coach — tus respuestas aparecerán con una insignia especial"
                    adminMode={true}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* VIDEOLLAMADAS */}
        {seccion === "videollamadas" && (
          <div>
            <h1 className="mb-6 text-2xl font-bold text-gray-900">Videollamadas</h1>

            {/* Configuración */}
            <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Configuracion de videollamada</h2>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Precio:</span>
                  {editandoPrecio ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={configPrecio}
                        onChange={e => setConfigPrecio(Number(e.target.value))}
                        className="w-24 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-wine-400 focus:outline-none focus:ring-1 focus:ring-wine-400"
                      />
                      <button
                        onClick={async () => {
                          await handleGuardarConfig("precioVideollamada", configPrecio);
                          setEditandoPrecio(false);
                        }}
                        className="rounded-lg bg-wine-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-wine-700"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditandoPrecio(false)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 transition-all hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">${configPrecio.toFixed(2)}</span>
                      <button
                        onClick={() => setEditandoPrecio(true)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-wine-600 transition-all hover:bg-wine-50"
                      >
                        Editar
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Estado:</span>
                  <button
                    onClick={async () => {
                      const nuevo = !configActiva;
                      setConfigActiva(nuevo);
                      await handleGuardarConfig("videollamadaActiva", nuevo);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      configActiva ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        configActiva ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-medium ${configActiva ? "text-green-600" : "text-gray-400"}`}>
                    {configActiva ? "Activa" : "Inactiva"}
                  </span>
                </div>
              </div>
            </div>

            {/* Disponibilidad */}
            <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-1 text-lg font-bold text-gray-900">Días no disponibles</h2>
              <p className="mb-5 text-sm text-gray-500">
                Tu horario base es de <strong>12:00 PM a 7:00 PM</strong> todos los días. Marca aquí cuándo <strong>no</strong> puedes atender.
              </p>

              {/* Bloquear fechas */}
              <div className="mb-6 rounded-xl bg-gray-50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Bloquear fechas</h3>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">Desde</label>
                      <input
                        type="date"
                        value={fechaBloqueo}
                        onChange={e => setFechaBloqueo(e.target.value)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-wine-400 focus:outline-none focus:ring-1 focus:ring-wine-400"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">Hasta</label>
                      <input
                        type="date"
                        value={fechaBloqueoFin}
                        onChange={e => setFechaBloqueoFin(e.target.value)}
                        min={fechaBloqueo}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-wine-400 focus:outline-none focus:ring-1 focus:ring-wine-400"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={bloqueoDiaCompleto}
                      onChange={e => setBloqueoDiaCompleto(e.target.checked)}
                      className="rounded border-gray-300 text-wine-600 focus:ring-wine-500"
                    />
                    Día(s) completo(s)
                  </label>

                  {!bloqueoDiaCompleto && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Solo de</span>
                      <input
                        type="time"
                        value={horaBloqueoInicio}
                        onChange={e => setHoraBloqueoInicio(e.target.value)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-wine-400 focus:outline-none focus:ring-1 focus:ring-wine-400"
                      />
                      <span className="text-xs text-gray-500">a</span>
                      <input
                        type="time"
                        value={horaBloqueoFin}
                        onChange={e => setHoraBloqueoFin(e.target.value)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-wine-400 focus:outline-none focus:ring-1 focus:ring-wine-400"
                      />
                    </div>
                  )}

                  <button
                    onClick={async () => {
                      if (!fechaBloqueo) return;
                      if (!bloqueoDiaCompleto && (!horaBloqueoInicio || !horaBloqueoFin)) return;

                      const inicio = new Date(fechaBloqueo + "T00:00:00");
                      const fin = fechaBloqueoFin ? new Date(fechaBloqueoFin + "T00:00:00") : inicio;
                      const nuevos: any[] = [];

                      for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
                        const fechaStr = d.toISOString().split("T")[0];
                        const res = await fetch("/api/admin/disponibilidad", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            diaSemana: -1,
                            horaInicio: bloqueoDiaCompleto ? "00:00" : horaBloqueoInicio,
                            horaFin: bloqueoDiaCompleto ? "23:59" : horaBloqueoFin,
                            disponible: false,
                            fechaEspecifica: fechaStr,
                          }),
                        });
                        if (res.ok) {
                          nuevos.push(await res.json());
                        }
                      }

                      setBloques(prev => [...prev, ...nuevos]);
                      setFechaBloqueo("");
                      setFechaBloqueoFin("");
                      setHoraBloqueoInicio("");
                      setHoraBloqueoFin("");
                      setBloqueoDiaCompleto(true);
                    }}
                    className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-red-700"
                  >
                    Bloquear {fechaBloqueoFin && fechaBloqueo !== fechaBloqueoFin ? "fechas" : "fecha"}
                  </button>
                </div>
              </div>

              {/* Bloquear día de la semana recurrente */}
              <div className="mb-6 rounded-xl bg-gray-50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Bloquear día de la semana (recurrente)</h3>
                <p className="mb-3 text-xs text-gray-400">Si nunca atiendes cierto día, bloquéalo aquí.</p>
                <div className="flex flex-wrap gap-2">
                  {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((dia, i) => {
                    const yaBloqueado = bloques.some(b => b.diaSemana === i && !b.disponible);
                    return (
                      <button
                        key={i}
                        onClick={async () => {
                          if (yaBloqueado) {
                            const bloque = bloques.find(b => b.diaSemana === i && !b.disponible);
                            if (bloque) {
                              const res = await fetch("/api/admin/disponibilidad", {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: bloque.id }),
                              });
                              if (res.ok) setBloques(prev => prev.filter(x => x.id !== bloque.id));
                            }
                          } else {
                            const res = await fetch("/api/admin/disponibilidad", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ diaSemana: i, horaInicio: "00:00", horaFin: "23:59", disponible: false }),
                            });
                            if (res.ok) {
                              const nuevo = await res.json();
                              setBloques(prev => [...prev, nuevo]);
                            }
                          }
                        }}
                        className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                          yaBloqueado
                            ? "bg-red-100 text-red-700 ring-1 ring-red-200"
                            : "bg-white text-gray-600 hover:bg-red-50 hover:text-red-600"
                        }`}
                      >
                        {dia} {yaBloqueado ? "✕" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lista de bloqueos activos */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Bloqueos activos ({bloques.filter(b => !b.disponible).length})</h3>
                {bloques.filter(b => !b.disponible).length === 0 ? (
                  <p className="text-sm text-gray-400">No tienes bloqueos. Estás disponible de 12:00 PM a 7:00 PM todos los días.</p>
                ) : (
                  <div className="space-y-2">
                    {bloques.filter(b => !b.disponible).map(b => {
                      const diasNombres = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
                      const esFechaEspecifica = b.diaSemana === -1;
                      const esDiaCompleto = b.horaInicio === "00:00" && (b.horaFin === "23:59" || b.horaFin === "24:00");
                      let texto = "";
                      if (esFechaEspecifica) {
                        const fecha = new Date(b.fechaEspecifica + "T00:00:00").toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" });
                        texto = esDiaCompleto ? `${fecha} — Todo el día` : `${fecha} — ${b.horaInicio} a ${b.horaFin}`;
                      } else {
                        texto = `Todos los ${diasNombres[b.diaSemana]}`;
                      }
                      return (
                        <div key={b.id} className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <svg className="h-4 w-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            <span className="text-sm font-medium text-red-700">{texto}</span>
                          </div>
                          <button
                            onClick={async () => {
                              const res = await fetch("/api/admin/disponibilidad", {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: b.id }),
                              });
                              if (res.ok) setBloques(prev => prev.filter(x => x.id !== b.id));
                            }}
                            className="rounded-lg p-1.5 text-red-400 transition-all hover:bg-red-100 hover:text-red-600"
                            title="Quitar bloqueo"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Solicitudes */}
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              Solicitudes ({videollamadas.length})
            </h2>
            {videollamadas.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                <p className="text-gray-400">No hay solicitudes de videollamada.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...videollamadas]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map(v => {
                    const badgeColors: Record<string, string> = {
                      pendiente_pago: "bg-yellow-100 text-yellow-700",
                      pagada: "bg-blue-100 text-blue-700",
                      agendada: "bg-purple-100 text-purple-700",
                      confirmada: "bg-green-100 text-green-700",
                      completada: "bg-gray-100 text-gray-600",
                      cancelada: "bg-red-100 text-red-600",
                    };
                    return (
                      <div key={v.id} className="rounded-2xl bg-white p-5 shadow-sm">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{v.nombre}</span>
                          <span className="text-xs text-gray-400">{v.email}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeColors[v.estado] || "bg-gray-100 text-gray-600"}`}>
                            {v.estado?.replace("_", " ")}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(v.createdAt).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        {v.fechaPropuesta && (
                          <p className="mb-1 text-xs text-gray-500">
                            <span className="font-medium">Fecha propuesta:</span>{" "}
                            {new Date(v.fechaPropuesta).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                        {v.fechaConfirmada && (
                          <p className="mb-1 text-xs text-gray-500">
                            <span className="font-medium">Fecha confirmada:</span>{" "}
                            {new Date(v.fechaConfirmada).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                        {v.enlace && (
                          <p className="mb-1 text-xs text-gray-500">
                            <span className="font-medium">Enlace:</span>{" "}
                            <a href={v.enlace} target="_blank" rel="noopener noreferrer" className="text-wine-600 underline hover:text-wine-700">{v.enlace}</a>
                          </p>
                        )}
                        {v.mensaje && (
                          <p className="mb-3 text-sm text-gray-600">{v.mensaje}</p>
                        )}

                        {/* Acciones */}
                        <div className="mt-3 flex flex-wrap items-end gap-3">
                          {v.estado === "pendiente_pago" && (
                            <form
                              onSubmit={e => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const enlace = (form.elements.namedItem("enlace") as HTMLInputElement).value;
                                if (enlace) {
                                  handleAccionVideollamada(v.id, "confirmar", { enlace });
                                }
                              }}
                              className="flex w-full flex-wrap items-end gap-2"
                            >
                              <div className="flex-1">
                                <label className="mb-1 block text-[11px] font-medium text-gray-500">Enlace de la reunión (Zoom, Meet, etc.)</label>
                                <input
                                  type="url"
                                  name="enlace"
                                  placeholder="https://meet.google.com/..."
                                  required
                                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-wine-400 focus:outline-none focus:ring-1 focus:ring-wine-400"
                                />
                              </div>
                              <button
                                type="submit"
                                className="rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-green-700"
                              >
                                Confirmar pago y agendar
                              </button>
                            </form>
                          )}

                          {v.estado === "confirmada" && (
                            <>
                              <button
                                onClick={() => handleAccionVideollamada(v.id, "completar")}
                                className="rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-green-700"
                              >
                                Marcar completada
                              </button>
                              <button
                                onClick={() => handleAccionVideollamada(v.id, "cancelar")}
                                className="rounded-lg border border-red-200 px-4 py-2 text-xs font-medium text-red-500 transition-all hover:bg-red-50"
                              >
                                Cancelar
                              </button>
                            </>
                          )}
                          {/* Eliminar solicitud */}
                          <button
                            onClick={() => handleEliminarVideollamada(v.id)}
                            className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                            title="Eliminar solicitud"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
