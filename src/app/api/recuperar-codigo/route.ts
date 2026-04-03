import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, recuperarCodigoSchema } from "@/lib/validations";
import { enviarCodigosAcceso } from "@/lib/email";

// POST /api/recuperar-codigo — enviar codigos activos al email del estudiante
export async function POST(req: NextRequest) {
  try {
    const { data, error: valError } = parseBody(
      recuperarCodigoSchema,
      await req.json()
    );
    if (valError) return valError;

    // Buscar accesos activos (no expirados) con sus codigos y clases
    const accesos = await prisma.acceso.findMany({
      where: {
        email: data.email,
        expiraAt: { gt: new Date() },
      },
      include: {
        codigo: { select: { codigo: true } },
        clase: { select: { titulo: true } },
      },
    });

    // Buscar membresia activa
    const membresia = await prisma.membresia.findFirst({
      where: {
        email: data.email,
        estado: "activa",
        expiraAt: { gt: new Date() },
      },
    });

    // Si no tiene nada activo, no enviar email pero no revelar info
    if (accesos.length === 0 && !membresia) {
      // Retornar ok por seguridad (no revelar si el email existe)
      return NextResponse.json({
        ok: true,
        mensaje:
          "Si tienes acceso activo, recibiras un correo con tus codigos.",
      });
    }

    // Preparar lista de codigos
    const codigos = accesos.map((a) => ({
      codigo: a.codigo.codigo,
      clase: a.clase.titulo,
      expiraAt: a.expiraAt.toISOString(),
    }));

    // Enviar email
    await enviarCodigosAcceso(
      data.email,
      codigos,
      !!membresia,
      membresia?.plan,
      membresia?.expiraAt?.toISOString()
    );

    return NextResponse.json({
      ok: true,
      mensaje:
        "Si tienes acceso activo, recibiras un correo con tus codigos.",
    });
  } catch (error) {
    console.error("Error en recuperar-codigo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
