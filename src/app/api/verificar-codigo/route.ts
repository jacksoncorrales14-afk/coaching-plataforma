import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/verificar-codigo — verifica que el email tiene un código usado asociado
export async function POST(req: NextRequest) {
  try {
    const { email, codigo } = await req.json();

    if (!email || !codigo) {
      return NextResponse.json(
        { error: "Email y codigo son requeridos" },
        { status: 400 }
      );
    }

    const emailNorm = email.trim().toLowerCase();
    const codigoNorm = codigo.trim().toUpperCase();

    // Buscar el código en la base de datos
    const codigoRecord = await prisma.codigo.findUnique({
      where: { codigo: codigoNorm },
      include: { acceso: true },
    });

    if (!codigoRecord) {
      return NextResponse.json(
        { error: "Codigo no valido. Verifica e intenta de nuevo." },
        { status: 404 }
      );
    }

    if (!codigoRecord.usado || !codigoRecord.acceso) {
      return NextResponse.json(
        { error: "Este codigo aun no ha sido activado. Ve a 'Desbloquear' primero." },
        { status: 400 }
      );
    }

    // Verificar que el email coincide con quien usó el código
    if (codigoRecord.acceso.email !== emailNorm) {
      return NextResponse.json(
        { error: "Este codigo no esta asociado a tu correo electronico." },
        { status: 403 }
      );
    }

    // Verificar que no haya expirado
    if (new Date(codigoRecord.acceso.expiraAt) < new Date()) {
      return NextResponse.json(
        { error: "Tu acceso ha expirado. Adquiere un nuevo curso o membresia." },
        { status: 403 }
      );
    }

    // También verificar si tiene membresía activa (los códigos de membresía se manejarán después con Stripe)
    const membresia = await prisma.membresia.findFirst({
      where: {
        email: emailNorm,
        estado: "activa",
        expiraAt: { gt: new Date() },
      },
    });

    return NextResponse.json({
      ok: true,
      tipo: membresia ? "membresia" : "curso",
      mensaje: "Acceso verificado correctamente",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
