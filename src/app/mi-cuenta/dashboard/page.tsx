"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Tab = "cursos" | "programas" | "comunidad";

interface Clase {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  precio: number;
  categoria: string;
}

interface ReaccionInfo {
  id: string;
  email: string;
  tipo: string;
}

interface ComentarioInfo {
  id: string;
  email: string;
  nombre: string;
  avatar: string;
  contenido: string;
  createdAt: string;
  reacciones: ReaccionInfo[];
  respuestas: ComentarioInfo[];
}

interface MembresiaInfo {
  activa: boolean;
  plan?: string;
  expiraAt?: string;
}

interface PerfilInfo {
  email: string;
  nombre: string;
  avatar: string;
  bio: string;
}

function tiempoRelativo(fecha: string) {
  const diff = Date.now() - new Date(fecha).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora mismo";
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  const dias = Math.floor(hrs / 24);
  if (dias < 7) return `Hace ${dias}d`;
  return new Date(fecha).toLocaleDateString("es", { day: "numeric", month: "short" });
}

export default function DashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("cursos");
  const [email, setEmail] = useState("");
  const [perfil, setPerfil] = useState<PerfilInfo>({ email: "", nombre: "", avatar: "", bio: "" });
  const [membresia, setMembresia] = useState<MembresiaInfo | null>(null);
  const [clases, setClases] = useState<Clase[]>([]);
  const [programas, setProgramas] = useState<any[]>([]);
  const [comentarios, setComentarios] = useState<ComentarioInfo[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [respondiendo, setRespondiendo] = useState<string | null>(null);
  const [textoRespuesta, setTextoRespuesta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const [nombreGuardado, setNombreGuardado] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedEmail = localStorage.getItem("coach_email");
    const savedAuth = localStorage.getItem("coach_auth");
    if (!savedEmail || savedAuth !== "true") { router.push("/mi-cuenta"); return; }

    setEmail(savedEmail);

    Promise.all([
      fetch(`/api/membresia?email=${encodeURIComponent(savedEmail)}`).then(r => r.json()),
      fetch(`/api/perfil?email=${encodeURIComponent(savedEmail)}`).then(r => r.json()),
      fetch("/api/clases").then(r => r.json()),
      fetch("/api/comunidad").then(r => r.json()).catch(() => []),
      fetch("/api/programas").then(r => r.json()).catch(() => []),
    ]).then(([memData, perfilData, clasesData, comData, progData]) => {
      if (!memData.activa) { router.push("/mi-cuenta"); return; }
      setMembresia(memData);
      setPerfil(perfilData);
      setNombreGuardado(!!perfilData.nombre);
      setClases(Array.isArray(clasesData) ? clasesData : []);
      setComentarios(Array.isArray(comData) ? comData : []);
      setProgramas(Array.isArray(progData) ? progData : []);
      setLoading(false);
    });
  }, [router]);

  const handleSubirAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoAvatar(true);

    const form = new FormData();
    form.append("file", file);
    form.append("email", email);

    const res = await fetch("/api/perfil", { method: "POST", body: form });
    if (res.ok) {
      const { avatar } = await res.json();
      setPerfil((p) => ({ ...p, avatar }));
    }
    setSubiendoAvatar(false);
  };

  const handleGuardarPerfil = async () => {
    await fetch("/api/perfil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, nombre: perfil.nombre, bio: perfil.bio }),
    });
    localStorage.setItem("coach_nombre", perfil.nombre);
  };

  const handleEnviarComentario = async () => {
    if (!nuevoComentario.trim() || !perfil.nombre.trim()) return;
    setEnviando(true);
    const res = await fetch("/api/comunidad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email, nombre: perfil.nombre, avatar: perfil.avatar,
        contenido: nuevoComentario.trim(), tipo: "comunidad", refId: "general",
      }),
    });
    if (res.ok) {
      const nuevo = await res.json();
      setComentarios([nuevo, ...comentarios]);
      setNuevoComentario("");
    }
    setEnviando(false);
  };

  const handleResponder = async (parentId: string) => {
    if (!textoRespuesta.trim()) return;
    setEnviando(true);
    const res = await fetch("/api/comunidad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email, nombre: perfil.nombre, avatar: perfil.avatar,
        contenido: textoRespuesta.trim(), tipo: "comunidad", refId: "general", parentId,
      }),
    });
    if (res.ok) {
      const resp = await res.json();
      setComentarios(comentarios.map(c =>
        c.id === parentId ? { ...c, respuestas: [...c.respuestas, resp] } : c
      ));
      setTextoRespuesta("");
      setRespondiendo(null);
    }
    setEnviando(false);
  };

  const handleReaccion = async (comentarioId: string) => {
    await fetch("/api/reacciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, comentarioId, tipo: "corazon" }),
    });
    // Actualizar localmente
    setComentarios(prev => prev.map(c => {
      const toggle = (com: ComentarioInfo) => {
        if (com.id !== comentarioId) return com;
        const yaReacciono = com.reacciones.some(r => r.email === email);
        return {
          ...com,
          reacciones: yaReacciono
            ? com.reacciones.filter(r => r.email !== email)
            : [...com.reacciones, { id: "temp", email, tipo: "corazon" }],
        };
      };
      const updated = toggle(c);
      return { ...updated, respuestas: updated.respuestas.map(toggle) };
    }));
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem("coach_email");
    localStorage.removeItem("coach_auth");
    localStorage.removeItem("coach_nombre");
    router.push("/mi-cuenta");
  };

  const diasRestantes = () => {
    if (!membresia?.expiraAt) return 0;
    return Math.max(0, Math.ceil((new Date(membresia.expiraAt).getTime() - Date.now()) / 86400000));
  };

  const Avatar = ({ src, name, size = "md" }: { src?: string; name: string; size?: "sm" | "md" | "lg" }) => {
    const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-20 w-20 text-2xl" };
    return src ? (
      <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover`} />
    ) : (
      <div className={`${sizes[size]} flex items-center justify-center rounded-full bg-wine-600 font-bold text-white`}>
        {name.charAt(0).toUpperCase()}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-wine-600" />
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: JSX.Element }[] = [
    { key: "cursos", label: "Cursos", icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
    { key: "programas", label: "Programas", icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
    { key: "comunidad", label: "Comunidad", icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg> },
  ];

  const renderComentario = (c: ComentarioInfo, esRespuesta = false) => {
    const yaReaccione = c.reacciones.some(r => r.email === email);
    return (
      <div key={c.id} className={`${esRespuesta ? "ml-12 mt-3" : ""}`}>
        <div className={`rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${esRespuesta ? "border-l-2 border-wine-200" : ""}`}>
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar src={c.avatar} name={c.nombre} />
              <div>
                <p className="text-sm font-semibold text-gray-900">{c.nombre}</p>
                <p className="text-xs text-gray-400">{tiempoRelativo(c.createdAt)}</p>
              </div>
            </div>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-gray-600">{c.contenido}</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleReaccion(c.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                yaReaccione
                  ? "bg-red-50 text-red-500"
                  : "bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-400"
              }`}
            >
              <svg className="h-4 w-4" fill={yaReaccione ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {c.reacciones.length > 0 && c.reacciones.length}
            </button>
            {!esRespuesta && (
              <button
                onClick={() => setRespondiendo(respondiendo === c.id ? null : c.id)}
                className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Responder
                {c.respuestas.length > 0 && ` (${c.respuestas.length})`}
              </button>
            )}
          </div>
        </div>
        {/* Respuestas */}
        {!esRespuesta && c.respuestas.map(r => renderComentario(r, true))}
        {/* Input de respuesta */}
        {respondiendo === c.id && (
          <div className="ml-12 mt-3 flex gap-2">
            <Avatar src={perfil.avatar} name={perfil.nombre} size="sm" />
            <div className="flex-1">
              <input
                type="text"
                value={textoRespuesta}
                onChange={(e) => setTextoRespuesta(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleResponder(c.id)}
                placeholder="Escribe una respuesta..."
                className="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm transition-all focus:border-wine-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-wine-500/20"
              />
            </div>
            <button
              onClick={() => handleResponder(c.id)}
              disabled={enviando || !textoRespuesta.trim()}
              className="rounded-full bg-wine-600 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-wine-700 disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-wine-600">
        <div className="absolute inset-0 bg-gradient-to-br from-wine-700/50 via-transparent to-wine-800/30" />
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-wine-500/20 blur-[100px]" />
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar con upload */}
              <div className="relative">
                <button onClick={() => fileInputRef.current?.click()} className="group relative">
                  <Avatar src={perfil.avatar} name={perfil.nombre || "U"} size="lg" />
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    {subiendoAvatar ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </div>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleSubirAvatar} />
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold uppercase text-white">
                    {membresia?.plan}
                  </span>
                  <span className="rounded-full bg-green-400/20 px-3 py-0.5 text-xs font-semibold text-green-200">
                    {diasRestantes()}d restantes
                  </span>
                </div>
                <h1 className="text-xl font-bold text-white">
                  {perfil.nombre || "Bienvenida"}
                </h1>
                <p className="text-sm text-wine-100">{email}</p>
              </div>
            </div>
            <button onClick={handleCerrarSesion} className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10">
              Cerrar sesion
            </button>
          </div>
          {/* Tabs */}
          <div className="mt-6 flex gap-2">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`relative flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
                  tab === t.key
                    ? "bg-white text-wine-600 shadow-lg shadow-wine-900/20"
                    : "bg-white/10 text-wine-100 backdrop-blur-sm hover:bg-white/20 hover:text-white hover:shadow-md"
                }`}
              >
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  tab === t.key ? "bg-wine-50" : "bg-white/10"
                }`}>
                  {t.icon}
                </span>
                {t.label}
                {tab === t.key && (
                  <span className="absolute -bottom-1 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-wine-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Tab: Cursos */}
        {tab === "cursos" && (
          <div>
            <h2 className="mb-6 text-xl font-bold text-gray-900">Todos los cursos ({clases.length})</h2>
            {clases.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                <p className="text-gray-500">Aun no hay cursos publicados.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {clases.map(clase => (
                  <Link key={clase.id} href={`/clases/${clase.id}`} className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-lg">
                    <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200">
                      {clase.imagen ? (
                        <img src={clase.imagen} alt={clase.titulo} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <svg className="h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                      )}
                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-700 backdrop-blur-sm">{clase.categoria}</span>
                      <span className="absolute right-3 top-3 rounded-full bg-green-500 px-2.5 py-0.5 text-xs font-semibold text-white">Incluido</span>
                    </div>
                    <div className="p-4">
                      <h3 className="mb-1 font-bold text-gray-900 group-hover:text-wine-600">{clase.titulo}</h3>
                      <p className="line-clamp-2 text-sm text-gray-500">{clase.descripcion}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Programas */}
        {tab === "programas" && (
          <div>
            <h2 className="mb-2 text-xl font-bold text-gray-900">Programas por niveles</h2>
            <p className="mb-6 text-sm text-gray-500">Completa cada nivel para desbloquear el siguiente</p>

            {programas.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-wine-50">
                  <svg className="h-8 w-8 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <h3 className="mb-1 text-lg font-bold text-gray-900">Proximamente</h3>
                <p className="text-sm text-gray-500">Los programas exclusivos por niveles estaran disponibles muy pronto.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {programas.map((prog: any) => (
                  <div key={prog.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                    {/* Portada */}
                    <div className="relative h-44 bg-gradient-to-br from-wine-600 to-wine-800">
                      {prog.imagen && (
                        <img src={prog.imagen} alt={prog.titulo} className="absolute inset-0 h-full w-full object-cover opacity-40" style={{ objectPosition: prog.imagenPos || "50% 50%" }} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-6">
                        <div>
                          <h3 className="text-2xl font-bold text-white">{prog.titulo}</h3>
                          <p className="mt-1 text-sm text-white/70">{prog.descripcion}</p>
                        </div>
                        <Link
                          href={`/programas/${prog.id}`}
                          className="flex-shrink-0 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-wine-600 shadow-lg transition-all hover:bg-nude-50"
                        >
                          Ir al programa
                        </Link>
                      </div>
                    </div>

                    {/* Niveles como timeline */}
                    <div className="p-6">
                      <div className="relative">
                        {/* Línea vertical del timeline */}
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

                        <div className="space-y-6">
                          {(prog.niveles || []).length === 0 ? (
                            <p className="ml-12 text-sm text-gray-400">Este programa aun no tiene niveles.</p>
                          ) : (
                            (prog.niveles || []).map((nivel: any, i: number) => {
                              const desbloqueado = i === 0; // TODO: verificar progreso real
                              return (
                                <div key={nivel.id || i} className="relative flex gap-4">
                                  {/* Nodo del timeline */}
                                  <div className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                                    desbloqueado ? "bg-wine-600 text-white" : "bg-gray-200 text-gray-500"
                                  }`}>
                                    {desbloqueado ? (
                                      <span className="text-xs font-bold">{i + 1}</span>
                                    ) : (
                                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                      </svg>
                                    )}
                                  </div>

                                  {/* Contenido del nivel */}
                                  <div className={`flex-1 rounded-xl border p-4 transition-all ${
                                    desbloqueado
                                      ? "border-wine-100 bg-wine-50/30 hover:shadow-md"
                                      : "border-gray-100 bg-gray-50 opacity-60"
                                  }`}>
                                    <div className="mb-1 flex items-center justify-between">
                                      <h4 className="font-bold text-gray-900">{nivel.titulo}</h4>
                                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                        desbloqueado ? "bg-wine-100 text-wine-600" : "bg-gray-200 text-gray-500"
                                      }`}>
                                        {desbloqueado ? "Disponible" : "Bloqueado"}
                                      </span>
                                    </div>
                                    {nivel.descripcion && (
                                      <p className="mb-2 text-xs text-gray-500">{nivel.descripcion}</p>
                                    )}
                                    <p className="text-xs text-gray-400">
                                      {nivel.videos?.length || nivel._count?.videos || 0} videos
                                    </p>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Comunidad */}
        {tab === "comunidad" && (
          <div>
            <h2 className="mb-2 text-xl font-bold text-gray-900">Comunidad</h2>
            <p className="mb-6 text-sm text-gray-500">Comparte, pregunta y conecta con otras alumnas</p>

            {/* Nuevo comentario */}
            <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex gap-3">
                <Avatar src={perfil.avatar} name={perfil.nombre || "U"} />
                <div className="flex-1">
                  {/* Nombre inline si no lo tiene guardado */}
                  {!nombreGuardado && (
                    <div className="mb-2 flex gap-2">
                      <input
                        type="text"
                        value={perfil.nombre}
                        onChange={(e) => setPerfil(p => ({ ...p, nombre: e.target.value }))}
                        placeholder="Escribe tu nombre..."
                        className="flex-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-gray-900 placeholder:text-amber-400 focus:border-wine-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-wine-500/20"
                      />
                      <button
                        onClick={() => {
                          if (perfil.nombre.trim()) {
                            handleGuardarPerfil();
                            setNombreGuardado(true);
                          }
                        }}
                        disabled={!perfil.nombre.trim()}
                        className="rounded-lg bg-wine-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-wine-700 disabled:opacity-50"
                      >
                        Guardar
                      </button>
                    </div>
                  )}
                  <textarea
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm transition-all placeholder:text-gray-400 focus:border-wine-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-wine-500/20"
                    placeholder="Que estas pensando? Comparte una idea, pregunta o experiencia..."
                    rows={3}
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={handleEnviarComentario}
                      disabled={enviando || !nuevoComentario.trim() || !perfil.nombre.trim()}
                      className="rounded-full bg-wine-600 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-wine-700 disabled:opacity-50"
                    >
                      {enviando ? "Publicando..." : "Publicar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de comentarios */}
            {comentarios.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="mb-1 text-lg font-bold text-gray-900">Se la primera en comentar</h3>
                <p className="text-sm text-gray-500">Inicia la conversacion compartiendo tu experiencia.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comentarios.map(c => renderComentario(c))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
