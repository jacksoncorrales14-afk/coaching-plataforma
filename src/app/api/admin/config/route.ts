import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody, configPlataformaSchema } from "@/lib/validations";

// GET /api/admin/config — obtener configuración
export async function GET() {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    let config = await prisma.configPlataforma.findUnique({ where: { id: "config" } });
    if (!config) {
      config = await prisma.configPlataforma.create({ data: { id: "config" } });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// PUT /api/admin/config — actualizar configuración
export async function PUT(req: NextRequest) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { data, error: valError } = parseBody(configPlataformaSchema, await req.json());
    if (valError) return valError;

    const config = await prisma.configPlataforma.upsert({
      where: { id: "config" },
      update: {
        ...(data.precioVideollamada !== undefined && { precioVideollamada: data.precioVideollamada }),
        ...(data.videollamadaActiva !== undefined && { videollamadaActiva: data.videollamadaActiva }),
      },
      create: {
        id: "config",
        precioVideollamada: data.precioVideollamada ?? 50,
        videollamadaActiva: data.videollamadaActiva ?? true,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
