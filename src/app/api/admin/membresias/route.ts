import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody, adminMembresiaSchema } from "@/lib/validations";

// GET /api/admin/membresias — listar todas las membresías
export async function GET() {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const membresias = await prisma.membresia.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(membresias);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// PUT /api/admin/membresias — cancelar membresía
export async function PUT(req: NextRequest) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { data, error: valError } = parseBody(adminMembresiaSchema, await req.json());
    if (valError) return valError;

    if (data.accion === "cancelar") {
      const membresia = await prisma.membresia.update({
        where: { id: data.id },
        data: { estado: "cancelada", canceladaAt: new Date() },
      });
      return NextResponse.json(membresia);
    }

    if (data.accion === "reactivar") {
      const expiraAt = new Date();
      expiraAt.setDate(expiraAt.getDate() + 30);
      const membresia = await prisma.membresia.update({
        where: { id: data.id },
        data: { estado: "activa", canceladaAt: null, expiraAt },
      });
      return NextResponse.json(membresia);
    }

    return NextResponse.json({ error: "Accion no valida" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
