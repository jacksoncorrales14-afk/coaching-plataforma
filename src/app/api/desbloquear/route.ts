import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, desbloquearSchema } from "@/lib/validations";

// POST /api/desbloquear - canjear un código
export async function POST(req: NextRequest) {
  try {
    const { data, error: valError } = parseBody(desbloquearSchema, await req.json());
    if (valError) return valError;

    const codigoNormalizado = data.codigo.trim().toUpperCase();

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

    // Calcular expiración: 30 días desde ahora
    const expiraAt = new Date();
    expiraAt.setDate(expiraAt.getDate() + 30);

    // Crear acceso y marcar código como usado en una transacción
    const acceso = await prisma.$transaction(async (tx) => {
      await tx.codigo.update({
        where: { id: codigoRecord.id },
        data: {
          usado: true,
          usadoPor: data.email,
          usadoAt: new Date(),
        },
      });

      return tx.acceso.create({
        data: {
          email: data.email,
          nombre: data.nombre.trim(),
          claseId: codigoRecord.claseId,
          codigoId: codigoRecord.id,
          expiraAt,
        },
        include: { clase: true },
      });
    });

    return NextResponse.json({
      mensaje: "Clase desbloqueada exitosamente!",
      acceso: {
        id: acceso.id,
        expiraAt: acceso.expiraAt,
        clase: {
          id: acceso.clase.id,
          titulo: acceso.clase.titulo,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
