import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Horario base: 12:00 PM a 7:00 PM todos los días
const HORA_INICIO = 12;
const HORA_FIN = 19;

// GET /api/disponibilidad — horarios disponibles (próximos 30 días)
// Lógica invertida: todo está disponible por defecto, los bloques son exclusiones
export async function GET() {
  try {
    const bloques = await prisma.bloqueHorario.findMany();

    const ahora = new Date();
    const en30Dias = new Date(ahora.getTime() + 30 * 86400000);

    const ocupadas = await prisma.videollamada.findMany({
      where: {
        estado: { in: ["agendada", "confirmada", "pendiente_pago", "pagada"] },
        fechaPropuesta: { gte: ahora, lte: en30Dias },
      },
      select: { fechaPropuesta: true, duracion: true },
    });

    const slots: { fecha: string; horas: string[] }[] = [];

    for (let d = 1; d <= 30; d++) {
      const dia = new Date(ahora.getTime() + d * 86400000);
      const diaSemana = dia.getDay(); // 0=domingo..6=sábado
      const fechaStr = dia.toISOString().split("T")[0];

      // Verificar si este día de la semana está bloqueado recurrentemente
      const diaBloqueadoRecurrente = bloques.some(
        (b) => b.diaSemana === diaSemana && !b.disponible &&
               b.horaInicio === "00:00" && (b.horaFin === "23:59" || b.horaFin === "24:00")
      );
      if (diaBloqueadoRecurrente) continue;

      // Buscar bloqueos específicos para esta fecha
      const bloqueosDelDia = bloques.filter(
        (b) =>
          b.diaSemana === -1 &&
          b.fechaEspecifica &&
          b.fechaEspecifica.toISOString().split("T")[0] === fechaStr &&
          !b.disponible
      );

      // Si hay bloqueo de día completo, saltar
      const bloqueoDiaCompleto = bloqueosDelDia.find(
        (b) => b.horaInicio === "00:00" && (b.horaFin === "23:59" || b.horaFin === "24:00")
      );
      if (bloqueoDiaCompleto) continue;

      // Generar slots de 1 hora dentro del horario base (12-19)
      const horasDisponibles: string[] = [];

      for (let h = HORA_INICIO; h < HORA_FIN; h++) {
        const horaStr = `${h.toString().padStart(2, "0")}:00`;
        const slotTime = new Date(`${fechaStr}T${horaStr}:00`);

        // Verificar bloqueo por rango de horas en esta fecha
        const bloqueadaPorRango = bloqueosDelDia.some((b) => {
          const [bhi] = b.horaInicio.split(":").map(Number);
          const [bhf] = b.horaFin.split(":").map(Number);
          return h >= bhi && h < bhf;
        });
        if (bloqueadaPorRango) continue;

        // Verificar bloqueo recurrente por rango de horas en este día de la semana
        const bloqueadaRecurrente = bloques.some((b) => {
          if (b.diaSemana !== diaSemana || b.disponible) return false;
          if (b.horaInicio === "00:00" && (b.horaFin === "23:59" || b.horaFin === "24:00")) return false; // ya manejado arriba
          const [bhi] = b.horaInicio.split(":").map(Number);
          const [bhf] = b.horaFin.split(":").map(Number);
          return h >= bhi && h < bhf;
        });
        if (bloqueadaRecurrente) continue;

        // Verificar que no esté ocupada por otra videollamada
        const ocupada = ocupadas.some((o) => {
          if (!o.fechaPropuesta) return false;
          const oTime = new Date(o.fechaPropuesta).getTime();
          const diff = Math.abs(slotTime.getTime() - oTime);
          return diff < (o.duracion || 30) * 60000;
        });
        if (ocupada) continue;

        horasDisponibles.push(horaStr);
      }

      if (horasDisponibles.length > 0) {
        slots.push({ fecha: fechaStr, horas: horasDisponibles });
      }
    }

    return NextResponse.json(slots);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
