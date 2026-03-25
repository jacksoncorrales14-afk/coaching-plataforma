import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/desbloquear - canjear un código
export async function POST(req: NextRequest) {
  const { codigo, email, nombre } = await req.json();

  if (!codigo || !email || !nombre) {
    return NextResponse.json(
      { error: "Codigo, email y nombre son requeridos" },
      { status: 400 }
    );
  }

  const codigoNormalizado = codigo.trim().toUpperCase();

  const codigoRecord = await prisma.codigo.findUnique({
    where: { codigo: codigoNormalizado },
    include: { clase: true },
  });

  if (!codigoRecord) {
    return NextResponse.json(
      { error: "Codigo no valido. Verifica e intenta de nuevo." },
      { status: 404 }
    );
  }

  if (codigoRecord.usado) {
    return NextResponse.json(
      { error: "Este codigo ya fue utilizado." },
      { status: 400 }
    );
  }

  // Crear acceso y marcar código como usado en una transacción
  const acceso = await prisma.$transaction(async (tx) => {
    await tx.codigo.update({
      where: { id: codigoRecord.id },
      data: {
        usado: true,
        usadoPor: email,
        usadoAt: new Date(),
      },
    });

    return tx.acceso.create({
      data: {
        email: email.trim().toLowerCase(),
        nombre: nombre.trim(),
        claseId: codigoRecord.claseId,
        codigoId: codigoRecord.id,
      },
      include: { clase: true },
    });
  });

  return NextResponse.json({
    mensaje: "Clase desbloqueada exitosamente!",
    acceso: {
      id: acceso.id,
      clase: {
        id: acceso.clase.id,
        titulo: acceso.clase.titulo,
      },
    },
  });
}
