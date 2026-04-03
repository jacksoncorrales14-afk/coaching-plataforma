import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody, bloqueHorarioSchema, deleteByIdSchema } from "@/lib/validations";

// GET /api/admin/disponibilidad — listar bloques de horario
export async function GET() {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const bloques = await prisma.bloqueHorario.findMany({
      orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
    });

    return NextResponse.json(bloques);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/admin/disponibilidad — crear bloque
export async function POST(req: NextRequest) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { data, error: valError } = parseBody(bloqueHorarioSchema, await req.json());
    if (valError) return valError;

    const bloque = await prisma.bloqueHorario.create({
      data: {
        diaSemana: data.diaSemana,
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        disponible: data.disponible,
        fechaEspecifica: data.fechaEspecifica ? new Date(data.fechaEspecifica) : null,
      },
    });

    return NextResponse.json(bloque, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE /api/admin/disponibilidad — eliminar bloque
export async function DELETE(req: NextRequest) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { data, error: valError } = parseBody(deleteByIdSchema, await req.json());
    if (valError) return valError;

    await prisma.bloqueHorario.delete({ where: { id: data.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
