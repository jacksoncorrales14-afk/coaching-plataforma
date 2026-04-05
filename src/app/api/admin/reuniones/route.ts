import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody, createReunionSchema, updateReunionSchema, deleteByIdSchema } from "@/lib/validations";

// POST /api/admin/reuniones — crear reunion
export async function POST(req: NextRequest) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { data, error: valError } = parseBody(createReunionSchema, await req.json());
    if (valError) return valError;

    const reunion = await prisma.reunionPrograma.create({
      data: {
        programaId: data.programaId,
        titulo: data.titulo,
        descripcion: data.descripcion,
        fecha: new Date(data.fecha),
        enlace: data.enlace,
        videoUrl: data.videoUrl,
      },
    });

    return NextResponse.json(reunion, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// PUT /api/admin/reuniones — actualizar reunion
export async function PUT(req: NextRequest) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { data, error: valError } = parseBody(updateReunionSchema, await req.json());
    if (valError) return valError;

    const updateData: any = {};
    if (data.titulo !== undefined) updateData.titulo = data.titulo;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.fecha !== undefined) updateData.fecha = new Date(data.fecha);
    if (data.enlace !== undefined) updateData.enlace = data.enlace;
    if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl;

    const reunion = await prisma.reunionPrograma.update({
      where: { id: data.id },
      data: updateData,
    });

    return NextResponse.json(reunion);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE /api/admin/reuniones — eliminar reunion
export async function DELETE(req: NextRequest) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { data, error: valError } = parseBody(deleteByIdSchema, await req.json());
    if (valError) return valError;

    await prisma.reunionPrograma.delete({ where: { id: data.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
