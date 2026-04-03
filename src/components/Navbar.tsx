"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = session?.user?.role === "admin";
  const pathname = usePathname();

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
