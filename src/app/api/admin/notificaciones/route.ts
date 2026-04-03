import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody, marcarLeidaSchema } from "@/lib/validations";

// GET /api/admin/notificaciones — listar notificaciones
export async function GET() {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const notificaciones = await prisma.notificacion.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const noLeidas = await prisma.notificacion.count({ where: { leida: false } });

    return NextResponse.json({ notificaciones, noLeidas });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// PUT /api/admin/notificaciones — marcar como leída
export async function PUT(req: NextRequest) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { data, error: valError } = parseBody(marcarLeidaSchema, await req.json());
    if (valError) return valError;

    if (data.todas) {
      await prisma.notificacion.updateMany({
        where: { leida: false },
        data: { leida: true },
      });
    } else if (data.id) {
      await prisma.notificacion.update({
        where: { id: data.id },
        data: { leida: true },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
