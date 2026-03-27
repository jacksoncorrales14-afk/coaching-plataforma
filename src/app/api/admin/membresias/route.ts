import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/membresias — listar todas las membresías
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

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
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id, accion } = await req.json();

    if (accion === "cancelar") {
      const membresia = await prisma.membresia.update({
        where: { id },
        data: { estado: "cancelada", canceladaAt: new Date() },
      });
      return NextResponse.json(membresia);
    }

    if (accion === "reactivar") {
      const expiraAt = new Date();
      expiraAt.setDate(expiraAt.getDate() + 30);
      const membresia = await prisma.membresia.update({
        where: { id },
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
