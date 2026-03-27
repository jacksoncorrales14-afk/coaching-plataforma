import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/programas — listar programas con niveles y videos
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const programas = await prisma.programa.findMany({
      orderBy: { orden: "asc" },
      include: {
        niveles: {
          orderBy: { orden: "asc" },
          include: {
            videos: {
              orderBy: { orden: "asc" },
              include: { tareas: { orderBy: { orden: "asc" } } },
            },
          },
        },
      },
    });

    return NextResponse.json(programas);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/admin/programas — crear programa
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { titulo, descripcion, imagen, imagenPos, niveles } = await req.json();

    if (!titulo) {
      return NextResponse.json({ error: "Titulo es requerido" }, { status: 400 });
    }

    const programa = await prisma.programa.create({
      data: {
        titulo,
        descripcion: descripcion || "",
        imagen: imagen || "",
        imagenPos: imagenPos || "50% 50%",
        publicado: false,
        niveles: {
          create: (niveles || []).map((nivel: any, i: number) => ({
            titulo: nivel.titulo || `Nivel ${i + 1}`,
            descripcion: nivel.descripcion || "",
            orden: i,
            videos: {
              create: (nivel.videos || []).map((video: any, j: number) => ({
                titulo: video.titulo || `Video ${j + 1}`,
                url: video.url || "",
                duracion: video.duracion || 0,
                orden: j,
              })),
            },
          })),
        },
      },
      include: {
        niveles: { include: { videos: true } },
      },
    });

    return NextResponse.json(programa, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// PUT /api/admin/programas — actualizar programa
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id, titulo, descripcion, imagen, imagenPos, precio, publicado } = await req.json();

    const programa = await prisma.programa.update({
      where: { id },
      data: { titulo, descripcion, imagen, imagenPos, precio, publicado },
    });

    return NextResponse.json(programa);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE /api/admin/programas — eliminar programa
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await req.json();
    await prisma.programa.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
