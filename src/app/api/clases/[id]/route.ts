import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody, updateClaseSchema } from "@/lib/validations";

// GET /api/clases/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === "admin";

    const clase = await prisma.clase.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        imagen: true,
        precio: true,
        categoria: true,
        publicada: true,
        orden: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
        // Solo el admin ve los códigos y accesos
        ...(isAdmin
          ? {
              contenido: true,
              codigos: true,
              accesos: true,
            }
          : {
              // El público NO recibe el contenido ni los códigos
              contenido: false,
            }),
      },
    });

    if (!clase) {
      return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
    }

    // Si no es admin y la clase no está publicada, denegar acceso
    if (!isAdmin && !clase.publicada) {
      return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
    }

    return NextResponse.json(clase);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// GET /api/clases/[id]/contenido — acceso verificado al contenido
// (Este endpoint se maneja en la subcarpeta contenido/route.ts)

// PUT /api/clases/[id] - actualizar clase (solo admin)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { data, error: valError } = parseBody(updateClaseSchema, await req.json());
    if (valError) return valError;

    const clase = await prisma.clase.update({
      where: { id: params.id },
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        contenido: data.contenido,
        imagen: data.imagen,
        precio: data.precio,
        categoria: data.categoria,
        publicada: data.publicada,
        orden: data.orden,
      },
    });

    return NextResponse.json(clase);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE /api/clases/[id] - eliminar clase (solo admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    await prisma.clase.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
