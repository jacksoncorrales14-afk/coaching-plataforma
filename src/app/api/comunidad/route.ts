import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, comentarioSchema } from "@/lib/validations";

// GET /api/comunidad — listar comentarios con respuestas y reacciones
// Soporta filtros: ?tipo=programa&refId=PROGRAM_ID (default: tipo=comunidad, parentId=null)
export async function GET(req: NextRequest) {
  try {
    const tipo = req.nextUrl.searchParams.get("tipo") || "comunidad";
    const refId = req.nextUrl.searchParams.get("refId") || "general";

    const where: any = { parentId: null, tipo };
    if (tipo === "comunidad") {
      where.refId = "general";
    } else {
      where.refId = refId;
    }

    const comentarios = await prisma.comentario.findMany({
      where,
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
    const { data, error: valError } = parseBody(comentarioSchema, await req.json());
    if (valError) return valError;

    // Verificar acceso
    const membresia = await prisma.membresia.findFirst({
      where: { email: data.email, estado: "activa", expiraAt: { gt: new Date() } },
    });

    const acceso = await prisma.acceso.findFirst({
      where: { email: data.email, expiraAt: { gt: new Date() } },
    });

    if (!membresia && !acceso) {
      return NextResponse.json(
        { error: "Necesitas una membresia activa o un curso comprado para comentar" },
        { status: 403 }
      );
    }

    const comentario = await prisma.comentario.create({
      data: {
        email: data.email,
        nombre: data.nombre.trim(),
        avatar: data.avatar,
        contenido: data.contenido.trim(),
        tipo: data.tipo,
        refId: data.refId,
        parentId: data.parentId,
      },
      include: { reacciones: true, respuestas: { include: { reacciones: true } } },
    });

    return NextResponse.json(comentario, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
