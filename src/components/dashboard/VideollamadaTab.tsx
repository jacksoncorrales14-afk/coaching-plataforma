"use client";

import { useState, useEffect } from "react";

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

interface DisponibilidadDia {
  fecha: string;
  horas: string[];
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
  pagada: { text: "Pagada - Esperando confirmación", color: "bg-blue-100 text-blue-700" },
  agendada: { text: "Horario propuesto - Esperando confirmación", color: "bg-purple-100 text-purple-700" },
  confirmada: { text: "Confirmada", color: "bg-green-100 text-green-700" },
  completada: { text: "Completada", color: "bg-gray-100 text-gray-600" },
  cancelada: { text: "Cancelada", color: "bg-red-100 text-red-600" },
};

const DIAS_SEMANA = ["L", "M", "M", "J", "V", "S", "D"];

function getMesNombre(mes: number): string {
  const nombres = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  return nombres[mes];
}

function formatFecha(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Build an array of day cells for the calendar grid.
 * Each cell is either { date: Date, fechaStr: string } or null (empty padding).
 */
function buildCalendarDays(year: number, month: number): (null | { date: Date; fechaStr: string })[] {
  const firstDay = new Date(year, month, 1);
  // JS getDay: 0=Sun..6=Sat  ->  We want Mon=0..Sun=6
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (null | { date: Date; fechaStr: string })[] = [];

  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    cells.push({ date, fechaStr: formatFecha(date) });
  }

  return cells;
}

export function VideollamadaTab({
  email,
  nombre,
  videollamadas,
  setVideollamadas,
  precio,
  activa,
}: VideollamadaTabProps) {
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadDia[]>([]);
  const [cargandoDisp, setCargandoDisp] = useState(true);
  const [mesOffset, setMesOffset] = useState(0); // 0 = current month, 1 = next month
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [solicitando, setSolicitando] = useState(false);

  // Fetch availability on mount
  useEffect(() => {
    async function fetchDisponibilidad() {
      setCargandoDisp(true);
      try {
        const res = await fetch("/api/disponibilidad");
        if (res.ok) {
          const data: DisponibilidadDia[] = await res.json();
          setDisponibilidad(data);
        }
      } catch {
        // silently fail
      }
      setCargandoDisp(false);
    }
    fetchDisponibilidad();
  }, []);

  // Derived data
  const hoy = new Date();
  const hoyStr = formatFecha(hoy);

  const disponibilidadMap = new Map<string, string[]>();
  for (const d of disponibilidad) {
    disponibilidadMap.set(d.fecha, d.horas);
  }

  const horasDelDia = fechaSeleccionada ? disponibilidadMap.get(fechaSeleccionada) || [] : [];

  // Calendar month computation
  const calendarDate = new Date(hoy.getFullYear(), hoy.getMonth() + mesOffset, 1);
  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();
  const cells = buildCalendarDays(calendarYear, calendarMonth);

  // Solicitud activa (no completada ni cancelada)
  const solicitudActiva = videollamadas.find(
    (v) => !["completada", "cancelada"].includes(v.estado)
  );

  // Historial (completadas y canceladas)
  const historial = videollamadas.filter((v) =>
    ["completada", "cancelada"].includes(v.estado)
  );

  const handleSolicitar = async () => {
    if (!fechaSeleccionada || !horaSeleccionada) return;
    setSolicitando(true);
    try {
      const fechaPropuesta = `${fechaSeleccionada}T${horaSeleccionada}:00`;
      const res = await fetch("/api/videollamada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nombre, mensaje, fechaPropuesta }),
      });
      if (res.ok) {
        const nueva = await res.json();
        setVideollamadas((prev) => [nueva, ...prev]);
        setMensaje("");
        setFechaSeleccionada(null);
        setHoraSeleccionada(null);
      }
    } catch {
      // silently fail
    }
    setSolicitando(false);
  };

  // Can navigate previous month only if it's current month or later
  const canGoPrev = mesOffset > 0;
  // Limit to ~2 months ahead
  const canGoNext = mesOffset < 2;

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
                    se agendará tu videollamada.
                  </p>
                  {solicitudActiva.fechaPropuesta && (
                    <p className="mt-2 text-xs font-medium text-yellow-700">
                      Horario solicitado:{" "}
                      {new Date(solicitudActiva.fechaPropuesta).toLocaleString("es", {
                        weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Estado: pagada */}
          {solicitudActiva.estado === "pagada" && (
            <div className="rounded-xl bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-800">Pago confirmado - Esperando confirmación de la coach</p>
                  {solicitudActiva.fechaPropuesta && (
                    <p className="mt-1 text-sm text-blue-600">
                      Horario solicitado:{" "}
                      {new Date(solicitudActiva.fechaPropuesta).toLocaleString("es", {
                        weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-blue-500">La coach confirmará tu horario pronto.</p>
                </div>
              </div>
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
                    Propusiste:{" "}
                    {new Date(solicitudActiva.fechaPropuesta!).toLocaleString("es", {
                      weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
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
                      weekday: "long", day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                  <p>
                    <strong>Hora:</strong>{" "}
                    {new Date(solicitudActiva.fechaConfirmada!).toLocaleTimeString("es", {
                      hour: "2-digit", minute: "2-digit",
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
        /* No tiene solicitud activa - Mostrar calendario para agendar */
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          {/* Header */}
          <div className="mb-4 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-wine-50">
              <svg className="h-7 w-7 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Agenda tu sesión</h3>
            <p className="mt-1 text-sm text-gray-500">
              Selecciona una fecha y hora disponible para tu videollamada
            </p>
            <p className="mt-2 text-2xl font-extrabold text-wine-600">${precio.toFixed(2)}</p>
          </div>

          {cargandoDisp ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-wine-200 border-t-wine-600" />
            </div>
          ) : (
            <>
              {/* Calendar */}
              <div className="mx-auto max-w-sm">
                {/* Month navigation */}
                <div className="mb-3 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setMesOffset((o) => o - 1);
                      setFechaSeleccionada(null);
                      setHoraSeleccionada(null);
                    }}
                    disabled={!canGoPrev}
                    className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    aria-label="Mes anterior"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-sm font-semibold text-gray-900">
                    {getMesNombre(calendarMonth)} {calendarYear}
                  </span>
                  <button
                    onClick={() => {
                      setMesOffset((o) => o + 1);
                      setFechaSeleccionada(null);
                      setHoraSeleccionada(null);
                    }}
                    disabled={!canGoNext}
                    className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    aria-label="Mes siguiente"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Day-of-week header */}
                <div className="mb-1 grid grid-cols-7 text-center">
                  {DIAS_SEMANA.map((d, i) => (
                    <span key={i} className="py-1 text-xs font-medium text-gray-400">
                      {d}
                    </span>
                  ))}
                </div>

                {/* Day grid */}
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((cell, i) => {
                    if (!cell) {
                      return <div key={`empty-${i}`} />;
                    }

                    const isPast = cell.fechaStr < hoyStr;
                    const isAvailable = !isPast && disponibilidadMap.has(cell.fechaStr);
                    const isSelected = cell.fechaStr === fechaSeleccionada;
                    const isToday = cell.fechaStr === hoyStr;

                    return (
                      <button
                        key={cell.fechaStr}
                        disabled={!isAvailable}
                        onClick={() => {
                          setFechaSeleccionada(cell.fechaStr);
                          setHoraSeleccionada(null);
                        }}
                        className={`
                          flex h-9 w-full items-center justify-center rounded-lg text-sm transition
                          ${isSelected
                            ? "bg-wine-600 font-semibold text-white"
                            : isAvailable
                              ? "bg-white font-medium text-gray-900 hover:bg-wine-50"
                              : "cursor-default text-gray-300"
                          }
                          ${isToday && !isSelected ? "ring-1 ring-wine-300" : ""}
                        `}
                      >
                        {cell.date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hour selection */}
              {fechaSeleccionada && (
                <div className="mx-auto mt-6 max-w-sm">
                  <p className="mb-3 text-center text-sm font-medium text-gray-700">
                    Horarios disponibles para el{" "}
                    <span className="font-semibold text-wine-600">
                      {new Date(fechaSeleccionada + "T00:00:00").toLocaleDateString("es", {
                        day: "numeric",
                        month: "long",
                      })}
                    </span>
                  </p>
                  {horasDelDia.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {horasDelDia.map((hora) => {
                        const isSelected = hora === horaSeleccionada;
                        return (
                          <button
                            key={hora}
                            onClick={() => setHoraSeleccionada(hora)}
                            className={`
                              rounded-full px-3 py-2 text-sm font-medium transition
                              ${isSelected
                                ? "bg-wine-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-wine-50 hover:text-wine-700"
                              }
                            `}
                          >
                            {hora}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-gray-400">No hay horarios disponibles para este día.</p>
                  )}
                </div>
              )}

              {/* Message + submit */}
              {horaSeleccionada && (
                <div className="mx-auto mt-6 max-w-sm space-y-3">
                  <div className="rounded-xl bg-wine-50 p-3 text-center">
                    <p className="text-sm font-medium text-wine-700">
                      {new Date(`${fechaSeleccionada}T${horaSeleccionada}:00`).toLocaleString("es", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
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
              )}
            </>
          )}
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
