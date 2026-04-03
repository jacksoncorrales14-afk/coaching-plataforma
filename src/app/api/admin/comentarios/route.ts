import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody, deleteByIdSchema } from "@/lib/validations";

// GET /api/admin/comentarios — listar todos los comentarios
export async function GET() {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const comentarios = await prisma.comentario.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(comentarios);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE /api/admin/comentarios — eliminar comentario
export async function DELETE(req: NextRequest) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { data, error: valError } = parseBody(deleteByIdSchema, await req.json());
    if (valError) return valError;

    await prisma.comentario.delete({ where: { id: data.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
