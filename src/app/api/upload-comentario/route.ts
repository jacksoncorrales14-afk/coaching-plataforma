import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

const IMAGE_MAX = 5 * 1024 * 1024; // 5MB
const VIDEO_MAX = 30 * 1024 * 1024; // 30MB
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-matroska"];

// POST /api/upload-comentario — subir imagen o video para adjuntar a comentario
// Permitido para: admin (via session) O estudiante con acceso (membresia o compra individual)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const email = (formData.get("email") as string | null)?.trim().toLowerCase() || "";

    if (!file) {
      return NextResponse.json({ error: "No se envio archivo" }, { status: 400 });
    }

    // Verificar permiso: admin o estudiante con acceso
    const session = await getServerSession(authOptions);
    const esAdmin = session?.user?.role === "admin";

    if (!esAdmin) {
      if (!email) {
        return NextResponse.json({ error: "Email requerido" }, { status: 400 });
      }
      const [membresia, acceso, accesoPrograma] = await Promise.all([
        prisma.membresia.findFirst({
          where: { email, estado: "activa", expiraAt: { gt: new Date() } },
        }),
        prisma.acceso.findFirst({ where: { email, expiraAt: { gt: new Date() } } }),
        prisma.accesoPrograma.findFirst({ where: { email } }),
      ]);
      if (!membresia && !acceso && !accesoPrograma) {
        return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
      }
    }

    // Determinar tipo
    let tipo: "imagen" | "video";
    if (file.type.startsWith("image/")) {
      tipo = "imagen";
      if (file.size > IMAGE_MAX) {
        return NextResponse.json(
          { error: "La imagen no puede pesar mas de 5MB" },
          { status: 400 }
        );
      }
    } else if (VIDEO_TYPES.includes(file.type) || file.type.startsWith("video/")) {
      tipo = "video";
      if (file.size > VIDEO_MAX) {
        return NextResponse.json(
          { error: "El video no puede pesar mas de 30MB" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Solo se permiten imagenes o videos" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() || (tipo === "imagen" ? "jpg" : "mp4");
    const fileName = `${nanoid()}.${ext}`;
    const filePath = `comentarios/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const supabase = getSupabase();

    const { error } = await supabase.storage
      .from("Images")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      return NextResponse.json(
        { error: "Error al subir archivo: " + error.message },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from("Images")
      .getPublicUrl(filePath);

    return NextResponse.json({ url: urlData.publicUrl, tipo });
  } catch (error: any) {
    console.error("[UPLOAD-COMENTARIO]", error);
    return NextResponse.json({ error: error?.message || "Error interno del servidor" }, { status: 500 });
  }
}
