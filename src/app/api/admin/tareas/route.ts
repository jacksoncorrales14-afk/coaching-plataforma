import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody, createTareaSchema, deleteByIdSchema } from "@/lib/validations";

// POST /api/admin/tareas — crear tarea para un video
export async function POST(req: NextRequest) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { data, error: valError } = parseBody(createTareaSchema, await req.json());
    if (valError) return valError;

    const count = await prisma.tarea.count({ where: { videoId: data.videoId } });

    const tarea = await prisma.tarea.create({
      data: {
        videoId: data.videoId,
        titulo: data.titulo,
        descripcion: data.descripcion,
        orden: count,
      },
    });

    return NextResponse.json(tarea, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE /api/admin/tareas — eliminar tarea
export async function DELETE(req: NextRequest) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { data, error: valError } = parseBody(deleteByIdSchema, await req.json());
    if (valError) return valError;

    await prisma.tarea.delete({ where: { id: data.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
