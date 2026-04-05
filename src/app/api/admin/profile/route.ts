import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/profile — obtener perfil del admin
export async function GET() {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "Sin sesion" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, avatar: true, role: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error: any) {
    console.error("[ADMIN-PROFILE-GET]", error);
    return NextResponse.json({ error: error?.message || "Error interno del servidor" }, { status: 500 });
  }
}

// PUT /api/admin/profile — actualizar avatar y/o nombre
export async function PUT(req: NextRequest) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "Sin sesion" }, { status: 401 });
    }

    const body = await req.json();
    const data: { avatar?: string; name?: string } = {};
    if (typeof body.avatar === "string") data.avatar = body.avatar;
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();

    const user = await prisma.user.update({
      where: { email },
      data,
      select: { id: true, email: true, name: true, avatar: true, role: true },
    });
    return NextResponse.json(user);
  } catch (error: any) {
    console.error("[ADMIN-PROFILE-PUT]", error);
    return NextResponse.json({ error: error?.message || "Error interno del servidor" }, { status: 500 });
  }
}
