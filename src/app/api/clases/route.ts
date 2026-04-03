import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody, createClaseSchema } from "@/lib/validations";

// GET /api/clases - listar clases publicadas (público) o todas (admin)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === "admin";

    const clases = await prisma.clase.findMany({
      where: isAdmin ? {} : { publicada: true },
      orderBy: { orden: "asc" },
      include: {
        _count: {
          select: { codigos: true, accesos: true },
        },
      },
    });

    return NextResponse.json(clases);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/clases - crear clase (solo admin)
export async function POST(req: NextRequest) {
  try {
    const { session, error: authError } = await requireAdmin();
    if (authError) return authError;

    const { data, error: valError } = parseBody(createClaseSchema, await req.json());
    if (valError) return valError;

    const clase = await prisma.clase.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        contenido: data.contenido,
        imagen: data.imagen,
        precio: data.precio,
        categoria: data.categoria,
        publicada: data.publicada,
        orden: data.orden,
        authorId: session.user.id,
      },
    });

    return NextResponse.json(clase, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
