import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, reaccionSchema } from "@/lib/validations";

// POST /api/reacciones — toggle reacción
export async function POST(req: NextRequest) {
  try {
    const { data, error: valError } = parseBody(reaccionSchema, await req.json());
    if (valError) return valError;

    // Toggle: si ya existe, eliminar; si no, crear
    const existente = await prisma.reaccion.findUnique({
      where: { email_comentarioId: { email: data.email, comentarioId: data.comentarioId } },
    });

    if (existente) {
      await prisma.reaccion.delete({ where: { id: existente.id } });
      return NextResponse.json({ accion: "eliminada" });
    }

    await prisma.reaccion.create({
      data: { email: data.email, tipo: data.tipo, comentarioId: data.comentarioId },
    });

    return NextResponse.json({ accion: "creada" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
