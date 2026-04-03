import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, toggleTareaSchema } from "@/lib/validations";

// POST /api/tareas — marcar tarea como completada (toggle)
export async function POST(req: NextRequest) {
  try {
    const { data, error: valError } = parseBody(toggleTareaSchema, await req.json());
    if (valError) return valError;

    // Toggle: si ya existe, eliminar; si no, crear
    const existente = await prisma.tareaCompletada.findUnique({
      where: { email_tareaId: { email: data.email, tareaId: data.tareaId } },
    });

    if (existente) {
      await prisma.tareaCompletada.delete({ where: { id: existente.id } });
      return NextResponse.json({ completada: false });
    }

    await prisma.tareaCompletada.create({
      data: {
        email: data.email,
        tareaId: data.tareaId,
        nota: data.nota,
      },
    });

    return NextResponse.json({ completada: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
