import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No se envio archivo" }, { status: 400 });
  }

  // Validar que sea imagen
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Solo se permiten imagenes" },
      { status: 400 }
    );
  }

  // Validar tamaño (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "La imagen no puede pesar mas de 5MB" },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${nanoid()}.${ext}`;
  const filePath = `portadas/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const supabase = getSupabase();

  const { error } = await supabase.storage
    .from("imagenes")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json(
      { error: "Error al subir imagen: " + error.message },
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage
    .from("imagenes")
    .getPublicUrl(filePath);

  return NextResponse.json({ url: urlData.publicUrl });
}
