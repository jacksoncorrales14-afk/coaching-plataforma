import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/clases/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const clase = await prisma.clase.findUnique({
    where: { id: params.id },
    include: {
      codigos: true,
      accesos: true,
    },
  });

  if (!clase) {
    return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
  }

  return NextResponse.json(clase);
}

// PUT /api/clases/[id] - actualizar clase (solo admin)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  const clase = await prisma.clase.update({
    where: { id: params.id },
    data: {
      titulo: body.titulo,
      descripcion: body.descripcion,
      contenido: body.contenido,
      imagen: body.imagen,
      precio: body.precio,
      categoria: body.categoria,
      publicada: body.publicada,
      orden: body.orden,
    },
  });

  return NextResponse.json(clase);
}

// DELETE /api/clases/[id] - eliminar clase (solo admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await prisma.clase.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
