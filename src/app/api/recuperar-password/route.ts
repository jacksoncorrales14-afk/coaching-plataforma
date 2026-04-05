import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { enviarEmailRestablecerPassword } from "@/lib/email";

// POST /api/recuperar-password — solicitar recuperación
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const emailNorm = String(email).trim().toLowerCase();

    // Verificar si el usuario existe (no revelamos si existe o no por seguridad)
    const user = await prisma.user.findUnique({
      where: { email: emailNorm },
    });

    if (user) {
      // Generar token seguro con expiración de 1 hora
      const token = nanoid(48);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      });

      // Usar el origin real de la request (más confiable que NEXTAUTH_URL)
      const origin =
        req.headers.get("origin") ||
        (req.headers.get("host") ? `https://${req.headers.get("host")}` : null) ||
        process.env.NEXTAUTH_URL ||
        "https://coaching-plataforma-1.onrender.com";
      const resetUrl = `${origin}/reset-password/${token}`;

      try {
        await enviarEmailRestablecerPassword(user.email, user.name || "", resetUrl);
      } catch (emailError) {
        console.error("[RECUPERAR PASSWORD] Error enviando email:", emailError);
        // No revelamos el error al cliente por seguridad
      }
    }

    // Siempre devolvemos éxito por seguridad (no revelamos si el email existe)
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
