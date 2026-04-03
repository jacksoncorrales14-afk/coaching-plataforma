import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, progresoSchema } from "@/lib/validations";

// POST /api/progreso — marcar video como visto
export async function POST(req: NextRequest) {
  try {
    const { data, error: valError } = parseBody(progresoSchema, await req.json());
    if (valError) return valError;

    const registro = await prisma.progresoVideo.upsert({
      where: { email_videoId: { email: data.email, videoId: data.videoId } },
      update: {
        progreso: data.progreso,
        visto: data.visto,
        vistoAt: data.visto ? new Date() : null,
      },
      create: {
        email: data.email,
        videoId: data.videoId,
        progreso: data.progreso,
        visto: data.visto,
        vistoAt: data.visto ? new Date() : null,
      },
    });

    return NextResponse.json(registro);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
