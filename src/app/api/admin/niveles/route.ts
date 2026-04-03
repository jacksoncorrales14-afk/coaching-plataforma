import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody, createNivelSchema, deleteByIdSchema } from "@/lib/validations";

// POST /api/admin/niveles — agregar nivel a un programa
export async function POST(req: NextRequest) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { data, error: valError } = parseBody(createNivelSchema, await req.json());
    if (valError) return valError;

    const count = await prisma.nivel.count({ where: { programaId: data.programaId } });

    const nivel = await prisma.nivel.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        orden: count,
        programaId: data.programaId,
      },
      include: { videos: true },
    });

    return NextResponse.json(nivel, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE /api/admin/niveles — eliminar nivel
export async function DELETE(req: NextRequest) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { data, error: valError } = parseBody(deleteByIdSchema, await req.json());
    if (valError) return valError;

    await prisma.nivel.delete({ where: { id: data.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
