import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/clases - listar clases publicadas (público) o todas (admin)
export async function GET(req: NextRequest) {
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
}

// POST /api/clases - crear clase (solo admin)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { titulo, descripcion, contenido, imagen, precio, categoria, publicada, orden } = body;

  if (!titulo || !descripcion) {
    return NextResponse.json(
      { error: "Titulo y descripcion son requeridos" },
      { status: 400 }
    );
  }

  const clase = await prisma.clase.create({
    data: {
      titulo,
      descripcion,
      contenido: contenido || "",
      imagen: imagen || "",
      precio: precio || 0,
      categoria: categoria || "General",
      publicada: publicada ?? false,
      orden: orden || 0,
      authorId: session.user.id,
    },
  });

  return NextResponse.json(clase, { status: 201 });
}
