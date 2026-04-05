import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody, deleteByIdSchema, comentarioAdminSchema } from "@/lib/validations";

// GET /api/admin/comentarios — listar todos los comentarios
export async function GET() {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const comentarios = await prisma.comentario.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(comentarios);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/admin/comentarios — crear comentario como admin (con esAdmin=true)
export async function POST(req: NextRequest) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const session = await getServerSession(authOptions);
    const adminEmail = session?.user?.email || "";
    const adminNombre = session?.user?.name || "Coach";

    const { data, error: valError } = parseBody(comentarioAdminSchema, await req.json());
    if (valError) return valError;

    const comentario = await prisma.comentario.create({
      data: {
        email: adminEmail,
        nombre: adminNombre,
        avatar: "",
        contenido: data.contenido.trim(),
        mediaUrl: data.mediaUrl,
        mediaTipo: data.mediaTipo,
        esAdmin: true,
        tipo: data.tipo,
        refId: data.refId,
        parentId: data.parentId,
      },
      include: { reacciones: true, respuestas: { include: { reacciones: true } } },
    });

    return NextResponse.json(comentario, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE /api/admin/comentarios — eliminar comentario
export async function DELETE(req: NextRequest) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { data, error: valError } = parseBody(deleteByIdSchema, await req.json());
    if (valError) return valError;

    await prisma.comentario.delete({ where: { id: data.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
