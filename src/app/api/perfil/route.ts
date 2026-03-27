import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabase } from "@/lib/supabase";
import { nanoid } from "nanoid";

// GET /api/perfil?email=xxx
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const perfil = await prisma.perfil.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    return NextResponse.json(perfil || { email, nombre: "", avatar: "", bio: "" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// PUT /api/perfil — actualizar nombre, bio
export async function PUT(req: NextRequest) {
  try {
    const { email, nombre, bio } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const perfil = await prisma.perfil.upsert({
      where: { email: email.trim().toLowerCase() },
      update: { nombre: nombre?.trim() || "", bio: bio?.trim() || "" },
      create: {
        email: email.trim().toLowerCase(),
        nombre: nombre?.trim() || "",
        bio: bio?.trim() || "",
      },
    });

    return NextResponse.json(perfil);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/perfil — subir avatar
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const email = formData.get("email") as string | null;

    if (!file || !email) {
      return NextResponse.json({ error: "Archivo y email requeridos" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Solo se permiten imagenes" }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "La imagen no puede pesar mas de 2MB" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${nanoid()}.${ext}`;
    const filePath = `avatares/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const supabase = getSupabase();

    const { error } = await supabase.storage
      .from("Images")
      .upload(filePath, buffer, { contentType: file.type, upsert: false });

    if (error) {
      return NextResponse.json({ error: "Error al subir imagen: " + error.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("Images").getPublicUrl(filePath);
    const avatarUrl = urlData.publicUrl;

    const emailNorm = email.trim().toLowerCase();
    await prisma.perfil.upsert({
      where: { email: emailNorm },
      update: { avatar: avatarUrl },
      create: { email: emailNorm, nombre: "", avatar: avatarUrl },
    });

    return NextResponse.json({ avatar: avatarUrl });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
