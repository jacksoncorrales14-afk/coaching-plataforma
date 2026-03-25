import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generarCodigo } from "@/lib/codigos";

// GET /api/codigos?claseId=xxx - listar códigos de una clase (solo admin)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const claseId = req.nextUrl.searchParams.get("claseId");

  const codigos = await prisma.codigo.findMany({
    where: claseId ? { claseId } : {},
    include: { clase: { select: { titulo: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(codigos);
}

// POST /api/codigos - generar códigos (solo admin)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { claseId, cantidad } = await req.json();

  if (!claseId) {
    return NextResponse.json(
      { error: "claseId es requerido" },
      { status: 400 }
    );
  }

  const cant = Math.min(Math.max(cantidad || 1, 1), 50);
  const codigos = [];

  for (let i = 0; i < cant; i++) {
    let codigo = generarCodigo();
    // Asegurar unicidad
    while (await prisma.codigo.findUnique({ where: { codigo } })) {
      codigo = generarCodigo();
    }
    const created = await prisma.codigo.create({
      data: { codigo, claseId },
    });
    codigos.push(created);
  }

  return NextResponse.json(codigos, { status: 201 });
}
