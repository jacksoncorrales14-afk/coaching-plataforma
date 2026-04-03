import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody, createVideoSchema, deleteByIdSchema } from "@/lib/validations";

// POST /api/admin/videos — agregar video a un nivel
export async function POST(req: NextRequest) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { data, error: valError } = parseBody(createVideoSchema, await req.json());
    if (valError) return valError;

    const count = await prisma.video.count({ where: { nivelId: data.nivelId } });

    const video = await prisma.video.create({
      data: {
        titulo: data.titulo,
        url: data.url,
        duracion: data.duracion,
        orden: count,
        nivelId: data.nivelId,
      },
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE /api/admin/videos — eliminar video
export async function DELETE(req: NextRequest) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { data, error: valError } = parseBody(deleteByIdSchema, await req.json());
    if (valError) return valError;

    await prisma.video.delete({ where: { id: data.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
