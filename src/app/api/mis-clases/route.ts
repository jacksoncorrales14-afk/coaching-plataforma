import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/mis-clases?email=xxx - obtener clases desbloqueadas por email
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    const accesos = await prisma.acceso.findMany({
      where: { email: email.trim().toLowerCase() },
      include: {
        clase: {
          select: {
            id: true,
            titulo: true,
            descripcion: true,
            imagen: true,
            categoria: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(accesos);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
