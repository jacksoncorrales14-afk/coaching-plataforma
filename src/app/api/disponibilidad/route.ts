import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/disponibilidad — horarios disponibles (próximos 30 días)
export async function GET() {
  try {
    // Obtener bloques de disponibilidad configurados
    const bloques = await prisma.bloqueHorario.findMany();

    // Obtener videollamadas agendadas/confirmadas (ocupadas)
    const ahora = new Date();
    const en30Dias = new Date(ahora.getTime() + 30 * 86400000);

    const ocupadas = await prisma.videollamada.findMany({
      where: {
        estado: { in: ["agendada", "confirmada", "pendiente_pago", "pagada"] },
        fechaPropuesta: { gte: ahora, lte: en30Dias },
      },
      select: { fechaPropuesta: true, duracion: true },
    });

    // Generar slots disponibles para los próximos 30 días
    const slots: { fecha: string; horas: string[] }[] = [];

    for (let d = 1; d <= 30; d++) {
      const dia = new Date(ahora.getTime() + d * 86400000);
      const diaSemana = dia.getDay(); // 0-6
      const fechaStr = dia.toISOString().split("T")[0]; // YYYY-MM-DD

      // Buscar bloqueos específicos para este día
      const bloqueosDelDia = bloques.filter(
        (b) =>
          b.diaSemana === -1 &&
          b.fechaEspecifica &&
          b.fechaEspecifica.toISOString().split("T")[0] === fechaStr &&
          !b.disponible
      );

      // Si hay bloqueo de día completo (00:00-23:59), saltar
      const bloqueoDiaCompleto = bloqueosDelDia.find(
        (b) => b.horaInicio === "00:00" && (b.horaFin === "23:59" || b.horaFin === "24:00")
      );
      if (bloqueoDiaCompleto) continue;

      // Buscar disponibilidad para este día de la semana
      const disponibilidadDia = bloques.filter(
        (b) => b.diaSemana === diaSemana && b.disponible
      );

      if (disponibilidadDia.length === 0) continue; // Sin horarios configurados

      // Generar slots de 1 hora dentro de los rangos disponibles
      const horasDisponibles: string[] = [];

      for (const bloque of disponibilidadDia) {
        const [hI, mI] = bloque.horaInicio.split(":").map(Number);
        const [hF] = bloque.horaFin.split(":").map(Number);

        for (let h = hI; h < hF; h++) {
          const horaStr = `${h.toString().padStart(2, "0")}:${(mI || 0).toString().padStart(2, "0")}`;
          const slotTime = new Date(`${fechaStr}T${horaStr}:00`);

          // Verificar que no esté bloqueada por rango de horas
          const bloqueadaPorRango = bloqueosDelDia.some((b) => {
            const [bhi] = b.horaInicio.split(":").map(Number);
            const [bhf] = b.horaFin.split(":").map(Number);
            return h >= bhi && h < bhf;
          });

          if (bloqueadaPorRango) continue;

          // Verificar que no esté ocupada por otra videollamada
          const ocupada = ocupadas.some((o) => {
            if (!o.fechaPropuesta) return false;
            const oTime = new Date(o.fechaPropuesta).getTime();
            const diff = Math.abs(slotTime.getTime() - oTime);
            return diff < (o.duracion || 30) * 60000;
          });

          if (!ocupada) {
            horasDisponibles.push(horaStr);
          }
        }
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
