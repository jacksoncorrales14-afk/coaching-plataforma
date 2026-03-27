import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/recuperar-password — solicitar recuperación
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    // Verificar si el usuario existe (no revelamos si existe o no por seguridad)
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (user) {
      // TODO: Integrar servicio de email (SendGrid, Resend, etc.)
      // Por ahora solo logueamos en consola
      console.log(`[RECUPERAR PASSWORD] Solicitud para: ${email}`);
      // Aquí se generaría un token temporal y se enviaría por email
    }

    // Siempre devolvemos éxito por seguridad
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
