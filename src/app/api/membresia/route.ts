import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/membresia?email=xxx — verificar si tiene membresía activa
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    const membresia = await prisma.membresia.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        estado: "activa",
        expiraAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!membresia) {
      return NextResponse.json({ activa: false });
    }

    return NextResponse.json({
      activa: true,
      plan: membresia.plan,
      expiraAt: membresia.expiraAt,
      inicioAt: membresia.inicioAt,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/membresia — crear membresía (se llamará después del pago con Stripe)
export async function POST(req: NextRequest) {
  try {
    const { email, nombre, plan } = await req.json();

    if (!email || !nombre || !plan) {
      return NextResponse.json(
        { error: "Email, nombre y plan son requeridos" },
        { status: 400 }
      );
    }

    if (!["mensual", "trimestral"].includes(plan)) {
      return NextResponse.json(
        { error: "Plan debe ser 'mensual' o 'trimestral'" },
        { status: 400 }
      );
    }

    const precio = plan === "mensual" ? 195 : 395;
    const diasDuracion = plan === "mensual" ? 30 : 90;

    const expiraAt = new Date();
    expiraAt.setDate(expiraAt.getDate() + diasDuracion);

    const membresia = await prisma.membresia.create({
      data: {
        email: email.trim().toLowerCase(),
        nombre: nombre.trim(),
        plan,
        precioMensual: precio,
        expiraAt,
      },
    });

    return NextResponse.json({
      mensaje: "Membresia activada exitosamente!",
      membresia: {
        id: membresia.id,
        plan: membresia.plan,
        expiraAt: membresia.expiraAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
