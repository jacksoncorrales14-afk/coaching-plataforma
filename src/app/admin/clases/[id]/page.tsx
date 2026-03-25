"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditarClasePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    contenido: "",
    imagen: "",
    precio: 0,
    categoria: "General",
    publicada: false,
    orden: 0,
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/clases/${params.id}`)
        .then((r) => r.json())
        .then((data) => {
          setForm({
            titulo: data.titulo || "",
            descripcion: data.descripcion || "",
            contenido: data.contenido || "",
            imagen: data.imagen || "",
            precio: data.precio || 0,
            categoria: data.categoria || "General",
            publicada: data.publicada || false,
            orden: data.orden || 0,
          });
        });
    }
  }, [params.id]);

  if (session?.user?.role !== "admin") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/clases/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    router.push("/admin");
  };

  const handleDelete = async () => {
    if (!confirm("Estas segura de eliminar esta clase? Se eliminaran tambien todos los codigos asociados.")) return;
    setDeleting(true);
    await fetch(`/api/clases/${params.id}`, { method: "DELETE" });
    router.push("/admin");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Editar Clase</h1>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Titulo *</label>
          <input
            type="text"
            className="input-field"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Descripcion *</label>
          <textarea
            className="input-field min-h-[100px]"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Contenido (URL del video)</label>
          <input
            type="text"
            className="input-field"
            value={form.contenido}
            onChange={(e) => setForm({ ...form, contenido: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Imagen de portada (URL)</label>
          <input
            type="text"
            className="input-field"
            value={form.imagen}
            onChange={(e) => setForm({ ...form, imagen: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Precio ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input-field"
              value={form.precio}
              onChange={(e) => setForm({ ...form, precio: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Categoria</label>
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
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Orden</label>
            <input
              type="number"
              className="input-field"
              value={form.orden}
              onChange={(e) => setForm({ ...form, orden: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="publicada"
            checked={form.publicada}
            onChange={(e) => setForm({ ...form, publicada: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="publicada" className="text-sm text-gray-700">
            Publicada (visible para las clientas)
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => router.push("/admin")}>
              Cancelar
            </button>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm font-medium text-red-500 hover:text-red-700"
          >
            {deleting ? "Eliminando..." : "Eliminar Clase"}
          </button>
        </div>
      </form>
    </div>
  );
}
