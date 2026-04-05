import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody, createProgramaSchema, updateProgramaSchema, deleteByIdSchema } from "@/lib/validations";

// GET /api/admin/programas — listar programas con niveles y videos
export async function GET() {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

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
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { data, error: valError } = parseBody(createProgramaSchema, await req.json());
    if (valError) return valError;

    const programa = await prisma.programa.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        imagen: data.imagen,
        imagenPos: data.imagenPos,
        publicado: false,
        niveles: {
          create: data.niveles.map((nivel: any, i: number) => ({
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
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { data, error: valError } = parseBody(updateProgramaSchema, await req.json());
    if (valError) return valError;

    const programa = await prisma.programa.update({
      where: { id: data.id },
      data: { titulo: data.titulo, descripcion: data.descripcion, imagen: data.imagen, imagenPos: data.imagenPos, precio: data.precio, publicado: data.publicado, foroNombre: data.foroNombre },
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
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { data, error: valError } = parseBody(deleteByIdSchema, await req.json());
    if (valError) return valError;

    await prisma.programa.delete({ where: { id: data.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
