import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, crearVideollamadaSchema } from "@/lib/validations";

// GET /api/videollamada?email=xxx — obtener solicitudes del estudiante
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const emailNorm = email.trim().toLowerCase();

    // Verificar membresía activa
    const membresia = await prisma.membresia.findFirst({
      where: { email: emailNorm, estado: "activa", expiraAt: { gt: new Date() } },
    });

    if (!membresia) {
      return NextResponse.json({ error: "Requiere membresía activa" }, { status: 403 });
    }

    const videollamadas = await prisma.videollamada.findMany({
      where: { email: emailNorm },
      orderBy: { createdAt: "desc" },
    });

    // Obtener config
    const config = await prisma.configPlataforma.findUnique({ where: { id: "config" } });

    return NextResponse.json({
      videollamadas,
      precio: config?.precioVideollamada ?? 50,
      activa: config?.videollamadaActiva ?? true,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/videollamada — crear solicitud
export async function POST(req: NextRequest) {
  try {
    const { data, error: valError } = parseBody(crearVideollamadaSchema, await req.json());
    if (valError) return valError;

    // Verificar membresía activa
    const membresia = await prisma.membresia.findFirst({
      where: { email: data.email, estado: "activa", expiraAt: { gt: new Date() } },
    });

    if (!membresia) {
      return NextResponse.json(
        { error: "Necesitas una membresía activa para solicitar una videollamada" },
        { status: 403 }
      );
    }

    // Verificar que no tenga una solicitud activa (no completada ni cancelada)
    const activa = await prisma.videollamada.findFirst({
      where: {
        email: data.email,
        estado: { notIn: ["completada", "cancelada"] },
      },
    });

    if (activa) {
      return NextResponse.json(
        { error: "Ya tienes una solicitud de videollamada en proceso" },
        { status: 400 }
      );
    }

    const videollamada = await prisma.videollamada.create({
      data: {
        email: data.email,
        nombre: data.nombre.trim(),
        mensaje: data.mensaje,
        fechaPropuesta: new Date(data.fechaPropuesta),
        estado: "pendiente_pago",
      },
    });

    // Crear notificación para admin
    const fechaStr = new Date(data.fechaPropuesta).toLocaleDateString("es", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
    try {
      await prisma.notificacion.create({
        data: {
          tipo: "solicitud_videollamada",
          mensaje: `${data.nombre.trim()} solicita videollamada para ${fechaStr}`,
          enlace: `/admin?seccion=videollamadas`,
          metadata: JSON.stringify({ email: data.email, videollamadaId: videollamada.id }),
        },
      });
    } catch { /* no bloquear si falla la notificación */ }

    return NextResponse.json(videollamada, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
