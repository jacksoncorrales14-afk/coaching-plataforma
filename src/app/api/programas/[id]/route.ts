import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/programas/[id]?email=xxx — programa completo con progreso del usuario
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const email = req.nextUrl.searchParams.get("email");

    const programa = await prisma.programa.findUnique({
      where: { id: params.id },
      include: {
        niveles: {
          orderBy: { orden: "asc" },
          include: {
            videos: {
              orderBy: { orden: "asc" },
              include: {
                tareas: { orderBy: { orden: "asc" } },
              },
            },
          },
        },
      },
    });

    if (!programa || !programa.publicado) {
      return NextResponse.json({ error: "Programa no encontrado" }, { status: 404 });
    }

    // Verificar acceso: membresía activa O compra individual del programa
    let tieneAcceso = false;
    if (email) {
      const emailNorm = email.trim().toLowerCase();

      const membresia = await prisma.membresia.findFirst({
        where: { email: emailNorm, estado: "activa", expiraAt: { gt: new Date() } },
      });

      const accesoPrograma = await prisma.accesoPrograma.findUnique({
        where: { email_programaId: { email: emailNorm, programaId: params.id } },
      });

      tieneAcceso = !!membresia || !!accesoPrograma;
    }

    // Obtener progreso del usuario si tiene email
    let progreso: Record<string, { visto: boolean; progreso: number }> = {};
    let tareasCompletadas: Set<string> = new Set();
    if (email) {
      const emailNorm = email.trim().toLowerCase();
      const registros = await prisma.progresoVideo.findMany({
        where: { email: emailNorm },
      });
      registros.forEach((r) => {
        progreso[r.videoId] = { visto: r.visto, progreso: r.progreso };
      });

      const completadas = await prisma.tareaCompletada.findMany({
        where: { email: emailNorm },
        select: { tareaId: true },
      });
      completadas.forEach((c) => tareasCompletadas.add(c.tareaId));
    }

    // Calcular qué niveles están desbloqueados
    const nivelesConEstado = programa.niveles.map((nivel, i) => {
      // Nivel 1 siempre desbloqueado
      let desbloqueado = i === 0;

      // Niveles siguientes: desbloqueados si TODOS los videos del nivel anterior están vistos
      if (i > 0) {
        const nivelAnterior = programa.niveles[i - 1];
        const todosVistos = nivelAnterior.videos.length > 0 &&
          nivelAnterior.videos.every((v) => progreso[v.id]?.visto);
        desbloqueado = todosVistos;
      }

      const videosConProgreso = nivel.videos.map((v) => ({
        ...v,
        visto: progreso[v.id]?.visto || false,
        progreso: progreso[v.id]?.progreso || 0,
        tareas: v.tareas.map((t: any) => ({
          ...t,
          completada: tareasCompletadas.has(t.id),
        })),
      }));

      const videosVistos = videosConProgreso.filter((v) => v.visto).length;

      return {
        ...nivel,
        desbloqueado,
        videos: videosConProgreso,
        videosVistos,
        totalVideos: nivel.videos.length,
        porcentaje: nivel.videos.length > 0 ? Math.round((videosVistos / nivel.videos.length) * 100) : 0,
      };
    });

    return NextResponse.json({
      ...programa,
      tieneAcceso,
      niveles: tieneAcceso ? nivelesConEstado : nivelesConEstado.map((n: any) => ({
        ...n,
        videos: n.videos.map((v: any) => ({ ...v, url: "" })), // No exponer URLs si no tiene acceso
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
