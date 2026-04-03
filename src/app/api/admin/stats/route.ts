import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/stats — estadísticas generales
export async function GET() {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

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
      ingresoCursosRaw,
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
      prisma.$queryRaw<[{ total: number }]>`
        SELECT COALESCE(SUM(c.precio), 0) as total
        FROM "Acceso" a
        JOIN "Clase" c ON a."claseId" = c.id
      `,
    ]);

    const ingresoMembresias = ingresoMembresiaAgg._sum.precioMensual || 0;
    const ingresoCursos = Number(ingresoCursosRaw[0]?.total || 0);

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
