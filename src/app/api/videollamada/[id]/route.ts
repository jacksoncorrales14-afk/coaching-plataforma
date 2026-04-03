import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, proponerFechaSchema } from "@/lib/validations";

// PUT /api/videollamada/[id] — proponer fecha (estudiante)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error: valError } = parseBody(proponerFechaSchema, await req.json());
    if (valError) return valError;

    const videollamada = await prisma.videollamada.findUnique({
      where: { id: params.id },
    });

    if (!videollamada) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    if (videollamada.estado !== "pagada") {
      return NextResponse.json(
        { error: "Solo puedes proponer fecha cuando el pago esté confirmado" },
        { status: 400 }
      );
    }

    const updated = await prisma.videollamada.update({
      where: { id: params.id },
      data: {
        fechaPropuesta: new Date(data.fechaPropuesta),
        mensaje: data.mensaje || videollamada.mensaje,
        estado: "agendada",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
