"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { ImagePositionEditor } from "@/components/ImagePositionEditor";

export default function NuevaClasePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    contenido: "",
    imagen: "",
    imagenPos: "50% 50%",
    precio: 0,
    categoria: "General",
    publicada: false,
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (session?.user?.role !== "admin") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/clases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push("/admin");
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">
        Nueva Clase
      </h1>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Titulo *
          </label>
          <input
            type="text"
            className="input-field"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            placeholder="Ej: Marketing en Instagram para Emprendedoras"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Descripcion *
          </label>
          <textarea
            className="input-field min-h-[100px]"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Describe el contenido de la clase..."
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Contenido (URL del video o enlace)
          </label>
          <input
            type="text"
            className="input-field"
            value={form.contenido}
            onChange={(e) => setForm({ ...form, contenido: e.target.value })}
            placeholder="URL del video de YouTube, Vimeo, Google Drive, etc."
          />
          <p className="mt-1 text-xs text-gray-400">
            Puedes usar enlaces de YouTube, Vimeo o cualquier servicio de video.
          </p>
        </div>

        <ImageUpload
          value={form.imagen}
          onChange={(url) => setForm({ ...form, imagen: url })}
        />
        <ImagePositionEditor
          imageUrl={form.imagen}
          position={form.imagenPos}
          onChange={(pos) => setForm({ ...form, imagenPos: pos })}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Precio ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input-field"
              value={form.precio}
              onChange={(e) =>
                setForm({ ...form, precio: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Categoria
            </label>
            <select
              className="input-field"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            >
              <option>General</option>
              <option>Instagram</option>
              <option>Facebook</option>
              <option>TikTok</option>
              <option>Email Marketing</option>
              <option>Branding</option>
              <option>Ventas</option>
              <option>Estrategia</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="publicada"
            checked={form.publicada}
            onChange={(e) => setForm({ ...form, publicada: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-wine-600 focus:ring-wine-500"
          />
          <label htmlFor="publicada" className="text-sm text-gray-700">
            Publicar inmediatamente (visible para las clientas)
          </label>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Guardando..." : "Crear Clase"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => router.push("/admin")}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
