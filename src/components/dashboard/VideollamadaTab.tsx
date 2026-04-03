"use client";

import { useState } from "react";

interface Videollamada {
  id: string;
  email: string;
  nombre: string;
  mensaje: string;
  fechaPropuesta: string | null;
  fechaConfirmada: string | null;
  duracion: number;
  enlace: string;
  estado: string;
  notasAdmin: string;
  createdAt: string;
}

interface VideollamadaTabProps {
  email: string;
  nombre: string;
  videollamadas: Videollamada[];
  setVideollamadas: React.Dispatch<React.SetStateAction<Videollamada[]>>;
  precio: number;
  activa: boolean;
}

const estadoLabel: Record<string, { text: string; color: string }> = {
  pendiente_pago: { text: "Pendiente de pago", color: "bg-yellow-100 text-yellow-700" },
  pagada: { text: "Pagada - Propón tu horario", color: "bg-blue-100 text-blue-700" },
  agendada: { text: "Horario propuesto - Esperando confirmación", color: "bg-purple-100 text-purple-700" },
  confirmada: { text: "Confirmada", color: "bg-green-100 text-green-700" },
  completada: { text: "Completada", color: "bg-gray-100 text-gray-600" },
  cancelada: { text: "Cancelada", color: "bg-red-100 text-red-600" },
};

export function VideollamadaTab({
  email,
  nombre,
  videollamadas,
  setVideollamadas,
  precio,
  activa,
}: VideollamadaTabProps) {
  const [solicitando, setSolicitando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [fechaPropuesta, setFechaPropuesta] = useState("");
  const [mensajePropuesta, setMensajePropuesta] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Solicitud activa (no completada ni cancelada)
  const solicitudActiva = videollamadas.find(
    (v) => !["completada", "cancelada"].includes(v.estado)
  );

  // Historial (completadas y canceladas)
  const historial = videollamadas.filter((v) =>
    ["completada", "cancelada"].includes(v.estado)
  );

  const handleSolicitar = async () => {
    setSolicitando(true);
    const res = await fetch("/api/videollamada", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, nombre, mensaje }),
    });
    if (res.ok) {
      const nueva = await res.json();
      setVideollamadas((prev) => [nueva, ...prev]);
      setMensaje("");
    }
    setSolicitando(false);
  };

  const handleProponerFecha = async (id: string) => {
    if (!fechaPropuesta) return;
    setEnviando(true);
    const res = await fetch(`/api/videollamada/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fechaPropuesta,
        mensaje: mensajePropuesta,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setVideollamadas((prev) =>
        prev.map((v) => (v.id === id ? updated : v))
      );
      setFechaPropuesta("");
      setMensajePropuesta("");
    }
    setEnviando(false);
  };

  if (!activa) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <svg className="mx-auto mb-4 h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-500">Las videollamadas no están disponibles en este momento.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-2 text-xl font-bold text-gray-900">Videollamada con la Coach</h2>
      <p className="mb-6 text-sm text-gray-500">
        Agenda una sesión personalizada con Deby para resolver tus dudas
      </p>

      {/* Solicitud activa */}
      {solicitudActiva ? (
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Tu solicitud</h3>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${estadoLabel[solicitudActiva.estado]?.color || "bg-gray-100 text-gray-600"}`}>
              {estadoLabel[solicitudActiva.estado]?.text || solicitudActiva.estado}
            </span>
          </div>

          {/* Estado: pendiente_pago */}
          {solicitudActiva.estado === "pendiente_pago" && (
            <div className="rounded-xl bg-yellow-50 p-4">
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-800">Esperando confirmación de pago</p>
                  <p className="mt-1 text-xs text-yellow-600">
                    Tu solicitud fue recibida. Una vez confirmado el pago de ${precio.toFixed(2)},
                    podrás proponer tu horario preferido.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Estado: pagada - proponer fecha */}
          {solicitudActiva.estado === "pagada" && (
            <div className="space-y-4">
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-800">
                  ¡Pago confirmado! Ahora propón tu fecha y hora preferida.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Fecha y hora propuesta
                </label>
                <input
                  type="datetime-local"
                  value={fechaPropuesta}
                  onChange={(e) => setFechaPropuesta(e.target.value)}
                  className="input-field"
                  min={new Date(Date.now() + 86400000).toISOString().slice(0, 16)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Mensaje para la coach (opcional)
                </label>
                <textarea
                  value={mensajePropuesta}
                  onChange={(e) => setMensajePropuesta(e.target.value)}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Cuéntale sobre qué te gustaría hablar..."
                />
              </div>
              <button
                onClick={() => handleProponerFecha(solicitudActiva.id)}
                disabled={enviando || !fechaPropuesta}
                className="btn-primary w-full py-3"
              >
                {enviando ? "Enviando..." : "Proponer horario"}
              </button>
            </div>
          )}

          {/* Estado: agendada */}
          {solicitudActiva.estado === "agendada" && (
            <div className="rounded-xl bg-purple-50 p-4">
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-purple-800">Horario propuesto, esperando confirmación</p>
                  <p className="mt-1 text-sm text-purple-600">
                    Propusiste: {new Date(solicitudActiva.fechaPropuesta!).toLocaleString("es", {
                      weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                  <p className="mt-1 text-xs text-purple-500">La coach confirmará tu horario pronto.</p>
                </div>
              </div>
            </div>
          )}

          {/* Estado: confirmada */}
          {solicitudActiva.estado === "confirmada" && (
            <div className="space-y-4">
              <div className="rounded-xl bg-green-50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-lg font-bold text-green-800">¡Videollamada confirmada!</p>
                </div>
                <div className="space-y-2 text-sm text-green-700">
                  <p>
                    <strong>Fecha:</strong>{" "}
                    {new Date(solicitudActiva.fechaConfirmada!).toLocaleDateString("es", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric"
                    })}
                  </p>
                  <p>
                    <strong>Hora:</strong>{" "}
                    {new Date(solicitudActiva.fechaConfirmada!).toLocaleTimeString("es", {
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                  <p><strong>Duración:</strong> {solicitudActiva.duracion} minutos</p>
                </div>
              </div>
              {solicitudActiva.enlace && (
                <a
                  href={solicitudActiva.enlace}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex w-full items-center justify-center gap-2 py-3"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Unirse a la videollamada
                </a>
              )}
            </div>
          )}
        </div>
      ) : (
        /* No tiene solicitud activa - mostrar CTA */
        <div className="mb-8 rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-wine-50">
            <svg className="h-8 w-8 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-bold text-gray-900">Sesión personalizada</h3>
          <p className="mb-2 text-sm text-gray-500">
            Reserva una videollamada privada con la coach para resolver tus dudas,
            revisar tu estrategia o recibir mentoría personalizada.
          </p>
          <p className="mb-6 text-2xl font-extrabold text-wine-600">${precio.toFixed(2)}</p>

          <div className="mx-auto max-w-sm space-y-3">
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              className="input-field resize-none"
              rows={2}
              placeholder="¿Sobre qué te gustaría hablar? (opcional)"
            />
            <button
              onClick={handleSolicitar}
              disabled={solicitando}
              className="btn-primary w-full py-3"
            >
              {solicitando ? "Solicitando..." : "Solicitar videollamada"}
            </button>
          </div>
        </div>
      )}

      {/* Historial */}
      {historial.length > 0 && (
        <div>
          <h3 className="mb-4 font-bold text-gray-900">Historial</h3>
          <div className="space-y-3">
            {historial.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {v.fechaConfirmada
                      ? new Date(v.fechaConfirmada).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })
                      : new Date(v.createdAt).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <p className="text-xs text-gray-500">{v.duracion} minutos</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${estadoLabel[v.estado]?.color || "bg-gray-100 text-gray-600"}`}>
                  {estadoLabel[v.estado]?.text || v.estado}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
