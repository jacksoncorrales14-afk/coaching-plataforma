import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generarCodigo } from "@/lib/codigos";

// GET /api/codigos?claseId=xxx - listar códigos de una clase (solo admin)
export async function GET(req: NextRequest) {
  try {
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
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/codigos - generar códigos (solo admin)
export async function POST(req: NextRequest) {
  try {
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

    // Generar códigos únicos en batch
    const codigosSet = new Set<string>();
    while (codigosSet.size < cant) {
      codigosSet.add(generarCodigo());
    }

    // Verificar que ninguno exista en la DB en una sola query
    const candidatos = Array.from(codigosSet);
    const existentes = await prisma.codigo.findMany({
      where: { codigo: { in: candidatos } },
      select: { codigo: true },
    });
    const existentesSet = new Set(existentes.map((e) => e.codigo));

    // Reemplazar duplicados
    const codigosFinales: string[] = [];
    for (const c of candidatos) {
      if (!existentesSet.has(c)) {
        codigosFinales.push(c);
      } else {
        // Generar reemplazo
        let nuevo = generarCodigo();
        while (existentesSet.has(nuevo) || codigosFinales.includes(nuevo)) {
          nuevo = generarCodigo();
        }
        codigosFinales.push(nuevo);
      }
    }

    // Crear todos en una sola transacción
    const codigos = await prisma.$transaction(
      codigosFinales.map((codigo) =>
        prisma.codigo.create({ data: { codigo, claseId } })
      )
    );

    return NextResponse.json(codigos, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
