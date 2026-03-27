import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/clases/[id]/contenido?email=xxx — devuelve el contenido solo si el usuario tiene acceso vigente
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const email = req.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido para verificar acceso" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verificar que el acceso existe y no ha expirado
    const acceso = await prisma.acceso.findFirst({
      where: {
        email: normalizedEmail,
        claseId: params.id,
        expiraAt: { gt: new Date() },
      },
    });

    if (!acceso) {
      return NextResponse.json(
        { error: "No tienes acceso a esta clase o tu acceso ha expirado" },
        { status: 403 }
      );
    }

    const clase = await prisma.clase.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        titulo: true,
        contenido: true,
      },
    });

    if (!clase) {
      return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      contenido: clase.contenido,
      expiraAt: acceso.expiraAt,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
