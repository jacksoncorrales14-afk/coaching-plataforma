import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/progreso — marcar video como visto
export async function POST(req: NextRequest) {
  try {
    const { email, videoId, progreso, visto } = await req.json();

    if (!email || !videoId) {
      return NextResponse.json({ error: "Email y videoId requeridos" }, { status: 400 });
    }

    const emailNorm = email.trim().toLowerCase();

    const registro = await prisma.progresoVideo.upsert({
      where: { email_videoId: { email: emailNorm, videoId } },
      update: {
        progreso: progreso ?? 100,
        visto: visto ?? true,
        vistoAt: visto ? new Date() : null,
      },
      create: {
        email: emailNorm,
        videoId,
        progreso: progreso ?? 100,
        visto: visto ?? true,
        vistoAt: visto ? new Date() : null,
      },
    });

    return NextResponse.json(registro);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
