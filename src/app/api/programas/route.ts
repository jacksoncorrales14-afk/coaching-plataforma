import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/programas — listar programas publicados con niveles
export async function GET() {
  try {
    const programas = await prisma.programa.findMany({
      where: { publicado: true },
      orderBy: { orden: "asc" },
      include: {
        niveles: {
          orderBy: { orden: "asc" },
          include: {
            _count: { select: { videos: true } },
          },
        },
      },
    });

    return NextResponse.json(programas);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
