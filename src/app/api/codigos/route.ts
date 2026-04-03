import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generarCodigo } from "@/lib/codigos";
import { parseBody, generarCodigosSchema } from "@/lib/validations";

// GET /api/codigos?claseId=xxx - listar códigos de una clase (solo admin)
export async function GET(req: NextRequest) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

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
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { data, error: valError } = parseBody(generarCodigosSchema, await req.json());
    if (valError) return valError;

    // Generar códigos únicos en batch
    const codigosSet = new Set<string>();
    while (codigosSet.size < data.cantidad) {
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
        prisma.codigo.create({ data: { codigo, claseId: data.claseId } })
      )
    );

    return NextResponse.json(codigos, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
