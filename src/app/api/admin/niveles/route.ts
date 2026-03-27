import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/admin/niveles — agregar nivel a un programa
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { programaId, titulo, descripcion } = await req.json();
    if (!programaId || !titulo) {
      return NextResponse.json({ error: "programaId y titulo requeridos" }, { status: 400 });
    }

    const count = await prisma.nivel.count({ where: { programaId } });

    const nivel = await prisma.nivel.create({
      data: {
        titulo,
        descripcion: descripcion || "",
        orden: count,
        programaId,
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
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await req.json();
    await prisma.nivel.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
