import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/admin/tareas — crear tarea para un video
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { videoId, titulo, descripcion } = await req.json();
    if (!videoId || !titulo) {
      return NextResponse.json({ error: "videoId y titulo requeridos" }, { status: 400 });
    }

    const count = await prisma.tarea.count({ where: { videoId } });

    const tarea = await prisma.tarea.create({
      data: {
        videoId,
        titulo,
        descripcion: descripcion || "",
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
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await req.json();
    await prisma.tarea.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
