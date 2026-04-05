"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [estado, setEstado] = useState<"validando" | "valido" | "invalido" | "exito">("validando");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const validar = async () => {
      try {
        const res = await fetch(`/api/reset-password?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        setEstado(data.valido ? "valido" : "invalido");
      } catch {
        setEstado("invalido");
      }
    };
    if (token) validar();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setEstado("exito");
      setTimeout(() => router.push("/login"), 2500);
    } else {
      setError(data.error || "No se pudo actualizar la contraseña.");
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Restablecer contraseña</h1>
          <p className="mb-6 text-sm text-gray-500">
            Elige una nueva contraseña para tu cuenta.
          </p>

          {estado === "validando" && (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-wine-600" />
            </div>
          )}

          {estado === "invalido" && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              Este enlace es inválido o ya expiró. Por favor{" "}
              <button
                onClick={() => router.push("/login")}
                className="font-semibold underline hover:text-red-900"
              >
                solicita uno nuevo
              </button>
              .
            </div>
          )}

          {estado === "exito" && (
            <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700">
              Contraseña actualizada con éxito. Redirigiendo al inicio de sesión...
            </div>
          )}

          {estado === "valido" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="Mínimo 6 caracteres"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Confirmar contraseña</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  className="input-field"
                  placeholder="Repite tu contraseña"
                  required
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5"
              >
                {loading ? "Guardando..." : "Restablecer contraseña"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
