"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = session?.user?.role === "admin";

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary-600">
            Coach Academy
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="/clases"
            className="text-sm font-medium text-gray-600 transition-colors hover:text-primary-600"
          >
            Clases
          </Link>
          <Link
            href="/desbloquear"
            className="text-sm font-medium text-gray-600 transition-colors hover:text-primary-600"
          >
            Desbloquear Clase
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-primary-600"
            >
              Panel Admin
            </Link>
          )}
          {session ? (
            <button
              onClick={() => signOut()}
              className="btn-secondary text-xs"
            >
              Cerrar Sesion
            </button>
          ) : (
            <Link href="/login" className="btn-primary text-xs">
              Admin
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menu"
        >
          <svg
            className="h-6 w-6 text-gray-600"
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
          <div className="flex flex-col gap-3">
            <Link
              href="/clases"
              className="text-sm font-medium text-gray-600"
              onClick={() => setMenuOpen(false)}
            >
              Clases
            </Link>
            <Link
              href="/desbloquear"
              className="text-sm font-medium text-gray-600"
              onClick={() => setMenuOpen(false)}
            >
              Desbloquear Clase
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="text-sm font-medium text-gray-600"
                onClick={() => setMenuOpen(false)}
              >
                Panel Admin
              </Link>
            )}
            {session ? (
              <button
                onClick={() => {
                  signOut();
                  setMenuOpen(false);
                }}
                className="text-left text-sm font-medium text-red-500"
              >
                Cerrar Sesion
              </button>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-primary-600"
                onClick={() => setMenuOpen(false)}
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
