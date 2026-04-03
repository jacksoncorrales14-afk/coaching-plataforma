import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody, adminVideollamadaSchema, deleteByIdSchema } from "@/lib/validations";
import { enviarConfirmacionVideollamada } from "@/lib/email";

// GET /api/admin/videollamadas — listar todas
export async function GET() {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const videollamadas = await prisma.videollamada.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(videollamadas);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// PUT /api/admin/videollamadas — cambiar estado
export async function PUT(req: NextRequest) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { data, error: valError } = parseBody(adminVideollamadaSchema, await req.json());
    if (valError) return valError;

    const videollamada = await prisma.videollamada.findUnique({
      where: { id: data.id },
    });

    if (!videollamada) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    if (data.accion === "marcar_pagada") {
      const updated = await prisma.videollamada.update({
        where: { id: data.id },
        data: { estado: "pagada" },
      });
      return NextResponse.json(updated);
    }

    if (data.accion === "confirmar") {
      if (!data.fechaConfirmada || !data.enlace) {
        return NextResponse.json(
          { error: "Fecha confirmada y enlace son requeridos" },
          { status: 400 }
        );
      }
      const updated = await prisma.videollamada.update({
        where: { id: data.id },
        data: {
          estado: "confirmada",
          fechaConfirmada: new Date(data.fechaConfirmada),
          enlace: data.enlace,
          notasAdmin: data.notasAdmin || "",
        },
      });

      // Enviar email de confirmación
      try {
        await enviarConfirmacionVideollamada(
          videollamada.email,
          videollamada.nombre,
          new Date(data.fechaConfirmada),
          data.enlace,
          videollamada.duracion
        );
      } catch (emailError) {
        console.error("Error enviando email de confirmación:", emailError);
      }

      return NextResponse.json(updated);
    }

    if (data.accion === "completar") {
      const updated = await prisma.videollamada.update({
        where: { id: data.id },
        data: { estado: "completada", notasAdmin: data.notasAdmin || videollamada.notasAdmin },
      });
      return NextResponse.json(updated);
    }

    if (data.accion === "cancelar") {
      const updated = await prisma.videollamada.update({
        where: { id: data.id },
        data: { estado: "cancelada", notasAdmin: data.notasAdmin || videollamada.notasAdmin },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE /api/admin/videollamadas — eliminar solicitud
export async function DELETE(req: NextRequest) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { data, error: valError } = parseBody(deleteByIdSchema, await req.json());
    if (valError) return valError;

    await prisma.videollamada.delete({ where: { id: data.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
