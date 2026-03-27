import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/comunidad — listar comentarios con respuestas y reacciones
export async function GET() {
  try {
    const comentarios = await prisma.comentario.findMany({
      where: { tipo: "comunidad", parentId: null },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        reacciones: true,
        respuestas: {
          orderBy: { createdAt: "asc" },
          include: { reacciones: true },
        },
      },
    });

    return NextResponse.json(comentarios);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/comunidad — crear comentario o respuesta
export async function POST(req: NextRequest) {
  try {
    const { email, nombre, avatar, contenido, tipo, refId, parentId } = await req.json();

    if (!email || !nombre || !contenido) {
      return NextResponse.json(
        { error: "Email, nombre y contenido son requeridos" },
        { status: 400 }
      );
    }

    const emailNorm = email.trim().toLowerCase();

    // Verificar acceso
    const membresia = await prisma.membresia.findFirst({
      where: { email: emailNorm, estado: "activa", expiraAt: { gt: new Date() } },
    });

    const acceso = await prisma.acceso.findFirst({
      where: { email: emailNorm, expiraAt: { gt: new Date() } },
    });

    if (!membresia && !acceso) {
      return NextResponse.json(
        { error: "Necesitas una membresia activa o un curso comprado para comentar" },
        { status: 403 }
      );
    }

    const comentario = await prisma.comentario.create({
      data: {
        email: emailNorm,
        nombre: nombre.trim(),
        avatar: avatar || "",
        contenido: contenido.trim(),
        tipo: tipo || "comunidad",
        refId: refId || "general",
        parentId: parentId || null,
      },
      include: { reacciones: true, respuestas: { include: { reacciones: true } } },
    });

    return NextResponse.json(comentario, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
