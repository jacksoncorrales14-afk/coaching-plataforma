import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/programas/[id]/reuniones?email=xxx — listar reuniones del programa
// Requiere que el usuario tenga acceso al programa (membresia o compra individual)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const emailNorm = email.trim().toLowerCase();

    // Verificar acceso al programa
    const [membresia, accesoPrograma, programa] = await Promise.all([
      prisma.membresia.findFirst({
        where: { email: emailNorm, estado: "activa", expiraAt: { gt: new Date() } },
      }),
      prisma.accesoPrograma.findUnique({
        where: { email_programaId: { email: emailNorm, programaId: params.id } },
      }),
      prisma.programa.findUnique({ where: { id: params.id } }),
    ]);

    if (!programa || !programa.publicado) {
      return NextResponse.json({ error: "Programa no encontrado" }, { status: 404 });
    }

    if (!membresia && !accesoPrograma) {
      return NextResponse.json({ error: "Sin acceso al programa" }, { status: 403 });
    }

    const reuniones = await prisma.reunionPrograma.findMany({
      where: { programaId: params.id },
      orderBy: { fecha: "desc" },
    });

    return NextResponse.json(reuniones);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
