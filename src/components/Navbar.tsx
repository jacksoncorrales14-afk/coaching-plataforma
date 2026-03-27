"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = session?.user?.role === "admin";

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="-ml-2 flex items-center gap-2">
          <img
            src="/logo.jpg"
            alt="Deby Chantel"
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
            className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-wine-300 hover:bg-wine-50 hover:text-wine-700 hover:shadow-md"
          >
            Cursos
          </Link>
          <Link
            href="/membresia"
            className="rounded-full bg-wine-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-wine-700 hover:shadow-md"
          >
            Membresia
          </Link>
          <Link
            href="/mi-cuenta"
            className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-wine-300 hover:bg-wine-50 hover:text-wine-700 hover:shadow-md"
          >
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Ingresar
            </span>
          </Link>
          <Link
            href={isAdmin ? "/admin" : "/login"}
            className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50 hover:shadow-md"
          >
            Administrador
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menu"
        >
          <svg
            className="h-6 w-6 text-gray-900"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
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
        <div className="border-t border-gray-100 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            <Link
              href="/clases"
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              Cursos
            </Link>
            <Link
              href="/membresia"
              className="rounded-lg bg-wine-600 px-4 py-2.5 text-center text-sm font-medium text-white"
              onClick={() => setMenuOpen(false)}
            >
              Membresia
            </Link>
            <Link
              href="/mi-cuenta"
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-wine-600 transition-colors hover:bg-wine-50"
              onClick={() => setMenuOpen(false)}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Ingresar
            </Link>
            <Link
              href={isAdmin ? "/admin" : "/login"}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
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
