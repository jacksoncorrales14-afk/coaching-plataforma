import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/admin/videos — agregar video a un nivel
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { nivelId, titulo, url, duracion } = await req.json();
    if (!nivelId || !titulo) {
      return NextResponse.json({ error: "nivelId y titulo requeridos" }, { status: 400 });
    }

    const count = await prisma.video.count({ where: { nivelId } });

    const video = await prisma.video.create({
      data: {
        titulo,
        url: url || "",
        duracion: duracion || 0,
        orden: count,
        nivelId,
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
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await req.json();
    await prisma.video.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
