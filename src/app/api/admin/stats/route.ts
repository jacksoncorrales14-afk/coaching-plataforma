import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/stats — estadísticas generales
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const [
      totalCursos,
      cursosPublicados,
      totalCodigos,
      codigosUsados,
      totalAccesos,
      membresiasActivas,
      membresiasTotales,
      totalComentarios,
      totalProgramas,
      ingresoMembresiaAgg,
      ingresoCursosAgg,
    ] = await Promise.all([
      prisma.clase.count(),
      prisma.clase.count({ where: { publicada: true } }),
      prisma.codigo.count(),
      prisma.codigo.count({ where: { usado: true } }),
      prisma.acceso.count(),
      prisma.membresia.count({ where: { estado: "activa", expiraAt: { gt: new Date() } } }),
      prisma.membresia.count(),
      prisma.comentario.count(),
      prisma.programa.count(),
      prisma.membresia.aggregate({ _sum: { precioMensual: true } }),
      prisma.acceso.findMany({
        select: { clase: { select: { precio: true } } },
        take: 1000,
      }),
    ]);

    const ingresoMembresias = ingresoMembresiaAgg._sum.precioMensual || 0;
    const ingresoCursos = ingresoCursosAgg.reduce((s, a) => s + a.clase.precio, 0);

    return NextResponse.json({
      totalCursos,
      cursosPublicados,
      totalCodigos,
      codigosUsados,
      totalAccesos,
      membresiasActivas,
      membresiasTotales,
      totalComentarios,
      totalProgramas,
      ingresoMembresias,
      ingresoCursos,
      ingresoTotal: ingresoMembresias + ingresoCursos,
    });
  } catch (error) {
    console.error("Error en stats:", error);
    return NextResponse.json({ error: "Error al cargar estadisticas" }, { status: 500 });
  }
}
