import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/tareas — marcar tarea como completada (toggle)
export async function POST(req: NextRequest) {
  try {
    const { email, tareaId, nota } = await req.json();

    if (!email || !tareaId) {
      return NextResponse.json({ error: "Email y tareaId requeridos" }, { status: 400 });
    }

    const emailNorm = email.trim().toLowerCase();

    // Toggle: si ya existe, eliminar; si no, crear
    const existente = await prisma.tareaCompletada.findUnique({
      where: { email_tareaId: { email: emailNorm, tareaId } },
    });

    if (existente) {
      await prisma.tareaCompletada.delete({ where: { id: existente.id } });
      return NextResponse.json({ completada: false });
    }

    await prisma.tareaCompletada.create({
      data: {
        email: emailNorm,
        tareaId,
        nota: nota || "",
      },
    });

    return NextResponse.json({ completada: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
