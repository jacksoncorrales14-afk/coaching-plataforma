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
        mediaUrl: data.mediaUrl,
        mediaTipo: data.mediaTipo,
        tipo: data.tipo,
        refId: data.refId,
        parentId: data.parentId,
      },
      include: { reacciones: true, respuestas: { include: { reacciones: true } } },
    });

    // Crear notificación para admin
    const notiTipo = data.tipo === "programa" ? "comentario_programa" : "comentario_comunidad";
    const preview = data.contenido.trim().slice(0, 80);
    try {
      await prisma.notificacion.create({
        data: {
          tipo: notiTipo as any,
          mensaje: `${data.nombre.trim()}: "${preview}${data.contenido.length > 80 ? "..." : ""}"`,
          enlace: data.tipo === "programa" ? `/admin?seccion=comunidad` : `/admin?seccion=comunidad`,
          metadata: JSON.stringify({ email: data.email, tipo: data.tipo, refId: data.refId }),
        },
      });
    } catch { /* no bloquear si falla la notificación */ }

    return NextResponse.json(comentario, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
