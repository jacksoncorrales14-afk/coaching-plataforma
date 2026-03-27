import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/reacciones — toggle reacción
export async function POST(req: NextRequest) {
  try {
    const { email, comentarioId, tipo } = await req.json();

    if (!email || !comentarioId) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const emailNorm = email.trim().toLowerCase();
    const tipoReaccion = tipo || "corazon";

    // Toggle: si ya existe, eliminar; si no, crear
    const existente = await prisma.reaccion.findUnique({
      where: { email_comentarioId: { email: emailNorm, comentarioId } },
    });

    if (existente) {
      await prisma.reaccion.delete({ where: { id: existente.id } });
      return NextResponse.json({ accion: "eliminada" });
    }

    await prisma.reaccion.create({
      data: { email: emailNorm, tipo: tipoReaccion, comentarioId },
    });

    return NextResponse.json({ accion: "creada" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
