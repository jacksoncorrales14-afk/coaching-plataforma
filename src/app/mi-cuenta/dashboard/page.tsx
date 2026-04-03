"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { CursosTab } from "@/components/dashboard/CursosTab";
import { ProgramasTab } from "@/components/dashboard/ProgramasTab";
import { ComunidadTab } from "@/components/dashboard/ComunidadTab";
import { VideollamadaTab } from "@/components/dashboard/VideollamadaTab";

type Tab = "cursos" | "programas" | "comunidad" | "videollamada";

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
  const [videollamadas, setVideollamadas] = useState<any[]>([]);
  const [videollamadaPrecio, setVideollamadaPrecio] = useState(50);
  const [videollamadaActiva, setVideollamadaActiva] = useState(true);
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const [nombreGuardado, setNombreGuardado] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedEmail = localStorage.getItem("coach_email");
    const savedAuth = localStorage.getItem("coach_auth");
    if (!savedEmail || savedAuth !== "true") { router.push("/mi-cuenta"); return; }

    setEmail(savedEmail);

    const controller = new AbortController();
    const opts = { signal: controller.signal };

    Promise.all([
      fetch(`/api/membresia?email=${encodeURIComponent(savedEmail)}`, opts).then(r => r.json()),
      fetch(`/api/perfil?email=${encodeURIComponent(savedEmail)}`, opts).then(r => r.json()),
      fetch("/api/clases", opts).then(r => r.json()),
      fetch("/api/comunidad", opts).then(r => r.json()).catch((e) => { if (e.name !== "AbortError") return []; console.error(e); return []; }),
      fetch("/api/programas", opts).then(r => r.json()).catch((e) => { if (e.name !== "AbortError") return []; console.error(e); return []; }),
      fetch(`/api/videollamada?email=${encodeURIComponent(savedEmail)}`, opts).then(r => r.ok ? r.json() : { videollamadas: [], precio: 50, activa: true }).catch(() => ({ videollamadas: [], precio: 50, activa: true })),
    ]).then(([memData, perfilData, clasesData, comData, progData, videoData]) => {
      if (!memData.activa) { router.push("/mi-cuenta"); return; }
      setMembresia(memData);
      setPerfil(perfilData);
      setNombreGuardado(!!perfilData.nombre);
      setClases(Array.isArray(clasesData) ? clasesData : []);
      setComentarios(Array.isArray(comData) ? comData : []);
      setProgramas(Array.isArray(progData) ? progData : []);
      setVideollamadas(videoData.videollamadas || []);
      setVideollamadaPrecio(videoData.precio || 50);
      setVideollamadaActiva(videoData.activa ?? true);
      setLoading(false);
    }).catch((e) => { if (e.name !== "AbortError") console.error(e); });

    return () => controller.abort();
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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Cargando dashboard">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-wine-600" aria-hidden="true" />
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: JSX.Element }[] = [
    { key: "cursos", label: "Cursos", icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
    { key: "programas", label: "Programas", icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
    { key: "comunidad", label: "Comunidad", icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg> },
    { key: "videollamada", label: "Videollamada", icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-wine-600">
        <div className="absolute inset-0 bg-gradient-to-br from-wine-700/50 via-transparent to-wine-800/30" />
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-wine-500/20 blur-[100px]" />
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <button onClick={() => fileInputRef.current?.click()} className="group relative">
                  <Avatar src={perfil.avatar} name={perfil.nombre || "U"} size="lg" />
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    {subiendoAvatar ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
                    ) : (
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
          <div className="mt-6 flex gap-2" role="tablist">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                role="tab"
                aria-selected={tab === t.key}
                aria-controls={`tabpanel-${t.key}`}
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
        {tab === "cursos" && (
          <div id="tabpanel-cursos" role="tabpanel" aria-labelledby="tab-cursos">
            <CursosTab clases={clases} />
          </div>
        )}
        {tab === "programas" && (
          <div id="tabpanel-programas" role="tabpanel" aria-labelledby="tab-programas">
            <ProgramasTab programas={programas} />
          </div>
        )}
        {tab === "comunidad" && (
          <div id="tabpanel-comunidad" role="tabpanel" aria-labelledby="tab-comunidad">
            <ComunidadTab
              email={email}
              perfil={perfil}
              comentarios={comentarios}
              setComentarios={setComentarios}
              nombreGuardado={nombreGuardado}
              setNombreGuardado={setNombreGuardado}
              setPerfil={setPerfil}
              onGuardarPerfil={handleGuardarPerfil}
            />
          </div>
        )}
        {tab === "videollamada" && (
          <div id="tabpanel-videollamada" role="tabpanel" aria-labelledby="tab-videollamada">
            <VideollamadaTab
              email={email}
              nombre={perfil.nombre}
              videollamadas={videollamadas}
              setVideollamadas={setVideollamadas}
              precio={videollamadaPrecio}
              activa={videollamadaActiva}
            />
          </div>
        )}
      </div>
    </div>
  );
}
