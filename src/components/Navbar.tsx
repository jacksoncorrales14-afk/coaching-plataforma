"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";

interface Notificacion {
  id: string;
  tipo: "comentario_comunidad" | "comentario_programa" | "solicitud_videollamada";
  mensaje: string;
  leida: boolean;
  createdAt: string;
}

function tiempoRelativo(fecha: string) {
  const diff = Date.now() - new Date(fecha).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const dias = Math.floor(hrs / 24);
  return `${dias}d`;
}

function NotifIcon({ tipo }: { tipo: Notificacion["tipo"] }) {
  if (tipo === "comentario_comunidad")
    return (
      <svg className="h-5 w-5 shrink-0 text-wine-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    );
  if (tipo === "comentario_programa")
    return (
      <svg className="h-5 w-5 shrink-0 text-wine-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    );
  // solicitud_videollamada
  return (
    <svg className="h-5 w-5 shrink-0 text-wine-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = session?.user?.role === "admin";
  const pathname = usePathname();

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotificaciones = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notificaciones");
      if (!res.ok) return;
      const data = await res.json();
      setNotificaciones(data.notificaciones || []);
      setNoLeidas(data.noLeidas || 0);
    } catch {
      /* silently ignore */
    }
  }, []);

  // Poll notifications every 30s for admins
  useEffect(() => {
    if (!isAdmin) return;
    fetchNotificaciones();
    const interval = setInterval(fetchNotificaciones, 30000);
    return () => clearInterval(interval);
  }, [isAdmin, fetchNotificaciones]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!showNotif) return;
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotif]);

  const toggleNotif = () => {
    setShowNotif((prev) => !prev);
    if (!showNotif) fetchNotificaciones();
  };

  const marcarTodas = async () => {
    try {
      await fetch("/api/admin/notificaciones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todas: true }),
      });
      await fetchNotificaciones();
    } catch {
      /* silently ignore */
    }
  };

  const marcarUna = async (id: string) => {
    try {
      await fetch("/api/admin/notificaciones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchNotificaciones();
    } catch {
      /* silently ignore */
    }
  };

  const linkClass = (href: string) =>
    `rounded-full border px-5 py-2 text-sm font-medium shadow-sm transition-all ${
      pathname === href || pathname.startsWith(href + "/")
        ? "border-wine-300 bg-wine-50 text-wine-700 shadow-md"
        : "border-gray-200 bg-white text-gray-700 hover:border-wine-300 hover:bg-wine-50 hover:text-wine-700 hover:shadow-md"
    }`;

  const mobileLinkClass = (href: string) =>
    `rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
      pathname === href || pathname.startsWith(href + "/")
        ? "bg-wine-50 text-wine-700"
        : "text-gray-700 hover:bg-gray-100"
    }`;

  const bellButton = (
    <button
      onClick={toggleNotif}
      className="relative rounded-full border border-gray-200 bg-white p-2 text-gray-700 shadow-sm transition-all hover:border-wine-300 hover:bg-wine-50 hover:text-wine-700 hover:shadow-md"
      aria-label="Notificaciones"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {noLeidas > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
          {noLeidas}
        </span>
      )}
    </button>
  );

  const notifDropdown = showNotif && (
    <div className="absolute right-0 top-full z-50 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-xl">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
      </div>
      {notificaciones.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-gray-500">Sin notificaciones</p>
      ) : (
        <ul className="divide-y divide-gray-50">
          {notificaciones.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => !n.leida && marcarUna(n.id)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                  n.leida ? "opacity-60" : ""
                }`}
              >
                <NotifIcon tipo={n.tipo} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-800 leading-snug">{n.mensaje}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{tiempoRelativo(n.createdAt)}</p>
                </div>
                {!n.leida && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-wine-500" />}
              </button>
            </li>
          ))}
        </ul>
      )}
      {noLeidas > 0 && (
        <div className="border-t border-gray-100 px-4 py-2">
          <button
            onClick={marcarTodas}
            className="w-full rounded-lg py-2 text-center text-sm font-medium text-wine-600 transition-colors hover:bg-wine-50"
          >
            Marcar todas como leídas
          </button>
        </div>
      )}
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl" aria-label="Navegacion principal">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="-ml-2 flex items-center gap-2">
          <Image
            src="/logo.jpg"
            alt="Deby Chantell Coach Academy"
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
          />
          <span className="text-lg font-bold tracking-tight text-black sm:text-xl">
            Coach Deby Chantel Academy
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/clases"
            className={linkClass("/clases")}
            aria-current={pathname.startsWith("/clases") ? "page" : undefined}
          >
            Cursos
          </Link>
          <Link
            href="/programas"
            className={linkClass("/programas")}
            aria-current={pathname.startsWith("/programas") ? "page" : undefined}
          >
            Programas
          </Link>
          <Link
            href="/membresia"
            className={`rounded-full px-5 py-2 text-sm font-medium shadow-sm transition-all ${
              pathname === "/membresia"
                ? "bg-wine-700 text-white shadow-md"
                : "bg-wine-600 text-white hover:bg-wine-700 hover:shadow-md"
            }`}
            aria-current={pathname === "/membresia" ? "page" : undefined}
          >
            Membresia
          </Link>
          <Link
            href="/mi-cuenta"
            className={linkClass("/mi-cuenta")}
            aria-current={pathname.startsWith("/mi-cuenta") ? "page" : undefined}
          >
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Ingresar
            </span>
          </Link>
          {isAdmin && (
            <div className="relative" ref={notifRef}>
              {bellButton}
              {notifDropdown}
            </div>
          )}
          <Link
            href={isAdmin ? "/admin" : "/login"}
            className={linkClass(isAdmin ? "/admin" : "/login")}
            aria-current={pathname === "/admin" || pathname === "/login" ? "page" : undefined}
          >
            Administrador
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Cerrar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          <svg
            className="h-6 w-6 text-gray-900"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div id="mobile-menu" className="border-t border-gray-100 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {isAdmin && (
              <div className="relative" ref={showNotif ? notifRef : undefined}>
                <div className="flex items-center gap-2 rounded-lg px-4 py-2.5">
                  {bellButton}
                  <span className="text-sm font-medium text-gray-700">Notificaciones</span>
                </div>
                {notifDropdown}
              </div>
            )}
            <Link
              href="/clases"
              className={mobileLinkClass("/clases")}
              onClick={() => setMenuOpen(false)}
              aria-current={pathname.startsWith("/clases") ? "page" : undefined}
            >
              Cursos
            </Link>
            <Link
              href="/programas"
              className={mobileLinkClass("/programas")}
              onClick={() => setMenuOpen(false)}
              aria-current={pathname.startsWith("/programas") ? "page" : undefined}
            >
              Programas
            </Link>
            <Link
              href="/membresia"
              className="rounded-lg bg-wine-600 px-4 py-2.5 text-center text-sm font-medium text-white"
              onClick={() => setMenuOpen(false)}
              aria-current={pathname === "/membresia" ? "page" : undefined}
            >
              Membresia
            </Link>
            <Link
              href="/mi-cuenta"
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                pathname.startsWith("/mi-cuenta")
                  ? "bg-wine-50 text-wine-700"
                  : "text-wine-600 hover:bg-wine-50"
              }`}
              onClick={() => setMenuOpen(false)}
              aria-current={pathname.startsWith("/mi-cuenta") ? "page" : undefined}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Ingresar
            </Link>
            <Link
              href={isAdmin ? "/admin" : "/login"}
              className={mobileLinkClass(isAdmin ? "/admin" : "/login")}
              onClick={() => setMenuOpen(false)}
            >
              Administrador
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
